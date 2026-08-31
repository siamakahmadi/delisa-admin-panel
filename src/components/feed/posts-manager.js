"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Save, ImageOff, ImagePlus, FilmIcon, X, Heart, MessageCircle } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  fetchFeedPosts,
  createFeedPost,
  updateFeedPost,
  deleteFeedPost,
  fetchFeedAuthors,
  fetchFeedSettings,
  saveFeedSettings,
} from "@/lib/feed/api";
import { SectionEnableToggle } from "@/components/homepage/section-enable-toggle";

const TYPE_LABELS = { video: "ویدیو (ریلز)", image: "تصویر", text: "متنی" };

export function FeedPostsManager() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["feed-posts"], queryFn: fetchFeedPosts });
  const { data: authors } = useQuery({ queryKey: ["feed-authors"], queryFn: fetchFeedAuthors });
  const items = data ?? [];
  const active = editing || creating;

  const saveMutation = useMutation({
    mutationFn: (formData) => (editing ? updateFeedPost(editing._id, formData) : createFeedPost(formData)),
    onSuccess: () => {
      toast.success(editing ? "پست بروزرسانی شد" : "پست ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      setEditing(null);
      setCreating(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFeedPost(id),
    onSuccess: () => {
      toast.success("حذف شد");
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = [
    {
      key: "media",
      header: "پیش‌نمایش",
      render: (row) => (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
          {row.type === "text" ? (
            <span className="text-[10px] text-[var(--text-faint)]">متن</span>
          ) : row.mediaUrl ? (
            row.type === "video" ? (
              <video src={row.mediaUrl} className="h-full w-full object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.mediaUrl} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <ImageOff size={14} className="text-[var(--text-faint)]" />
          )}
        </div>
      ),
    },
    { key: "author", header: "نویسنده", render: (row) => row.author?.name || "—" },
    { key: "type", header: "نوع", render: (row) => <Badge size="sm" variant="neutral">{TYPE_LABELS[row.type] || row.type}</Badge> },
    { key: "text", header: "متن", render: (row) => <span className="max-w-[200px] truncate text-[var(--text-muted)]">{row.text || "—"}</span> },
    {
      key: "stats",
      header: "لایک / کامنت",
      render: (row) => (
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><Heart size={13} /> {row.likeCount ?? 0}</span>
          <span className="flex items-center gap-1"><MessageCircle size={13} /> {row.commentCount ?? 0}</span>
        </div>
      ),
    },
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
            queryKey={["feed-settings"]}
            fetchFn={fetchFeedSettings}
            saveFn={saveFeedSettings}
            label="نمایش فید در سایت (اسکرول عمودی شبیه ریلز)"
          />
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">پست‌های فید — ویدیو/عکس تمام‌صفحه یا پست متنی، به‌ترتیب عدد «ترتیب» و سپس جدیدترین.</p>
            <Button onClick={() => { setEditing(null); setCreating(true); }} disabled={!authors?.length}>
              <Plus size={16} />
              افزودن پست
            </Button>
          </div>
          {!authors?.length && (
            <p className="mb-3 rounded-[var(--radius-md)] bg-[var(--warning-50)] p-3 text-sm text-[var(--warning-700)]">
              قبل از افزودن پست، حداقل یک نویسنده در تب «نویسندگان» بسازید.
            </p>
          )}
          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            emptyMessage="پستی یافت نشد"
            onRowClick={(row) => { setCreating(false); setEditing(row); }}
          />
        </>
      ) : (
        <PostForm
          key={editing?._id ?? "new"}
          editing={editing}
          authors={authors ?? []}
          isPending={saveMutation.isPending}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSubmit={(formData) => saveMutation.mutate(formData)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف پست"
        description="این پست، همراه با لایک‌ها و کامنت‌هایش، برای همیشه حذف می‌شود. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}

function PostForm({ editing, authors, isPending, onCancel, onSubmit }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(editing?.mediaUrl || "");
  const [form, setForm] = useState({
    authorId: editing?.author?._id || authors[0]?._id || "",
    type: editing?.type || "video",
    text: editing?.text || "",
    link: editing?.link || "",
    order: editing?.order ?? 0,
    isPublished: editing?.isPublished ?? true,
  });

  const patch = (fields) => setForm((f) => ({ ...f, ...fields }));

  const onFilePicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!form.authorId) {
      toast.error("انتخاب نویسنده الزامی است");
      return;
    }
    if (form.type === "text" && !form.text.trim()) {
      toast.error("برای پست متنی، متن الزامی است");
      return;
    }
    if (form.type !== "text" && !editing && !fileRef.current?.files?.[0]) {
      toast.error("انتخاب فایل رسانه الزامی است");
      return;
    }

    const fd = new FormData();
    fd.append("authorId", form.authorId);
    fd.append("type", form.type);
    fd.append("text", form.text.trim());
    fd.append("link", form.link.trim());
    fd.append("order", String(form.order || 0));
    fd.append("isPublished", String(!!form.isPublished));
    if (fileRef.current?.files?.[0]) fd.append("media", fileRef.current.files[0]);
    onSubmit(fd);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? "ویرایش پست" : "پست جدید"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>نویسنده</Label>
            <Select value={form.authorId} onChange={(e) => patch({ authorId: e.target.value })}>
              {authors.map((a) => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>نوع پست</Label>
            <Select value={form.type} onChange={(e) => patch({ type: e.target.value })}>
              <option value="video">ویدیو (ریلز)</option>
              <option value="image">تصویر</option>
              <option value="text">متنی (شبیه توییت)</option>
            </Select>
          </div>
        </div>

        {form.type !== "text" && (
          <div>
            <Label>{form.type === "video" ? "فایل ویدیو" : "فایل تصویر"}</Label>
            {preview ? (
              <div className="relative h-40 w-24 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-black">
                {form.type === "video" ? (
                  <video src={preview} className="h-full w-full object-cover" muted controls />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs text-white"
                >
                  تعویض
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-40 w-24 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--brand-500)] hover:text-[var(--brand-500)]"
              >
                {form.type === "video" ? <FilmIcon size={18} /> : <ImagePlus size={18} />}
                <span className="text-xs">انتخاب فایل</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept={form.type === "video" ? "video/*" : "image/*"}
              className="hidden"
              onChange={onFilePicked}
            />
          </div>
        )}

        <div>
          <Label>{form.type === "text" ? "متن پست" : "کپشن (اختیاری)"}</Label>
          <textarea
            value={form.text}
            onChange={(e) => patch({ text: e.target.value })}
            rows={form.type === "text" ? 5 : 2}
            maxLength={2000}
            className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>لینک (اختیاری)</Label>
            <Input dir="ltr" value={form.link} onChange={(e) => patch({ link: e.target.value })} placeholder="/archive یا https://..." />
          </div>
          <div>
            <Label>ترتیب نمایش</Label>
            <Input type="number" value={form.order} onChange={(e) => patch({ order: Number(e.target.value) })} />
          </div>
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
