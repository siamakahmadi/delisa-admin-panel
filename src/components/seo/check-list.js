"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEVERITY, CATEGORY_LABELS } from "@/lib/seo/constants";
import { TrafficDot } from "./severity-icon";

const ORDER = ["error", "warning", "notice", "passed", "skipped"];

/**
 * لیست چک‌ها به سبک چراغ راهنمای Yoast. مشکلات اول، بعد موارد درست
 * (جمع‌شده). هر آیتم با کلیک راهنمای رفع را باز می‌کند.
 */
export function CheckList({ checks = [], groupBy = "severity", compact = false, defaultOpenPassed = false }) {
  const [openPassed, setOpenPassed] = useState(defaultOpenPassed);
  const [expanded, setExpanded] = useState(null);

  const groups = useMemo(() => {
    const g = { error: [], warning: [], notice: [], passed: [], skipped: [] };
    for (const c of checks) (g[c.status] || g.notice).push(c);
    return g;
  }, [checks]);

  const renderItem = (c) => {
    const open = expanded === c.id;
    return (
      <li key={c.id} className="rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--surface-muted)]">
        <button type="button" className="flex w-full items-start gap-2.5 px-2 py-1.5 text-start" onClick={() => setExpanded(open ? null : c.id)}>
          <TrafficDot status={c.status} className="mt-1.5" />
          <span className="min-w-0 flex-1">
            <span className={cn("block text-[13px] leading-5 text-[var(--text)]", compact && "text-xs")}>
              {c.status === "passed" ? c.title : c.message || c.title}
            </span>
            {c.status === "passed" && c.message && <span className="block text-[11px] text-[var(--text-faint)]">{c.message}</span>}
            {c.status !== "passed" && c.message && c.message !== c.title && <span className="block text-[11px] text-[var(--text-faint)]">{c.title}</span>}
          </span>
          {!compact && <span className="hidden shrink-0 text-[10px] text-[var(--text-faint)] sm:inline">{CATEGORY_LABELS[c.category]}</span>}
          {c.howToFix && <ChevronDown size={13} className={cn("mt-1 shrink-0 text-[var(--text-faint)] transition-transform", open && "rotate-180")} />}
        </button>
        {open && c.howToFix && (
          <div className="mx-2 mb-2 flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs leading-5 text-[var(--text-muted)]">
            <Wrench size={13} className="mt-0.5 shrink-0 text-[var(--brand-500)]" />
            <span>{c.howToFix}</span>
          </div>
        )}
        {open && c.detail && Array.isArray(c.detail.links) && c.detail.links.length > 0 && (
          <ul className="mx-2 mb-2 space-y-1 text-[11px] text-[var(--text-faint)]" dir="ltr">
            {c.detail.links.map((l, i) => (
              <li key={i} className="truncate">• {typeof l === "string" ? l : `${l.url} ${l.status ? `(${l.status})` : ""}`}</li>
            ))}
          </ul>
        )}
        {open && c.detail && Array.isArray(c.detail.samples) && (
          <ul className="mx-2 mb-2 space-y-1 text-[11px] text-[var(--text-faint)]" dir="ltr">
            {c.detail.samples.map((s, i) => <li key={i} className="truncate">• {s}</li>)}
          </ul>
        )}
      </li>
    );
  };

  const problems = ["error", "warning", "notice"].flatMap((k) => groups[k]);

  return (
    <div className="space-y-3">
      {problems.length === 0 && <p className="rounded-[var(--radius-md)] bg-[var(--success-bg)] p-3 text-xs text-[var(--success)]">هیچ مشکلی پیدا نشد — همه چیز مرتب است 🎉</p>}
      {["error", "warning", "notice"].map((k) =>
        groups[k].length ? (
          <div key={k}>
            <p className="mb-1 flex items-center gap-1.5 px-2 text-[11px] font-semibold" style={{ color: SEVERITY[k].color }}>
              {SEVERITY[k].label} ({groups[k].length.toLocaleString("fa-IR")})
            </p>
            <ul className="space-y-0.5">{groups[k].map(renderItem)}</ul>
          </div>
        ) : null
      )}
      {groups.passed.length > 0 && (
        <div>
          <button type="button" onClick={() => setOpenPassed((s) => !s)} className="flex w-full items-center justify-between px-2 text-[11px] font-semibold text-[var(--success)]">
            <span>موارد درست ({groups.passed.length.toLocaleString("fa-IR")})</span>
            <ChevronDown size={13} className={cn("transition-transform", openPassed && "rotate-180")} />
          </button>
          {openPassed && <ul className="mt-1 space-y-0.5">{groups.passed.map(renderItem)}</ul>}
        </div>
      )}
      {groups.skipped.length > 0 && <p className="px-2 text-[11px] text-[var(--text-faint)]">{groups.skipped.length.toLocaleString("fa-IR")} چک بی‌صداشده</p>}
    </div>
  );
}
