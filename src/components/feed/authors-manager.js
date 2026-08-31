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
import { fetchFeedAuthors, createFeedAuthor, updateFeedAuthor, deleteFeedAuthor } from "@/lib/feed/api";

export function FeedAuthorsManager() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["feed-authors"], queryFn: fetchFeedAuthors });
  const items = data ?? [];
  const active = editing || creating;

  const saveMutation = useMutation({
    mutationFn: (formData) => (editing ? updateFeedAuthor(editing._id, formData) : createFeedAuthor(formData)),
    onSuccess: () => {
      toast.success(editing ? "نویسنده بروزرسانی شد" : "نویسنده ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["feed-authors"] });
      setEditing(null);
      setCreating(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFeedAuthor(id),
    onSuccess: () => {
      toast.success("حذف شد");
      queryClient.invalidateQueries({ queryKey: ["feed-authors"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = [
    {
      key: "avatar",
      header: "آواتار",
      render: (row) => (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-muted)]">
          {row.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageOff size={14} className="text-[var(--text-faint)]" />
          )}
        </div>
      ),
    },
    { key: "name", header: "نام", render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "bio", header: "بیوگرافی", render: (row) => <span className="text-[var(--text-muted)]">{row.bio || "—"}</span> },
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
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">نویسندگان/سازندگان محتوای فید — فقط یک هویت نمایشی (نام + آواتار)، نیازی به حساب کاربری ندارد.</p>
            <Button onClick={() => { setEditing(null); setCreating(true); }}>
              <Plus size={16} />
              افزودن نویسنده
            </Button>
          </div>
          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            emptyMessage="نویسنده‌ای یافت نشد"
            onRowClick={(row) => { setCreating(false); setEditing(row); }}
          />
        </>
      ) : (
        <AuthorForm
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
        title="حذف نویسنده"
        description="این نویسنده برای همیشه حذف می‌شود. پست‌های موجودِ او حذف نمی‌شوند اما دیگر نویسنده‌ی معتبری ندارند — قبل از حذف، پست‌هایش را به نویسنده‌ی دیگری منتقل کنید."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}

function AuthorForm({ editing, isPending, onCancel, onSubmit }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(editing?.avatar || "");
  const [form, setForm] = useState({
    name: editing?.name || "",
    bio: editing?.bio || "",
    isActive: editing?.isActive ?? true,
  });

  const patch = (fields) => setForm((f) => ({ ...f, ...fields }));

  const onFilePicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("bio", form.bio.trim());
    fd.append("isActive", String(!!form.isActive));
    if (fileRef.current?.files?.[0]) fd.append("avatar", fileRef.current.files[0]);
    onSubmit(fd);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? `ویرایش نویسنده: ${editing.name}` : "نویسنده جدید"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>آواتار</Label>
          {preview ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[var(--border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => { setPreview(""); if (fileRef.current) fileRef.current.value = ""; }}
                className="absolute inset-x-0 bottom-0 bg-black/50 py-1 text-center text-white"
              >
                <X size={12} className="mx-auto" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-full border border-dashed border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--brand-500)] hover:text-[var(--brand-500)]"
            >
              <ImagePlus size={16} />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
        </div>

        <div>
          <Label>نام</Label>
          <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="مثلاً: تیم دلیسا" />
        </div>
        <div>
          <Label>بیوگرافی (اختیاری)</Label>
          <Input value={form.bio} onChange={(e) => patch({ bio: e.target.value })} />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" checked={form.isActive} onChange={(e) => patch({ isActive: e.target.checked })} className="h-4 w-4 accent-[var(--brand-600)]" />
          فعال
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
