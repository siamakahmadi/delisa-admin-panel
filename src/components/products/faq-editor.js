"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function FaqEditor({ faqs, onChange, disabled }) {
  const update = (i, field, val) => {
    const next = [...faqs];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };
  const remove = (i) => onChange(faqs.filter((_, idx) => idx !== i));
  const add = () => onChange([...faqs, { question: "", answer: "" }]);

  return (
    <div className="space-y-3">
      {faqs.map((item, i) => (
        <div key={i} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-muted)]">سوال {(i + 1).toLocaleString("fa-IR")}</span>
            <Button variant="ghost" size="icon" onClick={() => remove(i)} disabled={disabled}>
              <Trash2 size={14} className="text-[var(--danger)]" />
            </Button>
          </div>
          <Input
            value={item.question}
            onChange={(e) => update(i, "question", e.target.value)}
            placeholder="متن سوال..."
            disabled={disabled}
            className="mb-2"
          />
          <textarea
            value={item.answer}
            onChange={(e) => update(i, "answer", e.target.value)}
            placeholder="پاسخ سوال..."
            disabled={disabled}
            rows={2}
            className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm outline-none focus:border-[var(--brand-500)]"
          />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} disabled={disabled}>
        <Plus size={13} />
        افزودن سوال جدید
      </Button>
    </div>
  );
}
