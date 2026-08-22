"use client";

import { cn } from "@/lib/utils";
import { Input, Label } from "@/components/ui/input";
import { PickerField } from "./picker-field";

const FILTER_TYPES = [
  ["manual", "دستی"],
  ["latest", "جدیدترین"],
  ["popularity", "پرفروش‌ترین"],
  ["discount", "تخفیف‌دار"],
  ["brand", "برند"],
  ["category", "دسته‌بندی"],
  ["tag", "تگ"],
];

export function ProductSourceField({ value, onChange }) {
  const v = value && typeof value === "object" ? value : {};
  const filterType = v.filterType || "manual";
  const filterItems = Array.isArray(v.filterItems) ? v.filterItems : [];
  const displayLimit = typeof v.displayLimit === "number" ? v.displayLimit : 12;

  const patch = (next) => onChange({ filterType, filterItems, displayLimit, ...next });
  const pickerKind = ["manual", "brand", "category", "tag"].includes(filterType)
    ? filterType === "manual"
      ? "product"
      : filterType
    : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="radiogroup">
        {FILTER_TYPES.map(([val, label]) => (
          <button
            key={val}
            type="button"
            role="radio"
            aria-checked={filterType === val}
            onClick={() => patch({ filterType: val, filterItems: [] })}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filterType === val
                ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {pickerKind && (
        <div>
          <Label>انتخاب {FILTER_TYPES.find(([v2]) => v2 === filterType)?.[1]}</Label>
          <PickerField kind={pickerKind} value={filterItems} onChange={(items) => patch({ filterItems: items })} />
        </div>
      )}
      {["latest", "popularity", "discount"].includes(filterType) && (
        <p className="text-xs text-[var(--text-faint)]">این حالت فقط ترتیب محصولات را مشخص می‌کند؛ نیازی به انتخاب دستی نیست.</p>
      )}

      <div>
        <Label>حداکثر تعداد نمایش</Label>
        <Input
          type="number"
          min={1}
          max={50}
          value={displayLimit}
          onChange={(e) => patch({ displayLimit: Math.max(1, Number(e.target.value) || 1) })}
        />
      </div>
    </div>
  );
}
