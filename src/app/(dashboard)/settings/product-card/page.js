"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Monitor, Smartphone, RotateCcw } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import ProductCardPreview from "@/components/settings/ProductCardPreview";

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

const ELEMENTS = [
  { key: "brand", label: "نام برند" },
  { key: "title", label: "عنوان محصول" },
  { key: "shortDescription", label: "توضیح کوتاه (متادسکریپشن سئو)" },
  { key: "price", label: "قیمت" },
  { key: "originalPrice", label: "قیمت قبل از تخفیف (خط‌خورده)" },
  { key: "discountBadge", label: "بج درصد تخفیف" },
  { key: "outOfStockBadge", label: "بج «ناموجود»" },
  { key: "addToCart", label: "دکمه‌ی افزودن به سبد" },
  { key: "notifyStock", label: "دکمه‌ی «خبرم کن» برای ناموجود" },
  { key: "imageHoverZoom", label: "بزرگ‌نمایی تصویر با هاور" },
];

const COLORS = [
  { key: "cardBackground", label: "پس‌زمینه کارت" },
  { key: "imageBackground", label: "پس‌زمینه قاب تصویر" },
  { key: "border", label: "رنگ حاشیه (خالی = بدون حاشیه)", optional: true },
  { key: "title", label: "عنوان" },
  { key: "brand", label: "برند" },
  { key: "description", label: "توضیح کوتاه" },
  { key: "price", label: "قیمت" },
  { key: "originalPrice", label: "قیمت خط‌خورده" },
  { key: "discountBackground", label: "پس‌زمینه بج تخفیف" },
  { key: "discountText", label: "متن بج تخفیف" },
  { key: "outOfStockBackground", label: "پس‌زمینه بج ناموجود" },
  { key: "outOfStockText", label: "متن بج ناموجود" },
  { key: "button", label: "رنگ دکمه/آیکون سبد" },
  { key: "buttonBackground", label: "پس‌زمینه دکمه سبد (خالی = شفاف)", optional: true },
];

const SIZES = [
  { key: "titleSize", label: "عنوان", min: 9, max: 24 },
  { key: "brandSize", label: "برند", min: 9, max: 20 },
  { key: "priceSize", label: "قیمت", min: 9, max: 28 },
  { key: "originalPriceSize", label: "قیمت خط‌خورده", min: 8, max: 20 },
  { key: "descriptionSize", label: "توضیح کوتاه", min: 9, max: 18 },
  { key: "badgeSize", label: "بج‌ها", min: 8, max: 16 },
  { key: "buttonSize", label: "آیکون سبد", min: 16, max: 48 },
  { key: "padding", label: "فاصله داخلی کارت", min: 0, max: 32 },
];

const WEIGHTS = [
  { value: 300, label: "نازک (۳۰۰)" },
  { value: 400, label: "معمولی (۴۰۰)" },
  { value: 500, label: "متوسط (۵۰۰)" },
  { value: 600, label: "نیمه‌ضخیم (۶۰۰)" },
  { value: 700, label: "ضخیم (۷۰۰)" },
  { value: 800, label: "خیلی ضخیم (۸۰۰)" },
  { value: 900, label: "سیاه (۹۰۰)" },
];

export default function ProductCardSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["product-card-settings"],
    queryFn: async () => (await apiClient.get("/api/admin/settings/product-card")).data,
  });

  return (
    <div>
      <PageHeader
        title="طراحی کارت محصول"
        subtitle="ظاهر کارت‌های محصول سایت مشتری (لیست‌ها، کاروسل‌ها، آرشیوها): کدام عناصر نمایش داده شوند، رنگ‌ها، و اندازه‌ها — جداگانه برای دسکتاپ و موبایل."
      />
      {isLoading || !data?.productCard ? <Skeleton className="h-[600px] w-full" /> : <Designer initial={data.productCard} />}
    </div>
  );
}

