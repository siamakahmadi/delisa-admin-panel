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
import { skinTypesApi } from "@/lib/beauty/api";

// All relationship fields here (incl. relatedBlogTags/Categories) are real
// Mongoose ref fields, so PickerField must use the id-valued kinds.
function idsOf(list) {
  return (list || []).map((t) => (typeof t === "string" ? t : t?._id)).filter(Boolean);
}

export default function SkinTypeForm({ editing }) {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(editing?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!editing);
  const [name, setName] = useState(editing?.name || "");
  const [shortDescription, setShortDescription] = useState(editing?.shortDescription || "");
  const [image, setImage] = useState(editing?.image || "");
  const [description, setDescription] = useState({ html: editing?.descriptionHtml || "" });
  const [tagRef, setTagRef] = useState(idsOf(editing?.tagRef ? [editing.tagRef] : []));

  const [commonConcerns, setCommonConcerns] = useState(idsOf(editing?.commonConcerns));
  const [relatedIngredients, setRelatedIngredients] = useState(idsOf(editing?.relatedIngredients));
  const [relatedProductsLimit, setRelatedProductsLimit] = useState(editing?.relatedProductsLimit ?? 8);
  const [relatedBlogTags, setRelatedBlogTags] = useState(idsOf(editing?.relatedBlogTags));
  const [relatedBlogCategories, setRelatedBlogCategories] = useState(idsOf(editing?.relatedBlogCategories));
  const [relatedArticlesLimit, setRelatedArticlesLimit] = useState(editing?.relatedArticlesLimit ?? 4);

  const [commonMistakes, setCommonMistakes] = useState((editing?.commonMistakes || []).map((i) => ({ a: i.title, b: i.description })));
  const [faq, setFaq] = useState((editing?.faq || []).map((i) => ({ a: i.question, b: i.answer })));

  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [status, setStatus] = useState(editing?.status || "draft");
  const [metaTitle, setMetaTitle] = useState(editing?.seo?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(editing?.seo?.metaDescription || "");
  const [canonical, setCanonical] = useState(editing?.seo?.canonical || "");
  const [ogImage, setOgImage] = useState(editing?.seo?.ogImage || "");
  const [robots, setRobots] = useState(editing?.seo?.robots || "index,follow");

  const handleNameChange = (v) => {
    setName(v);
    if (!slugTouched) setSlug(asciiSlugify(v));
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        slug,
        name,
        shortDescription,
        image,
        descriptionHtml: description.html,
        tagRef: tagRef[0] || null,
        commonConcerns,
        relatedIngredients,
        relatedProductsLimit: Number(relatedProductsLimit) || 8,
        relatedBlogTags,
        relatedBlogCategories,
        relatedArticlesLimit: Number(relatedArticlesLimit) || 4,
        commonMistakes: commonMistakes.filter((i) => i.a.trim()).map((i) => ({ title: i.a, description: i.b })),
        faq: faq.filter((i) => i.a.trim() && i.b.trim()).map((i) => ({ question: i.a, answer: i.b })),
        isActive,
        status,
        seo: { metaTitle, metaDescription, canonical, ogImage, robots },
      };
      return editing ? skinTypesApi.update(editing._id, payload) : skinTypesApi.create(payload);
    },
    onSuccess: (item) => {
      toast.success(editing ? "ذخیره شد" : "نوع پوست ساخته شد");
      queryClient.invalidateQueries({ queryKey: ["skin-types"] });
      if (!editing && item?._id) router.replace(`/beauty/skin-types/${item._id}`);
    },
    onError: (err) => toast.error(err?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  const handleSubmit = () => {
    if (!slug.trim()) return toast.error("اسلاگ الزامی است");
    if (!isValidBeautySlug(slug)) return toast.error("اسلاگ نامعتبر است (فقط حروف انگلیسی کوچک، عدد و خط تیره)");
    if (!name.trim()) return toast.error("نام الزامی است");
    saveMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">محتوا</TabsTrigger>
              <TabsTrigger value="related">ارتباطات</TabsTrigger>
              <TabsTrigger value="faq">اشتباهات رایج و سوالات</TabsTrigger>
              <TabsTrigger value="seo">سئو و انتشار</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>نام</Label>
                  <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="مثلاً: پوست چرب" autoFocus />
                </div>
                <div>
                  <Label>اسلاگ (آدرس، انگلیسی)</Label>
                  <Input dir="ltr" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(asciiSlugify(e.target.value)); }} placeholder="oily-skin" />
                  {slug && !isValidBeautySlug(slug) ? (
                    <p className="mt-1 text-xs text-[var(--danger)]">فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است</p>
                  ) : (
                    <p className="mt-1 text-xs text-[var(--text-faint)]">delisa.shop/beauty/skin-types/{slug || "..."}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>توضیح کوتاه</Label>
                <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
              </div>

              <div>
                <Label>تصویر</Label>
                <ImageField value={image} onChange={setImage} />
              </div>

              <div>
                <Label>پوست چرب چیست؟ (توضیح آموزشی)</Label>
                <RichTextEditor value={description.html} onChange={setDescription} />
              </div>

              <div>
                <Label>تگ محصول متناظر</Label>
                <PickerField kind="tagId" isMulti={false} value={tagRef[0] || ""} onChange={(v) => setTagRef(v ? [v] : [])} />
                <p className="mt-1 text-xs text-[var(--text-faint)]">محصولات دارای این تگ در «محصولات پیشنهادی» این صفحه نمایش داده می‌شوند.</p>
              </div>
              <div className="max-w-[200px]">
                <Label>حداکثر تعداد محصول</Label>
                <Input type="number" min={1} max={24} value={relatedProductsLimit} onChange={(e) => setRelatedProductsLimit(e.target.value)} />
              </div>
            </TabsContent>

            <TabsContent value="related" className="space-y-4 pt-4">
              <div>
                <Label>دغدغه‌های شایع این نوع پوست</Label>
                <PickerField kind="skinConcern" value={commonConcerns} onChange={setCommonConcerns} />
              </div>
              <div>
                <Label>ترکیبات مرتبط</Label>
                <PickerField kind="ingredient" value={relatedIngredients} onChange={setRelatedIngredients} />
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
                metaTitle={metaTitle} setMetaTitle={setMetaTitle} titlePlaceholder={name}
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
        <Button variant="outline" onClick={() => router.push("/beauty/skin-types")}>انصراف</Button>
        <Button loading={saveMutation.isPending} onClick={handleSubmit}>
          <Save size={16} />
          {editing ? "ذخیره تغییرات" : "ایجاد"}
        </Button>
      </div>
    </div>
  );
}
