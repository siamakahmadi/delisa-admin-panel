"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { fetchBeautyProfileSettings, saveBeautyProfileSettings } from "@/lib/beauty-profile/api";

const DEFAULTS = {
  enabled: false,
  modalTitle: "دلیسا رو با خودت هماهنگ کن ✨",
  modalSubtitle:
    "چند سؤال کوتاه جواب بده تا محصولات، روتین‌ها و محتواهایی که بیشتر به دردت می‌خورن رو راحت‌تر پیدا کنی.",
  estimatedTimeText: "حدود ۲ دقیقه",
  promoCopy: "دلیسا با شناخت بهتر پوست و سلیقه‌ات، محصولات مناسب‌تری بهت پیشنهاد می‌ده.",
  reminderCooldownDays: 14,
  triggerDelaySeconds: 15,
  suppressIfCompletionAtLeast: 80,
  productMatchWidget: {
    enabled: false,
    title: "چرا این محصول برای شما مناسب است؟",
    subtitle: "بر اساس پروفایل پوستی شما:",
    minCompletionToShow: 30,
    whenIncomplete: "prompt",
    incompleteMessage: "برای دیدن میزان تناسب این محصول با پوستت، پروفایل زیبایی‌ات را کامل کن.",
  },
};

export default function BeautyProfileSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["beauty-profile-settings"],
    queryFn: fetchBeautyProfileSettings,
  });

  return (
    <div>
      <PageHeader
        title="پروفایل زیبایی — فعال‌سازی و تنظیمات"
        subtitle="فیچر Beauty Profile را کل سایت روشن/خاموش کن و متن‌های نمایشی مودال معرفی را ویرایش کن."
      />
      {isLoading ? (
        <Skeleton className="h-96 w-full max-w-2xl" />
      ) : (
        <SettingsForm
          initial={{
            ...DEFAULTS,
            ...(data || {}),
            productMatchWidget: { ...DEFAULTS.productMatchWidget, ...(data?.productMatchWidget || {}) },
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
  const patch = (fields) => setSettings((s) => ({ ...s, ...fields }));
  const patchWidget = (fields) =>
    setSettings((s) => ({ ...s, productMatchWidget: { ...s.productMatchWidget, ...fields } }));

  const saveMutation = useMutation({
    mutationFn: () => saveBeautyProfileSettings(settings),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["beauty-profile-settings"] });
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
          فعال‌سازی Beauty Profile در سایت
        </label>
        <p className="text-xs text-[var(--text-faint)]">
          وقتی خاموش باشد، مودال بعد از تایید شماره تلفن نمایش داده نمی‌شود و کامپوننت‌های شخصی‌سازی‌شده در صفحات، فقط منبع جایگزین خودشان را نشان می‌دهند.
        </p>

        <div>
          <Label>عنوان مودال</Label>
          <Input value={settings.modalTitle} onChange={(e) => patch({ modalTitle: e.target.value })} />
        </div>

        <div>
          <Label>زیرعنوان مودال</Label>
          <Input value={settings.modalSubtitle} onChange={(e) => patch({ modalSubtitle: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>متن زمان تکمیل</Label>
            <Input value={settings.estimatedTimeText} onChange={(e) => patch({ estimatedTimeText: e.target.value })} placeholder="حدود ۲ دقیقه" />
          </div>
          <div>
            <Label>فاصله یادآوری بعد از رد کردن (روز)</Label>
            <Input
              type="number"
              value={settings.reminderCooldownDays}
              onChange={(e) => patch({ reminderCooldownDays: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>مودال چند ثانیه بعد از ورود به سایت باز شود؟</Label>
            <Input
              type="number"
              min={0}
              value={settings.triggerDelaySeconds}
              onChange={(e) => patch({ triggerDelaySeconds: Number(e.target.value) })}
            />
            <p className="mt-1 text-xs text-[var(--text-faint)]">نه بلافاصله بعد از لاگین — بعد از این‌که کاربر چند ثانیه در سایت گشت.</p>
          </div>
          <div>
            <Label>اگر پروفایل بیش از این درصد کامل بود، دیگر پیشنهاد نده</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={settings.suppressIfCompletionAtLeast}
              onChange={(e) => patch({ suppressIfCompletionAtLeast: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <Label>متن معرفی (پایین صفحه پروفایل)</Label>
          <Input value={settings.promoCopy} onChange={(e) => patch({ promoCopy: e.target.value })} />
        </div>

        <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--border)] p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
            <input
              type="checkbox"
              checked={settings.productMatchWidget.enabled}
              onChange={(e) => patchWidget({ enabled: e.target.checked })}
              className="h-4 w-4 accent-[var(--brand-600)]"
            />
            نمایش ویجت «چرا این محصول برای من؟» در صفحه محصول
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>عنوان ویجت</Label>
              <Input value={settings.productMatchWidget.title} onChange={(e) => patchWidget({ title: e.target.value })} />
            </div>
            <div>
              <Label>زیرعنوان ویجت</Label>
              <Input value={settings.productMatchWidget.subtitle} onChange={(e) => patchWidget({ subtitle: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>حداقل درصد تکمیل پروفایل برای نمایش ویجت</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={settings.productMatchWidget.minCompletionToShow}
                onChange={(e) => patchWidget({ minCompletionToShow: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>وقتی پروفایل ناکامل است</Label>
              <Select
                value={settings.productMatchWidget.whenIncomplete}
                onChange={(e) => patchWidget({ whenIncomplete: e.target.value })}
              >
                <option value="prompt">پیام تکمیل پروفایل نشان بده</option>
                <option value="hide">ویجت را کلاً مخفی کن</option>
              </Select>
            </div>
          </div>

          {settings.productMatchWidget.whenIncomplete === "prompt" && (
            <div>
              <Label>متن پیام تکمیل پروفایل</Label>
              <Input
                value={settings.productMatchWidget.incompleteMessage}
                onChange={(e) => patchWidget({ incompleteMessage: e.target.value })}
              />
            </div>
          )}
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
