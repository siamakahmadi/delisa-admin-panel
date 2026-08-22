"use client";

import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { FaqEditor } from "./faq-editor";
import { RelatedEntitiesEditor } from "./related-entities-editor";

const empty = () => ({
  h1: "",
  shortDescription: "",
  content: null,
  contentHtml: "",
  faqs: [],
  relatedEntities: [],
  sectionOverrides: { faq: null, relatedEntities: null, relatedArticles: null },
});

function OverrideSelect({ label, value, onChange }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-[11px] text-[var(--text-faint)]">{label}:</span>
      <Select
        value={value === null || value === undefined ? "inherit" : value ? "show" : "hide"}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "inherit" ? null : v === "show");
        }}
        className="!h-7 w-40 text-[11px]"
      >
        <option value="inherit">پیرو تنظیمات عمومی</option>
        <option value="show">همیشه نمایش بده</option>
        <option value="hide">همیشه مخفی کن</option>
      </Select>
    </div>
  );
}

export function SeoContentFields({ value, onChange, disabled }) {
  const seoContent = { ...empty(), ...(value || {}), sectionOverrides: { faq: null, relatedEntities: null, relatedArticles: null, ...(value?.sectionOverrides || {}) } };
  const patch = (partial) => onChange({ ...seoContent, ...partial });
  const patchOverride = (key, v) => patch({ sectionOverrides: { ...seoContent.sectionOverrides, [key]: v } });

  return (
    <div className="space-y-5">
      <div>
        <Label>H1 (عنوان اصلی صفحه فرود)</Label>
        <Input
          value={seoContent.h1}
          onChange={(e) => patch({ h1: e.target.value })}
          placeholder="در صورت خالی بودن، از نام استفاده می‌شود"
          disabled={disabled}
        />
      </div>

      <div>
        <Label>توضیح کوتاه (زیر H1)</Label>
        <textarea
          value={seoContent.shortDescription}
          onChange={(e) => patch({ shortDescription: e.target.value })}
          rows={2}
          disabled={disabled}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm outline-none focus:border-[var(--brand-500)]"
        />
      </div>

      <div>
        <Label>محتوای کامل سئو</Label>
        <RichTextEditor
          value={seoContent.content}
          onChange={({ json, html }) => patch({ content: json, contentHtml: html })}
          disabled={disabled}
        />
      </div>

      <div>
        <Label>سوالات متداول</Label>
        <FaqEditor faqs={seoContent.faqs} onChange={(faqs) => patch({ faqs })} disabled={disabled} />
        <OverrideSelect label="نمایش این بخش" value={seoContent.sectionOverrides.faq} onChange={(v) => patchOverride("faq", v)} />
      </div>

      <div>
        <Label>موارد مرتبط (دسته‌بندی، برند، برچسب، نوع محصول)</Label>
        <RelatedEntitiesEditor items={seoContent.relatedEntities} onChange={(relatedEntities) => patch({ relatedEntities })} />
        <OverrideSelect
          label="نمایش این بخش"
          value={seoContent.sectionOverrides.relatedEntities}
          onChange={(v) => patchOverride("relatedEntities", v)}
        />
      </div>
    </div>
  );
}