// رنگ‌های rgba/نام‌دار را <input type=color> نمی‌فهمد — برای پیکر یک hex
// تقریبی می‌سازیم ولی مقدار واقعی در فیلد متنی می‌ماند.
function toHexForPicker(v) {
  if (typeof v !== "string") return "#000000";
  const s = v.trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s;
  if (/^#[0-9a-f]{3}$/i.test(s)) return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  if (/^#[0-9a-f]{8}$/i.test(s)) return s.slice(0, 7);
  const m = s.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (m) return `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
  return "#000000";
}

function ColorField({ label, value, onChange, optional }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={toHexForPicker(value)}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-1"
          aria-label={label}
        />
        <Input dir="ltr" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={optional ? "خالی" : "#262626"} />
        {optional && value ? (
          <Button variant="ghost" size="icon" onClick={() => onChange("")} title="پاک کردن">
            <RotateCcw size={14} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function DeviceSizes({ device, values, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>نسبت قاب تصویر</Label>
          <Select value={values.ratio} onChange={(e) => onChange({ ratio: e.target.value })}>
            {RATIOS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>قرارگیری تصویر</Label>
          <Select value={values.fit} onChange={(e) => onChange({ fit: e.target.value })}>
            <option value="contain">کل تصویر دیده شود (contain)</option>
            <option value="cover">قاب پر شود (cover)</option>
          </Select>
        </div>
        {values.fit !== "cover" && (
          <div>
            <Label>اندازه تصویر داخل قاب (٪)</Label>
            <Input type="number" min={50} max={100} value={values.imageScale} onChange={(e) => onChange({ imageScale: e.target.value })} />
          </div>
        )}
        <div>
          <Label>حداکثر خطوط عنوان</Label>
          <Input type="number" min={1} max={4} value={values.titleLines} onChange={(e) => onChange({ titleLines: e.target.value })} />
        </div>
        <div>
          <Label>حداکثر خطوط توضیح کوتاه</Label>
          <Input type="number" min={1} max={4} value={values.descriptionLines} onChange={(e) => onChange({ descriptionLines: e.target.value })} />
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">اندازه فونت‌ها و فاصله‌ها (px) — {device === "mobile" ? "موبایل" : "دسکتاپ"}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SIZES.map((s) => (
            <div key={s.key}>
              <Label className="text-xs">{s.label}</Label>
              <Input type="number" min={s.min} max={s.max} value={values[s.key] ?? ""} onChange={(e) => onChange({ [s.key]: e.target.value })} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function numberize(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === "" || v === null || v === undefined) continue;
    out[k] = typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
  }
  return out;
}

function Designer({ initial }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [s, setS] = useState(initial);
  const [previewOos, setPreviewOos] = useState(false);
  const patch = (fields) => setS((prev) => ({ ...prev, ...fields }));
  const patchNested = (key, fields) => setS((prev) => ({ ...prev, [key]: { ...prev[key], ...fields } }));

  const saveMutation = useMutation({
    mutationFn: () =>
      apiClient.put("/api/admin/settings/product-card", {
        productCard: {
          ...numberize({ titleWeight: s.titleWeight, brandWeight: s.brandWeight, priceWeight: s.priceWeight, borderRadius: s.borderRadius }),
          addToCartStyle: s.addToCartStyle,
          addToCartLabel: s.addToCartLabel,
          discountLabel: s.discountLabel,
          desktop: numberize(s.desktop),
          mobile: numberize(s.mobile),
          elements: s.elements,
          colors: s.colors,
        },
      }),
    onSuccess: (res) => {
      toast.success("ذخیره شد — تا یک دقیقه‌ی دیگر روی سایت اعمال می‌شود");
      if (res?.data?.productCard) setS(res.data.productCard);
      queryClient.invalidateQueries({ queryKey: ["product-card-settings"] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  // پیش‌نمایش با مقادیر عددی لحظه‌ای (فیلدهای در حال تایپ رشته‌اند)
  const previewSettings = {
    ...s,
    ...numberize({ titleWeight: s.titleWeight, brandWeight: s.brandWeight, priceWeight: s.priceWeight, borderRadius: s.borderRadius }),
    desktop: numberize(s.desktop),
    mobile: numberize(s.mobile),
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardContent>
          <Tabs defaultValue="elements">
            <TabsList className="flex-wrap">
              <TabsTrigger value="elements">عناصر</TabsTrigger>
              <TabsTrigger value="colors">رنگ‌ها</TabsTrigger>
              <TabsTrigger value="desktop">
                <Monitor size={14} className="ml-1 inline" />
                دسکتاپ
              </TabsTrigger>
              <TabsTrigger value="mobile">
                <Smartphone size={14} className="ml-1 inline" />
                موبایل
              </TabsTrigger>
              <TabsTrigger value="general">عمومی</TabsTrigger>
            </TabsList>

            <TabsContent value="elements" className="pt-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ELEMENTS.map((e) => (
                  <label key={e.key} className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)]">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--brand-600)]"
                      checked={s.elements?.[e.key] !== false}
                      onChange={(ev) => patchNested("elements", { [e.key]: ev.target.checked })}
                    />
                    {e.label}
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-[var(--text-faint)]">
                «توضیح کوتاه» از فیلد متادسکریپشن سئوی محصول خوانده می‌شود (حداکثر ۱۶۰ کاراکتر) — محصولاتی که متادسکریپشن ندارند، بدون توضیح نمایش داده می‌شوند.
              </p>
            </TabsContent>

            <TabsContent value="colors" className="pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {COLORS.map((c) => (
                  <ColorField key={c.key} label={c.label} optional={c.optional} value={s.colors?.[c.key] ?? ""} onChange={(v) => patchNested("colors", { [c.key]: v })} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="desktop" className="pt-4">
              <DeviceSizes device="desktop" values={s.desktop || {}} onChange={(f) => patchNested("desktop", f)} />
            </TabsContent>
            <TabsContent value="mobile" className="pt-4">
              <DeviceSizes device="mobile" values={s.mobile || {}} onChange={(f) => patchNested("mobile", f)} />
            </TabsContent>

            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label>وزن فونت عنوان</Label>
                  <Select value={s.titleWeight} onChange={(e) => patch({ titleWeight: e.target.value })}>
                    {WEIGHTS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>وزن فونت برند</Label>
                  <Select value={s.brandWeight} onChange={(e) => patch({ brandWeight: e.target.value })}>
                    {WEIGHTS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>وزن فونت قیمت</Label>
                  <Select value={s.priceWeight} onChange={(e) => patch({ priceWeight: e.target.value })}>
                    {WEIGHTS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label>شعاع گوشه کارت (px)</Label>
                  <Input type="number" min={0} max={32} value={s.borderRadius ?? 0} onChange={(e) => patch({ borderRadius: e.target.value })} />
                </div>
                <div>
                  <Label>سبک دکمه‌ی سبد</Label>
                  <Select value={s.addToCartStyle} onChange={(e) => patch({ addToCartStyle: e.target.value })}>
                    <option value="icon">فقط آیکون</option>
                    <option value="button">دکمه با متن</option>
                  </Select>
                </div>
                {s.addToCartStyle === "button" && (
                  <div>
                    <Label>متن دکمه</Label>
                    <Input value={s.addToCartLabel ?? ""} onChange={(e) => patch({ addToCartLabel: e.target.value })} />
                  </div>
                )}
                <div>
                  <Label>قالب متن بج تخفیف</Label>
                  <Input dir="ltr" value={s.discountLabel ?? ""} onChange={(e) => patch({ discountLabel: e.target.value })} placeholder="-{percent}%" />
                  <p className="mt-1 text-xs text-[var(--text-faint)]">{"{percent}"} با درصد تخفیف جایگزین می‌شود؛ مثلاً «{"{percent}"}٪ تخفیف».</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
            <Button variant="outline" onClick={() => setS(initial)}>
              <RotateCcw size={16} />
              بازگردانی
            </Button>
            <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              <Save size={16} />
              ذخیره تنظیمات
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--text)]">پیش‌نمایش زنده</p>
              <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <input type="checkbox" className="h-3.5 w-3.5 accent-[var(--brand-600)]" checked={previewOos} onChange={(e) => setPreviewOos(e.target.checked)} />
                حالت ناموجود
              </label>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-4">
              <p className="mb-2 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Monitor size={12} /> دسکتاپ
              </p>
              <div className="flex justify-center">
                <ProductCardPreview settings={previewSettings} device="desktop" outOfStock={previewOos} />
              </div>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-4">
              <p className="mb-2 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Smartphone size={12} /> موبایل
              </p>
              <div className="flex justify-center">
                <ProductCardPreview settings={previewSettings} device="mobile" outOfStock={previewOos} width={170} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
