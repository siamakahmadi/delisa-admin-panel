"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound, ImagePlus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { fetchMyAuthorProfile, updateMyAuthorProfile, uploadBlogImage } from "@/lib/blog/api";

export default function AuthorProfilePage() {
  const toast = useToast();
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const author = await fetchMyAuthorProfile();
        if (cancelled) return;
        setName(author?.name || "");
        setBio(author?.bio || "");
        setAvatarUrl(author?.avatarUrl || "");
      } catch {
        if (!cancelled) toast.error("خطا در بارگذاری پروفایل نویسنده");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadAvatar(file) {
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

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyAuthorProfile({ name, bio, avatarUrl });
      toast.success("پروفایل نویسنده به‌روزرسانی شد");
    } catch (err) {
      toast.error(err?.response?.data?.message || "خطا در ذخیره پروفایل");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="پروفایل نویسندگی من" subtitle="این اطلاعات به‌عنوان نام نویسنده روی پست‌های منتشرشده در سایت نمایش داده می‌شود." />

      {loading ? (
        <Skeleton className="h-80 w-full max-w-lg" />
      ) : (
        <Card className="max-w-lg">
          <CardContent className="p-5">
            <form onSubmit={save} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-muted)] text-[var(--text-faint)]">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound size={26} />
                  )}
                </div>
                <div>
                  <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
                    <ImagePlus size={13} />
                    {uploading ? "در حال آپلود…" : "تغییر تصویر"}
                  </Button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) uploadAvatar(f);
                    }}
                  />
                </div>
              </div>

              <div>
                <Label>نام نمایشی</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام شما" />
              </div>

              <div>
                <Label>بیوگرافی کوتاه</Label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="چند جمله درباره خودتان…"
                  className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
                />
              </div>

              <Button type="submit" loading={saving}>
                ذخیره تغییرات
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
