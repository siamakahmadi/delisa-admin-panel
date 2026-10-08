"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { useToast } from "@/components/ui/toast";
import { createAiConnection, updateAiConnection, fetchAiConnectionModels } from "@/lib/ai/api";

export const CONNECTION_TYPES = {
  gemini: { label: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/", models: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"] },
  openrouter: { label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", models: ["openai/gpt-4o-mini", "google/gemini-2.5-flash", "anthropic/claude-sonnet-4.5", "openai/gpt-4o"] },
  openai: { label: "OpenAI", baseUrl: "https://api.openai.com/v1", models: ["gpt-5", "gpt-5-mini"] },
  liara: { label: "Liara AI", baseUrl: "", models: [] },
  custom: { label: "سفارشی (سازگار با OpenAI)", baseUrl: "", models: [] },
};

const errMsg = (e) => e?.response?.data?.error || e?.message || "خطا";
const EMPTY = { name: "", type: "gemini", apiKey: "", baseUrl: "", models: [] };

export function ConnectionDialog({ open, onOpenChange, connection }) {
  const toast = useToast();
  const qc = useQueryClient();
  const editing = Boolean(connection);
  const [form, setForm] = useState(EMPTY);
  const patch = (f) => setForm((s) => ({ ...s, ...f }));

  useEffect(() => {
    if (!open) return;
    setForm(
      connection
        ? { name: connection.name, type: connection.type, apiKey: "", baseUrl: connection.baseUrl || "", models: connection.models || [] }
        : { ...EMPTY, name: "Gemini", models: CONNECTION_TYPES.gemini.models.slice(0, 1) }
    );
  }, [open, connection]);

  const save = useMutation({
    mutationFn: () => (editing ? updateAiConnection(connection._id, form) : createAiConnection(form)),
    onSuccess: () => {
      toast.success(editing ? "اتصال به‌روز شد" : "اتصال اضافه شد");
      qc.invalidateQueries({ queryKey: ["ai-connections"] });
      qc.invalidateQueries({ queryKey: ["ai-settings"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error("ذخیره ناموفق بود", errMsg(e)),
  });

  const fetchModels = useMutation({
    mutationFn: () => fetchAiConnectionModels(connection._id),
    onSuccess: (r) => {
      patch({ models: Array.from(new Set([...form.models, ...(r.models || [])])) });
      toast.success(`${(r.models || []).length} مدل دریافت شد`);
    },
    onError: (e) => toast.error("دریافت مدل‌ها ناموفق بود", errMsg(e)),
  });

  const preset = CONNECTION_TYPES[form.type] || CONNECTION_TYPES.custom;
  const canSave = form.name.trim() && (editing || form.apiKey.trim()) && (form.type !== "custom" || form.baseUrl.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto" dir="rtl">
        <DialogTitle>{editing ? "ویرایش اتصال" : "افزودن اتصال هوش مصنوعی"}</DialogTitle>
        <DialogDescription>کلید API رمزنگاری‌شده در پایگاه‌داده ذخیره می‌شود و هرگز به مرورگر برنمی‌گردد.</DialogDescription>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>نام اتصال</Label>
              <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Gemini اصلی" />
            </div>
            <div>
              <Label>نوع سرویس</Label>
              <Select
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value;
                  patch({ type, models: form.models.length ? form.models : CONNECTION_TYPES[type].models.slice(0, 1) });
                }}
              >
                {Object.entries(CONNECTION_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label>{editing ? "کلید API (برای تغییر، کلید جدید را وارد کنید)" : "کلید API"}</Label>
            <Input
              dir="ltr"
              type="password"
              autoComplete="off"
              value={form.apiKey}
              onChange={(e) => patch({ apiKey: e.target.value })}
              placeholder={editing ? connection.keyMask || "••••" : "AQ.… یا AIza…"}
            />
            {form.type === "gemini" && (
              <p className="mt-1 text-[11px] text-[var(--text-faint)]">
                از Google AI Studio ← «Get API key» بگیرید. کلید را در جای عمومی (چت، اسکرین‌شات) منتشر نکنید.
              </p>
            )}
          </div>

          <div>
            <Label>آدرس سرویس {form.type === "custom" ? "" : "(اختیاری)"}</Label>
            <Input
              dir="ltr"
              value={form.baseUrl}
              onChange={(e) => patch({ baseUrl: e.target.value })}
              placeholder={preset.baseUrl || "https://…/v1"}
            />
            {preset.baseUrl && <p className="mt-1 text-[11px] text-[var(--text-faint)]">خالی = پیش‌فرض {preset.label}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>مدل‌ها</Label>
              {editing && (
                <Button type="button" size="sm" variant="outline" loading={fetchModels.isPending} onClick={() => fetchModels.mutate()}>
                  <Download size={13} /> دریافت از سرویس
                </Button>
              )}
            </div>
            <TagInput value={form.models} onChange={(models) => patch({ models })} placeholder="نام مدل را بنویسید و اینتر بزنید" />
            {preset.models.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {preset.models
                  .filter((m) => !form.models.includes(m))
                  .map((m) => (
                    <button
                      key={m}
                      type="button"
                      dir="ltr"
                      onClick={() => patch({ models: [...form.models, m] })}
                      className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--border)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                    >
                      <Plus size={10} /> {m}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!canSave}>
            {editing ? "ذخیره" : "افزودن"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
