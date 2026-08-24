"use client";

// Generic checkbox-list multi-select for a small, already-fetched entity list
// (categories/brands/tags/productTypes/vendors/campaigns) — used for Discount
// target pickers where the full option list is short enough to render inline
// (unlike ProductMultiPicker, which needs search against a large catalog).
export function EntityMultiSelect({ options = [], value = [], onChange, labelKey = "name", emptyLabel = "موردی یافت نشد" }) {
  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  if (!options.length) {
    return <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] p-3 text-center text-xs text-[var(--text-faint)]">{emptyLabel}</p>;
  }

  return (
    <div className="max-h-52 space-y-1 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] p-2">
      {options.map((opt) => (
        <label key={opt._id} className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-[var(--text)] hover:bg-[var(--surface-muted)]">
          <input
            type="checkbox"
            checked={value.includes(opt._id)}
            onChange={() => toggle(opt._id)}
            className="h-4 w-4 accent-[var(--brand-600)]"
          />
          {opt[labelKey] || opt._id}
        </label>
      ))}
    </div>
  );
}
