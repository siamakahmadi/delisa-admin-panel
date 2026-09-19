"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { DASHBOARD_WIDGETS } from "./widget-visibility";

export function DashboardWidgetCustomizer({ isVisible, setVisible }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-xs font-semibold transition-colors hover:bg-[var(--surface-muted)]",
          open ? "border-[var(--brand-300)] bg-[var(--surface-muted)]" : "border-[var(--border)]"
        )}
      >
        <SlidersHorizontal size={14} />
        شخصی‌سازی داشبورد
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-72 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-lg)] animate-toast-in">
          <p className="mb-2 px-1 text-xs font-bold text-[var(--text)]">نمایش ویجت‌ها</p>
          <div className="space-y-0.5">
            {DASHBOARD_WIDGETS.map((w) => (
              <label
                key={w.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-2 py-2 text-xs hover:bg-[var(--surface-muted)]"
              >
                <span className="text-[var(--text)]">{w.label}</span>
                <input
                  type="checkbox"
                  checked={isVisible(w.id)}
                  onChange={(e) => setVisible(w.id, e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-[var(--brand-600)]"
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
