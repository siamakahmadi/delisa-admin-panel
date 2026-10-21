"use client";

import { Input, Label } from "@/components/ui/input";
import { FieldAi } from "@/components/ai/field-ai";
import { LiveSeoAnalysis } from "@/components/seo/live-seo-analysis";
import { SeoContentFields } from "@/components/products/seo-content-fields";

const PATH_PREFIX = { brand: "/brand/", productType: "/product-type/", tag: "/tag/" };

/**
 * بخش سئوی مشترک برند / نوع محصول / برچسب: عنوان و متا با AI، محتوای سئو با AI و
 * تحلیل زنده‌ی سئو. form باید {seoTitle, seoDescription, seoContent, description, isActive} داشته باشد.
 */
export function TaxonomySeoPanel({ entityType, entityId, name, slug, image, form, setForm }) {
  const aiContext = { entityType, title: name, keyword: name };
  const source = form.seoContent.contentHtml || form.description || name;

  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <Label>عنوان سئو</Label>
          <FieldAi tasks={["seo-title"]} label="پیشنهاد" value={form.seoTitle} source={source} context={aiContext} onChange={(v) => setForm((f) => ({ ...f, seoTitle: v }))} />
        </div>
        <Input value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label>توضیحات متا</Label>
          <FieldAi tasks={["meta-description"]} label="پیشنهاد" value={form.seoDescription} source={source} context={aiContext} onChange={(v) => setForm((f) => ({ ...f, seoDescription: v }))} />
        </div>
        <Input value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} />
      </div>
      <div className="border-t border-[var(--border)] pt-4">
        <SeoContentFields
          value={form.seoContent}
          aiContext={{ entityType, name, description: form.description }}
          onChange={(seoContent) => setForm((f) => ({ ...f, seoContent }))}
        />
      </div>
      <LiveSeoAnalysis
        entityType={entityType}
        entityId={entityId}
        aiContext={{ entityType }}
        onApplySuggestion={(sg) => {
          if (sg.seoTitle) setForm((f) => ({ ...f, seoTitle: sg.seoTitle }));
          if (sg.metaDescription) setForm((f) => ({ ...f, seoDescription: sg.metaDescription }));
        }}
        payload={{
          entityType,
          entityId: entityId || null,
          title: name,
          label: name,
          seoTitle: form.seoTitle,
          metaDescription: form.seoDescription,
          h1: form.seoContent.h1 || name,
          slug: slug || "",
          path: `${PATH_PREFIX[entityType] || "/"}${encodeURIComponent(slug || "")}`,
          contentHtml: form.seoContent.contentHtml || form.description || "",
          images: image ? [{ url: image, alt: name }] : [],
          published: form.isActive !== false,
          taxonomy: {
            h1: form.seoContent.h1 || "",
            shortDescription: form.seoContent.shortDescription || "",
            faqs: (form.seoContent.faqs || []).filter((f) => f.question).length,
          },
        }}
      />
    </>
  );
}
