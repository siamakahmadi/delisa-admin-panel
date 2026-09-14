"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PickerField } from "@/components/page-builder/fields/picker-field";
import { PairListEditor } from "@/components/beauty/fields/PairListEditor";
import { ImageField } from "@/components/beauty/fields/ImageField";
import { SeoStatusTab } from "@/components/beauty/fields/SeoStatusTab";
import { useToast } from "@/components/ui/toast";
import { asciiSlugify, isValidBeautySlug } from "@/lib/beauty/slug";
import { skinConcernsApi } from "@/lib/beauty/api";

function idsOf(list) {
  return (list || []).map((t) => (typeof t === "string" ? t : t?._id)).filter(Boolean);
}

export default function SkinConcernForm({ editing }) {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(editing?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!editing);
  const [title, setTitle] = useState(editing?.title || "");
  const [shortDescription, setShortDescription] = useState(editing?.shortDescription || "");
  const [heroImage, setHeroImage] = useState(editing?.heroImage || "");
  const [whatIsIt, setWhatIsIt] = useState({ html: editing?.whatIsItHtml || "" });
  const [whyItHappens, setWhyItHappens] = useState({ html: editing?.whyItHappensHtml || "" });

  const [commonFactors, setCommonFactors] = useState((editing?.commonFactors || []).map((i) => ({ a: i.title, b: i.description })));
  const [goodIngredients, setGoodIngredients] = useState((editing?.goodIngredients || []).map((i) => ({ a: i.name, b: i.description })));
  const [avoidIngredients, setAvoidIngredients] = useState((editing?.avoidIngredients || []).map((i) => ({ a: i.name, b: i.description })));
  const [routineSteps, setRoutineSteps] = useState((editing?.routineSteps || []).map((i) => ({ a: i.title, b: i.description })));

  const [relatedSkinTypes, setRelatedSkinTypes] = useState(idsOf(editing?.relatedSkinTypes));
  const [relatedIngredients, setRelatedIngredients] = useState(idsOf(editing?.relatedIngredients));
  const [relatedConcerns, setRelatedConcerns] = useState(idsOf(editing?.relatedConcerns));

  const [relatedProductTags, setRelatedProductTags] = useState(idsOf(editing?.relatedProductTags));
  const [relatedProductsLimit, setRelatedProductsLimit] = useState(editing?.relatedProductsLimit ?? 8);
  const [relatedBlogTags, setRelatedBlogTags] = useState(idsOf(editing?.relatedBlogTags));
  const [relatedBlogCategories, setRelatedBlogCategories] = useState(idsOf(editing?.relatedBlogCategories));
  const [relatedArticlesLimit, setRelatedArticlesLimit] = useState(editing?.relatedArticlesLimit ?? 4);

  const [commonMistakes, setCommonMistakes] = useState((editing?.commonMistakes || []).map((i) => ({ a: i.title, b: i.description })));
  const [faq, setFaq] = useState((editing?.faq || []).map((i) => ({ a: i.question, b: i.answer })));
  const [showUserExperiences, setShowUserExperiences] = useState(editing?.showUserExperiences ?? true);

  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [status, setStatus] = useState(editing?.status || "draft");
  const [metaTitle, setMetaTitle] = useState(editing?.seo?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(editing?.seo?.metaDescription || "");
  const [canonical, setCanonical] = useState(editing?.seo?.canonical || "");
  const [ogImage, setOgImage] = useState(editing?.seo?.ogImage || "");
  const [robots, setRobots] = useState(editing?.seo?.robots || "index,follow");

  const handleTitleChange = (v) => {
    setTitle(v);
    if (!slugTouched) setSlug(asciiSlugify(v));
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        slug,
        title,
        shortDescription,
        heroImage,
        whatIsItHtml: whatIsIt.html,
        whyItHappensHtml: whyItHappens.html,
        commonFactors: commonFactors.filter((i) => i.a.trim()).map((i) => ({ title: i.a, description: i.b })),
        goodIngredients: goodIngredients.filter((i) => i.a.trim()).map((i) => ({ name: i.a, description: i.b })),
        avoidIngredients: avoidIngredients.filter((i) => i.a.trim()).map((i) => ({ name: i.a, description: i.b })),
        routineSteps: routineSteps.filter((i) => i.a.trim()).map((i) => ({ title: i.a, description: i.b })),
        relatedSkinTypes,
        relatedIngredients,
        relatedConcerns,
        relatedProductTags,
        relatedProductsLimit: Number(relatedProductsLimit) || 8,
        relatedBlogTags,
        relatedBlogCategories,
        relatedArticlesLimit: Number(relatedArticlesLimit) || 4,
        commonMistakes: commonMistakes.filter((i) => i.a.trim()).map((i) => ({ title: i.a, description: i.b })),
        faq: faq.filter((i) => i.a.trim() && i.b.trim()).map((i) => ({ question: i.a, answer: i.b })),
        showUserExperiences,
        isActive,
        status,
        seo: { metaTitle, metaDescription, canonical, ogImage, robots },
      };
      return editing ? skinConcernsApi.update(editing._id, payload) : skinConcernsApi.create(payload);
    },
    onSuccess: (item) => {
      toast.success(editing ? "ذخیره شد" : "دغدغه پوستی ساخته شد");
      queryClient.invalidateQueries({ queryKey: ["skin-concerns"] });
      if (!editing && item?._id) router.replace(`/beauty/skin-concerns/${item._id}`);
    },
    onError: (err) => toast.error(err?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  const handleSubmit = () => {
    if (!slug.trim()) return toast.error("اسلاگ الزامی است");
    if (!isValidBeautySlug(slug)) return toast.error("اسلاگ نامعتبر است (فقط حروف انگلیسی کوچک، عدد و خط تیره)");
    if (!title.trim()) return toast.error("عنوان الزامی است");
    saveMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">محتوا</TabsTrigger>
              <TabsTrigger value="routine">ترکیبات و روتین</TabsTrigger>
              <TabsTrigger value="related">ارتباطات و محصولات</TabsTrigger>
              <TabsTrigger value="faq">اشتباهات و سوالات</TabsTrigger>
              <TabsTrigger value="seo">سئو و انتشار</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>عنوان</Label>
                  <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="مثلاً: آکنه و جوش صورت" autoFocus />
                </div>
                <div>
                  <Label>اسلاگ (آدرس، انگلیسی)</Label>
                  <Input dir="ltr" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(asciiSlugify(e.target.value)); }} placeholder="acne" />
                  {slug && !isValidBeautySlug(slug) ? (
                    <p className="mt-1 text-xs text-[var(--danger)]">فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است</p>
                  ) : (
                    <p className="mt-1 text-xs text-[var(--text-faint)]">delisa.shop/beauty/skin-concerns/{slug || "..."}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>توضیح کوتاه</Label>
                <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
              </div>

              <div>
                <Label>تصویر شاخص</Label>
                <ImageField value={heroImage} onChange={setHeroImage} />
              </div>

              <div>
                <Label>این مشکل چیست؟</Label>
                <RichTextEditor value={whatIsIt.html} onChange={setWhatIsIt} />
              </div>

              <div>
                <Label>چرا ایجاد می‌شود؟</Label>
                <RichTextEditor value={whyItHappens.html} onChange={setWhyItHappens} />
              </div>

              <div>
                <Label>عوامل مرتبط (Related Factors)</Label>
                <PairListEditor items={commonFactors} onChange={setCommonFactors} addLabel="افزودن عامل" fieldALabel="عنوان" fieldBLabel="توضیح" fieldBMultiline />
              </div>
            </TabsContent>

            <TabsContent value="routine" className="space-y-5 pt-4">
              <div>
                <Label>ترکیبات مناسب (متن درون‌صفحه‌ای)</Label>
                <PairListEditor items={goodIngredients} onChange={setGoodIngredients} addLabel="افزودن ترکیب" fieldALabel="نام ترکیب" fieldBLabel="توضیح" fieldBMultiline />
              </div>
              <div>
                <Label>ترکیبات نامناسب (متن درون‌صفحه‌ای)</Label>
                <PairListEditor items={avoidIngredients} onChange={setAvoidIngredients} addLabel="افزودن ترکیب" fieldALabel="نام ترکیب" fieldBLabel="توضیح" fieldBMultiline />
              </div>
              <div>
                <Label>مراحل روتین پیشنهادی</Label>
                <PairListEditor items={routineSteps} onChange={setRoutineSteps} addLabel="افزودن مرحله" fieldALabel="عنوان مرحله" fieldBLabel="توضیح" fieldBMultiline />
              </div>
            </TabsContent>

            <TabsContent value="related" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>انواع پوست مرتبط</Label>
                  <PickerField kind="skinType" value={relatedSkinTypes} onChange={setRelatedSkinTypes} />
                </div>
                <div>
                  <Label>ترکیبات مرتبط (لینک به صفحه کامل)</Label>
                  <PickerField kind="ingredient" value={relatedIngredients} onChange={setRelatedIngredients} />
                </div>
              </div>
              <div>
                <Label>دغدغه‌های مشابه</Label>
                <PickerField kind="skinConcern" value={relatedConcerns} onChange={setRelatedConcerns} />
              </div>

              <div>
                <Label>تگ‌های محصول برای «محصولات پیشنهادی»</Label>
                <PickerField kind="tagId" value={relatedProductTags} onChange={setRelatedProductTags} />
              </div>
              <div className="max-w-[200px]">
                <Label>حداکثر تعداد محصول</Label>
                <Input type="number" min={1} max={24} value={relatedProductsLimit} onChange={(e) => setRelatedProductsLimit(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>تگ‌های بلاگ مرتبط</Label>
                  <PickerField kind="blogTagId" value={relatedBlogTags} onChange={setRelatedBlogTags} />
                </div>
                <div>
                  <Label>دسته‌بندی‌های بلاگ مرتبط</Label>
                  <PickerField kind="blogCategoryId" value={relatedBlogCategories} onChange={setRelatedBlogCategories} />
                </div>
              </div>
              <div className="max-w-[200px]">
                <Label>حداکثر تعداد مقاله</Label>
                <Input type="number" min={1} max={12} value={relatedArticlesLimit} onChange={(e) => setRelatedArticlesLimit(e.target.value)} />
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                <input type="checkbox" checked={showUserExperiences} onChange={(e) => setShowUserExperiences(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
                نمایش «تجربه کاربران» (از نظرات واقعی محصولات مرتبط)
              </label>
            </TabsContent>

            <TabsContent value="faq" className="space-y-5 pt-4">
              <div>
                <Label>اشتباهات رایج</Label>
                <PairListEditor items={commonMistakes} onChange={setCommonMistakes} addLabel="افزودن مورد" fieldALabel="عنوان" fieldBLabel="توضیح" fieldBMultiline />
              </div>
              <div>
                <Label>سوالات متداول</Label>
                <PairListEditor items={faq} onChange={setFaq} addLabel="افزودن سوال" fieldALabel="سوال" fieldBLabel="پاسخ" fieldBMultiline />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="pt-4">
              <SeoStatusTab
                isActive={isActive} setIsActive={setIsActive}
                status={status} setStatus={setStatus}
                metaTitle={metaTitle} setMetaTitle={setMetaTitle} titlePlaceholder={title}
                metaDescription={metaDescription} setMetaDescription={setMetaDescription} descriptionPlaceholder={shortDescription}
                canonical={canonical} setCanonical={setCanonical}
                robots={robots} setRobots={setRobots}
                ogImage={ogImage} setOgImage={setOgImage}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/beauty/skin-concerns")}>انصراف</Button>
        <Button loading={saveMutation.isPending} onClick={handleSubmit}>
          <Save size={16} />
          {editing ? "ذخیره تغییرات" : "ایجاد"}
        </Button>
      </div>
    </div>
  );
}
