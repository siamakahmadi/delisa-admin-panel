"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { runAgent } from "@/lib/agents/api";
import { cn } from "@/lib/utils";

function initialValues(agent) {
  const v = {};
  for (const f of agent.fields) {
    if (f.default !== undefined) v[f.name] = f.default;
    else if (f.type === "sources") v[f.name] = [];
    else v[f.name] = "";
  }
  return v;
}

export function RunDialog({ agent, sources, open, onOpenChange }) {
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [values, setValues] = useState(() => initialValues(agent));
  const set = (name, val) => setValues((s) => ({ ...s, [name]: val }));

  const mutation = useMutation({
    mutationFn: () => runAgent(agent.key, values),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      qc.invalidateQueries({ queryKey: ["agent-runs"] });
      onOpenChange(false);
      router.push(`/agents/runs/${res.runId}`);
    },
    onError: (e) => toast.error(e?.response?.data?.message || "اجرای ایجنت ناموفق بود"),
  });

  const missing = agent.fields.some((f) => f.required && !String(values[f.name] ?? "").trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>اجرای «{agent.name}»</DialogTitle>
        <DialogDescription>{agent.short}</DialogDescription>
        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pl-1">
          {agent.fields.map((f) => (
            <div key={f.name}>
              {f.type !== "boolean" && (
                <Label>
                  {f.label}
                  {f.required && <span className="text-[var(--danger)]"> *</span>}
                </Label>
              )}
              {f.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={values[f.name]}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
                />
              ) : f.type === "boolean" ? (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked)} />
                  {f.label}
                </label>
              ) : f.type === "sources" ? (
                sources.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {sources.map((s) => {
                      const on = values[f.name].includes(s._id);
                      return (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => set(f.name, on ? values[f.name].filter((x) => x !== s._id) : [...values[f.name], s._id])}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs transition-colors",
                            on ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                          )}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-faint)]">رقیبی در «هوش قیمت ← منابع رقبا» تعریف نشده؛ ایجنت خودش با جستجوی وب رقبا را پیدا می‌کند.</p>
                )
              ) : (
                <Input
                  type={f.type === "number" ? "number" : "text"}
                  min={f.min}
                  max={f.max}
                  value={values[f.name]}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={missing}>
            <Play size={15} /> اجرا
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
