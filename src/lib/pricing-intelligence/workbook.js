export function parseMoneyInput(raw) {
  if (raw == null || raw === "") return null;
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  let s = String(raw)
    .replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)))
    .replace(/[٬,]/g, "")
    .replace(/[^\d.]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function competitorPrices(row, columns) {
  return (columns || [])
    .map((col) => Number(row?.prices?.[col.id]))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function marketAverage(row, columns) {
  const values = competitorPrices(row, columns);
  if (!values.length) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

export function grossProfit(sellPrice, purchaseCost) {
  const sell = Number(sellPrice);
  const cost = Number(purchaseCost);
  if (!Number.isFinite(sell) || !Number.isFinite(cost)) return null;
  return sell - cost;
}

/** Gross margin: profit / sell price */
export function grossMargin(sellPrice, purchaseCost) {
  const profit = grossProfit(sellPrice, purchaseCost);
  const sell = Number(sellPrice);
  if (profit == null || !Number.isFinite(sell) || sell === 0) return null;
  return profit / sell;
}

/** Markup: profit / cost */
export function markupRatio(sellPrice, purchaseCost) {
  const profit = grossProfit(sellPrice, purchaseCost);
  const cost = Number(purchaseCost);
  if (profit == null || !Number.isFinite(cost) || cost === 0) return null;
  return profit / cost;
}

export const WORKBOOK_STORAGE_KEY = "delisa.pricing-workbook.v1";

export function defaultWorkbook() {
  return {
    columns: [
      { id: crypto.randomUUID(), name: "رقیب ۱" },
      { id: crypto.randomUUID(), name: "رقیب ۲" },
    ],
    rows: [],
    updatedAt: new Date().toISOString(),
  };
}

export function workbookHasRows(workbook) {
  return Array.isArray(workbook?.rows) && workbook.rows.length > 0;
}

export function pickNewerWorkbook(local, remote) {
  if (workbookHasRows(local) && !workbookHasRows(remote)) return local;
  if (workbookHasRows(remote) && !workbookHasRows(local)) return remote || local;
  if (!local && !remote) return defaultWorkbook();
  if (!local) return remote;
  if (!remote) return local;
  const localTime = Date.parse(local.updatedAt || 0) || 0;
  const remoteTime = Date.parse(remote.updatedAt || 0) || 0;
  if (localTime > remoteTime) return local;
  if (remoteTime > localTime) return remote;
  return (local.rows?.length || 0) >= (remote.rows?.length || 0) ? local : remote;
}

export function loadLocalWorkbook() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WORKBOOK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.columns) || !Array.isArray(parsed.rows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalWorkbook(workbook) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(
      WORKBOOK_STORAGE_KEY,
      JSON.stringify({
        columns: workbook.columns || [],
        rows: workbook.rows || [],
        updatedAt: new Date().toISOString(),
      })
    );
    return true;
  } catch {
    return false;
  }
}
