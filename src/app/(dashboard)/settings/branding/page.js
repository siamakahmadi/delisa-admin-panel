"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Upload, Trash2, ImageIcon } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

// هر اسلات = یک جای مشخص در سایت. اگر خالی باشد، سایت به اسلات‌های
// جایگزین (fallback) و در نهایت لوگوی داخلی کد برمی‌گردد.
const SLOTS = [
  { key: "header", label: "لوگوی هدر (دسکتاپ)", hint: "بالای همه‌ی صفحات. پیشنهاد: SVG یا PNG شفاف، نسبت ۲:۱ (مثلاً ۱۴۴×۷۲).", dark: false },
  { key: "headerMobile", label: "لوگوی هدر (موبایل)", hint: "اختیاری — اگر خالی باشد از لوگوی هدر دسکتاپ استفاده می‌شود.", dark: false },
  { key: "footer", label: "لوگوی فوتر", hint: "اختیاری — fallback: لوگوی هدر. اگر فوتر تیره است نسخه‌ی روشن آپلود کنید.", dark: true },
  { key: "auth", label: "لوگوی مودال ورود", hint: "بالای فرم ورود/ثبت‌نام. fallback: تایپوگرافی → هدر. پیشنهاد: عرض ۲۰۰.", dark: false },
  { key: "loading", label: "لوگوی صفحه لودینگ", hint: "اسپلش/لودینگ. fallback: آیکون → هدر.", dark: false },
  { key: "wordmark", label: "تایپوگرافی (نام برند)", hint: "فقط نوشتار برند بدون نماد.", dark: false },
  { key: "icon", label: "آیکون مربعی", hint: "نماد بدون متن — برای apple-touch-icon، PWA و شبکه‌های اجتماعی. پیشنهاد: ۵۱۲×۵۱۲ PNG.", dark: false },
  { key: "favicon", label: "فاویکون", hint: "آیکون تب مرورگر. SVG، PNG ۳۲×۳۲ یا ICO.", dark: false },
  { key: "og", label: "تصویر ناشر (JSON-LD / شبکه‌های اجتماعی)", hint: "برای Organization.logo و og:image پیش‌فرض. پیشنهاد: PNG ۵۱۲×۵۱۲ یا ۱۲۰۰×۶۳۰. fallback: آیکون → هدر.", dark: false },
];

function fmtBytes(n) {
  const v = Number(n || 0);
  if (v >= 1024 * 1024) return `${(v / 1024 / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} MB`;
  if (v >= 1024) return `${Math.round(v / 1024).toLocaleString("fa-IR")} KB`;
  return `${v.toLocaleString("fa-IR")} B`;
}

export default function BrandingSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["branding-settings"],
    queryFn: async () => (await apiClient.get("/api/admin/settings/branding")).data,
  });

  return (
    <div>
      <PageHeader
        title="لوگو و برندینگ"
        subtitle="لوگوی سایت را یک‌بار برای هر جایگاه آپلود کنید؛ سایت مشتری خودکار از همان استفاده می‌کند. SVG، PNG، WebP، JPG و ICO پذیرفته می‌شود (SVG قبل از ذخیره پاک‌سازی امنیتی می‌شود)."
      />
      {isLoading || !data?.branding ? <Skeleton className="h-96 w-full" /> : <BrandingForm initial={data.branding} />}
    </div>
  );
}

