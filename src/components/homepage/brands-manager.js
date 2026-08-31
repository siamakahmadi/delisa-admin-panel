"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Save, ImageOff, ImagePlus, X } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchHomeBrands, createHomeBrand, updateHomeBrand, deleteHomeBrand, fetchBrandsSectionSettings, saveBrandsSectionSettings } from "@/lib/homepage/api";
import { SectionEnableToggle } from "@/components/homepage/section-enable-toggle";

export function BrandsManager() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["home-brands"], queryFn: fetchHomeBrands });
  const items = data ?? [];
  const active = editing || creating;

  const saveMutation = useMutation({
    mutationFn: (formData) => (editing ? updateHomeBrand(editing._id, formData) : createHomeBrand(formData)),
    onSuccess: () => {
      toast.success(editing ? "برند بروزرسانی شد" : "برند ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["home-brands"] });
      setEditing(null);
      setCreating(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteHomeBrand(id),
    onSuccess: () => {
      toast.success("حذف شد");
      queryClient.invalidateQueries({ queryKey: ["home-brands"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = [
    {
      key: "image",
      header: "تصویر",
      render: (row) => (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
          {row.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.image} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImageOff size={14} className="text-[var(--text-faint)]" />
          )}
        </div>
      ),
    },
    { key: "title", header: "عنوان", render: (row) => <span className="font-medium">{row.title}</span> },
    { key: "link", header: "لینک", render: (row) => <span dir="ltr" className="text-xs text-[var(--text-muted)]">{row.link || "—"}</span> },
    { key: "order", header: "ترتیب", render: (row) => row.order ?? 0 },
    {
      key: "isPublished",
      header: "وضعیت",
      render: (row) =>
        row.isPublished ? (
          <Badge variant="success" size="sm" dot>منتشر شده</Badge>
        ) : (
          <Badge variant="neutral" size="sm" dot>پیش‌نویس</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setCreating(false); setEditing(row); }}>
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
      {!active ? (
        <>
          <SectionEnableToggle
            queryKey={["brands-section-settings"]}
            fetchFn={fetchBrandsSectionSettings}
            saveFn={saveBrandsSectionSettings}
            label="نمایش سکشن برندها در صفحه اصلی"
          />
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">لوگوهای برندهای همکار که در صفحه اصلی نمایش داده می‌شوند.</p>
            <Button onClick={() => { setEditing(null); setCreating(true); }}>
              <Plus size={16} />
              افزودن برند
            </Button>
          </div>
          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            emptyMessage="برندی یافت نشد"
            onRowClick={(row) => { setCreating(false); setEditing(row); }}
          />
        </>
      ) : (
        <BrandForm
          key={editing?._id ?? "new"}
          editing={editing}
          isPending={saveMutation.isPending}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSubmit={(formData) => saveMutation.mutate(formData)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف برند"
        description="این برند برای همیشه حذف می‌شود. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}

function BrandForm({ editing, isPending, onCancel, onSubmit }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(editing?.image || "");
  const [removeImage, setRemoveImage] = useState(false);
  const [form, setForm] = useState({
    title: editing?.title || "",
    link: editing?.link || "",
    order: editing?.order ?? 0,
    isPublished: editing?.isPublished ?? true,
  });

  const patch = (fields) => setForm((f) => ({ ...f, ...fields }));

  const onFilePicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("عنوان الزامی است");
      return;
    }
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("link", form.link);
    fd.append("order", String(form.order || 0));
    fd.append("isPublished", String(!!form.isPublished));
    if (fileRef.current?.files?.[0]) {
      fd.append("image", fileRef.current.files[0]);
    } else if (editing && removeImage) {
      fd.append("removeImage", "true");
    }
    onSubmit(fd);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? `ویرایش برند: ${editing.title}` : "برند جدید"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>لوگو</Label>
          {preview ? (
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="h-full w-full object-contain p-2" />
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-1">
                <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>تعویض</Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => { setPreview(""); setRemoveImage(true); if (fileRef.current) fileRef.current.value = ""; }}
                >
                  <X size={13} />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--brand-500)] hover:text-[var(--brand-500)]"
            >
              <ImagePlus size={18} />
              <span className="text-[10px]">انتخاب لوگو</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>عنوان</Label>
            <Input value={form.title} onChange={(e) => patch({ title: e.target.value })} placeholder="مثلاً: لورآل" />
          </div>
          <div>
            <Label>لینک (اختیاری)</Label>
            <Input dir="ltr" value={form.link} onChange={(e) => patch({ link: e.target.value })} placeholder="/brand/loreal یا https://..." />
          </div>
        </div>

        <div className="max-w-[160px]">
          <Label>ترتیب نمایش</Label>
          <Input type="number" value={form.order} onChange={(e) => patch({ order: Number(e.target.value) })} />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => patch({ isPublished: e.target.checked })} className="h-4 w-4 accent-[var(--brand-600)]" />
          منتشر شود (روی سایت نمایش داده شود)
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>انصراف</Button>
          <Button loading={isPending} onClick={handleSubmit}>
            <Save size={16} />
            {editing ? "ذخیره تغییرات" : "ایجاد"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
