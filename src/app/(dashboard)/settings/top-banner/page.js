"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, ImagePlus, X } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const DEFAULTS = {
  enabled: false,
  image: "",
  mobileImage: "",
  href: "",
  alt: "",
  backgroundColor: "",
  openInNewTab: false,
};

async function uploadSiteImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "site-banner");
  const res = await apiClient.post("/api/admin/uploads/image", fd);
  return res.data;
}

export default function TopBannerSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["top-banner-settings"],
    queryFn: async () => (await apiClient.get("/api/admin/settings/top-banner")).data,
  });

  return (
    <div>
      <PageHeader title="بنر بالای هدر" subtitle="یک نوار باریک تمام‌عرض که بالای هدر سایت نمایش داده می‌شود؛ برای تبلیغات یا اطلاع‌رسانی‌های عمومی." />

      {isLoading ? <Skeleton className="h-96 w-full max-w-2xl" /> : <SettingsForm initial={{ ...DEFAULTS, ...(data?.topBanner || {}) }} />}
    </div>
  );
}

function SettingsForm({ initial }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(initial);
  const patch = (fields) => setSettings((s) => ({ ...s, ...fields }));

  const saveMutation = useMutation({
    mutationFn: () => apiClient.put("/api/admin/settings/top-banner", { topBanner: settings }),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["top-banner-settings"] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-4">
        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" checked={settings.enabled} onChange={(e) => patch({ enabled: e.target.checked })} className="h-4 w-4 accent-[var(--brand-600)]" />
          نمایش بنر بالای هدر
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>تصویر بنر (دسکتاپ)</Label>
            <BannerImageField value={settings.image} onChange={(v) => patch({ image: v })} />
          </div>
          <div>
            <Label>تصویر بنر (موبایل — اختیاری)</Label>
            <BannerImageField value={settings.mobileImage} onChange={(v) => patch({ mobileImage: v })} />
            <p className="mt-1 text-xs text-[var(--text-faint)]">در صورت خالی بودن، همان تصویر دسکتاپ در موبایل هم استفاده می‌شود.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>لینک مقصد</Label>
            <Input dir="ltr" value={settings.href} onChange={(e) => patch({ href: e.target.value })} placeholder="/landing/sale یا https://..." />
          </div>
          <div>
            <Label>متن جایگزین تصویر (Alt)</Label>
            <Input value={settings.alt} onChange={(e) => patch({ alt: e.target.value })} placeholder="مثلاً: جشنواره تخفیف تابستانه" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>رنگ پس‌زمینه (اختیاری)</Label>
            <Input dir="ltr" value={settings.backgroundColor} onChange={(e) => patch({ backgroundColor: e.target.value })} placeholder="#ce3263" />
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm text-[var(--text)]">
            <input type="checkbox" checked={settings.openInNewTab} onChange={(e) => patch({ openInNewTab: e.target.checked })} className="h-4 w-4 accent-[var(--brand-600)]" />
            باز شدن در تب جدید
          </label>
        </div>

        {settings.image && (
          <div>
            <Label>پیش‌نمایش</Label>
            <div
              className="flex h-10 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]"
              style={settings.backgroundColor ? { backgroundColor: settings.backgroundColor } : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.image} alt={settings.alt} className="h-full w-full object-cover" />
            </div>
          </div>
        )}

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

function BannerImageField({ value, onChange }) {
  const inputRef = useRef(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadSiteImage(file);
      if (!res?.url) throw new Error("سرور آدرس تصویر را برنگرداند");
      onChange(res.url);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative h-20 w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2">
            <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
              تعویض
            </Button>
            <Button size="sm" variant="danger" onClick={() => onChange("")}>
              <X size={13} />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex h-16 w-full flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--brand-500)] hover:text-[var(--brand-500)]"
          )}
        >
          <ImagePlus size={16} />
          <span className="text-xs">{uploading ? "در حال آپلود…" : "انتخاب تصویر"}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
