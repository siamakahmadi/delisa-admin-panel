"use client";

import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";

/**
 * Persian/Jalali date + time picker for `datetime` fields (countdown deadlines
 * etc). Stores a plain ISO 8601 string, same as the previous native
 * datetime-local input — nothing downstream needs to change.
 */
export function DateTimeField({ value, onChange }) {
  const date = value ? new Date(value) : null;
  const dateIso = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : "";
  const time = date ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` : "";

  function combine(nextDateIso, nextTime) {
    if (!nextDateIso) {
      onChange("");
      return;
    }
    const [y, m, d] = nextDateIso.split("-").map(Number);
    const [h, min] = (nextTime || "00:00").split(":").map(Number);
    const dt = new Date(y, m - 1, d, h || 0, min || 0);
    onChange(dt.toISOString());
  }

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <JalaliDatePicker value={dateIso} onChange={(v) => combine(v, time)} />
      </div>
      <input
        type="time"
        value={time}
        onChange={(e) => combine(dateIso, e.target.value)}
        disabled={!dateIso}
        className="h-10 w-28 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm text-[var(--text)] outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)] disabled:opacity-50"
      />
    </div>
  );
}
