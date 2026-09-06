"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Save, Trash2, Search, X, ImageOff, Plus, Check } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCategories } from "@/hooks/use-taxonomies";
import { formatToman, cn } from "@/lib/utils";
import { SeoContentFields } from "@/components/products/seo-content-fields";

export function LabelDetail({ id }) {
  const { data: tag, isLoading } = useQuery({
    queryKey: ["tag", id],
    queryFn: async () => (await apiClient.get(`/api/admin/tags/${id}`)).data,
  });

  if (isLoading || !tag) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return <LabelEditor key={tag._id} tag={tag} id={id} />;
}

function LabelEditor({ tag, id }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: tag.title || "",
    description: tag.description || "",
    color: tag.color || "",
    sortOrder: tag.sortOrder ?? 0,
    seoTitle: tag.seoTitle || "",
    seoDescription: tag.seoDescription || "",
    seoContent: { h1: "", shortDescription: "", faqs: [], ...(tag.seoContent || {}) },
  });
  const [productIds, setProductIds] = useState((tag.products ?? []).map((p) => p._id));
  const [assignedProducts, setAssignedProducts] = useState(tag.products ?? []);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const { data: categories } = useCategories();

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["products-search-for-tag", debouncedSearch, categoryFilter],
    queryFn: async () =>
      (
        await apiClient.get("/api/admin/products/search-for-tag", {
          params: { search: debouncedSearch || undefined, category: categoryFilter || undefined, limit: 12 },
        })
      ).data,
  });

  const saveInfoMutation = useMutation({
    mutationFn: () =>
      apiClient.put(`/api/admin/tags/${id}`, {
        title: form.title.trim(),
        description: form.description,
        color: form.color,
        sortOrder: Number(form.sortOrder) || 0,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        seoContent: form.seoContent,
      }),
    onSuccess: () => {
      toast.success("اطلاعات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["tag", id] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (err) => toast.error("خطا", err?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  const saveProductsMutation = useMutation({
    mutationFn: () => apiClient.put(`/api/admin/tags/${id}/products`, { productIds }),
    onSuccess: () => {
      toast.success("محصولات برچسب بروزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["tag", id] });
    },
    onError: () => toast.error("بروزرسانی محصولات ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/admin/tags/${id}`),
    onSuccess: () => {
      toast.success("برچسب حذف شد");
      router.push("/products/labels");
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const addProduct = (product) => {
    if (productIds.includes(product._id)) return;
    setProductIds((prev) => [...prev, product._id]);
    setAssignedProducts((prev) => [...prev, product]);
  };

  const removeProduct = (productId) => {
    setProductIds((prev) => prev.filter((id_) => id_ !== productId));
    setAssignedProducts((prev) => prev.filter((p) => p._id !== productId));
  };

  return (
    <div>
      <PageHeader
        title={tag?.title || "برچسب"}
        subtitle="ویرایش برچسب"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/products/labels")}>
              <ArrowRight size={16} />
              بازگشت
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} />
              حذف
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات پایه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>نام برچسب</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label>اسلاگ</Label>
                <Input dir="ltr" value={tag?.slug || ""} disabled className="opacity-60" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>رنگ</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color || "#7c5cff"}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="h-10 w-14 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]"
                  />
                  <Input dir="ltr" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="#7c5cff" />
                </div>
              </div>
              <div>
                <Label>ترتیب نمایش</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>توضیحات</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex justify-end">
              <Button loading={saveInfoMutation.isPending} onClick={() => saveInfoMutation.mutate()}>
                <Save size={16} />
                ذخیره اطلاعات
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>محصولات این برچسب ({assignedProducts.length.toLocaleString("fa-IR")})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">افزودن محصول</p>
                <div className="mb-2 flex gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                    <Input placeholder="جستجوی محصول..." className="pr-8" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <Select className="w-36 shrink-0" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="">همه دسته‌ها</option>
                    {(categories ?? []).map((c) => (
                      <option key={c._id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="h-80 space-y-1.5 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] p-2">
                  {searching && <p className="py-6 text-center text-xs text-[var(--text-faint)]">در حال جستجو...</p>}
                  {!searching && !searchResults?.products?.length && (
                    <p className="py-6 text-center text-xs text-[var(--text-faint)]">موردی یافت نشد.</p>
                  )}
                  {(searchResults?.products ?? []).map((p) => {
                    const added = productIds.includes(p._id);
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => (added ? removeProduct(p._id) : addProduct(p))}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-[var(--radius-sm)] p-1.5 text-start text-sm hover:bg-[var(--surface-muted)]",
                          added && "bg-[var(--brand-50)]"
                        )}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
                          {p.productImages?.[0]?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.productImages[0].url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageOff size={12} className="text-[var(--text-faint)]" />
                          )}
                        </div>
                        <span className="flex-1 truncate">{p.productName}</span>
                        <span className="shrink-0 text-xs text-[var(--text-faint)]">{formatToman(p.finalPrice)}</span>
                        {added ? <Check size={15} className="shrink-0 text-[var(--brand-600)]" /> : <Plus size={15} className="shrink-0 text-[var(--text-faint)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">محصولات اضافه‌شده</p>
                <div className="h-80 space-y-2 overflow-y-auto">
                  {assignedProducts.length === 0 && (
                    <p className="py-6 text-center text-xs text-[var(--text-faint)]">محصولی به این برچسب اضافه نشده است.</p>
                  )}
                  {assignedProducts.map((p) => (
                    <div key={p._id} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
                        {p.productImages?.[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.productImages[0].url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageOff size={14} className="text-[var(--text-faint)]" />
                        )}
                      </div>
                      <span className="flex-1 truncate text-sm">{p.productName}</span>
                      <span className="text-xs text-[var(--text-faint)]">{formatToman(p.finalPrice)}</span>
                      <button onClick={() => removeProduct(p._id)} className="text-[var(--text-faint)] hover:text-[var(--danger)]">
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button loading={saveProductsMutation.isPending} onClick={() => saveProductsMutation.mutate()}>
                <Save size={16} />
                ذخیره محصولات
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تنظیمات سئو</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>عنوان سئو</Label>
              <Input value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} />
            </div>
            <div>
              <Label>توضیحات متا</Label>
              <Input value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} />
            </div>
            <div className="border-t border-[var(--border)] pt-4">
              <SeoContentFields value={form.seoContent} onChange={(seoContent) => setForm((f) => ({ ...f, seoContent }))} />
            </div>
            <div className="flex justify-end">
              <Button loading={saveInfoMutation.isPending} onClick={() => saveInfoMutation.mutate()}>
                <Save size={16} />
                ذخیره سئو
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف برچسب"
        description="این برچسب برای همیشه حذف می‌شود. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
