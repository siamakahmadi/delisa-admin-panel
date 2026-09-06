"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

const DEFAULTS = {
  enabled: true,
  phone: "",
};

export default function WhatsappWidgetSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-widget-settings"],
    queryFn: async () => (await apiClient.get("/api/admin/settings/whatsapp-widget")).data,
  });

  return (
    <div>
      <PageHeader
        title="ویجت واتس‌اپ"
        subtitle="دکمه‌ی شناور پشتیبانی واتس‌اپ سایت مشتری — روی موبایل داخل هدر و روی دسکتاپ به‌صورت شناور در گوشه‌ی پایین صفحه نمایش داده می‌شود."
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full max-w-xl" />
      ) : (
        <SettingsForm initial={{ ...DEFAULTS, ...(data?.whatsappWidget || {}) }} />
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
    mutationFn: () =>
      apiClient.put("/api/admin/settings/whatsapp-widget", { whatsappWidget: settings }),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-widget-settings"] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  return (
    <Card className="max-w-xl">
      <CardContent className="space-y-4">
        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
            className="h-4 w-4 accent-[var(--brand-600)]"
          />
          نمایش ویجت واتس‌اپ در سایت
        </label>

        <div>
          <Label>شماره واتس‌اپ</Label>
          <Input
            dir="ltr"
            value={settings.phone}
            onChange={(e) => patch({ phone: e.target.value })}
            placeholder="مثلاً: 09171234567"
          />
          <p className="mt-1 text-xs text-[var(--text-faint)]">
            با یا بدون کد کشور وارد کنید. اگر خالی بماند، لینک پیش‌فرض فعلی سایت
            بدون تغییر باقی می‌ماند.
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
