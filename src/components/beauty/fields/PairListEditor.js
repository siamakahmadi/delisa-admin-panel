"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ویرایشگر ردیفی مشترک برای هر فیلد آرایه‌ای دوستونه‌ی Beauty Hub:
// ترکیبات (نام+توضیح)، مراحل روتین (عنوان+توضیح)، عوامل مرتبط/اشتباهات
// رایج (عنوان+توضیح)، سوالات متداول (سوال+پاسخ) — همه یک شکل‌اند.
export function PairListEditor({ items, onChange, addLabel, fieldALabel, fieldBLabel, fieldBMultiline }) {
  const patch = (index, fields) => onChange(items.map((it, i) => (i === index ? { ...it, ...fields } : it)));
  const remove = (index) => onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, { a: "", b: "" }]);

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--border)] p-2.5">
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
            <Input placeholder={fieldALabel} value={item.a} onChange={(e) => patch(index, { a: e.target.value })} />
            {fieldBMultiline ? (
              <textarea
                className="min-h-[38px] w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
                placeholder={fieldBLabel}
                value={item.b}
                onChange={(e) => patch(index, { b: e.target.value })}
              />
            ) : (
              <Input placeholder={fieldBLabel} value={item.b} onChange={(e) => patch(index, { b: e.target.value })} />
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => remove(index)}>
            <X size={15} className="text-[var(--danger)]" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <Plus size={14} />
        {addLabel}
      </Button>
    </div>
  );
}
