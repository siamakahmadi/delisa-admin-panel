"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/input";
import { DEVICE_LABELS } from "@/lib/page-builder/field-utils";

const DEVICES = ["desktop", "tablet", "mobile"];

/**
 * Universal visibility controls shared by every section AND component
 * inspector. `showOrder` additionally renders a per-device display-order
 * override — only meaningful for components (a section's position on the
 * page doesn't vary per device), so only ComponentInspector passes it.
 */
export function VisibilityEditor({ isVisible, visibility, onChange, showOrder = false }) {
  const v = visibility || { devices: DEVICES, startsAt: null, endsAt: null, order: null };
  const devices = Array.isArray(v.devices) && v.devices.length ? v.devices : DEVICES;
  const order = v.order && typeof v.order === "object" ? v.order : {};

  const updateOrder = (device, raw) => {
    const nextOrder = { ...order };
    if (raw === "") delete nextOrder[device];
    else nextOrder[device] = Number(raw);
    onChange({ isVisible, visibility: { ...v, order: Object.keys(nextOrder).length ? nextOrder : null } });
  };

  const toggleDevice = (d) => {
    const next = devices.includes(d) ? devices.filter((x) => x !== d) : [...devices, d];
    onChange({ isVisible, visibility: { ...v, devices: next.length ? next : DEVICES } });
  };

  const toIsoOrNull = (val) => (val ? new Date(val).toISOString() : null);
  const toLocalInput = (val) => (val ? String(val).slice(0, 16) : "");

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isVisible !== false} onChange={(e) => onChange({ isVisible: e.target.checked, visibility: v })} className="h-4 w-4 accent-[var(--brand-600)]" />
        {isVisible !== false ? "نمایش داده می‌شود" : "پنهان است"}
      </label>

      <div>
        <Label>دستگاه‌های نمایش</Label>
        <div className="flex flex-wrap gap-1.5" role="group">
          {DEVICES.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={devices.includes(d)}
              onClick={() => toggleDevice(d)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                devices.includes(d)
                  ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              )}
            >
              {DEVICE_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>شروع نمایش (اختیاری)</Label>
          <input
            type="datetime-local"
            dir="ltr"
            value={toLocalInput(v.startsAt)}
            onChange={(e) => onChange({ isVisible, visibility: { ...v, startsAt: toIsoOrNull(e.target.value) } })}
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs outline-none focus:border-[var(--brand-500)]"
          />
        </div>
        <div>
          <Label>پایان نمایش (اختیاری)</Label>
          <input
            type="datetime-local"
            dir="ltr"
            value={toLocalInput(v.endsAt)}
            onChange={(e) => onChange({ isVisible, visibility: { ...v, endsAt: toIsoOrNull(e.target.value) } })}
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs outline-none focus:border-[var(--brand-500)]"
          />
        </div>
      </div>

      {showOrder && (
        <div>
          <Label>ترتیب نمایش سفارشی (اختیاری)</Label>
          <p className="mb-1.5 text-xs text-[var(--text-faint)]">
            برای جابه‌جا کردن این کامپوننت در یک دستگاه خاص عددی وارد کنید (عدد کوچیک‌تر = زودتر). خالی بگذارید تا ترتیب طبیعی (همان ترتیب در بوم) حفظ شود.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEVICES.map((d) => (
              <div key={d}>
                <span className="mb-1 block text-[11px] text-[var(--text-faint)]">{DEVICE_LABELS[d]}</span>
                <input
                  type="number"
                  dir="ltr"
                  value={order[d] ?? ""}
                  onChange={(e) => updateOrder(d, e.target.value)}
                  placeholder="—"
                  className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-2 text-xs outline-none focus:border-[var(--brand-500)]"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
