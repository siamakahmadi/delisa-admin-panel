"use client";

import { useQuery } from "@tanstack/react-query";
import CreatableSelect from "react-select/creatable";
import { cn } from "@/lib/utils";
import { fetchTags } from "@/lib/blog/api";

const selectClassNames = {
  control: ({ isFocused }) =>
    cn(
      "!min-h-10 !rounded-[var(--radius-md)] !border !bg-[var(--surface)] !shadow-none",
      isFocused ? "!border-[var(--brand-500)] !ring-2 !ring-[var(--brand-100)]" : "!border-[var(--border)]"
    ),
  placeholder: () => "!text-[var(--text-faint)]",
  input: () => "!text-[var(--text)]",
  menu: () => "!rounded-[var(--radius-md)] !border !border-[var(--border)] !bg-[var(--surface)] !shadow-[var(--shadow-lg)] !mt-1.5 !z-30",
  option: ({ isFocused, isSelected }) =>
    cn("!text-sm !px-3 !py-2", isSelected ? "!bg-[var(--brand-600)] !text-white" : isFocused ? "!bg-[var(--surface-muted)] !text-[var(--text)]" : "!text-[var(--text)]"),
  multiValue: () => "!bg-[var(--brand-50)] !rounded-full !ps-1",
  multiValueLabel: () => "!text-[var(--brand-700)] !text-xs",
  multiValueRemove: () => "!text-[var(--brand-500)] hover:!bg-transparent hover:!text-[var(--brand-700)]",
  noOptionsMessage: () => "!text-[var(--text-faint)] !text-sm",
  indicatorSeparator: () => "!bg-[var(--border)]",
  dropdownIndicator: () => "!text-[var(--text-faint)]",
  clearIndicator: () => "!text-[var(--text-faint)]",
};

function toOption(t) {
  return { value: t._id, label: `${t.name}${typeof t.postCount === "number" ? ` (${t.postCount})` : ""}` };
}

/** value/onChange operate on an array of { value, label } — value is a tag id,
 * or (for a freshly-typed tag) the raw name string, which the backend
 * resolves/creates on save (see resolveTagIds server-side). */
export function TagSelect({ value = [], onChange }) {
  const { data, isLoading } = useQuery({ queryKey: ["blog-tags"], queryFn: fetchTags });
  const options = (data ?? []).map(toOption);

  return (
    <CreatableSelect
      unstyled
      isMulti
      isLoading={isLoading}
      options={options}
      value={value}
      onChange={(v) => onChange(v || [])}
      placeholder="تگ‌ها را انتخاب یا اضافه کنید..."
      noOptionsMessage={() => "موردی وجود ندارد — با نوشتن اضافه کنید"}
      formatCreateLabel={(input) => `افزودن تگ «${input}»`}
      classNames={selectClassNames}
    />
  );
}
