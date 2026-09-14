"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { fetchRoutineBuilderSettings, saveRoutineBuilderSettings } from "@/lib/routine-builder/api";

const DEFAULTS = {
  enabled: false,
  introTitle: "روتین زیبایی خودت رو بساز ✨",
  introSubtitle: "بر اساس پروفایل پوستی‌ات، مرحله‌به‌مرحله محصولات مناسب رو انتخاب کن.",
  defaultReorderCycleDays: 30,
};

export default function RoutineBuilderSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["routine-builder-settings"],
    queryFn: fetchRoutineBuilderSettings,
  });

  return (
    <div>
      <PageHeader
        title="روتین‌ساز — فعال‌سازی و تنظیمات"
        subtitle="فیچر روتین‌ساز را کل سایت روشن/خاموش کن و متن‌های معرفی و چرخه‌ی پیش‌فرض سفارش مجدد را ویرایش کن."
      />
      {isLoading ? (
        <Skeleton className="h-72 w-full max-w-2xl" />
      ) : (
        <SettingsForm initial={{ ...DEFAULTS, ...(data || {}) }} />
      )}
    </div>
  );
}

function SettingsForm({ initial }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(initial);
  const patch = (fields) => setSettings((s) => ({ ...s, ...fields }));

  const saveMutation = useMutation({
    mutationFn: () => saveRoutineBuilderSettings(settings),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["routine-builder-settings"] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-4">
        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
            className="h-4 w-4 accent-[var(--brand-600)]"
          />
          فعال‌سازی روتین‌ساز در سایت
        </label>
        <p className="text-xs text-[var(--text-faint)]">
          وقتی خاموش باشد، لینک/دکمه‌ی روتین‌ساز سمت مشتری نمایش داده نمی‌شود.
        </p>

        <div>
          <Label>عنوان معرفی</Label>
          <Input value={settings.introTitle} onChange={(e) => patch({ introTitle: e.target.value })} />
        </div>

        <div>
          <Label>زیرعنوان معرفی</Label>
          <Input value={settings.introSubtitle} onChange={(e) => patch({ introSubtitle: e.target.value })} />
        </div>

        <div className="max-w-[280px]">
          <Label>چرخه‌ی پیش‌فرض سفارش مجدد (روز)</Label>
          <Input
            type="number"
            min={1}
            value={settings.defaultReorderCycleDays}
            onChange={(e) => patch({ defaultReorderCycleDays: Number(e.target.value) })}
          />
          <p className="mt-1 text-xs text-[var(--text-faint)]">
            وقتی محصولی «مدت‌زمان مصرف تقریبی» جداگانه ندارد، همین عدد برای یادآوری پیامکی استفاده می‌شود.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save size={16} />
            ذخیره تنظیمات
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
