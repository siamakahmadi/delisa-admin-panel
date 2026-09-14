"use client";

import { cn } from "@/lib/utils";
import { scoreColor, scoreLabel } from "@/lib/seo/constants";

/** حلقه‌ی نمره (۰–۱۰۰) — رنگ بر اساس بازه‌ی نمره */
export function ScoreRing({ score, size = 96, stroke = 8, label, className, showLabel = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score));
  const color = scoreColor(score);
  return (
    <div className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold leading-none text-[var(--text)]" style={{ fontSize: size * 0.28 }}>
          {score == null ? "—" : Number(score).toLocaleString("fa-IR")}
        </span>
        {showLabel && (
          <span className="mt-1 leading-none text-[var(--text-muted)]" style={{ fontSize: Math.max(10, size * 0.11) }}>
            {label ?? scoreLabel(score)}
          </span>
        )}
      </div>
    </div>
  );
}

/** نوار نمره‌ی کوچک (برای جدول‌ها) */
export function ScoreBar({ score, className }) {
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--surface-muted)]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: scoreColor(score) }} />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color: scoreColor(score) }}>
        {score == null ? "—" : Number(score).toLocaleString("fa-IR")}
      </span>
    </div>
  );
}
