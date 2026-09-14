"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Gauge, ChevronLeft, Loader2, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchSeoHealth } from "@/lib/seo/api";
import { SEVERITY, ENTITY_LABELS, scoreColor, scoreLabel, PHASE_LABELS } from "@/lib/seo/constants";
import { ScoreRing } from "./score-ring";
import { TrafficDot } from "./severity-icon";

/**
 * نشانگر سلامت سئو در هدر پنل: نمره + تعداد خطاها؛ با کلیک، پاپ‌اور
 * «مواردی که باید رفع شوند» با لینک مستقیم به ویرایشگر باز می‌شود.
 */
export function SeoHealthIndicator() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { data, isLoading } = useQuery({
    queryKey: ["seo-health"],
    queryFn: fetchSeoHealth,
    refetchInterval: (q) => (q.state.data?.running ? 5000 : 90_000),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const score = data?.score ?? null;
  const errors = data?.counts?.errors ?? 0;
  const warnings = data?.counts?.warnings ?? 0;
  const running = data?.running;
  const color = scoreColor(score);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-label="وضعیت سئو"
        className={cn(
          "flex h-9 items-center gap-2 rounded-[var(--radius-md)] border px-2.5 text-xs font-semibold transition-colors hover:bg-[var(--surface-muted)]",
          open ? "border-[var(--brand-300)] bg-[var(--surface-muted)]" : "border-[var(--border)]"
        )}
      >
        {running ? <Loader2 size={15} className="animate-spin text-[var(--brand-600)]" /> : <Gauge size={15} style={{ color }} />}
        <span className="hidden text-[var(--text-muted)] sm:inline">سئو</span>
        {isLoading ? (
          <span className="h-3 w-6 animate-pulse rounded bg-[var(--surface-muted)]" />
        ) : (
          <span style={{ color }} className="tabular-nums">
            {score == null ? "—" : Number(score).toLocaleString("fa-IR")}
          </span>
        )}
        {errors > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1.5 text-[10px] font-bold text-white">
            {errors > 99 ? "۹۹+" : errors.toLocaleString("fa-IR")}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] animate-toast-in">
          <div className="flex items-center gap-3 border-b border-[var(--border)] p-4">
            <ScoreRing score={score} size={64} stroke={6} showLabel={false} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--text)]">
                سلامت سئوی سایت: <span style={{ color }}>{scoreLabel(score)}</span>
              </p>
              {running ? (
                <p className="mt-0.5 text-xs text-[var(--brand-600)]">در حال ممیزی — {PHASE_LABELS[running.progress?.phase] || ""}</p>
              ) : data?.hasAudit ? (
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  <span className="text-[var(--danger)]">{errors.toLocaleString("fa-IR")} خطا</span>
                  {" · "}
                  <span className="text-[var(--warning)]">{warnings.toLocaleString("fa-IR")} هشدار</span>
                  {" · "}
                  {(data.counts?.pages ?? 0).toLocaleString("fa-IR")} صفحه
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">هنوز ممیزی اجرا نشده</p>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {!data?.hasAudit && !running && (
              <p className="p-3 text-center text-xs text-[var(--text-muted)]">از «مرکز سئو» اولین ممیزی را اجرا کنید.</p>
            )}
            {(data?.topIssues || []).length === 0 && data?.hasAudit && (
              <p className="p-3 text-center text-xs text-[var(--success)]">مشکل بازی وجود ندارد 🎉</p>
            )}
            {(data?.topIssues || []).map((g) => {
              const sample = g.samples?.[0];
              const fixHref = g.count === 1 && sample?.editUrl ? sample.editUrl : `/seo?tab=issues&check=${g.checkId}`;
              return (
                <Link
                  key={g.checkId}
                  href={fixHref}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2.5 rounded-[var(--radius-md)] p-2.5 transition-colors hover:bg-[var(--surface-muted)]"
                >
                  <TrafficDot status={g.severity} className="mt-1.5" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-[var(--text)]">{g.title}</span>
                    <span className="block text-[11px] text-[var(--text-faint)]">
                      {g.count.toLocaleString("fa-IR")} مورد
                      {sample?.entityType && sample.entityType !== "site" ? ` · ${ENTITY_LABELS[sample.entityType] || ""}` : ""}
                      {g.count === 1 && sample?.label ? ` · ${sample.label}` : ""}
                    </span>
                  </span>
                  <span className="mt-1 flex shrink-0 items-center gap-1 text-[11px] font-medium" style={{ color: SEVERITY[g.severity]?.color }}>
                    <Wrench size={11} />
                    رفع
                  </span>
                </Link>
              );
            })}
          </div>

          <Link
            href="/seo"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-xs font-semibold text-[var(--brand-700)] hover:bg-[var(--brand-50)]"
          >
            <span>مرکز سئو و گزارش کامل</span>
            <ChevronLeft size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
