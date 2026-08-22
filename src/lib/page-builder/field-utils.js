/* Dot-path get/set utilities so a Field.key like "cta.label" or "items.0.title"
 * can address nested props. */

export function getPath(obj, path) {
  if (!path) return obj;
  const parts = String(path).split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

export function setPath(obj, path, value) {
  const parts = String(path).split(".");
  const root = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextKeyIsIndex = /^\d+$/.test(parts[i + 1]);
    const existing = cur[key];
    const cloned = Array.isArray(existing) ? [...existing] : { ...(existing && typeof existing === "object" ? existing : {}) };
    cur[key] = existing == null ? (nextKeyIsIndex ? [] : {}) : cloned;
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = value;
  return root;
}

export const CATEGORY_LABELS = {
  media: "رسانه",
  commerce: "فروشگاهی",
  marketing: "بازاریابی",
  content: "محتوا",
  navigation: "ناوبری",
  utility: "ابزار",
};

export const FIELD_GROUP_LABELS = {
  content: "محتوا",
  media: "رسانه",
  behavior: "رفتار",
  appearance: "ظاهر",
  accessibility: "دسترسی‌پذیری",
  performance: "کارایی",
};

export const FIELD_GROUP_ORDER = ["content", "media", "behavior", "appearance", "accessibility", "performance"];

export const DEVICE_LABELS = { desktop: "دسکتاپ", tablet: "تبلت", mobile: "موبایل" };

/**
 * Resolves a component's registry definition the same way the backend does:
 * exact match first, then a case-insensitive match against the canonical
 * type or any of its `aliases`.
 */
export function resolveTypeDef(registry, type) {
  if (!type || !Array.isArray(registry)) return null;
  const exact = registry.find((t) => t.type === type);
  if (exact) return exact;
  const lower = String(type).toLowerCase();
  return (
    registry.find((t) => t.type.toLowerCase() === lower || (Array.isArray(t.aliases) && t.aliases.includes(lower))) ||
    null
  );
}

/** Same resolution as resolveTypeDef, indexed as a Map for fast repeated lookups. */
export function buildTypeDefIndex(registry) {
  const map = new Map();
  for (const def of registry || []) {
    map.set(def.type, def);
    map.set(String(def.type).toLowerCase(), def);
    for (const alias of def.aliases || []) map.set(alias, def);
  }
  return map;
}

/** Builds initial props for a field schema when the registry has no defaultProps. */
export function buildDefaultPropsFromFields(fields = []) {
  const props = {};
  for (const f of fields) {
    if (f.defaultValue !== undefined) {
      props[f.key] = f.defaultValue;
    } else if (f.type === "repeater") {
      props[f.key] = [];
    } else if (f.type === "boolean") {
      props[f.key] = false;
    } else if (f.type === "multiselect" || f.type.endsWith("Picker")) {
      props[f.key] = [];
    } else if (f.type === "productSource") {
      props[f.key] = { filterType: "manual", filterItems: [], displayLimit: 12 };
    } else {
      props[f.key] = "";
    }
  }
  return props;
}

export function defaultVisibility() {
  return { devices: ["desktop", "tablet", "mobile"], startsAt: null, endsAt: null, order: null };
}
