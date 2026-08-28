"use client";

import { Hand, Clock, TrendingUp, Percent, Store, Grid3x3, Tag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, Label } from "@/components/ui/input";
import { PickerField } from "./picker-field";

const FILTER_TYPES = [
  ["manual", "دستی", Hand],
  ["latest", "جدیدترین", Clock],
  ["popularity", "پرفروش‌ترین", TrendingUp],
  ["discount", "تخفیف‌دار", Percent],
  ["brand", "برند", Store],
  ["category", "دسته‌بندی", Grid3x3],
  ["tag", "تگ", Tag],
  ["personalized", "پیشنهادی کاربر", Sparkles],
];

// فقط برای این سه نوع، «تلفیق با پروفایل زیبایی» معنی دارد — چون فقط این‌ها
// یک محدودیت واقعی (دسته/برند/تگ) دارند که بشود همراه با تطبیق پروفایل
// اعمال کرد (نگاه کن به matchService.getMatchingProducts -> extraFilter در
// back_end). برای latest/popularity/discount، حالت مستقل «پیشنهادی کاربر»
// همان نتیجه را با کیفیت بهتر می‌دهد.
const BOOSTABLE_TYPES = ["brand", "category", "tag"];

const SCOPE_OPTIONS = [
  ["skinType", "نوع پوست"],
  ["concerns", "دغدغه‌های پوستی"],
  ["preferences", "سلیقه (بافت/رایحه/ترکیبات)"],
  ["budget", "بودجه"],
  ["goals", "اهداف"],
];

function FilterTypeChip({ Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-medium transition-all",
        active
          ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)] shadow-[var(--shadow-sm)]"
          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand-200)] hover:bg-[var(--surface-muted)]"
      )}
    >
      <Icon size={14} className={active ? "text-[var(--brand-600)]" : "text-[var(--text-faint)]"} />
      {label}
    </button>
  );
}

function ScopePicker({ value = [], onChange }) {
  const toggle = (key) => {
    if (value.includes(key)) onChange(value.filter((v) => v !== key));
    else onChange([...value, key]);
  };

  return (
    <div>
      <Label>پیشنهادها بر اساس کدام بخش از پروفایل زیبایی فیلتر شوند؟</Label>
      <div className="flex flex-wrap gap-1.5">
        {SCOPE_OPTIONS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              value.includes(key)
                ? "border-[var(--brand-500)] bg-[var(--brand-600)] text-white"
                : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-[var(--text-faint)]">
        {value.length ? "فقط این بخش‌ها در تطبیق دخیل می‌شوند." : "چیزی انتخاب نشده = کل پروفایل (همه بخش‌ها) ملاک تطبیق است."}
      </p>
    </div>
  );
}

export function ProductSourceField({ value, onChange }) {
  const v = value && typeof value === "object" ? value : {};
  const filterType = v.filterType || "manual";
  const filterItems = Array.isArray(v.filterItems) ? v.filterItems : [];
  const displayLimit = typeof v.displayLimit === "number" ? v.displayLimit : 12;
  const personalize = Boolean(v.personalize);
  const personalizeScope = Array.isArray(v.personalizeScope) ? v.personalizeScope : [];

  const patch = (next) => onChange({ filterType, filterItems, displayLimit, personalize, personalizeScope, ...next });
  const pickerKind = ["manual", "brand", "category", "tag"].includes(filterType)
    ? filterType === "manual"
      ? "product"
      : filterType
    : null;

  const isPersonalized = filterType === "personalized";
  const canBoost = BOOSTABLE_TYPES.includes(filterType);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="radiogroup">
        {FILTER_TYPES.map(([val, label, Icon]) => (
          <FilterTypeChip
            key={val}
            Icon={Icon}
            label={label}
            active={filterType === val}
            onClick={() => patch({ filterType: val, filterItems: [], personalize: val === "personalized" ? false : personalize })}
          />
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

      {isPersonalized && (
        <div className="rounded-[var(--radius-md)] border border-[var(--brand-200)] bg-[var(--brand-50)] p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--brand-700)]">
            <Sparkles size={14} />
            محصولات کاملاً بر اساس Beauty Profile هر مشتری انتخاب می‌شوند — بدون هیچ انتخاب دستی.
          </p>
          <ScopePicker value={personalizeScope} onChange={(scope) => patch({ personalizeScope: scope })} />
        </div>
      )}

      {canBoost && (
        <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-md)] border border-[var(--border)] p-3 text-xs hover:bg-[var(--surface-muted)]">
          <input
            type="checkbox"
            checked={personalize}
            onChange={(e) => patch({ personalize: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[var(--brand-600)]"
          />
          <span>
            <span className="flex items-center gap-1 font-medium text-[var(--text)]">
              <Sparkles size={13} className="text-[var(--brand-600)]" />
              اولویت با پیشنهادهای مناسب مشتری
            </span>
            <span className="mt-0.5 block text-[var(--text-faint)]">
              در همین {FILTER_TYPES.find(([v2]) => v2 === filterType)?.[1]}، محصولاتی که با Beauty Profile مشتری بیشتر همخوانی دارند بالاتر نمایش داده می‌شوند.
            </span>
          </span>
        </label>
      )}
      {canBoost && personalize && (
        <ScopePicker value={personalizeScope} onChange={(scope) => patch({ personalizeScope: scope })} />
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
