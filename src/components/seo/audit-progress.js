"use client";

import { Loader2, XCircle } from "lucide-react";
import { PHASE_LABELS, MODE_LABELS } from "@/lib/seo/constants";
import { Button } from "@/components/ui/button";

export function AuditProgress({ running, onCancel, cancelling }) {
  if (!running) return null;
  const p = running.progress || {};
  const pct = p.total ? Math.min(100, Math.round((p.done / p.total) * 100)) : null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--brand-100)] bg-[var(--brand-50)] p-4">
      <Loader2 size={18} className="animate-spin text-[var(--brand-600)]" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--brand-700)]">
          ممیزی در حال اجرا — {PHASE_LABELS[p.phase] || p.phase} {pct != null && `(${pct.toLocaleString("fa-IR")}٪)`}
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          {p.message || MODE_LABELS[running.mode]} {p.total ? `— ${Number(p.done || 0).toLocaleString("fa-IR")} از ${Number(p.total).toLocaleString("fa-IR")}` : ""}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--brand-100)]">
          <div className="h-full rounded-full bg-[var(--brand-600)] transition-all" style={{ width: `${pct ?? 15}%` }} />
        </div>
      </div>
      {onCancel && (
        <Button variant="ghost" size="sm" onClick={onCancel} loading={cancelling}>
          <XCircle size={14} />
          لغو
        </Button>
      )}
    </div>
  );
}
