"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ImageField } from "./fields/image-field";
import { LinkField } from "./fields/link-field";
import { PickerField } from "./fields/picker-field";
import { ProductSourceField } from "./fields/product-source-field";
import { RepeaterField } from "./fields/repeater-field";
import { DateTimeField } from "./fields/datetime-field";

const RESPONSIVE_BREAKPOINTS = [
  ["tablet", "تبلت"],
  ["mobile", "موبایل"],
];

function isResponsiveValue(v) {
  return v && typeof v === "object" && !Array.isArray(v) && "base" in v;
}

function BaseInput({ field, value, onChange }) {
  switch (field.type) {
    case "textarea":
      return (
        <textarea
          rows={3}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
        />
      );
    case "number":
      return (
        <Input
          type="number"
          min={field.min}
          max={field.max}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      );
    case "boolean":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
          {value ? "فعال" : "غیرفعال"}
        </label>
      );
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || "#6c5ce7"}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-12 shrink-0 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]"
          />
          <Input dir="ltr" value={value || ""} placeholder="#6c5ce7" onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "datetime":
      return <DateTimeField value={value} onChange={onChange} />;
    case "select":
      return (
        <Select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">-- انتخاب کنید --</option>
          {(field.options || []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      );
    case "multiselect":
      return (
        <select
          multiple
          value={Array.isArray(value) ? value : []}
          onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value))}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2 text-sm outline-none focus:border-[var(--brand-500)]"
        >
          {(field.options || []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "image":
      return <ImageField value={value} onChange={onChange} />;
    case "link":
      return <LinkField value={value} onChange={onChange} placeholder={field.placeholder} />;
    case "richtext":
      return <RichTextEditor value={value?.html ?? value} onChange={({ html }) => onChange(html)} placeholder={field.placeholder} />;
    case "productPicker":
      return <PickerField kind="product" value={value} onChange={onChange} />;
    case "categoryPicker":
      return <PickerField kind="category" value={value} onChange={onChange} />;
    case "brandPicker":
      return <PickerField kind="brand" value={value} onChange={onChange} />;
    case "tagPicker":
      return <PickerField kind="tag" value={value} onChange={onChange} />;
    case "productSource":
      return <ProductSourceField value={value} onChange={onChange} />;
    case "repeater":
      return <RepeaterField fields={field.fields || []} value={value} onChange={onChange} itemLabel={field.label} />;
    case "text":
    default:
      return <Input value={value ?? ""} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
}

/** Renders a single Field definition from the component-type registry, with optional per-breakpoint overrides. */
export function FieldRenderer({ field, value, onChange }) {
  const isWide = field.type === "repeater" || field.type === "richtext";
  const responsiveActive = field.responsive && isResponsiveValue(value);
  const [showResponsive, setShowResponsive] = useState(responsiveActive);

  const baseValue = responsiveActive || showResponsive ? value?.base : value;

  function updateBase(v) {
    if (showResponsive) onChange({ ...(isResponsiveValue(value) ? value : { base: v }), base: v });
    else onChange(v);
  }

  function updateBreakpoint(bp, v) {
    const current = isResponsiveValue(value) ? value : { base: value };
    onChange({ ...current, [bp]: v });
  }

  function toggleResponsive(checked) {
    setShowResponsive(checked);
    onChange(checked ? (isResponsiveValue(value) ? value : { base: value }) : isResponsiveValue(value) ? value.base : value);
  }

  return (
    <div data-field-key={field.key} className={isWide ? "col-span-full" : ""}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Label className="!mb-0">
          {field.label}
          {field.required && <span className="text-[var(--danger)]"> *</span>}
        </Label>
        {field.responsive && (
          <label className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
            <input type="checkbox" checked={showResponsive} onChange={(e) => toggleResponsive(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--brand-600)]" />
            تنظیم جداگانه برای دستگاه‌ها
          </label>
        )}
      </div>

      {field.helpText && <p className="mb-1.5 text-xs text-[var(--text-faint)]">{field.helpText}</p>}

      <BaseInput field={field} value={baseValue} onChange={updateBase} />

      {showResponsive && (
        <div className="mt-2 space-y-2 border-s-2 border-[var(--border)] ps-3">
          {RESPONSIVE_BREAKPOINTS.map(([bp, label]) => (
            <div key={bp}>
              <span className="mb-1 block text-[11px] text-[var(--text-faint)]">{label}</span>
              <BaseInput field={field} value={isResponsiveValue(value) ? value[bp] : undefined} onChange={(v) => updateBreakpoint(bp, v)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
