"use client";

import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";

export const fa = (n) => Number(n ?? 0).toLocaleString("fa-IR");

export const TEXTAREA = "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-faint)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]";

function Counter({ value, min, max }) {
  const n = Array.from(String(value || "")).length;
  if (!min && !max) return null;
  const ok = n >= (min || 0) && n <= (max || Infinity);
  return <span dir="ltr" className={cn("tabular-nums", n === 0 ? "text-[var(--text-faint)]" : ok ? "text-[var(--success)]" : "text-[var(--warning)]")}>{fa(n)}{max ? ` / ${fa(max)}` : ""}</span>;
}

function FieldShell({ field, focused, children, extra }) {
  return (
    <div data-field={field.key} className={cn("rounded-[var(--radius-md)] border p-3 transition-colors", focused ? "border-[var(--brand-400)] bg-[var(--brand-50)]/40" : "border-[var(--border)]")}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-[var(--text)]">{field.label}</label>
        {extra}
      </div>
      {children}
      {field.hint ? <p className="mt-1.5 text-[11px] leading-5 text-[var(--text-faint)]">{field.hint}</p> : null}
    </div>
  );
}

export function FieldEditor({ field, value, onChange, focused }) {
  switch (field.kind) {
    case "text":
      return (
        <FieldShell field={field} focused={focused} extra={<Counter value={value} min={field.min} max={field.max} />}>
          <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />
        </FieldShell>
      );
    case "textarea":
    case "markdown":
      return (
        <FieldShell field={field} focused={focused} extra={<Counter value={value} min={field.min} max={field.kind === "textarea" ? field.max : undefined} />}>
          <textarea className={cn(TEXTAREA, field.kind === "markdown" && "font-mono text-[13px]")} rows={field.rows || 4} value={value || ""} onChange={(e) => onChange(e.target.value)} />
        </FieldShell>
      );
    case "tags":
      return (
        <FieldShell field={field} focused={focused}>
          <TagInput value={value || []} onChange={onChange} placeholder="کلمه را بنویسید و Enter بزنید" />
        </FieldShell>
      );
    case "alts":
      return (
        <FieldShell field={field} focused={focused}>
          {(field.images || []).length === 0 ? (
            <p className="text-xs text-[var(--text-faint)]">تصویری ثبت نشده.</p>
          ) : (
            <div className="space-y-2">
              {field.images.map((url, i) => (
                <div key={url + i} className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-10 w-10 shrink-0 rounded border border-[var(--border)] object-cover" />
                  <Input value={(value || [])[i] || ""} placeholder={`توصیف تصویر ${fa(i + 1)}`} onChange={(e) => onChange(field.images.map((_, j) => (j === i ? e.target.value : (value || [])[j] || "")))} />
                </div>
              ))}
            </div>
          )}
        </FieldShell>
      );
    case "faqs": {
      const list = value || [];
      return (
        <FieldShell field={field} focused={focused} extra={<Button size="sm" variant="ghost" type="button" onClick={() => onChange([...list, { question: "", answer: "" }])}><Plus size={12} />پرسش جدید</Button>}>
          <div className="space-y-2">
            {list.map((f, i) => (
              <div key={i} className="space-y-1.5 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-2">
                <div className="flex gap-2">
                  <Input value={f.question} placeholder="پرسش" onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} />
                  <Button size="icon" variant="ghost" type="button" className="h-10 w-8" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="حذف"><Trash2 size={14} /></Button>
                </div>
                <textarea className={TEXTAREA} rows={2} value={f.answer} placeholder="پاسخ" onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} />
              </div>
            ))}
            {list.length === 0 && <p className="text-xs text-[var(--text-faint)]">هنوز پرسشی نیست.</p>}
          </div>
        </FieldShell>
      );
    }
    case "links": {
      const list = value || [];
      return (
        <FieldShell field={field} focused={focused} extra={<Button size="sm" variant="ghost" type="button" onClick={() => onChange([...list, { text: "", url: "" }])}><Plus size={12} />لینک جدید</Button>}>
          <div className="space-y-2">
            {list.map((l, i) => (
              <div key={i} className="flex gap-2">
                <Input value={l.text} placeholder="متن لینک" onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
                <Input dir="ltr" value={l.url} placeholder="/product/slug" onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                <Button size="icon" variant="ghost" type="button" className="h-10 w-8 shrink-0" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="حذف"><Trash2 size={14} /></Button>
              </div>
            ))}
            {list.length === 0 && <p className="text-xs text-[var(--text-faint)]">لینکی اضافه نشده؛ «پیشنهاد لینک» را بزنید یا دستی اضافه کنید.</p>}
          </div>
        </FieldShell>
      );
    }
    default:
      return null;
  }
}

