"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Monitor, Smartphone } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

const RATIOS = [
  { value: "1:1", label: "مربع (۱:۱)" },
  { value: "4:5", label: "عمودی (۴:۵)" },
  { value: "3:4", label: "عمودی (۳:۴)" },
  { value: "2:3", label: "عمودی بلند (۲:۳)" },
  { value: "5:4", label: "افقی (۵:۴)" },
  { value: "4:3", label: "افقی (۴:۳)" },
  { value: "3:2", label: "افقی (۳:۲)" },
  { value: "16:9", label: "عریض (۱۶:۹)" },
];

const DEVICE_DEFAULT = { ratio: "1:1", fit: "contain", imageScale: 80 };

export default function ProductCardSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["product-card-settings"],
    queryFn: async () => (await apiClient.get("/api/admin/settings/product-card")).data,
  });

  return (
    <div>
      <PageHeader
        title="نمایش کارت محصول"
        subtitle="نسبت قاب تصویر کارت‌های محصول در سایت مشتری (لیست‌ها، کاروسل‌ها، آرشیوها) — جداگانه برای دسکتاپ و موبایل."
      />
      {isLoading ? (
        <Skeleton className="h-96 w-full max-w-4xl" />
      ) : (
        <SettingsForm
          initial={{
            desktop: { ...DEVICE_DEFAULT, ...(data?.productCard?.desktop || {}) },
            mobile: { ...DEVICE_DEFAULT, ...(data?.productCard?.mobile || {}) },
          }}
        />
      )}
    </div>
  );
}

function ratioToCss(ratio) {
  const [w, h] = String(ratio || "1:1").split(":").map(Number);
  return w && h ? `${w} / ${h}` : "1 / 1";
}

function CardPreview({ device, label }) {
  const fit = device.fit === "cover" ? "cover" : "contain";
  const scale = fit === "cover" ? 100 : Number(device.imageScale) || 80;
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-3">
      <p className="mb-2 text-xs text-[var(--text-muted)]">پیش‌نمایش {label}</p>
      <div className="mx-auto w-[150px] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]">
        <div
          className="flex w-full items-center justify-center overflow-hidden bg-white"
          style={{ aspectRatio: ratioToCss(device.ratio) }}
        >
          <div
            className="rounded-md bg-gradient-to-br from-[var(--brand-100)] to-[var(--brand-300)]"
            style={{ width: `${scale}%`, height: `${scale}%` }}
          />
        </div>
        <div className="space-y-1.5 p-2">
          <div className="h-2 w-10 rounded bg-[var(--surface-muted)]" />
          <div className="h-2.5 w-full rounded bg-[var(--surface-muted)]" />
          <div className="h-2.5 w-2/3 rounded bg-[var(--surface-muted)]" />
          <div className="mt-2 h-3 w-1/2 rounded bg-[var(--brand-100)]" />
        </div>
      </div>
    </div>
  );
}

function DeviceFields({ device, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>نسبت قاب تصویر</Label>
        <Select value={device.ratio} onChange={(e) => onChange({ ratio: e.target.value })}>
          {RATIOS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>نحوه‌ی قرارگیری تصویر</Label>
        <Select value={device.fit} onChange={(e) => onChange({ fit: e.target.value })}>
          <option value="contain">کل تصویر دیده شود (contain)</option>
          <option value="cover">قاب پر شود (cover — لبه‌ها بریده می‌شود)</option>
        </Select>
      </div>
      {device.fit !== "cover" && (
        <div>
          <Label>اندازه‌ی تصویر داخل قاب (٪)</Label>
          <Input
            type="number"
            min={50}
            max={100}
            value={device.imageScale}
            onChange={(e) => onChange({ imageScale: e.target.value })}
          />
          <p className="mt-1 text-xs text-[var(--text-faint)]">۸۰٪ یعنی کمی حاشیه‌ی سفید دور عکس (رفتار پیش‌فرض).</p>
        </div>
      )}
    </div>
  );
}

function SettingsForm({ initial }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(initial);
  const patchDevice = (device, fields) =>
    setSettings((s) => ({ ...s, [device]: { ...s[device], ...fields } }));

  const saveMutation = useMutation({
    mutationFn: () =>
      apiClient.put("/api/admin/settings/product-card", {
        productCard: {
          desktop: { ...settings.desktop, imageScale: Number(settings.desktop.imageScale) || 80 },
          mobile: { ...settings.mobile, imageScale: Number(settings.mobile.imageScale) || 80 },
        },
      }),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد — تا یک دقیقه‌ی دیگر روی سایت اعمال می‌شود");
      queryClient.invalidateQueries({ queryKey: ["product-card-settings"] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  return (
    <div className="max-w-4xl space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[
          { key: "desktop", label: "دسکتاپ", Icon: Monitor },
          { key: "mobile", label: "موبایل", Icon: Smartphone },
        ].map(({ key, label, Icon }) => (
          <Card key={key}>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <Icon size={16} className="text-[var(--brand-600)]" />
                {label}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_170px]">
                <DeviceFields device={settings[key]} onChange={(f) => patchDevice(key, f)} />
                <CardPreview device={settings[key]} label={label} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-end">
        <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          <Save size={16} />
          ذخیره تنظیمات
        </Button>
      </div>
    </div>
  );
}
