"use client";

import { Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PickerField } from "@/components/page-builder/fields/picker-field";

const TIME_OF_DAY_LABEL = { AM: "صبح", PM: "شب", both: "صبح و شب" };

// ویرایشگر مراحل روتین — هر ردیف: عنوان مرحله، زمان (صبح/شب/هردو) و
// دسته‌بندی محصول که پیشنهادهای این مرحله سمت مشتری از آن گرفته می‌شود
// (همون categorySlug که مستقیم به endpoint موجود suggestions داده می‌شود).
export function RoutineStepsEditor({ items, onChange }) {
  const patch = (index, fields) => onChange(items.map((it, i) => (i === index ? { ...it, ...fields } : it)));
  const remove = (index) => onChange(items.filter((_, i) => i !== index));
  const add = () =>
    onChange([...items, { title: "", description: "", timeOfDay: "both", categorySlug: "" }]);

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-[var(--radius-md)] border border-[var(--border)] p-3">
          <div className="flex items-start gap-2">
            <GripVertical size={16} className="mt-2.5 shrink-0 text-[var(--text-faint)]" />
            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
              <Input placeholder="عنوان مرحله (مثلاً: پاک‌کننده)" value={item.title} onChange={(e) => patch(index, { title: e.target.value })} />
              <Select value={item.timeOfDay} onChange={(e) => patch(index, { timeOfDay: e.target.value })}>
                {Object.entries(TIME_OF_DAY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <PickerField
                kind="category"
                isMulti={false}
                value={item.categorySlug}
                onChange={(slug) => patch(index, { categorySlug: slug })}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(index)}>
              <X size={15} className="text-[var(--danger)]" />
            </Button>
          </div>
          <textarea
            className="min-h-[38px] w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
            placeholder="توضیح مرحله (اختیاری)"
            value={item.description}
            onChange={(e) => patch(index, { description: e.target.value })}
          />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <Plus size={14} />
        افزودن مرحله
      </Button>
    </div>
  );
}
