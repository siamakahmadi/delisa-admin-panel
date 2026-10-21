"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { updateAgentSettings } from "@/lib/agents/api";

export function AgentSettingsDialog({ agent, open, onOpenChange }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...agent.setting });

  const mutation = useMutation({
    mutationFn: () => updateAgentSettings(agent.key, form),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      qc.invalidateQueries({ queryKey: ["agents"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>تنظیمات «{agent.name}»</DialogTitle>
        <DialogDescription>اتصال و مدل‌ها از «دستیار هوشمند ← تنظیمات» می‌آیند؛ اینجا فقط رفتار همین ایجنت را تنظیم می‌کنید.</DialogDescription>
        <div className="mt-4 space-y-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
            ایجنت فعال باشد
          </label>
          <div>
            <Label>سطح مدل</Label>
            <Select value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}>
              <option value="">پیش‌فرض ایجنت ({agent.tier === "full" ? "کامل" : "سریع"})</option>
              <option value="mini">سریع و ارزان (mini)</option>
              <option value="full">کامل و قوی‌تر (full)</option>
            </Select>
          </div>
          <div>
            <Label>دستور اضافه برای این ایجنت</Label>
            <textarea
              rows={5}
              value={form.extraInstructions}
              onChange={(e) => setForm((f) => ({ ...f, extraInstructions: e.target.value }))}
              placeholder="مثلاً: همیشه لحن صمیمی‌تر بنویس. هرگز به سایت X لینک نده. حاشیه سود هدف ۲۵٪ است."
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>ذخیره</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
