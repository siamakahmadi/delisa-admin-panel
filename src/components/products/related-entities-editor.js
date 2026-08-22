"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useCategories, useBrands, useProductTypes, useTags } from "@/hooks/use-taxonomies";

const TYPE_LABELS = {
  category: "دسته‌بندی",
  brand: "برند",
  tag: "برچسب",
  productType: "نوع محصول",
};

export function RelatedEntitiesEditor({ items = [], onChange }) {
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: productTypes } = useProductTypes();
  const { data: tags } = useTags();

  const [refType, setRefType] = useState("category");
  const [refId, setRefId] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [badgeColor, setBadgeColor] = useState("");

  const sourceMap = {
    category: (categories ?? []).map((c) => ({ value: c._id, label: c.name })),
    brand: (brands ?? []).map((b) => ({ value: b._id, label: b.name })),
    tag: (tags ?? []).map((t) => ({ value: t._id, label: t.title })),
    productType: (productTypes ?? []).map((t) => ({ value: t._id, label: t.name })),
  };

  const lookupTitle = (type, id) => sourceMap[type]?.find((o) => String(o.value) === String(id))?.label || "…";

  const add = () => {
    if (!refId) return;
    onChange([...items, { refType, refId, badgeText: badgeText.trim(), badgeColor: badgeColor.trim() }]);
    setRefId("");
    setBadgeText("");
    setBadgeColor("");
  };

  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.length === 0 && <p className="text-xs text-[var(--text-faint)]">هنوز موردی اضافه نشده است.</p>}
        {items.map((item, i) => (
          <span
            key={`${item.refType}-${item.refId}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-muted)] py-1 ps-3 pe-1.5 text-xs"
          >
            <span className="text-[var(--text-faint)]">{TYPE_LABELS[item.refType]}:</span>
            <span className="font-medium text-[var(--text)]">{lookupTitle(item.refType, item.refId)}</span>
            {item.badgeText && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] text-white"
                style={{ background: item.badgeColor || "var(--brand-500)" }}
              >
                {item.badgeText}
              </span>
            )}
            <button type="button" onClick={() => remove(i)} className="text-[var(--text-faint)] hover:text-[var(--danger)]">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3 sm:grid-cols-[auto_1fr]">
        <Select
          value={refType}
          onChange={(e) => {
            setRefType(e.target.value);
            setRefId("");
          }}
          className="sm:w-36"
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <SearchableSelect options={sourceMap[refType]} value={refId} onChange={setRefId} placeholder={`انتخاب ${TYPE_LABELS[refType]}`} />

        <div className="sm:col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input value={badgeText} onChange={(e) => setBadgeText(e.target.value)} placeholder="متن نشان (اختیاری)" />
          <Input dir="ltr" value={badgeColor} onChange={(e) => setBadgeColor(e.target.value)} placeholder="#ce3263" />
          <Button type="button" variant="secondary" disabled={!refId} onClick={add}>
            <Plus size={14} />
            افزودن
          </Button>
        </div>
      </div>
    </div>
  );
}
