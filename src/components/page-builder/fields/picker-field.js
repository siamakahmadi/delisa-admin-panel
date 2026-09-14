"use client";

import { useQuery } from "@tanstack/react-query";
import Select from "react-select";
import {
  fetchCmsProducts,
  fetchCmsCategories,
  fetchCmsBrands,
  fetchCmsTags,
  fetchCmsBlogTags,
  fetchCmsBlogCategories,
  fetchCmsSkinTypes,
  fetchCmsSkinConcerns,
  fetchCmsIngredients,
} from "@/lib/page-builder/api";
import { cn } from "@/lib/utils";

const FETCHERS = {
  product: fetchCmsProducts,
  category: fetchCmsCategories,
  brand: fetchCmsBrands,
  tag: fetchCmsTags,
  tagId: fetchCmsTags,
  blogTag: fetchCmsBlogTags,
  blogCategory: fetchCmsBlogCategories,
  blogTagId: fetchCmsBlogTags,
  blogCategoryId: fetchCmsBlogCategories,
  skinType: fetchCmsSkinTypes,
  skinConcern: fetchCmsSkinConcerns,
  ingredient: fetchCmsIngredients,
};

// Page Builder pickers (tag/brand/category/blogTag/blogCategory) resolve by
// slug server-side — but Beauty entity relationships (and Beauty's own
// `tagRef` field) are real Mongoose `ref` ObjectId fields (need populate()
// to work), so these kinds must use the Mongo _id as the value instead of
// the slug. "tagId"/"blogTagId"/"blogCategoryId" are the same lists as
// "tag"/"blogTag"/"blogCategory", just id-valued (Beauty relatedBlogTags /
// relatedBlogCategories are ObjectId refs too — sending slugs there fails
// with a CastError on save).
const ID_VALUE_KINDS = new Set(["skinType", "skinConcern", "ingredient", "tagId", "blogTagId", "blogCategoryId"]);

function toOption(item, kind) {
  const value = ID_VALUE_KINDS.has(kind) ? item._id || item.id : item.slug || item._id || item.id || item.name;
  const label = item.title || item.name || item.slug || String(value);
  return { value: String(value), label };
}

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
      "!text-sm !px-3 !py-2",
      isSelected ? "!bg-[var(--brand-600)] !text-white" : isFocused ? "!bg-[var(--surface-muted)] !text-[var(--text)]" : "!text-[var(--text)]"
    ),
  multiValue: () => "!bg-[var(--brand-50)] !rounded-full !ps-1",
  multiValueLabel: () => "!text-[var(--brand-700)] !text-xs",
  multiValueRemove: () => "!text-[var(--brand-500)] hover:!bg-transparent hover:!text-[var(--brand-700)]",
  noOptionsMessage: () => "!text-[var(--text-faint)] !text-sm",
  indicatorSeparator: () => "!bg-[var(--border)]",
  dropdownIndicator: () => "!text-[var(--text-faint)]",
  clearIndicator: () => "!text-[var(--text-faint)]",
};

/** kind: "product" | "category" | "brand" | "tag". value: string[] of slugs/ids. */
export function PickerField({ kind, value, onChange, isMulti = true }) {
  const { data, isLoading } = useQuery({
    queryKey: ["cms-picker", kind],
    queryFn: async () => {
      const fetcher = FETCHERS[kind];
      const items = fetcher ? await fetcher() : [];
      return (Array.isArray(items) ? items : []).map((item) => toOption(item, kind));
    },
    enabled: Boolean(FETCHERS[kind]),
    staleTime: 60_000,
  });

  const options = data ?? [];
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const selectedOptions = options.filter((o) => selectedValues.includes(o.value));

  return (
    <Select
      unstyled
      isMulti={isMulti}
      isLoading={isLoading}
      options={options}
      value={isMulti ? selectedOptions : selectedOptions[0] || null}
      onChange={(v) => (isMulti ? onChange((v || []).map((o) => o.value)) : onChange(v ? v.value : ""))}
      placeholder="جستجو و انتخاب..."
      noOptionsMessage={() => "موردی یافت نشد"}
      classNames={selectClassNames}
    />
  );
}
