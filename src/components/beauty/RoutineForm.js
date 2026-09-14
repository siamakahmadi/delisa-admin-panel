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
import { RoutineStepsEditor } from "@/components/beauty/fields/RoutineStepsEditor";
import { ImageField } from "@/components/beauty/fields/ImageField";
import { SeoStatusTab } from "@/components/beauty/fields/SeoStatusTab";
import { useToast } from "@/components/ui/toast";
import { asciiSlugify, isValidBeautySlug } from "@/lib/beauty/slug";
import { routinesApi } from "@/lib/beauty/api";

function idsOf(list) {
  return (list || []).map((t) => (typeof t === "string" ? t : t?._id)).filter(Boolean);
}

export default function RoutineForm({ editing }) {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [slug, setSlug] = useState(editing?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!editing);
  const [title, setTitle] = useState(editing?.title || "");
  const [shortDescription, setShortDescription] = useState(editing?.shortDescription || "");
  const [heroImage, setHeroImage] = useState(editing?.heroImage || "");
  const [intro, setIntro] = useState({ html: editing?.introHtml || "" });

  const [steps, setSteps] = useState(
    (editing?.steps || []).map((s) => ({
      title: s.title || "",
      description: s.description || "",
      timeOfDay: s.timeOfDay || "both",
      categorySlug: s.categorySlug || "",
    }))
  );

  const [targetSkinTypes, setTargetSkinTypes] = useState(idsOf(editing?.targetSkinTypes));
  const [targetConcerns, setTargetConcerns] = useState(idsOf(editing?.targetConcerns));

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
        introHtml: intro.html,
        steps: steps.filter((s) => s.title.trim()).map((s, index) => ({ ...s, order: index })),
        targetSkinTypes,
        targetConcerns,
        isActive,
        status,
        seo: { metaTitle, metaDescription, canonical, ogImage, robots },
      };
      return editing ? routinesApi.update(editing._id, payload) : routinesApi.create(payload);
    },
    onSuccess: (item) => {
      toast.success(editing ? "ذخیره شد" : "قالب روتین ساخته شد");
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      if (!editing && item?._id) router.replace(`/beauty/routines/${item._id}`);
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
              <TabsTrigger value="steps">مراحل روتین</TabsTrigger>
              <TabsTrigger value="related">مناسب برای</TabsTrigger>
              <TabsTrigger value="seo">سئو و انتشار</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>عنوان</Label>
                  <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="مثلاً: روتین کامل پوست چرب" autoFocus />
                </div>
                <div>
                  <Label>اسلاگ (آدرس، انگلیسی)</Label>
                  <Input dir="ltr" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(asciiSlugify(e.target.value)); }} placeholder="oily-skin-routine" />
                  {slug && !isValidBeautySlug(slug) ? (
                    <p className="mt-1 text-xs text-[var(--danger)]">فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است</p>
                  ) : (
                    <p className="mt-1 text-xs text-[var(--text-faint)]">delisa.shop/beauty/routines/{slug || "..."}</p>
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
                <Label>معرفی روتین</Label>
                <RichTextEditor value={intro.html} onChange={setIntro} />
              </div>
            </TabsContent>

            <TabsContent value="steps" className="space-y-3 pt-4">
              <p className="text-xs text-[var(--text-faint)]">
                دسته‌بندی هر مرحله تعیین می‌کند سمت مشتری، پیشنهاد محصول این مرحله از کدام دسته‌بندی گرفته شود.
              </p>
              <RoutineStepsEditor items={steps} onChange={setSteps} />
            </TabsContent>

            <TabsContent value="related" className="space-y-4 pt-4">
              <div>
                <Label>مناسب برای این انواع پوست</Label>
                <PickerField kind="skinType" value={targetSkinTypes} onChange={setTargetSkinTypes} />
              </div>
              <div>
                <Label>مناسب برای این دغدغه‌های پوستی</Label>
                <PickerField kind="skinConcern" value={targetConcerns} onChange={setTargetConcerns} />
              </div>
              <p className="text-xs text-[var(--text-faint)]">
                این‌ها برای پیشنهاد خودکار «این قالب برای پروفایل شما مناسب است» در روتین‌ساز استفاده می‌شوند.
              </p>
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
        <Button variant="outline" onClick={() => router.push("/beauty/routines")}>انصراف</Button>
        <Button loading={saveMutation.isPending} onClick={handleSubmit}>
          <Save size={16} />
          {editing ? "ذخیره تغییرات" : "ایجاد"}
        </Button>
      </div>
    </div>
  );
}
