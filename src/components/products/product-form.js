"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ImagePlus, X, Save, FileText, Plus } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { slugify } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { useToast } from "@/components/ui/toast";
import { useCategories, useBrands, useProductTypes } from "@/hooks/use-taxonomies";
import { CategoryTreeSelect } from "./category-tree-select";
import { FeaturesEditor } from "./features-editor";
import { AttributesEditor } from "./attributes-editor";
import { FaqEditor } from "./faq-editor";
import { QuickAddDialog } from "./quick-add-dialog";

const MAX_IMAGES = 6;

function normalizeNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(String(value).replace(/[,٬]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

function Section({ title, children, action }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function ProductForm({ product }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = Boolean(product);

  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: productTypes } = useProductTypes();

  const [productName, setProductName] = useState(product?.productName ?? "");
  const [productNameEn, setProductNameEn] = useState(product?.productNameEn ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [usageInstructions, setUsageInstructions] = useState(product?.usageInstructions ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEn, setSlugEn] = useState(product?.slugEn ?? "");
  const slugTouchedRef = useRef(Boolean(product?.slug));

  // Auto-generate the (Persian) slug from the product name as the admin
  // types — same "generate until manually edited" pattern used for the
  // blog/menu slugs elsewhere in this panel — until they explicitly edit
  // the slug field themselves, after which their edits are never overwritten.
  useEffect(() => {
    if (!slugTouchedRef.current) setSlug(slugify(productName));
  }, [productName]);

  const [basePriceMin, setBasePriceMin] = useState(product?.basePriceMin ?? "");
  const [basePriceMax, setBasePriceMax] = useState(product?.basePriceMax ?? "");
  const [finalPrice, setFinalPrice] = useState(product?.finalPrice ?? "");
  const [discountPrice, setDiscountPrice] = useState(product?.discountPrice ?? "");

  const [selectedCategories, setSelectedCategories] = useState(
    (product?.categories ?? []).map((c) => c._id ?? c)
  );
  const [brand, setBrand] = useState(product?.brand?._id ?? product?.brand ?? "");
  const [productType, setProductType] = useState(product?.productType?._id ?? product?.productType ?? "");
  const [tags, setTags] = useState((product?.tags ?? []).map((t) => t.title || t.name || t));

  const [features, setFeatures] = useState(product?.features?.length ? product.features : [{ title: "", value: "" }]);
  const [attributes, setAttributes] = useState(
    product?.attributes?.length ? product.attributes : [{ name: "", values: [{ title: "", value: "" }] }]
  );
  const [faqs, setFaqs] = useState(
    product?.faqs?.length ? product.faqs.map((f) => ({ question: f.q ?? f.question ?? "", answer: f.a ?? f.answer ?? "" })) : [{ question: "", answer: "" }]
  );

  const [seoTitle, setSeoTitle] = useState(product?.seo?.seoTitle ?? "");
  const [seoSlug, setSeoSlug] = useState(product?.seo?.seoSlug ?? "");
  const [seoDescription, setSeoDescription] = useState(product?.seo?.seoDescription ?? "");
  const [seoKeywords, setSeoKeywords] = useState(product?.seo?.seoKeywords ?? []);

  const [expiryDate, setExpiryDate] = useState(product?.expiryDate ? product.expiryDate.slice(0, 10) : "");
  const [licenseNumber, setLicenseNumber] = useState(product?.licenseNumber ?? "");
  const [countryOfOrigin, setCountryOfOrigin] = useState(product?.countryOfOrigin ?? "");
  const [storageCondition, setStorageCondition] = useState(product?.storageCondition ?? "");
  const [badges, setBadges] = useState(product?.badges ?? []);
  const [campaignTags, setCampaignTags] = useState(product?.campaignTags ?? []);
  const [bundleSupport, setBundleSupport] = useState(product?.bundleSupport ?? false);
  const [weightGrams, setWeightGrams] = useState(product?.dimensions?.weightGrams ?? "");
  const [heightCm, setHeightCm] = useState(product?.dimensions?.heightCm ?? "");
  const [widthCm, setWidthCm] = useState(product?.dimensions?.widthCm ?? "");
  const [depthCm, setDepthCm] = useState(product?.dimensions?.depthCm ?? "");

  const [isPublished, setIsPublished] = useState(product?.isPublished ?? false);

  const [existingImages, setExistingImages] = useState(product?.productImages ?? []);
  const [removedImageUrls, setRemovedImageUrls] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const [quickAddType, setQuickAddType] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const removeExistingImage = (url) => {
    setExistingImages((prev) => prev.filter((img) => img.url !== url));
    setRemovedImageUrls((prev) => [...prev, url]);
  };

  const updateExistingImageAlt = (url, alt) => {
    setExistingImages((prev) => prev.map((img) => (img.url === url ? { ...img, alt } : img)));
  };

  const updateNewImageAlt = (index, alt) => {
    setNewImages((prev) => prev.map((img, i) => (i === index ? { ...img, alt } : img)));
  };

  const appendFiles = (files) => {
    const slots = MAX_IMAGES - existingImages.length - newImages.length;
    const allowed = Array.from(files || [])
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, slots));
    if (!allowed.length) return;
    setNewImages((prev) => [
      ...prev,
      ...allowed.map((file) => ({ file, previewUrl: URL.createObjectURL(file), alt: "" })),
    ]);
  };

  const buildFormData = (publish) => {
    const fd = new FormData();
    fd.append("productName", productName.trim());
    fd.append("productNameEn", productNameEn.trim());
    fd.append("description", description.trim());
    fd.append("usageInstructions", usageInstructions.trim());
    if (slug.trim()) fd.append("slug", slug.trim());
    if (slugEn.trim()) fd.append("slugEn", slugEn.trim());

    fd.append("basePriceMin", String(normalizeNumber(basePriceMin)));
    fd.append("basePriceMax", String(normalizeNumber(basePriceMax)));
    fd.append("finalPrice", String(normalizeNumber(finalPrice)));
    if (discountPrice !== "" && discountPrice !== null) {
      fd.append("discountPrice", String(normalizeNumber(discountPrice)));
    }

    fd.append("categories", JSON.stringify(selectedCategories));
    if (brand) fd.append("brand", brand);
    if (productType) fd.append("productType", productType);
    fd.append("tags", JSON.stringify(tags));

    const filteredFeatures = features.filter((f) => f.title.trim() && f.value.trim());
    fd.append("features", JSON.stringify(filteredFeatures));

    const filteredAttributes = attributes
      .map((a) => ({ name: a.name.trim(), values: a.values.filter((v) => v.title.trim() && v.value.trim()) }))
      .filter((a) => a.name && a.values.length);
    fd.append("attributes", JSON.stringify(filteredAttributes));

    const filteredFaqs = faqs
      .filter((f) => f.question.trim() && f.answer.trim())
      .map((f) => ({ q: f.question.trim(), a: f.answer.trim() }));
    fd.append("faqs", JSON.stringify(filteredFaqs));

    fd.append(
      "seo",
      JSON.stringify({
        seoTitle: seoTitle.trim(),
        seoSlug: seoSlug.trim(),
        seoDescription: seoDescription.trim(),
        seoKeywords,
      })
    );

    if (expiryDate) fd.append("expiryDate", expiryDate);
    fd.append("licenseNumber", licenseNumber.trim());
    fd.append("countryOfOrigin", countryOfOrigin.trim());
    fd.append("storageCondition", storageCondition.trim());
    fd.append("badges", JSON.stringify(badges));
    fd.append("campaignTags", JSON.stringify(campaignTags));
    fd.append("bundleSupport", bundleSupport ? "true" : "false");
    fd.append(
      "dimensions",
      JSON.stringify({
        weightGrams: normalizeNumber(weightGrams),
        heightCm: normalizeNumber(heightCm),
        widthCm: normalizeNumber(widthCm),
        depthCm: normalizeNumber(depthCm),
      })
    );

    fd.append("isSuggested", "false");
    fd.append("isPublished", publish ? "true" : "false");

    newImages.forEach((img) => fd.append("images", img.file));
    fd.append(
      "imageMeta",
      JSON.stringify(newImages.map((img, i) => ({ fileIndex: i, alt: img.alt || "", position: existingImages.length + i })))
    );

    if (isEdit && removedImageUrls.length) {
      fd.append("removeImages", JSON.stringify(removedImageUrls));
    }

    if (isEdit && existingImages.length) {
      const imageUpdates = Object.fromEntries(existingImages.map((img) => [img.url, { alt: img.alt || "" }]));
      fd.append("imageUpdates", JSON.stringify(imageUpdates));
    }

    return fd;
  };

  const mutation = useMutation({
    mutationFn: (publish) => {
      const fd = buildFormData(publish);
      return isEdit ? apiClient.put(`/api/products/${product._id}`, fd) : apiClient.post("/api/products/add", fd);
    },
    onSuccess: () => {
      toast.success(isEdit ? "محصول بروزرسانی شد" : "محصول ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/products");
    },
    onError: (err) => {
      setErrorMsg(err?.response?.data?.message || "عملیات ناموفق بود");
      toast.error("خطا", err?.response?.data?.message || "عملیات ناموفق بود");
    },
  });

  const handleSubmit = (publish) => {
    setErrorMsg("");
    if (!productName.trim() || !description.trim()) {
      setErrorMsg("نام محصول و توضیحات الزامی است.");
      return;
    }
    const min = normalizeNumber(basePriceMin);
    const max = normalizeNumber(basePriceMax);
    const fin = normalizeNumber(finalPrice);
    if (![min, max, fin].every(Number.isFinite)) {
      setErrorMsg("قیمت پایه، سقف قیمت و قیمت نهایی الزامی و باید عددی باشند.");
      return;
    }
    if (min > max) {
      setErrorMsg("کف قیمت نباید از سقف قیمت بیشتر باشد.");
      return;
    }
    mutation.mutate(publish);
  };

  const brandOptions = (brands ?? []).map((b) => ({ value: b._id, label: b.name }));
  const productTypeOptions = (productTypes ?? []).map((t) => ({ value: t._id, label: t.name }));

  return (
    <div>
      {errorMsg && (
        <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger)]">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="اطلاعات اصلی">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>نام محصول</Label>
                <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="مثال: کرم آبرسان پوست خشک" />
              </div>
              <div>
                <Label>نام انگلیسی محصول</Label>
                <Input dir="ltr" value={productNameEn} onChange={(e) => setProductNameEn(e.target.value)} placeholder="Hydrating Cream" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>اسلاگ فارسی</Label>
                <Input
                  dir="rtl"
                  value={slug}
                  onChange={(e) => {
                    slugTouchedRef.current = true;
                    setSlug(e.target.value);
                  }}
                  placeholder="کرم-آبرسان-پوست-خشک"
                />
              </div>
              <div>
                <Label>اسلاگ انگلیسی (اختیاری)</Label>
                <Input dir="ltr" value={slugEn} onChange={(e) => setSlugEn(e.target.value)} placeholder="hydrating-cream" />
              </div>
            </div>
            <div>
              <Label>توضیحات محصول</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="توضیح کامل محصول..."
                className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
              />
            </div>
            <div>
              <Label>نحوه مصرف</Label>
              <textarea
                value={usageInstructions}
                onChange={(e) => setUsageInstructions(e.target.value)}
                rows={3}
                placeholder="روش استفاده از محصول..."
                className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
              />
            </div>
          </Section>

          <Section title="گالری محصول" action={<span className="text-xs text-[var(--text-faint)]">{existingImages.length + newImages.length} / {MAX_IMAGES} تصویر</span>}>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] py-8 text-[var(--text-faint)] hover:border-[var(--brand-500)] hover:text-[var(--brand-500)]">
              <ImagePlus size={22} />
              <span className="text-sm">تصویر را بکشید اینجا یا کلیک کنید</span>
              <span className="text-[11px]">JPG / PNG / WEBP - حداکثر {MAX_IMAGES} عدد</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => appendFiles(e.target.files)} />
            </label>

            {(existingImages.length > 0 || newImages.length > 0) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {existingImages.map((img) => (
                  <div key={img.url} className="flex gap-2.5 rounded-[var(--radius-md)] border border-[var(--border)] p-2">
                    <div className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.url)}
                        className="absolute left-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X size={11} />
                      </button>
                    </div>
                    <Input
                      value={img.alt || ""}
                      onChange={(e) => updateExistingImageAlt(img.url, e.target.value)}
                      placeholder="متن جایگزین (Alt) تصویر"
                      className="self-center text-xs"
                    />
                  </div>
                ))}
                {newImages.map((img, i) => (
                  <div key={i} className="flex gap-2.5 rounded-[var(--radius-md)] border border-[var(--border)] p-2">
                    <div className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewImages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute left-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X size={11} />
                      </button>
                    </div>
                    <Input
                      value={img.alt || ""}
                      onChange={(e) => updateNewImageAlt(i, e.target.value)}
                      placeholder="متن جایگزین (Alt) تصویر"
                      className="self-center text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="قیمت‌گذاری">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <Label>کف قیمت</Label>
                <Input type="number" value={basePriceMin} onChange={(e) => setBasePriceMin(e.target.value)} />
              </div>
              <div>
                <Label>سقف قیمت</Label>
                <Input type="number" value={basePriceMax} onChange={(e) => setBasePriceMax(e.target.value)} />
              </div>
              <div>
                <Label>قیمت نهایی فروش</Label>
                <Input type="number" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} />
              </div>
              <div>
                <Label>قبل از تخفیف (اختیاری)</Label>
                <Input type="number" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} />
              </div>
            </div>
          </Section>

          <Section title="ویژگی‌های کوتاه">
            <FeaturesEditor features={features} onChange={setFeatures} disabled={mutation.isPending} />
          </Section>

          <Section title="ویژگی‌های ساختارمند">
            <AttributesEditor attributes={attributes} onChange={setAttributes} disabled={mutation.isPending} />
          </Section>

          <Section title="سوالات متداول (FAQ)">
            <FaqEditor faqs={faqs} onChange={setFaqs} disabled={mutation.isPending} />
          </Section>

          <Section title="تنظیمات سئو">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>عنوان سئو</Label>
                <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </div>
              <div>
                <Label>اسلاگ سئو</Label>
                <Input value={seoSlug} onChange={(e) => setSeoSlug(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>توضیحات متا</Label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={2}
                className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
              />
            </div>
            <div>
              <Label>کلمات کلیدی</Label>
              <TagInput value={seoKeywords} onChange={setSeoKeywords} placeholder="کلمه را تایپ و اینتر بزنید" />
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <Section
            title="سازماندهی"
            action={
              <Button variant="ghost" size="sm" onClick={() => setQuickAddType("category")}>
                <Plus size={13} />
                دسته جدید
              </Button>
            }
          >
            <Label>دسته‌بندی‌های محصول</Label>
            <CategoryTreeSelect
              categories={categories ?? []}
              value={selectedCategories}
              onChange={setSelectedCategories}
              disabled={mutation.isPending}
            />

            <div className="border-t border-[var(--border)] pt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="!mb-0">برند</Label>
                <button type="button" onClick={() => setQuickAddType("brand")} className="text-xs text-[var(--brand-600)]">
                  + افزودن
                </button>
              </div>
              <SearchableSelect options={brandOptions} value={brand} onChange={setBrand} placeholder="انتخاب برند" />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="!mb-0">نوع محصول</Label>
                <button type="button" onClick={() => setQuickAddType("productType")} className="text-xs text-[var(--brand-600)]">
                  + افزودن
                </button>
              </div>
              <SearchableSelect options={productTypeOptions} value={productType} onChange={setProductType} placeholder="انتخاب نوع" />
            </div>
          </Section>

          <Section title="برچسب‌ها">
            <TagInput value={tags} onChange={setTags} placeholder="برچسب جدید..." />
          </Section>

          <Section title="نشان‌ها و کمپین">
            <div>
              <Label>نشان‌ها (Badges)</Label>
              <TagInput value={badges} onChange={setBadges} placeholder="مثلاً پرفروش..." />
            </div>
            <div>
              <Label>برچسب کمپین</Label>
              <TagInput value={campaignTags} onChange={setCampaignTags} placeholder="مثلاً یلدا..." />
            </div>
          </Section>

          <Section title="اطلاعات تکمیلی">
            <div>
              <Label>تاریخ انقضا</Label>
              <JalaliDatePicker value={expiryDate} onChange={setExpiryDate} />
            </div>
            <div>
              <Label>شماره پروانه</Label>
              <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
            </div>
            <div>
              <Label>کشور سازنده</Label>
              <Input value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} />
            </div>
            <div>
              <Label>شرایط نگهداری</Label>
              <Input value={storageCondition} onChange={(e) => setStorageCondition(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>وزن (گرم)</Label>
                <Input type="number" value={weightGrams} onChange={(e) => setWeightGrams(e.target.value)} />
              </div>
              <div>
                <Label>ارتفاع (سانتی‌متر)</Label>
                <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
              </div>
              <div>
                <Label>عرض (سانتی‌متر)</Label>
                <Input type="number" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} />
              </div>
              <div>
                <Label>عمق (سانتی‌متر)</Label>
                <Input type="number" value={depthCm} onChange={(e) => setDepthCm(e.target.value)} />
              </div>
            </div>
            <label className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3 text-sm">
              <span>امکان فروش باندل</span>
              <input type="checkbox" checked={bundleSupport} onChange={(e) => setBundleSupport(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
            </label>
          </Section>

          <Section title="انتشار">
            {isEdit ? (
              <>
                <label className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3 text-sm">
                  <span>نمایش در فروشگاه</span>
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 accent-[var(--brand-600)]"
                  />
                </label>
                <Button className="w-full" loading={mutation.isPending} onClick={() => handleSubmit(isPublished)}>
                  <Save size={16} />
                  ذخیره تغییرات
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Button className="w-full" loading={mutation.isPending} onClick={() => handleSubmit(true)}>
                  <Save size={16} />
                  ایجاد و انتشار
                </Button>
                <Button variant="outline" className="w-full" disabled={mutation.isPending} onClick={() => handleSubmit(false)}>
                  <FileText size={16} />
                  ذخیره به‌عنوان پیش‌نویس
                </Button>
              </div>
            )}
          </Section>
        </div>
      </div>

      <QuickAddDialog
        key={quickAddType ?? "closed"}
        type={quickAddType}
        open={!!quickAddType}
        onOpenChange={(open) => !open && setQuickAddType(null)}
        categories={categories ?? []}
        onCreated={(created) => {
          if (!created?._id) return;
          if (quickAddType === "category") setSelectedCategories((prev) => [...prev, created._id]);
          if (quickAddType === "brand") setBrand(created._id);
          if (quickAddType === "productType") setProductType(created._id);
        }}
      />
    </div>
  );
}
