"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils";

/** Shared CRUD UI for blog categories & tags — both share the same shape
 * (name + slug [+ optional description]), so one component drives both
 * /content/blog/categories and /content/blog/tags. */
export function TaxonomyManager({ title, subtitle, itemLabel, hasDescription = false, listKey, fetchList, createItem, updateItem, deleteItem }) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const slugTouchedRef = useRef(false);

  const { data, isLoading } = useQuery({ queryKey: [listKey], queryFn: fetchList });
  const items = data ?? [];

  useEffect(() => {
    if (!slugTouchedRef.current) setSlug(slugify(name || ""));
  }, [name]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    slugTouchedRef.current = false;
  }

  function startEdit(item) {
    setEditingId(item._id);
    setName(item.name || "");
    setSlug(item.slug || "");
    setDescription(item.description || "");
    slugTouchedRef.current = true;
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), slug: slug.trim() || undefined };
      if (hasDescription) payload.description = description.trim();
      return editingId ? updateItem(editingId, payload) : createItem(payload);
    },
    onSuccess: () => {
      toast.success(editingId ? `${itemLabel} به‌روزرسانی شد` : `${itemLabel} ایجاد شد`);
      resetForm();
      queryClient.invalidateQueries({ queryKey: [listKey] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || `خطا در ذخیره ${itemLabel}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (item) => deleteItem(item._id),
    onSuccess: () => {
      toast.success(`${itemLabel} حذف شد`);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: [listKey] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || `خطا در حذف ${itemLabel}`),
  });

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(`نام ${itemLabel} الزامی است`);
      return;
    }
    saveMutation.mutate();
  }

  const columns = [
    { key: "name", header: "نام", sortable: true },
    { key: "slug", header: "اسلاگ", render: (row) => <code dir="ltr" className="text-xs text-[var(--text-muted)]">{row.slug}</code> },
    { key: "postCount", header: "تعداد پست", render: (row) => (typeof row.postCount === "number" ? row.postCount.toLocaleString("fa-IR") : "-") },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" title="ویرایش" onClick={() => startEdit(row)}>
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleteTarget(row)}>
            <Trash2 size={14} className="text-[var(--danger)]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />

      <Card className="mb-4">
        <CardContent className="p-4">
          <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <Label>نام {itemLabel} *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`نام ${itemLabel} را وارد کنید`} />
            </div>
            <div>
              <Label>اسلاگ</Label>
              <Input
                dir="ltr"
                value={slug}
                onChange={(e) => {
                  slugTouchedRef.current = true;
                  setSlug(e.target.value);
                }}
                placeholder="در صورت خالی بودن خودکار تولید می‌شود"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={saveMutation.isPending}>
                {editingId ? "به‌روزرسانی" : `ایجاد ${itemLabel}`}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" size="icon" onClick={resetForm} title="انصراف">
                  <X size={15} />
                </Button>
              )}
            </div>
            {hasDescription && (
              <div className="sm:col-span-3">
                <Label>توضیح</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="توضیح کوتاه (اختیاری)" />
              </div>
            )}
          </form>
          {saveMutation.error && <FieldError>{saveMutation.error?.response?.data?.message}</FieldError>}
        </CardContent>
      </Card>

      <DataTable columns={columns} data={items} isLoading={isLoading} emptyMessage={`هنوز ${itemLabel}‌ای ثبت نشده است`} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`حذف ${itemLabel}`}
        description={
          deleteTarget
            ? `آیا از حذف «${deleteTarget.name}» مطمئن هستید؟${
                typeof deleteTarget.postCount === "number" && deleteTarget.postCount > 0 ? ` این ${itemLabel} در ${deleteTarget.postCount} پست استفاده شده و از آن‌ها حذف خواهد شد.` : ""
              }`
            : ""
        }
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget)}
      />
    </div>
  );
}
