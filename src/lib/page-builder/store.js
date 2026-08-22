import { create } from "zustand";
import { uuidv4, normalizePageState } from "./normalize";

/** Defends against id collisions when the backend hands back a duplicate id. */
function withUniqueId(id, existingIds) {
  let candidate = id;
  while (candidate && existingIds.has(candidate)) candidate = uuidv4();
  return candidate || uuidv4();
}

const HISTORY_LIMIT = 50;

function snapshotSections(page) {
  return page ? JSON.parse(JSON.stringify(page.sections || [])) : [];
}

const defaultUi = () => ({
  selectedSectionId: null,
  selectedComponentId: null,
  isSaving: false,
  breakpoint: "desktop",
});

export const usePageBuilderStore = create((set, get) => ({
  page: null,
  ui: defaultUi(),
  history: { past: [], future: [] },

  setPage: (page, opts = {}) => {
    const normalized = normalizePageState(page);
    set({
      page: normalized,
      ui: defaultUi(),
      ...(opts.resetHistory !== false ? { history: { past: [], future: [] } } : {}),
    });
  },

  setTitle: (title) => set((s) => ({ page: s.page ? { ...s.page, title } : s.page })),
  setSeo: (seo) => set((s) => ({ page: s.page ? { ...s.page, seo } : s.page })),

  setSaving: (v) => set((s) => ({ ui: { ...s.ui, isSaving: v } })),
  setBreakpoint: (bp) => set((s) => ({ ui: { ...s.ui, breakpoint: bp } })),

  selectSection: (sectionId) => set((s) => ({ ui: { ...s.ui, selectedSectionId: sectionId, selectedComponentId: null } })),
  selectComponent: (componentId) => set((s) => ({ ui: { ...s.ui, selectedComponentId: componentId } })),

  syncSelectionWithPage: () =>
    set((s) => {
      const page = s.page;
      if (!page) return s;
      const sec = (page.sections || []).find((x) => x.id === s.ui.selectedSectionId);
      if (!sec) return { ui: { ...s.ui, selectedSectionId: null, selectedComponentId: null } };
      if (s.ui.selectedComponentId) {
        const compExists = (sec.components || []).some((c) => c.id === s.ui.selectedComponentId);
        if (!compExists) return { ui: { ...s.ui, selectedComponentId: null } };
      }
      return s;
    }),

  /* ---------------- history (undo/redo) ---------------- */
  commitHistory: () =>
    set((s) => {
      if (!s.page) return s;
      const snap = snapshotSections(s.page);
      const past = [...s.history.past, snap].slice(-HISTORY_LIMIT);
      return { history: { past, future: [] } };
    }),

  undo: () => {
    const s = get();
    if (!s.page || s.history.past.length === 0) return null;
    const past = [...s.history.past];
    const prevSnap = past.pop();
    const currentSnap = snapshotSections(s.page);
    const future = [currentSnap, ...s.history.future];
    set({ page: { ...s.page, sections: prevSnap }, history: { past, future } });
    return prevSnap;
  },

  redo: () => {
    const s = get();
    if (!s.page || s.history.future.length === 0) return null;
    const future = [...s.history.future];
    const nextSnap = future.shift();
    const currentSnap = snapshotSections(s.page);
    const past = [...s.history.past, currentSnap];
    set({ page: { ...s.page, sections: nextSnap }, history: { past, future } });
    return nextSnap;
  },

  /* ---------------- sections ---------------- */
  addSectionLocally: (section) =>
    set((s) => {
      if (!s.page) return s;
      const existingIds = new Set((s.page.sections || []).map((sec) => sec.id));
      const safeSection = { ...section, id: withUniqueId(section.id, existingIds) };
      return { page: { ...s.page, sections: [...(s.page.sections || []), safeSection] } };
    }),

  updateSectionLocally: (sectionId, patch) =>
    set((s) => {
      if (!s.page) return s;
      const safePatch = { ...patch };
      if (safePatch.id !== undefined && safePatch.id !== sectionId && (s.page.sections || []).some((sec) => sec.id === safePatch.id)) {
        delete safePatch.id;
      }
      return {
        page: {
          ...s.page,
          sections: (s.page.sections || []).map((sec) => (sec.id === sectionId ? { ...sec, ...safePatch } : sec)),
        },
      };
    }),

  removeSectionLocally: (sectionId) =>
    set((s) => {
      const nextSections = (s.page?.sections || []).filter((sec) => sec.id !== sectionId);
      const selectedSectionId = s.ui.selectedSectionId === sectionId ? null : s.ui.selectedSectionId;
      const selectedComponentId = s.ui.selectedSectionId === sectionId ? null : s.ui.selectedComponentId;
      return {
        page: s.page ? { ...s.page, sections: nextSections } : s.page,
        ui: { ...s.ui, selectedSectionId, selectedComponentId },
      };
    }),

  reorderSectionsLocally: (orderedIds) =>
    set((s) => {
      if (!s.page) return s;
      const byId = new Map((s.page.sections || []).map((sec) => [sec.id, sec]));
      const next = orderedIds.map((id, idx) => (byId.has(id) ? { ...byId.get(id), order: idx } : null)).filter(Boolean);
      return { page: { ...s.page, sections: next } };
    }),

  moveSection: (sectionId, dir) =>
    set((s) => {
      const arr = [...(s.page?.sections || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const i = arr.findIndex((x) => x.id === sectionId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return s;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { page: { ...s.page, sections: arr.map((x, k) => ({ ...x, order: k })) } };
    }),

  duplicateSectionLocally: (sectionId, freshSection) =>
    set((s) => {
      const arr = s.page?.sections || [];
      const i = arr.findIndex((x) => x.id === sectionId);
      if (i < 0) return s;
      const next = [...arr.slice(0, i + 1), freshSection, ...arr.slice(i + 1)].map((x, k) => ({ ...x, order: k }));
      return { page: { ...s.page, sections: next } };
    }),

  /* ---------------- components ---------------- */
  addComponentLocally: (sectionId, component) =>
    set((s) => ({
      page: {
        ...s.page,
        sections: (s.page?.sections || []).map((sec) => {
          if (sec.id !== sectionId) return sec;
          const existingIds = new Set((sec.components || []).map((c) => c.id));
          const safeComponent = { ...component, id: withUniqueId(component.id, existingIds) };
          return { ...sec, components: [...(sec.components || []), safeComponent] };
        }),
      },
    })),

  updateComponentLocally: (sectionId, compId, patch) =>
    set((s) => ({
      page: {
        ...s.page,
        sections: (s.page?.sections || []).map((sec) => {
          if (sec.id !== sectionId) return sec;
          const safePatch = { ...patch };
          if (safePatch.id !== undefined && safePatch.id !== compId && (sec.components || []).some((c) => c.id === safePatch.id)) {
            delete safePatch.id;
          }
          return { ...sec, components: (sec.components || []).map((c) => (c.id === compId ? { ...c, ...safePatch } : c)) };
        }),
      },
    })),

  reorderComponentsLocally: (sectionId, orderedIds) =>
    set((s) => {
      if (!s.page) return s;
      return {
        page: {
          ...s.page,
          sections: (s.page.sections || []).map((sec) => {
            if (sec.id !== sectionId) return sec;
            const byId = new Map((sec.components || []).map((c) => [c.id, c]));
            return { ...sec, components: orderedIds.map((id) => byId.get(id)).filter(Boolean) };
          }),
        },
      };
    }),

  removeComponentLocally: (sectionId, compId) =>
    set((s) => {
      const nextPage = {
        ...s.page,
        sections: (s.page?.sections || []).map((sec) =>
          sec.id === sectionId ? { ...sec, components: (sec.components || []).filter((c) => c.id !== compId) } : sec
        ),
      };
      const selectedComponentId = s.ui.selectedComponentId === compId ? null : s.ui.selectedComponentId;
      return { page: nextPage, ui: { ...s.ui, selectedComponentId } };
    }),
}));
