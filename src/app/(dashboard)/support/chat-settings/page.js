"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { fetchChatSettings, updateChatSettings } from "@/lib/support/api";
import { CHAT_DAY_LABELS, CHAT_DAY_ORDER } from "@/lib/support/constants";

const DEFAULT_DAY = { enabled: true, start: "09:00", end: "18:00" };

const DEFAULTS = {
  enabled: true,
  scheduleEnabled: false,
  timezone: "Asia/Tehran",
  widgetTitle: "پشتیبانی دلیسا",
  welcomeMessage: "سلام! چطور می‌تونیم کمکتون کنیم؟",
  offlineMessage: "در حال حاضر پشتیبانی آنلاین نیست. پیام‌تون رو بذارید تا در اولین فرصت پاسخ بدیم.",
  schedule: CHAT_DAY_ORDER.reduce((acc, day) => {
    acc[day] = { ...DEFAULT_DAY, enabled: day !== "fri" };
    return acc;
  }, {}),
};

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
        {description && <p className="mt-0.5 text-xs text-[var(--text-faint)]">{description}</p>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-9 shrink-0 accent-[var(--brand-600)]"
      />
    </label>
  );
}

export default function ChatSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["chat-settings"],
    queryFn: fetchChatSettings,
  });

  return (
    <div>
      <PageHeader title="چت زنده پشتیبانی" subtitle="روشن/خاموش کردن ویجت چت سایت مشتری، زمان‌بندی پاسخ‌گویی و پیام‌های پیش‌فرض" />

      {isLoading ? (
        <Skeleton className="h-96 w-full max-w-2xl" />
      ) : (
        <SettingsForm
          initial={{
            ...DEFAULTS,
            ...(data || {}),
            schedule: {
              ...DEFAULTS.schedule,
              ...Object.fromEntries(
                Object.entries(data?.schedule || {}).map(([day, val]) => [day, { ...DEFAULT_DAY, ...val }])
              ),
            },
          }}
        />
      )}
    </div>
  );
}

function SettingsForm({ initial }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(initial);
  useEffect(() => setSettings(initial), [initial]);

  const patch = (fields) => setSettings((s) => ({ ...s, ...fields }));
  const patchDay = (day, fields) =>
    setSettings((s) => ({ ...s, schedule: { ...s.schedule, [day]: { ...s.schedule[day], ...fields } } }));

  const saveMutation = useMutation({
    mutationFn: () => updateChatSettings(settings),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["chat-settings"] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>فعال‌سازی</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-[var(--border)]">
          <Toggle
            label="چت زنده فعال باشد"
            description="در صورت غیرفعال بودن، حباب چت به هیچ‌وجه در سایت مشتری نمایش داده نمی‌شود."
            checked={settings.enabled}
            onChange={(v) => patch({ enabled: v })}
          />
          <Toggle
            label="محدود به ساعات مشخص"
            description="خارج از این بازه‌ها، ویجت به حالت «آفلاین» می‌رود و پیام آفلاین نمایش داده می‌شود؛ پیام همچنان ثبت و در تب پشتیبانی دیده می‌شود."
            checked={settings.scheduleEnabled}
            onChange={(v) => patch({ scheduleEnabled: v })}
          />
        </CardContent>
      </Card>

      {settings.scheduleEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>ساعات پاسخ‌گویی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CHAT_DAY_ORDER.map((day) => {
              const d = settings.schedule[day];
              return (
                <div key={day} className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] py-2 last:border-0">
                  <label className="flex w-28 shrink-0 items-center gap-2 text-sm text-[var(--text)]">
                    <input
                      type="checkbox"
                      checked={d.enabled}
                      onChange={(e) => patchDay(day, { enabled: e.target.checked })}
                      className="h-4 w-4 accent-[var(--brand-600)]"
                    />
                    {CHAT_DAY_LABELS[day]}
                  </label>
                  <Input
                    type="time"
                    className="w-32"
                    dir="ltr"
                    disabled={!d.enabled}
                    value={d.start}
                    onChange={(e) => patchDay(day, { start: e.target.value })}
                  />
                  <span className="text-xs text-[var(--text-faint)]">تا</span>
                  <Input
                    type="time"
                    className="w-32"
                    dir="ltr"
                    disabled={!d.enabled}
                    value={d.end}
                    onChange={(e) => patchDay(day, { end: e.target.value })}
                  />
                </div>
              );
            })}
            <div>
              <Label>منطقه زمانی</Label>
              <Input dir="ltr" value={settings.timezone} onChange={(e) => patch({ timezone: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>متن‌های ویجت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>عنوان ویجت</Label>
            <Input value={settings.widgetTitle} onChange={(e) => patch({ widgetTitle: e.target.value })} />
          </div>
          <div>
            <Label>پیام خوش‌آمدگویی (وقتی آنلاین هستیم)</Label>
            <textarea
              className="min-h-[70px] w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
              value={settings.welcomeMessage}
              onChange={(e) => patch({ welcomeMessage: e.target.value })}
            />
          </div>
          <div>
            <Label>پیام آفلاین (خارج از ساعات پاسخ‌گویی)</Label>
            <textarea
              className="min-h-[70px] w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
              value={settings.offlineMessage}
              onChange={(e) => patch({ offlineMessage: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          <Save size={16} />
          ذخیره تنظیمات
        </Button>
      </div>
    </div>
  );
}
