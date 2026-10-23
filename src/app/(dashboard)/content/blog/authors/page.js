"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Pencil, Trash2, UserRound, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { createAuthor, deleteAuthor, fetchAuthors, updateAuthor, uploadBlogImage } from "@/lib/blog/api";

function Avatar({ url, size = 36 }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-muted)] text-[var(--text-faint)]"
      style={{ width: size, height: size }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <UserRound size={size * 0.5} />
      )}
    </span>
  );
}

export default function BlogAuthorsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["blog-authors"], queryFn: fetchAuthors });

  function reset() {
    setEditingId(null);
    setName("");
    setBio("");
    setAvatarUrl("");
  }

  function startEdit(a) {
    setEditingId(a._id);
    setName(a.name || "");
    setBio(a.bio || "");
    setAvatarUrl(a.avatarUrl || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function upload(file) {
    setUploading(true);
    try {
      const res = await uploadBlogImage(file, "blog-authors");
      if (res?.url) setAvatarUrl(res.url);
    } catch {
      toast.error("خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), bio: bio.trim(), avatarUrl };
      return editingId ? updateAuthor(editingId, payload) : createAuthor(payload);
    },
    onSuccess: () => {
      toast.success(editingId ? "نویسنده به‌روزرسانی شد" : "نویسنده اضافه شد");
      reset();
      queryClient.invalidateQueries({ queryKey: ["blog-authors"] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "خطا در ذخیره نویسنده"),
  });

  const deleteMutation = useMutation({
    mutationFn: (a) => deleteAuthor(a._id),
    onSuccess: () => {
      toast.success("نویسنده حذف شد");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["blog-authors"] });
    },
    onError: (e) => {
      toast.error(e?.response?.data?.message || "خطا در حذف نویسنده");
      setDeleteTarget(null);
    },
  });

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("نام نویسنده الزامی است");
      return;
    }
    saveMutation.mutate();
  }

  const columns = [
    {
      key: "name",
      header: "نویسنده",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar url={row.avatarUrl} />
          <div>
            <p className="text-sm font-medium text-[var(--text)]">{row.name}</p>
            {row.bio ? <p className="line-clamp-1 max-w-xs text-xs text-[var(--text-faint)]">{row.bio}</p> : null}
          </div>
        </div>
      ),
    },
    { key: "postCount", header: "تعداد مقاله", render: (row) => (row.postCount || 0).toLocaleString("fa-IR") },
    { key: "kind", header: "نوع", render: (row) => (row.staffUserId ? "عضو تیم (حساب کاربری)" : "نویسنده‌ی مستقل") },
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
      <PageHeader title="نویسندگان بلاگ" subtitle="نویسنده‌ها را اینجا مدیریت کنید؛ هنگام نوشتن هر مقاله می‌توانید یکی از آن‌ها را به‌عنوان نویسنده انتخاب کنید." />

      <Card className="mb-4">
        <CardContent className="p-4">
          <form onSubmit={submit} className="space-y-3">
            <div className="flex items-center gap-4">
              <Avatar url={avatarUrl} size={56} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  <ImagePlus size={13} />
                  {uploading ? "در حال آپلود…" : avatarUrl ? "تغییر تصویر" : "تصویر نویسنده"}
                </Button>
                {avatarUrl ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAvatarUrl("")}>
                    حذف تصویر
                  </Button>
                ) : null}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) upload(f);
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>نام نویسنده *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً سیامک احمدی" />
              </div>
              <div>
                <Label>بیوگرافی کوتاه</Label>
                <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="اختیاری" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" loading={saveMutation.isPending}>
                {editingId ? "به‌روزرسانی نویسنده" : "افزودن نویسنده"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" size="icon" onClick={reset} title="انصراف">
                  <X size={15} />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={data ?? []} isLoading={isLoading} emptyMessage="هنوز نویسنده‌ای ثبت نشده است" />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف نویسنده"
        description={deleteTarget ? `آیا از حذف «${deleteTarget.name}» مطمئن هستید؟ نویسنده‌ای که مقاله دارد حذف نمی‌شود.` : ""}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget)}
      />
    </div>
  );
}
