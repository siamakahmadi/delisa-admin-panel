"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Save, ImageOff, ImagePlus, X, Eye, Video } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchStories, createStory, updateStory, deleteStory, fetchStoriesSettings, saveStoriesSettings } from "@/lib/homepage/api";
import { SectionEnableToggle } from "@/components/homepage/section-enable-toggle";

export function StoriesManager() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["home-stories"], queryFn: fetchStories });
  const items = data ?? [];
  const active = editing || creating;

  const saveMutation = useMutation({
    mutationFn: (formData) => (editing ? updateStory(editing._id, formData) : createStory(formData)),
    onSuccess: () => {
      toast.success(editing ? "استوری بروزرسانی شد" : "استوری ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["home-stories"] });
      setEditing(null);
      setCreating(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteStory(id),
    onSuccess: () => {
      toast.success("حذف شد");
      queryClient.invalidateQueries({ queryKey: ["home-stories"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = [
    {
      key: "media",
      header: "رسانه",
      render: (row) => (
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-muted)]">
          {row.mediaType === "video" && row.video ? (
            <>
              <video src={row.video} className="h-full w-full object-cover" muted playsInline preload="metadata" />
              <Video size={12} className="absolute bottom-0 right-0 rounded-full bg-black/60 p-0.5 text-white" />
            </>
          ) : row.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageOff size={14} className="text-[var(--text-faint)]" />
          )}
        </div>
      ),
    },
    { key: "title", header: "عنوان", render: (row) => <span className="font-medium">{row.title || "—"}</span> },
    {
      key: "views",
      header: "بازدید",
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
          <Eye size={13} />
          {(row.views ?? 0).toLocaleString("fa-IR")}
        </span>
      ),
    },
    { key: "durationSeconds", header: "مدت نمایش", render: (row) => `${row.durationSeconds ?? 6} ثانیه` },
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
            queryKey={["stories-settings"]}
            fetchFn={fetchStoriesSettings}
            saveFn={saveStoriesSettings}
            label="نمایش استوری‌ها در صفحه اصلی"
          />
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">
              استوری‌ها به‌صورت یک ردیف آواتار بالای صفحه‌ی اصلی نمایش داده می‌شوند و با لمس، به‌ترتیب عدد «ترتیب» به‌صورت تمام‌صفحه پخش می‌شوند.
            </p>
            <Button onClick={() => { setEditing(null); setCreating(true); }}>
              <Plus size={16} />
              افزودن استوری
            </Button>
          </div>
          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            emptyMessage="استوری‌ای یافت نشد"
            onRowClick={(row) => { setCreating(false); setEditing(row); }}
          />
        </>
      ) : (
        <StoryForm
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
        title="حذف استوری"
        description="این استوری برای همیشه حذف می‌شود. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}

function StoryForm({ editing, isPending, onCancel, onSubmit }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(editing?.mediaType === "video" ? editing?.video || "" : editing?.image || "");
  const [previewIsVideo, setPreviewIsVideo] = useState(editing?.mediaType === "video");
  const [form, setForm] = useState({
    title: editing?.title || "",
    link: editing?.link || "",
    durationSeconds: editing?.durationSeconds ?? 6,
    order: editing?.order ?? 0,
    isPublished: editing?.isPublished ?? true,
  });

  const patch = (fields) => setForm((f) => ({ ...f, ...fields }));

  const onFilePicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewIsVideo(file.type.startsWith("video/"));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!editing && !fileRef.current?.files?.[0]) {
      toast.error("تصویر یا ویدیوی استوری الزامی است");
      return;
    }
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("link", form.link.trim());
    fd.append("durationSeconds", String(form.durationSeconds || 6));
    fd.append("order", String(form.order || 0));
    fd.append("isPublished", String(!!form.isPublished));
    if (fileRef.current?.files?.[0]) {
      fd.append("media", fileRef.current.files[0]);
    }
    onSubmit(fd);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? `ویرایش استوری: ${editing.title || "بدون عنوان"}` : "استوری جدید"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>تصویر یا ویدیوی استوری (عمودی، پیشنهاد نسبت ۹:۱۶)</Label>
          {preview ? (
            <div className="relative h-48 w-28 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
              {previewIsVideo ? (
                <video src={preview} className="h-full w-full object-cover" muted autoPlay loop playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2">
                <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>تعویض</Button>
                {editing && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => { setPreview(""); if (fileRef.current) fileRef.current.value = ""; }}
                  >
                    <X size={13} />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-48 w-28 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--brand-500)] hover:text-[var(--brand-500)]"
            >
              <ImagePlus size={18} />
              <span className="text-xs">انتخاب تصویر/ویدیو</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFilePicked} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>عنوان (اختیاری)</Label>
            <Input value={form.title} onChange={(e) => patch({ title: e.target.value })} placeholder="مثلاً: تخفیف ویژه" />
          </div>
          <div>
            <Label>لینک مقصد (اختیاری)</Label>
            <Input dir="ltr" value={form.link} onChange={(e) => patch({ link: e.target.value })} placeholder="/archive یا https://..." />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>مدت نمایش (ثانیه)</Label>
            <Input type="number" min={2} max={30} value={form.durationSeconds} onChange={(e) => patch({ durationSeconds: Number(e.target.value) })} />
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
