"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImageField } from "./fields/image-field";

const ROBOTS_OPTIONS = [
  { value: "index,follow", label: "نمایه‌سازی و دنبال‌کردن لینک‌ها (پیش‌فرض)" },
  { value: "noindex,follow", label: "عدم نمایه‌سازی، دنبال‌کردن لینک‌ها" },
  { value: "index,nofollow", label: "نمایه‌سازی، عدم دنبال‌کردن لینک‌ها" },
  { value: "noindex,nofollow", label: "عدم نمایه‌سازی و عدم دنبال‌کردن" },
];

const EMPTY_SEO = { headline: "", tagline: "", metaTitle: "", metaDescription: "", canonical: "", robots: "index,follow", ogTitle: "", ogDescription: "", ogImage: "" };

export function SeoModal({ open, onOpenChange, seo, onSave, saving }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogTitle>سئو و متادیتای صفحه</DialogTitle>
        <DialogDescription>این تنظیمات مستقل از محتوای بصری صفحه ذخیره می‌شوند.</DialogDescription>
        {open && <SeoForm seo={seo} onSave={onSave} saving={saving} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function SeoForm({ seo, onSave, saving, onClose }) {
  const [form, setForm] = useState({ ...EMPTY_SEO, ...(seo || {}) });
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      className="mt-4 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[var(--text-muted)]">محتوای نمایشی صفحه</p>
        <div>
          <Label>سرتیتر (Headline)</Label>
          <Input value={form.headline} onChange={(e) => set("headline", e.target.value)} placeholder="مثلاً: جشنواره تابستانه دلیسا" />
        </div>
        <div>
          <Label>شعار/زیرعنوان (Tagline)</Label>
          <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="مثلاً: تا ۴۰٪ تخفیف روی محصولات منتخب" />
        </div>
      </div>

      <div className="space-y-3 border-t border-[var(--border)] pt-4">
        <p className="text-xs font-semibold text-[var(--text-muted)]">سئو (نتایج جستجو)</p>
        <div>
          <Label>عنوان سئو (Meta Title)</Label>
          <Input value={form.metaTitle} maxLength={160} onChange={(e) => set("metaTitle", e.target.value)} placeholder="در صورت خالی‌ماندن، از عنوان صفحه استفاده می‌شود" />
        </div>
        <div>
          <Label>توضیحات متا (Meta Description)</Label>
          <textarea
            rows={3}
            maxLength={320}
            value={form.metaDescription}
            onChange={(e) => set("metaDescription", e.target.value)}
            className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
          />
        </div>
        <div>
          <Label>آدرس کنونیکال (اختیاری)</Label>
          <Input dir="ltr" value={form.canonical} onChange={(e) => set("canonical", e.target.value)} placeholder="https://delisa.shop/landing/..." />
        </div>
        <div>
          <Label>نمایه‌سازی (Robots)</Label>
          <Select value={form.robots} onChange={(e) => set("robots", e.target.value)}>
            {ROBOTS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-3 border-t border-[var(--border)] pt-4">
        <p className="text-xs font-semibold text-[var(--text-muted)]">اشتراک‌گذاری (Open Graph)</p>
        <div>
          <Label>عنوان اشتراک‌گذاری</Label>
          <Input value={form.ogTitle} onChange={(e) => set("ogTitle", e.target.value)} placeholder="در صورت خالی‌ماندن، از «عنوان سئو» استفاده می‌شود" />
        </div>
        <div>
          <Label>توضیح اشتراک‌گذاری</Label>
          <textarea
            rows={2}
            value={form.ogDescription}
            onChange={(e) => set("ogDescription", e.target.value)}
            className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
          />
        </div>
        <div>
          <Label>تصویر اشتراک‌گذاری</Label>
          <ImageField value={form.ogImage} onChange={(v) => set("ogImage", v)} />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          انصراف
        </Button>
        <Button type="submit" loading={saving}>
          ذخیره
        </Button>
      </div>
    </form>
  );
}
