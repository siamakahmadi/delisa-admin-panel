"use client";

import { Input } from "@/components/ui/input";

export function LinkField({ value, onChange, placeholder }) {
  const isObj = value && typeof value === "object";
  const href = isObj ? value.href || "" : value || "";
  const target = isObj ? value.target || "_self" : "_self";

  function update(patch) {
    if (isObj || patch.target) onChange({ href, target, ...patch });
    else onChange(patch.href ?? href);
  }

  return (
    <div className="space-y-1.5">
      <Input dir="ltr" value={href} placeholder={placeholder || "/products یا https://..."} onChange={(e) => update({ href: e.target.value })} />
      <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <input
          type="checkbox"
          checked={target === "_blank"}
          onChange={(e) => update({ href, target: e.target.checked ? "_blank" : "_self" })}
          className="h-3.5 w-3.5 accent-[var(--brand-600)]"
        />
        باز شدن در تب جدید
      </label>
    </div>
  );
}
