export const STATUS_LABELS = {
  queued: "در صف",
  running: "در حال اجرا",
  succeeded: "موفق",
  failed: "ناموفق",
  cancelled: "لغو شد",
};

export const STATUS_VARIANTS = {
  queued: "neutral",
  running: "info",
  succeeded: "success",
  failed: "danger",
  cancelled: "warning",
};

export const isActiveStatus = (s) => s === "queued" || s === "running";

export const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
};

export const formatToman = (n) => (Number.isFinite(Number(n)) && n !== null && n !== "" ? `${Number(n).toLocaleString("fa-IR")} تومان` : "—");

export const formatNumber = (n) => Number(n || 0).toLocaleString("fa-IR");

export function durationLabel(run) {
  if (!run?.startedAt) return "—";
  const end = run.finishedAt ? new Date(run.finishedAt) : new Date();
  const sec = Math.max(0, Math.round((end - new Date(run.startedAt)) / 1000));
  if (sec < 60) return `${sec.toLocaleString("fa-IR")} ثانیه`;
  return `${Math.floor(sec / 60).toLocaleString("fa-IR")} دقیقه و ${(sec % 60).toLocaleString("fa-IR")} ثانیه`;
}

export function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(Array.isArray(r[c]) ? r[c].join(" | ") : r[c])).join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
