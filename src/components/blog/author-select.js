"use client";

import { useQuery } from "@tanstack/react-query";
import Select from "react-select";
import { cn } from "@/lib/utils";
import { fetchAuthors } from "@/lib/blog/api";

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
};

/** value/onChange operate on plain author ids (string | null). خالی = نویسنده‌ی پیش‌فرض (کاربر فعلی). */
export function AuthorSelect({ value, onChange }) {
  const { data, isLoading } = useQuery({ queryKey: ["blog-authors"], queryFn: fetchAuthors });
  const options = (data ?? []).map((a) => ({ value: a._id, label: a.name }));
  const selected = value ? options.find((o) => o.value === value) || null : null;

  return (
    <Select
      unstyled
      isLoading={isLoading}
      options={options}
      value={selected}
      onChange={(opt) => onChange(opt ? opt.value : null)}
      placeholder="نویسنده را انتخاب کنید"
      noOptionsMessage={() => "نویسنده‌ای یافت نشد"}
      classNames={selectClassNames}
    />
  );
}
