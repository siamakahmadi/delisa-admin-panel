"use client";

import { Label, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

// تب مشترک «سئو و انتشار» بین SkinType/SkinConcern/Ingredient — یک شکل کامل یکسان.
export function SeoStatusTab({
  isActive, setIsActive,
  status, setStatus,
  metaTitle, setMetaTitle, titlePlaceholder,
  metaDescription, setMetaDescription, descriptionPlaceholder,
  canonical, setCanonical,
  robots, setRobots,
  ogImage, setOgImage,
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
          فعال
        </label>
        <div>
          <Label>وضعیت انتشار</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">پیش‌نویس</option>
            <option value="published">منتشرشده</option>
          </Select>
        </div>
      </div>

      <div>
        <Label>عنوان سئو (Meta Title)</Label>
        <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder={titlePlaceholder} />
      </div>
      <div>
        <Label>توضیح سئو (Meta Description)</Label>
        <Input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder={descriptionPlaceholder} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Canonical (اختیاری)</Label>
          <Input dir="ltr" value={canonical} onChange={(e) => setCanonical(e.target.value)} />
        </div>
        <div>
          <Label>Robots</Label>
          <Select value={robots} onChange={(e) => setRobots(e.target.value)}>
            <option value="index,follow">index,follow</option>
            <option value="noindex,follow">noindex,follow</option>
            <option value="index,nofollow">index,nofollow</option>
            <option value="noindex,nofollow">noindex,nofollow</option>
          </Select>
        </div>
      </div>
      <div>
        <Label>تصویر Open Graph (اختیاری)</Label>
        <Input dir="ltr" value={ogImage} onChange={(e) => setOgImage(e.target.value)} placeholder="خالی = همان تصویر شاخص" />
      </div>
    </div>
  );
}
