"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { fetchCommunitySettings, fetchCommunityStats, saveCommunitySettings } from "@/lib/community/api";

const TEXTAREA =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-faint)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]";

const STAT_LABELS = [
  ["posts", "پست"],
  ["replies", "پاسخ"],
  ["profiles", "کاربر"],
  ["today", "پست ۲۴ ساعت اخیر"],
  ["pending", "در انتظار تایید"],
  ["openReports", "گزارش باز"],
  ["banned", "مسدود"],
];

function Switch({ label, hint, checked, onChange, disabled }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border)] p-3">
      <span>
        <span className="block text-sm font-medium text-[var(--text)]">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-5 text-[var(--text-faint)]">{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand-600)]" />
    </label>
  );
}

export function CommunitySettingsPanel() {
  const { data: settings, isLoading } = useQuery({ queryKey: ["community-settings"], queryFn: fetchCommunitySettings });
  const { data: stats } = useQuery({ queryKey: ["community-stats"], queryFn: fetchCommunityStats, refetchInterval: 60000 });
  if (isLoading || !settings) return <p className="text-sm text-[var(--text-muted)]">در حال بارگذاری…</p>;
  return <SettingsForm settings={settings} stats={stats} />;
}

function SettingsForm({ settings, stats }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({ ...settings, bannedWordsText: (settings.bannedWords || []).join("\n") }));

  const mutation = useMutation({
    mutationFn: (patch) => saveCommunitySettings(patch),
    onSuccess: (result) => {
      queryClient.setQueryData(["community-settings"], result);
      toast.success("ذخیره شد");
    },
    onError: (err) => toast.error(err?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const toggleNow = (key, value) => {
    set(key, value);
    mutation.mutate({ [key]: value });
  };
  const save = () =>
    mutation.mutate({
      maxTextLength: Number(form.maxTextLength),
      maxImages: Number(form.maxImages),
      dailyPostLimit: Number(form.dailyPostLimit),
      bannedWords: form.bannedWordsText.split("\n").map((w) => w.trim()).filter(Boolean),
      guidelines: form.guidelines,
    });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {STAT_LABELS.map(([key, label]) => (
          <Card key={key}>
            <CardContent className="p-4">
              <p className="text-xl font-bold text-[var(--text)]">{(stats?.[key] ?? 0).toLocaleString("fa-IR")}</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text)]">فعال‌سازی</h3>
          <Switch
            label="کامیونیتی در اپ فعال باشد"
            hint="تا وقتی خاموش است، تب «کامیونیتی» در اپ نمایش داده نمی‌شود و هیچ پستی منتشر نمی‌شود. بهتر است قبل از روشن‌کردن، قوانین و کلمات ممنوع را تنظیم کنی."
            checked={form.enabled}
            disabled={mutation.isPending}
            onChange={(v) => toggleNow("enabled", v)}
          />
          <Switch
            label="هر پست قبل از انتشار تایید شود"
            hint="پست‌های جدید «در انتظار تایید» می‌مانند و فقط نویسنده می‌بیند؛ از تب «پست‌ها» تایید کن."
            checked={form.requireApproval}
            disabled={mutation.isPending}
            onChange={(v) => toggleNow("requireApproval", v)}
          />
          <Switch
            label="لینک به سایت‌های دیگر مجاز باشد"
            hint="لینک محصول و مقاله‌ی خود دلیسا همیشه مجاز است و خودکار جاسازی می‌شود."
            checked={form.allowLinks}
            disabled={mutation.isPending}
            onChange={(v) => toggleNow("allowLinks", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text)]">محدودیت‌ها</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>حداکثر حروف هر پست</Label>
              <Input type="number" min={50} max={1000} value={form.maxTextLength} onChange={(e) => set("maxTextLength", e.target.value)} />
            </div>
            <div>
              <Label>حداکثر عکس هر پست (۰ تا ۴)</Label>
              <Input type="number" min={0} max={4} value={form.maxImages} onChange={(e) => set("maxImages", e.target.value)} />
            </div>
            <div>
              <Label>سقف پست در روز برای هر کاربر</Label>
              <Input type="number" min={1} max={500} value={form.dailyPostLimit} onChange={(e) => set("dailyPostLimit", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>کلمات ممنوع (هر خط یک کلمه — پستی که شامل آن‌ها باشد ثبت نمی‌شود)</Label>
            <textarea className={TEXTAREA} rows={4} dir="rtl" value={form.bannedWordsText} onChange={(e) => set("bannedWordsText", e.target.value)} />
          </div>
          <div>
            <Label>قوانین کامیونیتی (هر خط یک مورد — هنگام ساخت پروفایل به کاربر نشان داده می‌شود)</Label>
            <textarea className={TEXTAREA} rows={5} dir="rtl" value={form.guidelines} onChange={(e) => set("guidelines", e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={save} loading={mutation.isPending}>ذخیره تنظیمات</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
