"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { fetchAiSettings, updateAiSettings } from "@/lib/ai/api";

const DEFAULTS = {
  enabled: true,
  temperature: 0.4,
  maxOutputTokens: 900,
  webSearchEnabled: true,
  productSearchEnabled: true,
  smartSearchEnabled: true,
  conversationHistoryEnabled: true,
  contextWindowMessages: 16,
  model: { mini: "", full: "" },
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

export default function AiSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: fetchAiSettings,
  });

  return (
    <div>
      <PageHeader title="تنظیمات دستیار هوشمند" subtitle="مدیریت رفتار، مدل‌ها و قابلیت‌های چت‌بات دلیسا" />

      {isLoading ? (
        <Skeleton className="h-96 w-full max-w-2xl" />
      ) : (
        <SettingsForm
          initial={{ ...DEFAULTS, ...(data?.settings || {}) }}
          connection={data?.connection}
        />
      )}
    </div>
  );
}

function SettingsForm({ initial, connection }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(initial);
  useEffect(() => setSettings(initial), [initial]);

  const patch = (fields) => setSettings((s) => ({ ...s, ...fields }));

  const saveMutation = useMutation({
    mutationFn: () => updateAiSettings(settings),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>اتصال به OpenAI (از طریق Liara)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">API Key</span>
            {connection?.hasApiKey ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 size={12} /> متصل
              </Badge>
            ) : (
              <Badge variant="danger" size="sm">
                <XCircle size={12} /> تنظیم نشده
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">مدل ساده (Mini)</span>
            <span className="font-mono text-xs" dir="ltr">
              {connection?.modelMini || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">مدل پیچیده (Full)</span>
            <span className="font-mono text-xs" dir="ltr">
              {connection?.modelFull || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">جستجوی وب (Tavily)</span>
            {connection?.hasWebSearchKey ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 size={12} /> فعال
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                تنظیم نشده — پاسخ از دانش عمومی مدل
              </Badge>
            )}
          </div>
          <p className="pt-1 text-xs text-[var(--text-faint)]">
            کلیدهای API فقط سمت سرور (فایل .env) ذخیره می‌شوند و هرگز به مرورگر ارسال نمی‌شوند.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>فعال‌سازی</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-[var(--border)]">
          <Toggle
            label="دستیار هوشمند فعال باشد"
            description="در صورت غیرفعال بودن، ویجت چت در سایت مشتری نمایش داده نمی‌شود."
            checked={settings.enabled}
            onChange={(v) => patch({ enabled: v })}
          />
          <Toggle
            label="جستجوی محصولات"
            description="اجازه به دستیار برای جستجو در محصولات واقعی دلیسا"
            checked={settings.productSearchEnabled}
            onChange={(v) => patch({ productSearchEnabled: v })}
          />
          <Toggle
            label="جستجوی وب"
            description="برای سؤالات علمی/عمومی که نیاز به اطلاعات تکمیلی دارند"
            checked={settings.webSearchEnabled}
            onChange={(v) => patch({ webSearchEnabled: v })}
          />
          <Toggle
            label="جستجوی انسانی (زبان طبیعی)"
            description="جعبه جستجوی سایت مشتری — کاربر با جمله‌ی طبیعی می‌نویسد (مثلاً «ضدآفتاب برای پوست چرب که برق نزنه») و نتیجه واقعی برمی‌گردد."
            checked={settings.smartSearchEnabled}
            onChange={(v) => patch({ smartSearchEnabled: v })}
          />
          <Toggle
            label="حافظه مکالمه"
            description="حفظ context مکالمه فعلی کاربر بین پیام‌ها"
            checked={settings.conversationHistoryEnabled}
            onChange={(v) => patch({ conversationHistoryEnabled: v })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>رفتار پاسخ‌دهی</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Temperature ({settings.temperature})</Label>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => patch({ temperature: Number(e.target.value) })}
              className="w-full accent-[var(--brand-600)]"
            />
          </div>
          <div>
            <Label>حداکثر طول پاسخ (توکن)</Label>
            <Input
              type="number"
              min={100}
              max={4000}
              value={settings.maxOutputTokens}
              onChange={(e) => patch({ maxOutputTokens: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>تعداد پیام‌های حافظه مکالمه</Label>
            <Input
              type="number"
              min={4}
              max={60}
              value={settings.contextWindowMessages}
              onChange={(e) => patch({ contextWindowMessages: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>مدل ساده (اختیاری — پیش‌فرض از .env)</Label>
            <Input
              dir="ltr"
              placeholder="openai/gpt-5.4-mini"
              value={settings.model?.mini || ""}
              onChange={(e) => patch({ model: { ...settings.model, mini: e.target.value } })}
            />
          </div>
          <div>
            <Label>مدل پیچیده (اختیاری — پیش‌فرض از .env)</Label>
            <Input
              dir="ltr"
              placeholder="openai/gpt-5"
              value={settings.model?.full || ""}
              onChange={(e) => patch({ model: { ...settings.model, full: e.target.value } })}
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
