"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, ImagePlus, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { fetchFooterSettings, saveFooterSettings, uploadFooterBannerImage } from "@/lib/footer/api";

const DEFAULTS = {
  banner: { enabled: true, image: "", href: "", alt: "", openInNewTab: true },
  phone: { number: "", label: "", hours: "" },
  social: { whatsapp: "", telegram: "", instagram: "" },
  descriptionHtml: "",
};

export default function FooterSettingsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["footer-settings"], queryFn: fetchFooterSettings });

  return (
    <div>
      <PageHeader
        title="تنظیمات فوتر"
        subtitle="بنر، اطلاعات تماس، شبکه‌های اجتماعی و توضیحات پایین فوتر سایت مشتری. این تغییرات سمت سرور رندر می‌شوند و بلافاصله روی همه صفحات اعمال می‌شوند."
      />

      {isLoading ? (
        <Skeleton className="h-96 w-full max-w-2xl" />
      ) : (
        <SettingsForm
          initial={{
            banner: { ...DEFAULTS.banner, ...(data?.banner || {}) },
            phone: { ...DEFAULTS.phone, ...(data?.phone || {}) },
            social: { ...DEFAULTS.social, ...(data?.social || {}) },
            descriptionHtml: data?.descriptionHtml || "",
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

  const patchBanner = (fields) => setSettings((s) => ({ ...s, banner: { ...s.banner, ...fields } }));
  const patchPhone = (fields) => setSettings((s) => ({ ...s, phone: { ...s.phone, ...fields } }));
  const patchSocial = (fields) => setSettings((s) => ({ ...s, social: { ...s.social, ...fields } }));

  const saveMutation = useMutation({
    mutationFn: () => saveFooterSettings(settings),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["footer-settings"] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-[var(--text)]">دسته‌بندی‌ها و منوهای فوتر</p>
          <p className="text-xs text-[var(--text-faint)]">
            ستون‌های لینک سمت راست فوتر (دسته‌بندی‌ها، لینک‌های «درباره دلیسا» و…) از طریق{" "}
            <a href="/content/menu-builder" className="text-[var(--brand-600)] underline">
              منوساز
            </a>{" "}
            مدیریت می‌شوند، نه این صفحه. برای افزودن/ویرایش آن‌ها یک منو با جایگاه (location) «footer»
            بسازید یا منتشر کنید.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-[var(--text)]">بنر فوتر</p>

          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input
              type="checkbox"
              checked={settings.banner.enabled}
              onChange={(e) => patchBanner({ enabled: e.target.checked })}
              className="h-4 w-4 accent-[var(--brand-600)]"
            />
            نمایش بنر
          </label>

          <div>
            <Label>تصویر بنر</Label>
            <BannerImageField value={settings.banner.image} onChange={(v) => patchBanner({ image: v })} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>لینک بنر</Label>
              <Input dir="ltr" value={settings.banner.href} onChange={(e) => patchBanner({ href: e.target.value })} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <Label>متن جایگزین تصویر (Alt)</Label>
              <Input value={settings.banner.alt} onChange={(e) => patchBanner({ alt: e.target.value })} placeholder="مثلاً: اینستاگرام دلیسا" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input
              type="checkbox"
              checked={settings.banner.openInNewTab}
              onChange={(e) => patchBanner({ openInNewTab: e.target.checked })}
              className="h-4 w-4 accent-[var(--brand-600)]"
            />
            باز شدن در تب جدید
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-[var(--text)]">تلفن پشتیبانی</p>
          <div>
            <Label>عنوان</Label>
            <Input value={settings.phone.label} onChange={(e) => patchPhone({ label: e.target.value })} placeholder="تلفن پشتیبانی:" />
          </div>
          <div>
            <Label>شماره تلفن</Label>
            <Input dir="ltr" value={settings.phone.number} onChange={(e) => patchPhone({ number: e.target.value })} placeholder="09175293160" />
          </div>
          <div>
            <Label>ساعات پاسخگویی</Label>
            <Input
              value={settings.phone.hours}
              onChange={(e) => patchPhone({ hours: e.target.value })}
              placeholder="شنبه تا چهارشنبه ۰۹:۳۰ تا ۱۷:۳۰ و پنج‌شنبه ۰۹:۳۰ تا ۱۳:۳۰"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-[var(--text)]">شبکه‌های اجتماعی</p>
          <div>
            <Label>واتساپ</Label>
            <Input dir="ltr" value={settings.social.whatsapp} onChange={(e) => patchSocial({ whatsapp: e.target.value })} placeholder="https://wa.me/98..." />
          </div>
          <div>
            <Label>تلگرام</Label>
            <Input dir="ltr" value={settings.social.telegram} onChange={(e) => patchSocial({ telegram: e.target.value })} placeholder="https://t.me/..." />
          </div>
          <div>
            <Label>اینستاگرام</Label>
            <Input dir="ltr" value={settings.social.instagram} onChange={(e) => patchSocial({ instagram: e.target.value })} placeholder="https://instagram.com/..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-[var(--text)]">توضیحات درباره‌ی دلیسا</p>
          <p className="text-xs text-[var(--text-faint)]">
            این متن در پایین فوتر همه‌ی صفحات سایت مشتری نمایش داده می‌شود. اگر خالی بگذارید، همان متن
            پیش‌فرض فعلی سایت بدون تغییر باقی می‌ماند.
          </p>
          <RichTextEditor
            value={settings.descriptionHtml}
            onChange={(v) => setSettings((s) => ({ ...s, descriptionHtml: v.html }))}
            placeholder="توضیحات درباره‌ی دلیسا را بنویسید..."
          />
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

function BannerImageField({ value, onChange }) {
  const inputRef = useRef(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFooterBannerImage(file);
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
