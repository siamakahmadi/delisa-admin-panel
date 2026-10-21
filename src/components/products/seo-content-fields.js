"use client";

import { useState } from "react";
import { Sparkles, Check, X } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FieldAi } from "@/components/ai/field-ai";
import { suggestArchiveWithAi } from "@/lib/seo/api";
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

/**
 * aiContext (اختیاری): {entityType, name, parent, brands, count} — با آن دکمه‌های
 * هوش مصنوعی برای H1، توضیح کوتاه، محتوای کامل و FAQ فعال می‌شوند.
 */
export function SeoContentFields({ value, onChange, disabled, aiContext }) {
  const toast = useToast();
  const [suggestion, setSuggestion] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const ai = aiContext?.name ? aiContext : null;
  const generate = async () => {
    setBusy(true);
    try {
      setSuggestion(await suggestArchiveWithAi({ ...ai, existingDescription: value?.shortDescription || ai.description || "" }));
    } catch (e) {
      toast.error("خطا", e?.response?.data?.message || "تولید محتوا ناموفق بود");
    } finally {
      setBusy(false);
    }
  };
  const seoContent = { ...empty(), ...(value || {}), sectionOverrides: { faq: null, relatedEntities: null, relatedArticles: null, ...(value?.sectionOverrides || {}) } };
  const patch = (partial) => onChange({ ...seoContent, ...partial });
  const patchOverride = (key, v) => patch({ sectionOverrides: { ...seoContent.sectionOverrides, [key]: v } });

  const fieldCtx = ai ? { entityType: ai.entityType, title: ai.name, category: ai.parent || "", keyword: ai.name } : undefined;
  const applySuggestion = () => {
    const sg = suggestion;
    patch({
      shortDescription: sg.shortDescription || seoContent.shortDescription,
      ...(sg.contentHtml ? { contentHtml: sg.contentHtml, content: sg.contentHtml } : {}),
      faqs: sg.faqs?.length ? [...seoContent.faqs.filter((f) => f.question), ...sg.faqs] : seoContent.faqs,
    });
    setSuggestion(null);
    setEditorKey((k) => k + 1);
    toast.success("محتوا اعمال شد — فراموش نکنید ذخیره کنید");
  };

  return (
    <div className="space-y-5">
      {ai && (
        <div>
          {!suggestion ? (
            <Button variant="outline" size="sm" onClick={generate} loading={busy} disabled={disabled} className="w-full">
              <Sparkles size={14} className="text-[var(--brand-500)]" />
              تولید توضیح کوتاه، محتوای سئو و سوالات متداول با هوش مصنوعی
            </Button>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-[var(--brand-100)] bg-[var(--brand-50)] p-3 text-xs">
              <p className="mb-2 flex items-center gap-1.5 font-semibold text-[var(--brand-700)]">
                <Sparkles size={13} />
                پیش‌نمایش پیشنهاد هوش مصنوعی (قبل از اعمال بازبینی کنید)
              </p>
              <p className="mb-2"><span className="text-[var(--text-faint)]">توضیح کوتاه: </span>{suggestion.shortDescription}</p>
              <div className="rte-content mb-2 max-h-48 overflow-auto rounded bg-[var(--surface)] p-2" dangerouslySetInnerHTML={{ __html: suggestion.contentHtml }} />
              {suggestion.faqs?.map((f, i) => (
                <p key={i} className="mb-1"><b>{f.question}</b> — {f.answer}</p>
              ))}
              <p className="mt-2 text-[11px] text-[var(--text-faint)]">محتوای فعلی جایگزین می‌شود؛ سوالات تازه به FAQهای فعلی اضافه می‌شوند.</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={applySuggestion}><Check size={13} />اعمال</Button>
                <Button size="sm" variant="ghost" onClick={generate} loading={busy}>پیشنهاد دیگر</Button>
                <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)}><X size={13} /></Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <Label>H1 (عنوان اصلی صفحه فرود)</Label>
          {ai && <FieldAi tasks={["seo-title", "rewrite", "custom"]} label="پیشنهاد" value={seoContent.h1} source={seoContent.shortDescription || ai.name} context={fieldCtx} onChange={(v) => patch({ h1: v.trim() })} />}
        </div>
        <Input
          value={seoContent.h1}
          onChange={(e) => patch({ h1: e.target.value })}
          placeholder="در صورت خالی بودن، از نام استفاده می‌شود"
          disabled={disabled}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>توضیح کوتاه (زیر H1)</Label>
          {ai && <FieldAi tasks={["rewrite", "expand", "shorten", "proofread", "custom"]} label="بهبود با AI" value={seoContent.shortDescription} source={seoContent.shortDescription || ai.name} context={fieldCtx} onChange={(v) => patch({ shortDescription: v })} />}
        </div>
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
          key={editorKey}
          value={seoContent.content}
          onChange={({ json, html }) => patch({ content: json, contentHtml: html })}
          disabled={disabled}
          aiContext={fieldCtx}
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
