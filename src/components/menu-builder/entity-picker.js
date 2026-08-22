"use client";

import { useCallback } from "react";
import AsyncSelect from "react-select/async";
import { cn } from "@/lib/utils";
import { searchEntities } from "@/lib/menu-builder/api";

const TYPE_LABELS = { category: "دسته‌بندی", brand: "برند", product: "محصول", tag: "برچسب", type: "نوع محصول", page: "صفحه" };

const selectClassNames = {
  control: ({ isFocused }) =>
    cn(
      "!min-h-10 !rounded-[var(--radius-md)] !border !bg-[var(--surface)] !shadow-none",
      isFocused ? "!border-[var(--brand-500)] !ring-2 !ring-[var(--brand-100)]" : "!border-[var(--border)]"
    ),
  placeholder: () => "!text-[var(--text-faint)]",
  input: () => "!text-[var(--text)]",
  singleValue: () => "!text-[var(--text)]",
  menu: () => "!rounded-[var(--radius-md)] !border !border-[var(--border)] !bg-[var(--surface)] !shadow-[var(--shadow-lg)] !mt-1.5 !z-30",
  option: ({ isFocused, isSelected }) =>
    cn(
      "!text-sm !px-3 !py-2 !flex !items-center !gap-2",
      isSelected ? "!bg-[var(--brand-600)] !text-white" : isFocused ? "!bg-[var(--surface-muted)] !text-[var(--text)]" : "!text-[var(--text)]"
    ),
  noOptionsMessage: () => "!text-[var(--text-faint)] !text-sm",
  indicatorSeparator: () => "!bg-[var(--border)]",
  dropdownIndicator: () => "!text-[var(--text-faint)]",
  clearIndicator: () => "!text-[var(--text-faint)]",
};

function toOption(row) {
  return { value: row._id, label: row.title, image: row.image, raw: row };
}

function formatOptionLabel(option) {
  return (
    <div className="flex items-center gap-2">
      {option.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={option.image} alt="" className="h-6 w-6 rounded-[4px] object-cover" />
      ) : (
        <span className="h-6 w-6 shrink-0 rounded-[4px] bg-[var(--surface-muted)]" />
      )}
      <span>{option.label}</span>
    </div>
  );
}

/** Debounced async-search picker for category/brand/product/tag/type/page. */
export function EntityPicker({ type, value, onChange }) {
  const loadOptions = useCallback((inputValue) => searchEntities(type, inputValue, 25).then((rows) => rows.map(toOption)).catch(() => []), [type]);

  return (
    <AsyncSelect
      key={type}
      unstyled
      cacheOptions
      defaultOptions
      loadOptions={loadOptions}
      value={value ? { value: value.refId, label: value.title || "…", image: value.image } : null}
      onChange={(opt) => onChange(opt ? { refId: opt.value, title: opt.raw.title, image: opt.raw.image, slug: opt.raw.slug } : null)}
      formatOptionLabel={formatOptionLabel}
      placeholder={`جستجوی ${TYPE_LABELS[type] || type}…`}
      noOptionsMessage={({ inputValue }) => (inputValue ? "موردی یافت نشد" : "برای جستجو تایپ کنید")}
      loadingMessage={() => "در حال جستجو…"}
      classNames={selectClassNames}
      isClearable
    />
  );
}
