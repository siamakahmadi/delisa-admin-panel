"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Trash2, Save } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { CategoryTreePanel } from "@/components/products/category-tree-panel";
import { SeoContentFields } from "@/components/products/seo-content-fields";

export default function CategoriesPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("view");
  const [createParentId, setCreateParentId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await apiClient.get("/api/admin/categories")).data,
  });

  const categories = useMemo(() => data ?? [], [data]);
  const selected = useMemo(() => categories.find((c) => c._id === selectedId) || null, [categories, selectedId]);

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      id ? apiClient.put(`/api/admin/categories/${id}`, payload) : apiClient.post("/api/admin/categories", payload),
    onSuccess: (res) => {
      toast.success(mode === "create" ? "دسته‌بندی ایجاد شد" : "تغییرات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setMode("view");
      setSelectedId(res.data._id);
    },
    onError: (err) => toast.error("خطا", err?.response?.data?.message || "عملیات ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/categories/${id}`),
    onSuccess: () => {
      toast.success("دسته‌بندی حذف شد");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setSelectedId(null);
      setDeleteTarget(null);
    },
    onError: (err) => toast.error("خطا", err?.response?.data?.message || "در صورتی که این دسته زیرمجموعه داشته باشد، حذف امکان‌پذیر نیست."),
  });

  const reorderMutation = useMutation({
    mutationFn: (items) =>
      apiClient.patch("/api/admin/categories/reorder", {
        items: items.map((it) => ({ _id: it._id, parent: it.parentId, order: it.order })),
      }),
    onSuccess: () => {
      toast.success("چیدمان دسته‌بندی‌ها ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => {
      toast.error("ذخیره چیدمان ناموفق بود");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const openCreate = (parentId = null) => {
    setMode("create");
    setSelectedId(null);
    setCreateParentId(parentId);
  };

  return (
    <div>
      <PageHeader
        title="دسته‌بندی‌های محصولات"
        subtitle={`${categories.length.toLocaleString("fa-IR")} دسته‌بندی`}
        actions={
          <Button variant="outline" onClick={() => router.push("/products")}>
            <ArrowRight size={16} />
            بازگشت
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {isLoading ? (
            <p className="text-sm text-[var(--text-faint)]">در حال بارگذاری...</p>
          ) : (
            <CategoryTreePanel
              categories={categories}
              selectedId={selectedId}
              onSelect={(id) => {
                setMode("view");
                setSelectedId(id);
              }}
              onAddChild={openCreate}
              onAddRoot={() => openCreate(null)}
              onReorder={(items) => reorderMutation.mutate(items)}
            />
          )}
        </div>

        <div className="lg:col-span-2">
          {mode === "view" && !selected ? (
            <Card>
              <CardContent className="py-16 text-center text-sm text-[var(--text-faint)]">
                یک دسته را از فهرست کنار انتخاب کنید یا یک دسته جدید اضافه کنید.
              </CardContent>
            </Card>
          ) : (
            <CategoryForm
              key={mode === "create" ? "new" : selected?._id}
              mode={mode}
              category={mode === "create" ? null : selected}
              parentId={mode === "create" ? createParentId : selected?.parent?._id ?? selected?.parent ?? null}
              categories={categories}
              isPending={saveMutation.isPending}
              onCancel={() => setMode("view")}
              onDelete={() => setDeleteTarget(selected)}
              onSubmit={(payload) => saveMutation.mutate({ id: mode === "create" ? null : selected._id, payload })}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف دسته‌بندی"
        description="در صورتی که این دسته‌بندی زیرمجموعه داشته باشد، حذف امکان‌پذیر نیست."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}

function CategoryForm({ mode, category, parentId, categories, isPending, onCancel, onDelete, onSubmit }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: category?.name || "",
    parent: parentId || null,
    description: category?.description || "",
    image: category?.image || "",
    isActive: category?.isActive !== false,
    seoTitle: category?.seoTitle || "",
    seoDescription: category?.seoDescription || "",
    seoContent: { h1: "", shortDescription: "", faqs: [], ...(category?.seoContent || {}) },
  });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("نام دسته‌بندی الزامی است");
      return;
    }
    onSubmit({
      name: form.name.trim(),
      parent: form.parent || null,
      description: form.description,
      image: form.image,
      isActive: form.isActive,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      seoContent: form.seoContent,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "دسته‌بندی جدید" : `ویرایش: ${category?.name || ""}`}</CardTitle>
          {mode === "view" && category && (
            <Button variant="danger" size="sm" onClick={onDelete}>
              <Trash2 size={14} />
              حذف
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>نام دسته</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>دسته والد</Label>
              <Select value={form.parent || ""} onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value || null }))}>
                <option value="">دسته اصلی</option>
                {categories
                  .filter((c) => c._id !== category?._id)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>توضیحات کوتاه</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>تصویر (URL)</Label>
              <Input dir="ltr" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3 text-sm">
            <span>فعال</span>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 accent-[var(--brand-600)]"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تنظیمات سئو</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>عنوان سئو</Label>
              <Input value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>توضیحات متا</Label>
            <Input value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} />
          </div>
          <div className="border-t border-[var(--border)] pt-4">
            <SeoContentFields value={form.seoContent} onChange={(seoContent) => setForm((f) => ({ ...f, seoContent }))} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        {mode === "create" && (
          <Button variant="outline" onClick={onCancel}>
            انصراف
          </Button>
        )}
        <Button loading={isPending} onClick={handleSubmit}>
          <Save size={16} />
          {mode === "create" ? "ایجاد دسته" : "ذخیره تغییرات"}
        </Button>
      </div>
    </div>
  );
}
