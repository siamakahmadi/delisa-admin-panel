"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Trash2, Monitor, Tablet, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { usePageBuilderStore } from "@/lib/page-builder/store";
import { scheduleSectionSave } from "@/lib/page-builder/autosave";
import { adaptLayoutToAPI } from "@/lib/page-builder/normalize";
import { buildTypeDefIndex } from "@/lib/page-builder/field-utils";
import { VisibilityEditor } from "./visibility-editor";
import { ImageField } from "./fields/image-field";

const SPACING_PRESETS = { small: "8px", medium: "16px", large: "32px", none: "0px" };
const MARGIN_PRESETS = { small: "8px 0", medium: "16px 0", large: "24px 0", none: "0" };

const LAYOUT_DEVICES = [
  ["desktop", "دسکتاپ", Monitor],
  ["tablet", "تبلت", Tablet],
  ["mobile", "موبایل", Smartphone],
];

function Section({ title, k, open, onToggle, children }) {
  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button type="button" onClick={() => onToggle(k)} className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-semibold text-[var(--text)]">
        {title}
        <ChevronDown size={14} className={cn("text-[var(--text-faint)] transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-3 px-3 pb-3">{children}</div>}
    </div>
  );
}

export function SectionInspector({ page, section, registry, onDeleteComponent, onAddComponent }) {
  const updateSectionLocally = usePageBuilderStore((s) => s.updateSectionLocally);
  const selectComponent = usePageBuilderStore((s) => s.selectComponent);
  const commitHistory = usePageBuilderStore((s) => s.commitHistory);
  const [newCompType, setNewCompType] = useState(registry?.[0]?.type || "");
  const [open, setOpen] = useState({ layout: true, components: true, visibility: false });
  // Which device the "چیدمان" panel below is currently editing — mirrors
  // Elementor/Webflow's per-breakpoint style editing: "دسکتاپ" edits the
  // base layout.*; "تبلت"/"موبایل" edit layout.responsive.{device}.*
  // overrides, which win over the base value only for that device (see
  // the merge in delisa-customer's pages/index.js + landing/[slug].js).
  const [layoutDevice, setLayoutDevice] = useState("desktop");

  const typeDefByType = useMemo(() => buildTypeDefIndex(registry), [registry]);

  if (!section) return <p className="p-4 text-center text-xs text-[var(--text-faint)]">برای ویرایش، یک سکشن را از بوم انتخاب کنید.</p>;

  const isDesktopLayout = layoutDevice === "desktop";
  const responsiveOverride = section.layout?.responsive?.[layoutDevice] || {};
  // What the layout controls below should *show*: the base value, with
  // this device's override (if any) applied on top — same resolution the
  // customer site uses at render time.
  const effectiveLayout = isDesktopLayout ? section.layout || {} : { ...(section.layout || {}), ...responsiveOverride };
  const hasOverrideForDevice = !isDesktopLayout && Object.keys(responsiveOverride).length > 0;

  const applyLayoutPatch = (patch) => {
    if (isDesktopLayout) {
      const newLayout = { ...(section.layout || {}), ...patch };
      updateSectionLocally(section.id, { layout: newLayout });
      if (page?.id) scheduleSectionSave(page.id, section.id, { layout: adaptLayoutToAPI(newLayout) });
      return;
    }
    const newLayout = {
      ...(section.layout || {}),
      responsive: {
        ...(section.layout?.responsive || {}),
        [layoutDevice]: { ...responsiveOverride, ...patch },
      },
    };
    updateSectionLocally(section.id, { layout: newLayout });
    if (page?.id) scheduleSectionSave(page.id, section.id, { layout: adaptLayoutToAPI(newLayout) });
  };

  const clearDeviceOverride = () => {
    const nextResponsive = { ...(section.layout?.responsive || {}) };
    delete nextResponsive[layoutDevice];
    const newLayout = { ...(section.layout || {}), responsive: nextResponsive };
    updateSectionLocally(section.id, { layout: newLayout });
    if (page?.id) scheduleSectionSave(page.id, section.id, { layout: adaptLayoutToAPI(newLayout) });
  };

  const onTitleChange = (v) => {
    updateSectionLocally(section.id, { title: v });
    if (page?.id) scheduleSectionSave(page.id, section.id, { title: v });
  };

  const onVisibilityChange = ({ isVisible, visibility }) => {
    updateSectionLocally(section.id, { isVisible, visibility });
    if (page?.id) scheduleSectionSave(page.id, section.id, { isVisible, visibility });
    commitHistory();
  };

  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div onBlur={commitHistory}>
      <div className="p-3">
        <Label>عنوان سکشن</Label>
        <Input value={section.title || ""} onChange={(e) => onTitleChange(e.target.value)} />
      </div>

      <Section title="چیدمان" k="layout" open={open.layout} onToggle={toggle}>
        <div>
          <Label>ویرایش چیدمان برای دستگاه</Label>
          <div className="flex gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-1">
            {LAYOUT_DEVICES.map(([d, label, Icon]) => (
              <button
                key={d}
                type="button"
                onClick={() => setLayoutDevice(d)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] py-1.5 text-[11px] font-medium transition-colors",
                  layoutDevice === d ? "bg-[var(--surface)] text-[var(--brand-700)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text)]"
                )}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
          {!isDesktopLayout && (
            <p className="mt-1.5 text-[11px] text-[var(--text-faint)]">
              فقط مقادیری که اینجا تغییر بدید، مخصوص «{LAYOUT_DEVICES.find(([d]) => d === layoutDevice)?.[1]}» ذخیره می‌شن؛ بقیه از حالت دسکتاپ ارث می‌برن.
              {hasOverrideForDevice && (
                <button type="button" onClick={clearDeviceOverride} className="ms-1.5 text-[var(--brand-600)] hover:underline">
                  بازنشانی همه به دسکتاپ
                </button>
              )}
            </p>
          )}
        </div>

        <div>
          <Label>نوع چیدمان</Label>
          <div className="flex gap-1.5">
            {["block", "grid", "flex"].map((d) => (
              <button
                key={d}
                onClick={() => applyLayoutPatch({ display: d })}
                className={cn(
                  "flex-1 rounded-[var(--radius-sm)] border py-1.5 text-xs",
                  effectiveLayout.display === d ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]" : "border-[var(--border)] text-[var(--text-muted)]"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {effectiveLayout.display === "grid" && (
          <>
            <div>
              <Label>ستون‌ها</Label>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => applyLayoutPatch({ gridTemplateColumns: `repeat(${n}, 1fr)`, display: "grid" })}
                    className={cn(
                      "h-8 w-8 rounded-[var(--radius-sm)] border text-xs",
                      effectiveLayout.gridTemplateColumns === `repeat(${n}, 1fr)` ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]" : "border-[var(--border)] text-[var(--text-muted)]"
                    )}
                  >
                    {n.toLocaleString("fa-IR")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>gridTemplateColumns</Label>
              <Input dir="ltr" value={effectiveLayout.gridTemplateColumns || ""} onChange={(e) => applyLayoutPatch({ gridTemplateColumns: e.target.value })} placeholder="repeat(3, 1fr)" />
            </div>
          </>
        )}

        {effectiveLayout.display === "flex" && (
          <div>
            <Label>flexDirection</Label>
            <div className="flex flex-wrap gap-1.5">
              {["row", "column", "row-reverse", "column-reverse"].map((d) => (
                <button
                  key={d}
                  onClick={() => applyLayoutPatch({ display: "flex", flexDirection: d })}
                  className={cn(
                    "rounded-[var(--radius-sm)] border px-2 py-1 text-[11px]",
                    effectiveLayout.flexDirection === d ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]" : "border-[var(--border)] text-[var(--text-muted)]"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {["gap", "padding", "margin"].map((sp) => (
          <div key={sp}>
            <Label>{sp}</Label>
            <div className="flex items-center gap-1.5">
              <div className="flex gap-1">
                {["small", "medium", "large", "none"].map((s) => (
                  <button
                    key={s}
                    onClick={() => applyLayoutPatch({ [sp]: (sp === "margin" ? MARGIN_PRESETS : SPACING_PRESETS)[s] })}
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] px-1.5 py-1 text-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Input dir="ltr" className="h-8 text-xs" value={effectiveLayout[sp] || ""} onChange={(e) => applyLayoutPatch({ [sp]: e.target.value })} />
            </div>
          </div>
        ))}

        {isDesktopLayout && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>رنگ پس‌زمینه</Label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={effectiveLayout.backgroundColor || "#ffffff"}
                  onChange={(e) => applyLayoutPatch({ backgroundColor: e.target.value })}
                  className="h-9 w-10 shrink-0 rounded-[var(--radius-sm)] border border-[var(--border)]"
                />
                {effectiveLayout.backgroundColor && (
                  <button onClick={() => applyLayoutPatch({ backgroundColor: "" })} className="text-[11px] text-[var(--text-faint)] hover:text-[var(--danger)]">
                    حذف
                  </button>
                )}
              </div>
            </div>
            <div>
              <Label>عرض محتوا</Label>
              <Select value={effectiveLayout.contentWidth || "container"} onChange={(e) => applyLayoutPatch({ contentWidth: e.target.value })}>
                <option value="full">تمام عرض</option>
                <option value="container">استاندارد</option>
                <option value="narrow">باریک</option>
              </Select>
            </div>
          </div>
        )}

        {isDesktopLayout && (
          <div>
            <Label>تصویر پس‌زمینه (اختیاری)</Label>
            <ImageField value={effectiveLayout.backgroundImage || ""} onChange={(url) => applyLayoutPatch({ backgroundImage: url })} />
          </div>
        )}
      </Section>

      <Section title={`کامپوننت‌های سکشن (${(section.components?.length || 0).toLocaleString("fa-IR")})`} k="components" open={open.components} onToggle={toggle}>
        <div className="flex gap-1.5">
          <Select value={newCompType} onChange={(e) => setNewCompType(e.target.value)} className="flex-1">
            {(registry || []).map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </Select>
          <button onClick={() => onAddComponent(newCompType)} className="shrink-0 rounded-[var(--radius-md)] bg-[var(--brand-600)] px-3 text-xs text-white hover:bg-[var(--brand-700)]">
            افزودن
          </button>
        </div>

        {(section.components || []).map((c) => {
          const def = typeDefByType.get(c.type);
          return (
            <div key={c.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] px-2.5 py-1.5">
              <button onClick={() => selectComponent(c.id)} className="text-xs text-[var(--text)] hover:text-[var(--brand-600)]">
                {def?.label || c.type}
                {c.isVisible === false && <span className="ms-1.5 text-[10px] text-[var(--text-faint)]">پنهان</span>}
              </button>
              <button onClick={() => onDeleteComponent(c)} className="text-[var(--text-faint)] hover:text-[var(--danger)]">
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
        {!(section.components || []).length && <p className="text-xs text-[var(--text-faint)]">کامپوننتی وجود ندارد</p>}
      </Section>

      <Section title="نمایش" k="visibility" open={open.visibility} onToggle={toggle}>
        <VisibilityEditor isVisible={section.isVisible} visibility={section.visibility} onChange={onVisibilityChange} />
      </Section>
    </div>
  );
}
