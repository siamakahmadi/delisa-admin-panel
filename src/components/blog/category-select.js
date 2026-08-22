"use client";

import { useQuery } from "@tanstack/react-query";
import Select from "react-select";
import { cn } from "@/lib/utils";
import { fetchCategories } from "@/lib/blog/api";

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
    cn("!text-sm !px-3 !py-2", isSelected ? "!bg-[var(--brand-600)] !text-white" : isFocused ? "!bg-[var(--surface-muted)] !text-[var(--text)]" : "!text-[var(--text)]"),
  noOptionsMessage: () => "!text-[var(--text-faint)] !text-sm",
  indicatorSeparator: () => "!bg-[var(--border)]",
  dropdownIndicator: () => "!text-[var(--text-faint)]",
  clearIndicator: () => "!text-[var(--text-faint)]",
};

function toOption(c) {
  return { value: c._id, label: `${c.name}${typeof c.postCount === "number" ? ` (${c.postCount})` : ""}` };
}

/** value/onChange operate on plain category ids (string | null). */
export function CategorySelect({ value, onChange }) {
  const { data, isLoading } = useQuery({ queryKey: ["blog-categories"], queryFn: fetchCategories });
  const options = (data ?? []).map(toOption);
  const selected = value ? options.find((o) => o.value === value) || null : null;

  return (
    <Select
      unstyled
      isLoading={isLoading}
      isClearable
      options={options}
      value={selected}
      onChange={(opt) => onChange(opt ? opt.value : null)}
      placeholder="دسته‌ای را انتخاب کنید"
      noOptionsMessage={() => "دسته‌ای یافت نشد"}
      classNames={selectClassNames}
    />
  );
}
