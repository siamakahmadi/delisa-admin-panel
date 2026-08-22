"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, Pencil, Trash2, Save, ImageOff } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { SeoContentFields } from "@/components/products/seo-content-fields";
import { slugify } from "@/lib/utils";

/**
 * Generic list+edit manager for taxonomy entities sharing the
 * {name, slug, description, isActive, seoTitle, seoDescription, seoContent}
 * shape: Brand and ProductType.
 */
export function TaxonomyManager({ title, endpoint, queryKey, imageField }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => (await apiClient.get(endpoint)).data,
  });

  const items = useMemo(() => data ?? [], [data]);
  const active = editing || creating;

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing ? apiClient.put(`${endpoint}/${editing._id}`, payload) : apiClient.post(endpoint, payload),
    onSuccess: () => {
      toast.success(editing ? "با موفقیت بروزرسانی شد" : "با موفقیت ایجاد شد");
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setEditing(null);
      setCreating(false);
    },
    onError: (err) => toast.error("خطا", err?.response?.data?.message || err?.response?.data?.error || "عملیات ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`${endpoint}/${id}`),
    onSuccess: () => {
      toast.success("حذف شد");
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setDeleteTarget(null);
      if (editing?._id === deleteTarget?._id) setEditing(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = [
    {
      key: "name",
      header: title,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
            {row[imageField] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row[imageField]} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageOff size={14} className="text-[var(--text-faint)]" />
            )}
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    { key: "slug", header: "اسلاگ", render: (row) => <span dir="ltr">{row.slug}</span> },
    {
      key: "isActive",
      header: "وضعیت",
      render: (row) =>
        row.isActive ? (
          <Badge variant="success" size="sm" dot>فعال</Badge>
        ) : (
          <Badge variant="neutral" size="sm" dot>غیرفعال</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setCreating(false);
              setEditing(row);
            }}
          >
            <Pencil size={15} />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
            <Trash2 size={15} className="text-[var(--danger)]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${items.length.toLocaleString("fa-IR")} مورد`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/products")}>
              <ArrowRight size={16} />
              بازگشت
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setCreating(true);
              }}
            >
              <Plus size={16} />
              افزودن
            </Button>
          </div>
        }
      />

      {!active ? (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          emptyMessage="موردی یافت نشد"
          onRowClick={(row) => {
            setCreating(false);
            setEditing(row);
          }}
        />
      ) : (
        <TaxonomyForm
          key={editing?._id ?? "new"}
          title={title}
          editing={editing}
          imageField={imageField}
          isPending={saveMutation.isPending}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSubmit={(payload) => saveMutation.mutate(payload)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف"
        description="این مورد برای همیشه حذف می‌شود. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}

function TaxonomyForm({ title, editing, imageField, isPending, onCancel, onSubmit }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: editing?.name || "",
    [imageField]: editing?.[imageField] || "",
    description: editing?.description || "",
    isActive: editing?.isActive !== false,
    seoTitle: editing?.seoTitle || "",
    seoDescription: editing?.seoDescription || "",
    seoContent: { h1: "", shortDescription: "", faqs: [], ...(editing?.seoContent || {}) },
  });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("نام الزامی است");
      return;
    }
    onSubmit({
      name: form.name.trim(),
      slug: editing?.slug || slugify(form.name),
      [imageField]: form[imageField],
      description: form.description,
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
          <CardTitle>{editing ? `ویرایش: ${editing.name}` : `${title} جدید`}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>نام</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>تصویر (URL)</Label>
              <Input
                dir="ltr"
                value={form[imageField]}
                onChange={(e) => setForm((f) => ({ ...f, [imageField]: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>توضیحات</Label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
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
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          انصراف
        </Button>
        <Button loading={isPending} onClick={handleSubmit}>
          <Save size={16} />
          {editing ? "ذخیره تغییرات" : "ایجاد"}
        </Button>
      </div>
    </div>
  );
}