function SlotCard({ slot, logo, onUploaded, onChangeMeta, onRemove }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiClient.post(`/api/admin/settings/branding/logo/${slot.key}`, fd).then((r) => r.data);
    },
    onSuccess: (res) => {
      toast.success("لوگو آپلود شد");
      onUploaded(res.logo);
    },
    onError: (e) => {
      const msg = e?.response?.data?.error || e?.response?.data?.message;
      toast.error(msg === "INVALID_FILE_TYPE" ? "فرمت فایل مجاز نیست (SVG/PNG/WebP/JPG/ICO)" : msg || "آپلود ناموفق بود");
    },
  });

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("حجم لوگو باید کمتر از ۲ مگابایت باشد");
    uploadMutation.mutate(file);
  };

  const hasLogo = !!logo?.url;
  const isSvg = logo?.mimeType === "image/svg+xml" || /\.svg($|\?)/i.test(logo?.url || "");

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">{slot.label}</p>
            <p className="mt-0.5 text-xs leading-5 text-[var(--text-faint)]">{slot.hint}</p>
          </div>
          {hasLogo ? (
            <Badge variant="success" size="sm" dot>
              {isSvg ? "SVG" : (logo.mimeType || "").replace("image/", "").toUpperCase() || "تنظیم شده"}
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm">
              پیش‌فرض کد
            </Badge>
          )}
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex min-h-[110px] cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-dashed p-3 transition ${
            dragOver ? "border-[var(--brand-500)] bg-[var(--brand-50)]" : "border-[var(--border)]"
          } ${slot.dark ? "bg-[#1f1f1f]" : "bg-[var(--surface-muted)]"}`}
          style={{
            backgroundImage: slot.dark
              ? undefined
              : "linear-gradient(45deg,#eee 25%,transparent 25%),linear-gradient(-45deg,#eee 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eee 75%),linear-gradient(-45deg,transparent 75%,#eee 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
          }}
        >
          {uploadMutation.isPending ? (
            <span className="text-xs text-[var(--text-muted)]">در حال آپلود…</span>
          ) : hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo.url} alt={logo.alt || slot.label} style={{ maxWidth: "100%", maxHeight: 96, objectFit: "contain" }} />
          ) : (
            <span className="flex items-center gap-2 text-xs text-[var(--text-faint)]">
              <ImageIcon size={16} /> برای آپلود کلیک کنید یا فایل را اینجا بیندازید
            </span>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/svg+xml,image/png,image/webp,image/jpeg,image/x-icon,image/vnd.microsoft.icon,.ico,.svg" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />

        {hasLogo && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">عرض نمایش (px)</Label>
                <Input type="number" min={0} max={2000} value={logo.width || ""} placeholder="پیش‌فرض" onChange={(e) => onChangeMeta({ width: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">ارتفاع نمایش (px)</Label>
                <Input type="number" min={0} max={2000} value={logo.height || ""} placeholder="خودکار" onChange={(e) => onChangeMeta({ height: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">متن جایگزین (alt)</Label>
              <Input value={logo.alt || ""} onChange={(e) => onChangeMeta({ alt: e.target.value })} placeholder="مثلاً: دلیسا" />
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-faint)]">
              <span dir="ltr">
                {logo.naturalWidth && logo.naturalHeight ? `${logo.naturalWidth}×${logo.naturalHeight}` : ""}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
                  <Upload size={14} /> جایگزینی
                </Button>
                <Button variant="ghost" size="sm" onClick={onRemove}>
                  <Trash2 size={14} /> حذف
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BrandingForm({ initial }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [branding, setBranding] = useState(initial);
  const [removed, setRemoved] = useState({}); // slot → true (حذف در ذخیره)

  const setLogo = (slot, logo) => setBranding((b) => ({ ...b, logos: { ...b.logos, [slot]: logo } }));
  const patchLogo = (slot, fields) => setBranding((b) => ({ ...b, logos: { ...b.logos, [slot]: { ...(b.logos?.[slot] || {}), ...fields } } }));

  const saveMutation = useMutation({
    mutationFn: () => {
      const logos = {};
      for (const s of SLOTS) {
        if (removed[s.key]) {
          logos[s.key] = { url: "" };
          continue;
        }
        const l = branding.logos?.[s.key];
        if (l?.url) logos[s.key] = { width: Number(l.width) || 0, height: Number(l.height) || 0, alt: l.alt || "" };
      }
      return apiClient.put("/api/admin/settings/branding", { branding: { siteName: branding.siteName, logos } }).then((r) => r.data);
    },
    onSuccess: (res) => {
      toast.success("ذخیره شد — تا یک دقیقه‌ی دیگر روی سایت اعمال می‌شود");
      setRemoved({});
      if (res?.branding) setBranding(res.branding);
      queryClient.invalidateQueries({ queryKey: ["branding-settings"] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px]">
            <Label>نام سایت</Label>
            <Input value={branding.siteName || ""} onChange={(e) => setBranding((b) => ({ ...b, siteName: e.target.value }))} />
          </div>
          <p className="text-xs leading-6 text-[var(--text-muted)]">
            آپلود هر لوگو بلافاصله ذخیره می‌شود؛ «ذخیره تنظیمات» فقط برای عرض/ارتفاع/alt و حذف لازم است.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SLOTS.map((slot) => (
          <SlotCard
            key={slot.key}
            slot={slot}
            logo={removed[slot.key] ? null : branding.logos?.[slot.key]}
            onUploaded={(logo) => {
              setRemoved((r) => ({ ...r, [slot.key]: false }));
              setLogo(slot.key, logo);
            }}
            onChangeMeta={(fields) => patchLogo(slot.key, fields)}
            onRemove={() => setRemoved((r) => ({ ...r, [slot.key]: true }))}
          />
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
