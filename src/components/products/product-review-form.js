"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ImageOff, Save } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useToast } from "@/components/ui/toast";
import { fetchReviewByProductId, upsertReviewByProductId } from "@/lib/product-reviews/api";

export function ProductReviewForm({ productId }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => (await apiClient.get(`/api/admin/products/${productId}`)).data,
  });

  const { data: review, isLoading: loadingReview } = useQuery({
    queryKey: ["product-editorial-review", productId],
    queryFn: () => fetchReviewByProductId(productId),
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState({ json: null, html: "" });
  const [status, setStatus] = useState("draft");
  const [enabled, setEnabled] = useState(true);
  const [hydratedFor, setHydratedFor] = useState(undefined);

  // `review` arrives asynchronously (or is null for a brand-new review) —
  // hydrate the form once when it resolves. Adjusting state during render
  // (guarded so it only fires once per productId) rather than in an effect,
  // per React's documented pattern for deriving state from data that just
  // finished loading — see sidebar.js's tab-auto-switch for the same pattern.
  const hydrated = hydratedFor === productId;
  if (!loadingReview && !hydrated) {
    setHydratedFor(productId);
    if (review) {
      setTitle(review.title || "");
      setContent({ json: review.content || null, html: review.contentHtml || "" });
      setStatus(review.status || "draft");
      setEnabled(review.enabled !== false);
    }
  }

  const saveMutation = useMutation({
    mutationFn: (publish) =>
      upsertReviewByProductId(productId, {
        title: title.trim(),
        content: content.json || {},
        contentHtml: content.html || "",
        status: publish ? "published" : status,
        enabled,
      }),
    onSuccess: (saved) => {
      toast.success("نقد و بررسی ذخیره شد");
      setStatus(saved?.status || status);
      // Drop the cached review (rather than just invalidating it) so a later
      // visit to this same edit URL starts with no data and a real loading
      // state, instead of the stale "no review yet" snapshot cached from the
      // very first (create) visit — React Query would otherwise serve that
      // stale cache synchronously (isLoading:false) before revalidating,
      // which hydrated the form empty even though content had been saved.
      queryClient.removeQueries({ queryKey: ["product-editorial-review", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-editorial-reviews"] });
      router.push("/products/reviews");
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  const handleSave = (publish) => {
    if (!title.trim()) {
      toast.error("عنوان نقد و بررسی الزامی است");
      return;
    }
    if (!content.html?.trim()) {
      toast.error("محتوای نقد و بررسی الزامی است");
      return;
    }
    saveMutation.mutate(publish);
  };

  // RichTextEditor is an uncontrolled editor (its `value` is only read once,
  // at mount) — it must not mount until the async-loaded review content has
  // already been hydrated into `content`, or it mounts empty and never
  // catches up (see the hydration effect above).
  const loading = loadingProduct || loadingReview || !hydrated;
  const img = product?.productImages?.[0]?.url;

  return (
    <div>
      <PageHeader
        title={review ? "ویرایش نقد و بررسی" : "افزودن نقد و بررسی"}
        subtitle={loadingProduct ? "" : product?.productName}
        actions={
          <Button variant="ghost" onClick={() => router.push("/products/reviews")}>
            <ArrowRight size={16} />
            بازگشت
          </Button>
        }
      />

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff size={18} className="text-[var(--text-faint)]" />
                    )}
                  </div>
                  <p className="min-w-0 truncate text-sm font-medium text-[var(--text)]">{product?.productName}</p>
                </div>

                <div>
                  <Label>عنوان نقد و بررسی</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: بررسی تخصصی کرم آبرسان پوست خشک — آیا ارزش خرید دارد؟" />
                </div>

                <div>
                  <Label>محتوا</Label>
                  <RichTextEditor value={content.html} onChange={(v) => setContent(v)} placeholder="نقد و بررسی مفصل محصول را اینجا بنویسید..." />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3 p-4">
                <h3 className="text-sm font-semibold text-[var(--text)]">انتشار</h3>
                <div>
                  <Label>وضعیت</Label>
                  <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="draft">پیش‌نویس</option>
                    <option value="published">منتشر شده</option>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                  <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
                  نمایش در صفحه محصول
                </label>
                <p className="text-xs text-[var(--text-faint)]">این محتوا در صفحه محصول، کنار سوالات متداول، به مشتری نمایش داده می‌شود.</p>

                <div className="space-y-2 pt-2">
                  <Button className="w-full" variant="secondary" loading={saveMutation.isPending} onClick={() => handleSave(false)}>
                    <Save size={15} />
                    ذخیره
                  </Button>
                  <Button className="w-full" loading={saveMutation.isPending} onClick={() => handleSave(true)}>
                    ذخیره و انتشار
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
