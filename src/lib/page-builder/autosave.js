import { usePageBuilderStore } from "./store";
import { updatePage, updateSection, updateComponent } from "./api";

let pendingSavesCount = 0;
function markSaving() {
  pendingSavesCount++;
  usePageBuilderStore.getState().setSaving(true);
}
function markSaved() {
  pendingSavesCount = Math.max(0, pendingSavesCount - 1);
  if (pendingSavesCount === 0) usePageBuilderStore.getState().setSaving(false);
}

let onSaveSettledCbs = [];
export function onSaveSettled(cb) {
  onSaveSettledCbs.push(cb);
  return () => {
    onSaveSettledCbs = onSaveSettledCbs.filter((c) => c !== cb);
  };
}
function notifySettled() {
  if (pendingSavesCount === 0) onSaveSettledCbs.forEach((cb) => cb());
}

/* ---------------- page meta (title/seo/...) ---------------- */
const pageSaveQueue = {};
const pageSaveTimers = {};

async function sendPageSave(pageId) {
  const patch = pageSaveQueue[pageId];
  if (!patch) return;
  delete pageSaveQueue[pageId];
  if (pageSaveTimers[pageId]) {
    clearTimeout(pageSaveTimers[pageId]);
    delete pageSaveTimers[pageId];
  }
  markSaving();
  try {
    await updatePage(pageId, patch);
  } finally {
    markSaved();
    notifySettled();
  }
}

export function schedulePageSave(pageId, patch, delay = 1200) {
  pageSaveQueue[pageId] = { ...(pageSaveQueue[pageId] || {}), ...patch };
  if (pageSaveTimers[pageId]) clearTimeout(pageSaveTimers[pageId]);
  pageSaveTimers[pageId] = setTimeout(() => sendPageSave(pageId).catch(() => {}), delay);
}

export function flushPageSave(pageId) {
  if (pageSaveTimers[pageId]) {
    clearTimeout(pageSaveTimers[pageId]);
    delete pageSaveTimers[pageId];
  }
  return sendPageSave(pageId);
}

/* ---------------- sections ---------------- */
const sectionSaveTimers = {};

export function scheduleSectionSave(pageId, sectionId, patch, delay = 900) {
  const key = `${pageId}::${sectionId}`;
  if (sectionSaveTimers[key]) clearTimeout(sectionSaveTimers[key]);
  sectionSaveTimers[key] = setTimeout(async () => {
    markSaving();
    try {
      await updateSection(pageId, sectionId, patch);
    } finally {
      markSaved();
      notifySettled();
      delete sectionSaveTimers[key];
    }
  }, delay);
}

export function flushSectionSave(pageId, sectionId, patch) {
  const key = `${pageId}::${sectionId}`;
  if (sectionSaveTimers[key]) {
    clearTimeout(sectionSaveTimers[key]);
    delete sectionSaveTimers[key];
  }
  markSaving();
  return updateSection(pageId, sectionId, patch).finally(() => {
    markSaved();
    notifySettled();
  });
}

/* ---------------- components ---------------- */
const componentSaveTimers = {};

export function debouncedSaveComponent(pageId, sectionId, compId, patch, delay = 900) {
  const key = `${sectionId}::${compId}`;
  if (componentSaveTimers[key]) clearTimeout(componentSaveTimers[key]);
  componentSaveTimers[key] = setTimeout(async () => {
    markSaving();
    try {
      await updateComponent(pageId, sectionId, compId, patch);
    } finally {
      markSaved();
      notifySettled();
      delete componentSaveTimers[key];
    }
  }, delay);
}
