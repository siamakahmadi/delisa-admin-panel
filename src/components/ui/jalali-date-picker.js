"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isoToJalali, jalaliToIso, formatJalali, daysInJalaliMonth, JALALI_MONTHS, JALALI_WEEKDAYS, toJalali } from "@/lib/jalali";

function todayJalali() {
  const t = toJalali(new Date());
  return { jy: t.jy, jm: t.jm };
}

export function JalaliDatePicker({ value, onChange, placeholder = "انتخاب تاریخ", disabled, className }) {
  const [open, setOpen] = useState(false);
  const selected = isoToJalali(value);
  const [view, setView] = useState(() => (selected ? { jy: selected.jy, jm: selected.jm } : todayJalali()));
  const containerRef = useRef(null);

  useEffect(() => {
    const onOutside = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const openPicker = () => {
    if (disabled) return;
    setView(selected ? { jy: selected.jy, jm: selected.jm } : todayJalali());
    setOpen((v) => !v);
  };

  const changeMonth = (delta) => {
    setView((v) => {
      let jm = v.jm + delta;
      let jy = v.jy;
      if (jm > 12) {
        jm = 1;
        jy += 1;
      } else if (jm < 1) {
        jm = 12;
        jy -= 1;
      }
      return { jy, jm };
    });
  };

  const dayCount = daysInJalaliMonth(view.jy, view.jm);
  const firstOfMonthIso = jalaliToIso(view.jy, view.jm, 1);
  const firstWeekday = new Date(firstOfMonthIso).getDay(); // 0=Sunday..6=Saturday, matches JALALI_WEEKDAYS order (ش..ج)
  const leadingBlanks = firstWeekday;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none transition-colors",
          open && "border-[var(--brand-500)] ring-2 ring-[var(--brand-100)]",
          disabled && "opacity-50",
          className
        )}
      >
        <span className={value ? "text-[var(--text)]" : "text-[var(--text-faint)]"}>{value ? formatJalali(value) : placeholder}</span>
        <CalendarIcon size={14} className="shrink-0 text-[var(--text-faint)]" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-72 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-lg)]">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => changeMonth(1)} className="rounded-[var(--radius-sm)] p-1 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]">
              <ChevronRight size={16} />
            </button>
            <span className="text-sm font-semibold text-[var(--text)]">
              {JALALI_MONTHS[view.jm - 1]} {view.jy.toLocaleString("fa-IR", { useGrouping: false })}
            </span>
            <button type="button" onClick={() => changeMonth(-1)} className="rounded-[var(--radius-sm)] p-1 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]">
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] text-[var(--text-faint)]">
            {JALALI_WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: dayCount }).map((_, i) => {
              const day = i + 1;
              const iso = jalaliToIso(view.jy, view.jm, day);
              const isSelected = value === iso;
              const isToday = (() => {
                const t = todayJalali();
                return t.jy === view.jy && t.jm === view.jm && toJalali(new Date()).jd === day;
              })();
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-xs transition-colors hover:bg-[var(--surface-muted)]",
                    isSelected && "bg-[var(--brand-600)] text-white hover:bg-[var(--brand-600)]",
                    !isSelected && isToday && "border border-[var(--brand-500)] text-[var(--brand-600)]"
                  )}
                >
                  {day.toLocaleString("fa-IR")}
                </button>
              );
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="mt-2 w-full rounded-[var(--radius-sm)] py-1.5 text-center text-xs text-[var(--text-faint)] hover:bg-[var(--surface-muted)] hover:text-[var(--danger)]"
            >
              پاک کردن
            </button>
          )}
        </div>
      )}
    </div>
  );
}
