"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, ImagePlus, X } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const BANNER_DEFAULTS = {
  enabled: true,
  mode: "default",
  text: "",
  image: "",
  href: "",
  alt: "",
  customHtml: "",
};

async function uploadBannerImage(file, folder) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await apiClient.post("/api/admin/uploads/image", fd);
  return res.data;
}

export default function ProductPageSettingsPage() {
  return (
    <div>
      <PageHeader
        title="ارسال رایگان و بنرهای صفحه محصول"
        subtitle="آستانه‌ی ارسال رایگان (که واقعاً روی هزینه‌ی سفارش هم اثر می‌گذارد) و دو بنر کوچک صفحه‌ی تک‌محصول: ارسال رایگان و پرداخت اقساطی ترب‌پی."
      />

      <div className="max-w-2xl space-y-5">
        <FreeShippingProgressSection />

        <InlineBannerSection
          settingsKey="freeShippingBanner"
          apiPath="/api/admin/settings/free-shipping-banner"
          queryKey="free-shipping-banner-settings"
          uploadFolder="free-shipping-banner"
          title="بنر ارسال رایگان"
          description="بخش «ارسال رایگان برای خریدهای بالای X تومان» بالای دکمه خرید."
          defaultTextPlaceholder="ارسال رایگان برای خرید های بالای ۱ میلیون تومان"
        />

        <InlineBannerSection
          settingsKey="installmentBanner"
          apiPath="/api/admin/settings/installment-banner"
          queryKey="installment-banner-settings"
          uploadFolder="installment-banner"
          title="بنر پرداخت اقساطی ترب‌پی"
          description="کادر کوچک زیر قیمت، کنار دکمه خرید."
          defaultTextPlaceholder="امکان خرید اقساطی با ترب‌پی"
        />
      </div>
    </div>
  );
}

function FreeShippingProgressSection() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["free-shipping-progress-settings"],
    queryFn: async () => (await apiClient.get("/api/admin/settings/free-shipping-progress")).data,
  });

  const initial = {
    enabled: false,
    threshold: 3000000,
    flatFee: 0,
    ...(data?.freeShippingProgress || {}),
  };

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return <FreeShippingProgressForm initial={initial} toast={toast} queryClient={queryClient} />;
}

