"use client";

import { useMemo, useState } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePageBuilderStore } from "@/lib/page-builder/store";
import { scheduleSectionSave, debouncedSaveComponent } from "@/lib/page-builder/autosave";
import { buildTypeDefIndex, DEVICE_LABELS } from "@/lib/page-builder/field-utils";

const DEVICES = [
  ["desktop", "دسکتاپ", Monitor],
  ["tablet", "تبلت", Tablet],
  ["mobile", "موبایل", Smartphone],
];

function isOnForDevice(visibility, device) {
  const devices = visibility?.devices;
  if (!Array.isArray(devices) || devices.length === 0) return true;
  return devices.includes(device);
}

/**
 * "چیدمان بر اساس دستگاه" — a single, dedicated place to see every
 * section/component of the page at once and control, per device, whether
 * it's shown and (for components) what order it renders in — instead of
 * hunting through each section's own inspector one at a time. Reuses the
 * exact same store actions + autosave helpers as SectionInspector /
 * ComponentInspector; this panel is just a different, page-wide view onto
 * the same isVisible/visibility data.
 */
export function DeviceLayoutPanel({ open, onOpenChange, page, registry }) {
  const [device, setDevice] = useState("desktop");
  const updateSectionLocally = usePageBuilderStore((s) => s.updateSectionLocally);
  const updateComponentLocally = usePageBuilderStore((s) => s.updateComponentLocally);
  const commitHistory = usePageBuilderStore((s) => s.commitHistory);

  const typeDefByType = useMemo(() => buildTypeDefIndex(registry), [registry]);

  function toggleSectionDevice(section) {
    const v = section.visibility || { devices: ["desktop", "tablet", "mobile"] };
    const current = Array.isArray(v.devices) && v.devices.length ? v.devices : ["desktop", "tablet", "mobile"];
    const next = current.includes(device) ? current.filter((d) => d !== device) : [...current, device];
    const visibility = { ...v, devices: next.length ? next : ["desktop", "tablet", "mobile"] };
    updateSectionLocally(section.id, { visibility });
    if (page?.id) scheduleSectionSave(page.id, section.id, { visibility });
    commitHistory();
  }

  function toggleComponentDevice(section, component) {
    const v = component.visibility || { devices: ["desktop", "tablet", "mobile"] };
    const current = Array.isArray(v.devices) && v.devices.length ? v.devices : ["desktop", "tablet", "mobile"];
    const next = current.includes(device) ? current.filter((d) => d !== device) : [...current, device];
    const visibility = { ...v, devices: next.length ? next : ["desktop", "tablet", "mobile"] };
    updateComponentLocally(section.id, component.id, { visibility });
    if (page?.id) debouncedSaveComponent(page.id, section.id, component.id, { visibility });
    commitHistory();
  }

  function setComponentOrder(section, component, raw) {
    const v = component.visibility || {};
    const nextOrder = { ...(v.order && typeof v.order === "object" ? v.order : {}) };
    if (raw === "") delete nextOrder[device];
    else nextOrder[device] = Number(raw);
    const visibility = { ...v, order: Object.keys(nextOrder).length ? nextOrder : null };
    updateComponentLocally(section.id, component.id, { visibility });
    if (page?.id) debouncedSaveComponent(page.id, section.id, component.id, { visibility });
  }

  const sections = page?.sections || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[92vw] max-w-3xl overflow-y-auto">
        <DialogTitle>چیدمان بر اساس دستگاه</DialogTitle>
        <DialogDescription>
          نمایش و ترتیب سکشن‌ها و کامپوننت‌های کل صفحه را برای هر دستگاه، بدون نیاز به باز کردن هر سکشن به‌صورت جداگانه، از همین‌جا مدیریت کنید.
        </DialogDescription>

        <div className="mt-4 flex gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-1">
          {DEVICES.map(([d, label, Icon]) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] py-1.5 text-xs font-medium transition-colors",
                device === d ? "bg-[var(--surface)] text-[var(--brand-700)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text)]"
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {!sections.length && <p className="py-6 text-center text-xs text-[var(--text-faint)]">این صفحه هنوز سکشنی ندارد.</p>}

          {sections.map((section) => {
            const sectionOn = isOnForDevice(section.visibility, device);
            const components = section.components || [];

            return (
              <div key={section.id} className="rounded-[var(--radius-md)] border border-[var(--border)]">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2">
                  <span className={cn("text-xs font-semibold", !sectionOn && "text-[var(--text-faint)] line-through")}>
                    {section.title || "سکشن بدون عنوان"}
                  </span>
                  <label className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <input
                      type="checkbox"
                      checked={sectionOn}
                      onChange={() => toggleSectionDevice(section)}
                      className="h-3.5 w-3.5 accent-[var(--brand-600)]"
                    />
                    نمایش در {DEVICE_LABELS[device]}
                  </label>
                </div>

                {!components.length ? (
                  <p className="px-3 py-2.5 text-xs text-[var(--text-faint)]">کامپوننتی ندارد</p>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {components.map((component) => {
                      const compOn = isOnForDevice(component.visibility, device);
                      const def = typeDefByType.get(component.type);
                      const orderValue = component.visibility?.order?.[device];

                      return (
                        <div key={component.id} className="flex items-center gap-2 px-3 py-2">
                          <span className={cn("flex-1 truncate text-xs", !compOn && "text-[var(--text-faint)] line-through")}>
                            {def?.label || component.type}
                          </span>
                          <input
                            type="number"
                            dir="ltr"
                            value={orderValue ?? ""}
                            onChange={(e) => setComponentOrder(section, component, e.target.value)}
                            placeholder="ترتیب"
                            title={`ترتیب سفارشی در ${DEVICE_LABELS[device]}`}
                            className="h-8 w-16 shrink-0 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-1.5 text-[11px] outline-none focus:border-[var(--brand-500)]"
                          />
                          <label className="flex shrink-0 items-center gap-1 text-[11px] text-[var(--text-muted)]">
                            <input
                              type="checkbox"
                              checked={compOn}
                              onChange={() => toggleComponentDevice(section, component)}
                              className="h-3.5 w-3.5 accent-[var(--brand-600)]"
                            />
                            نمایش
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
