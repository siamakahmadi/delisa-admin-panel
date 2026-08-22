export const uuidv4 = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "id_" + Math.random().toString(36).slice(2, 11);

function ensureUniqueId(id, seen) {
  let nextId = id || uuidv4();
  while (seen.has(nextId)) nextId = uuidv4();
  seen.add(nextId);
  return nextId;
}

export function adaptLayoutFromAPI(layout = {}) {
  return {
    display: layout.display || "block",
    gridTemplateColumns: layout.gridTemplateColumns || "",
    gridTemplateRows: layout.gridTemplateRows || "",
    gap: layout.gap || "",
    rowGap: layout.rowGap || "",
    columnGap: layout.columnGap || "",
    padding: Array.isArray(layout.padding) ? layout.padding.join(" ") : layout.padding || "",
    margin: Array.isArray(layout.margin) ? layout.margin.join(" ") : layout.margin || "",
    backgroundColor: layout.backgroundColor || "",
    backgroundImage: layout.backgroundImage || "",
    contentWidth: layout.contentWidth || "container",
    flexDirection: layout.flexDirection || layout.flex?.direction || "row",
    alignItems: layout.alignItems || layout.flex?.alignItems || "",
    justifyItems: layout.justifyItems || layout.flex?.justifyContent || "",
    className: layout.className || "",
    responsive: layout.responsive || undefined,
  };
}

export function adaptLayoutToAPI(layout = {}) {
  const out = { ...layout };
  if (out.flexDirection !== undefined) {
    out.flex = { direction: out.flexDirection };
    delete out.flexDirection;
  }
  if (Array.isArray(out.padding)) out.padding = out.padding.join(" ");
  if (Array.isArray(out.margin)) out.margin = out.margin.join(" ");
  return out;
}

function defaultVisibility() {
  return { devices: ["desktop", "tablet", "mobile"], startsAt: null, endsAt: null, order: null };
}

export function normalizeVisibility(v) {
  if (!v || typeof v !== "object") return defaultVisibility();
  return {
    devices: Array.isArray(v.devices) && v.devices.length ? v.devices : ["desktop", "tablet", "mobile"],
    startsAt: v.startsAt || null,
    endsAt: v.endsAt || null,
    // Per-device component display-order override ({ desktop?, tablet?,
    // mobile? }) — see VisibilityEditor's `showOrder` mode. Must be carried
    // through here or it silently gets dropped every time a page reloads.
    order: v.order && typeof v.order === "object" ? v.order : null,
  };
}

export function normalizeComponent(c) {
  const compId = c?._id || c?.id || uuidv4();
  const type = (c?.type || c?.component || "").toLowerCase();
  return {
    id: compId,
    type,
    props: c?.props || c?.settings || {},
    isVisible: c?.isVisible !== false,
    visibility: normalizeVisibility(c?.visibility),
  };
}

export function normalizeSection(sec) {
  const sectionId = sec?._id || sec?.id || uuidv4();
  return {
    id: sectionId,
    title: sec?.title || "",
    order: typeof sec?.order === "number" ? sec.order : 0,
    layout: adaptLayoutFromAPI(sec?.layout || {}),
    isVisible: sec?.isVisible !== false,
    visibility: normalizeVisibility(sec?.visibility),
    components: (sec?.components || sec?.slots || []).map(normalizeComponent),
  };
}

export function adaptPageFromAPI(page) {
  if (!page) return null;
  return {
    id: page._id || page.id,
    type: page.type || "landing",
    title: page.title || "",
    slug: page.slug || "",
    internalName: page.internalName || "",
    status: page.status || "",
    publishedAt: page.publishedAt || null,
    seo: page.seo || {},
    sections: (page.sections || []).map(normalizeSection),
  };
}

/** Cleanup pass on load: normalizes empty/duplicate ids and drops any stale selection. */
export function normalizePageState(page) {
  if (!page) return null;
  const seenSections = new Set();

  const sections = (page.sections || []).map((sec, secIndex) => {
    const sectionId = ensureUniqueId(sec?.id || sec?._id, seenSections);
    const seenComponents = new Set();
    const components = (sec?.components || []).map((c) => {
      const compId = ensureUniqueId(c?.id || c?._id, seenComponents);
      return { ...c, id: compId };
    });
    return { ...sec, id: sectionId, order: typeof sec?.order === "number" ? sec.order : secIndex, components };
  });

  return { ...page, sections };
}