function FreeShippingProgressForm({ initial, toast, queryClient }) {
  const [settings, setSettings] = useState(initial);
  const patch = (fields) => setSettings((s) => ({ ...s, ...fields }));

  const saveMutation = useMutation({
    mutationFn: () =>
      apiClient.put("/api/admin/settings/free-shipping-progress", {
        freeShippingProgress: settings,
      }),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["free-shipping-progress-settings"] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-[var(--text)]">آستانه‌ی ارسال رایگان</p>
          <p className="mt-1 text-xs text-[var(--text-faint)]">
            وقتی فعال باشد، هم ویجت پیشرفت در مینی‌سبد سایت (بالای سبد خرید هدر) نشان داده می‌شود، و
            هم — مهم‌تر — هزینه‌ی واقعی ارسال سفارش وقتی مبلغ سبد به این عدد برسد صفر می‌شود؛ این یک
            متن تزئینی نیست.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
            className="h-4 w-4 accent-[var(--brand-600)]"
          />
          فعال (هم ویجت، هم محاسبه‌ی واقعی هزینه‌ی ارسال)
        </label>

        <div>
          <Label>مبلغ آستانه (تومان)</Label>
          <Input
            dir="ltr"
            type="number"
            min={0}
            value={settings.threshold}
            onChange={(e) => patch({ threshold: Number(e.target.value) || 0 })}
            placeholder="3000000"
          />
        </div>

        <div>
          <Label>هزینه‌ی ثابت ارسال (تومان)</Label>
          <Input
            dir="ltr"
            type="number"
            min={0}
            value={settings.flatFee}
            onChange={(e) => patch({ flatFee: Number(e.target.value) || 0 })}
            placeholder="100000"
          />
          <p className="mt-1 text-xs text-[var(--text-faint)]">
            هزینه‌ای که وقتی سبد به آستانه‌ی بالا نرسیده از مشتری گرفته می‌شود. صفر بگذار تا مقدار
            پیش‌فرض سیستم (۱۰۰٬۰۰۰ تومان) بدون تغییر بماند.
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

function InlineBannerSection({
  settingsKey,
  apiPath,
  queryKey,
  uploadFolder,
  title,
  description,
  defaultTextPlaceholder,
}) {
  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => (await apiClient.get(apiPath)).data,
  });

  if (isLoading) return <Skeleton className="h-72 w-full" />;

  return (
    <InlineBannerForm
      initial={{ ...BANNER_DEFAULTS, ...(data?.[settingsKey] || {}) }}
      settingsKey={settingsKey}
      apiPath={apiPath}
      queryKey={queryKey}
      uploadFolder={uploadFolder}
      title={title}
      description={description}
      defaultTextPlaceholder={defaultTextPlaceholder}
    />
  );
}

function InlineBannerForm({
  initial,
  settingsKey,
  apiPath,
  queryKey,
  uploadFolder,
  title,
  description,
  defaultTextPlaceholder,
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(initial);
  const patch = (fields) => setSettings((s) => ({ ...s, ...fields }));

  const saveMutation = useMutation({
    mutationFn: () => apiClient.put(apiPath, { [settingsKey]: settings }),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-[var(--text)]">{title}</p>
          {description && <p className="mt-1 text-xs text-[var(--text-faint)]">{description}</p>}
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
            className="h-4 w-4 accent-[var(--brand-600)]"
          />
          نمایش این بخش
        </label>

        <div>
          <Label>نوع نمایش</Label>
          <Select value={settings.mode} onChange={(e) => patch({ mode: e.target.value })}>
            <option value="default">متن با آیکون پیش‌فرض</option>
            <option value="image">بنر تصویری</option>
            <option value="custom">کد سفارشی (HTML)</option>
          </Select>
        </div>

        {settings.mode === "default" && (
          <div>
            <Label>متن</Label>
            <Input
              value={settings.text}
              onChange={(e) => patch({ text: e.target.value })}
              placeholder={defaultTextPlaceholder}
            />
            <p className="mt-1 text-xs text-[var(--text-faint)]">
              خالی بگذارید تا همین متن پیش‌فرض بدون تغییر باقی بماند.
            </p>
          </div>
        )}

        {settings.mode === "image" && (
          <>
            <div>
              <Label>تصویر بنر</Label>
              <BannerImageField
                value={settings.image}
                onChange={(v) => patch({ image: v })}
                folder={uploadFolder}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>لینک بنر (اختیاری)</Label>
                <Input
                  dir="ltr"
                  value={settings.href}
                  onChange={(e) => patch({ href: e.target.value })}
                  placeholder="/landing/free-shipping"
                />
              </div>
              <div>
                <Label>متن جایگزین تصویر (Alt)</Label>
                <Input
                  value={settings.alt}
                  onChange={(e) => patch({ alt: e.target.value })}
                  placeholder="مثلاً: ارسال رایگان دلیسا"
                />
              </div>
            </div>

            {!settings.image && (
              <p className="text-xs text-[var(--warning)]">
                تا وقتی تصویری آپلود نکنی، همان بنر پیش‌فرض نمایش داده می‌شود.
              </p>
            )}
          </>
        )}

        {settings.mode === "custom" && (
          <div>
            <Label>کد HTML سفارشی</Label>
            <textarea
              dir="ltr"
              rows={6}
              value={settings.customHtml}
              onChange={(e) => patch({ customHtml: e.target.value })}
              placeholder='<div style="...">...</div>'
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 font-mono text-xs outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
            />
            <p className="mt-1 text-xs text-[var(--text-faint)]">
              قبل از ذخیره پاک‌سازی می‌شود (اسکریپت/iframe و رویدادهایی مثل onclick حذف می‌شوند)؛
              تگ، کلاس و استایل اینلاین مجازند. تا وقتی کدی وارد نکنی، همان بنر پیش‌فرض نمایش داده
              می‌شود.
            </p>
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

function BannerImageField({ value, onChange, folder }) {
  const inputRef = useRef(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadBannerImage(file, folder);
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
