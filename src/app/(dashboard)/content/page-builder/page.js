"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, Smartphone, Flag, Plus, Pencil, Eye, Rocket, PauseCircle, Trash2 } from "lucide-react";
import * as pb from "@/lib/page-builder/api";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate, slugify } from "@/lib/utils";

function getPreviewPath(page) {
  // homeMobile has no URL of its own — it's the same / as home, just served
  // to mobile-width requests (see back_end's GET /api/cms/pages/home/mobile
  // and delisa-customer/src/pages/index.js).
  return page.type === "home" || page.type === "homeMobile"
    ? "/"
    : `/landing/${page.slug || ""}`;
}

export default function PageBuilderListPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["cms-pages", { filterType, filterStatus }],
    queryFn: async () => {
      const res = await pb.fetchPages({ type: filterType || undefined, published: filterStatus || undefined });
      return Array.isArray(res) ? res : res?.pages || [];
    },
  });

  const pages = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => (p.title || "").toLowerCase().includes(q) || (p.slug || "").toLowerCase().includes(q) || (p.internalName || "").toLowerCase().includes(q));
  }, [pages, search]);

  const stats = useMemo(() => {
    const total = pages.length;
    const published = pages.filter((p) => p.status === "published").length;
    const homeCount = pages.filter((p) => p.type === "home" || p.type === "homeMobile").length;
    return { total, published, draft: total - published, homeCount };
  }, [pages]);

  const actionMutation = useMutation({
    mutationFn: ({ action, page }) => {
      const id = page._id || page.id || page.slug;
      if (action === "publish") return pb.publishPage(id);
      if (action === "unpublish") return pb.unpublishPage(id);
      if (action === "delete") return pb.deletePage(id);
      return Promise.resolve();
    },
    onSuccess: (_, { action }) => {
      toast.success(action === "publish" ? "صفحه منتشر شد" : action === "unpublish" ? "انتشار صفحه لغو شد" : "صفحه حذف شد");
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("عملیات ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: "صفحه",
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-muted)] text-[var(--text-muted)]">
              {row.type === "home" ? (
                <Home size={14} />
              ) : row.type === "homeMobile" ? (
                <Smartphone size={14} />
              ) : (
                <Flag size={14} />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text)]">{row.title || row.internalName || row.slug}</p>
              <p className="truncate text-xs text-[var(--text-faint)]">
                {row.type === "home"
                  ? "صفحه اصلی (دسکتاپ)"
                  : row.type === "homeMobile"
                  ? "صفحه اصلی (موبایل)"
                  : `لندینگ ${row.slug || ""}`}
              </p>
            </div>
          </div>
        ),
      },
      { key: "path", header: "آدرس", render: (row) => <code dir="ltr" className="text-xs text-[var(--text-muted)]">{getPreviewPath(row)}</code> },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => {
          const isPublished = row.status === "published" || !!row.publishedAt;
          return isPublished ? (
            <Badge variant="success" size="sm" dot>منتشرشده</Badge>
          ) : (
            <Badge variant="neutral" size="sm" dot>پیش‌نویس</Badge>
          );
        },
      },
      { key: "updatedAt", header: "به‌روزرسانی", render: (row) => formatDate(row.updatedAt || row.publishedAt) },
      {
        key: "actions",
        header: "",
        render: (row) => {
          const isPublished = row.status === "published" || !!row.publishedAt;
          return (
            <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" title="ویرایش" onClick={() => router.push(`/content/page-builder/${row._id || row.id}`)}>
                <Pencil size={14} />
              </Button>
              <Button variant="ghost" size="icon" title="مشاهده" onClick={() => window.open(getPreviewPath(row), "_blank", "noopener,noreferrer")}>
                <Eye size={14} />
              </Button>
              {isPublished ? (
                <Button variant="ghost" size="icon" title="لغو انتشار" onClick={() => actionMutation.mutate({ action: "unpublish", page: row })}>
                  <PauseCircle size={14} className="text-[var(--warning)]" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" title="انتشار" onClick={() => actionMutation.mutate({ action: "publish", page: row })}>
                  <Rocket size={14} className="text-[var(--success)]" />
                </Button>
              )}
              <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleteTarget(row)}>
                <Trash2 size={14} className="text-[var(--danger)]" />
              </Button>
            </div>
          );
        },
      },
    ],
    [router, actionMutation]
  );

  return (
    <div>
      <PageHeader
        title="صفحه‌ساز"
        subtitle="مدیریت صفحه اصلی و لندینگ‌پیج‌های ساخته‌شده با صفحه‌ساز"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            صفحه جدید
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="کل صفحات" value={stats.total} />
        <StatCard label="منتشرشده" value={stats.published} />
        <StatCard label="پیش‌نویس" value={stats.draft} />
        <StatCard label="صفحه اصلی" value={stats.homeCount} />
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input placeholder="جستجو در عنوان، اسلاگ یا نام داخلی..." className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">همه وضعیت‌ها</option>
          <option value="true">منتشرشده</option>
          <option value="false">پیش‌نویس</option>
        </Select>
        <Select className="w-40" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">همه انواع</option>
          <option value="home">صفحه اصلی (دسکتاپ)</option>
          <option value="homeMobile">صفحه اصلی (موبایل)</option>
          <option value="landing">لندینگ</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyMessage="هنوز صفحه‌ای نساخته‌اید"
        onRowClick={(row) => router.push(`/content/page-builder/${row._id || row.id}`)}
      />

      <CreatePageDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(page) => router.push(`/content/page-builder/${page._id || page.id}`)} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف صفحه"
        description="این عملیات قابل بازگشت نیست. مطمئنید؟"
        loading={actionMutation.isPending}
        onConfirm={() => actionMutation.mutate({ action: "delete", page: deleteTarget })}
      />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xl font-bold text-[var(--text)]">{(value ?? 0).toLocaleString("fa-IR")}</p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{label}</p>
      </CardContent>
    </Card>
  );
}

function CreatePageDialog({ open, onOpenChange, onCreated }) {
  const toast = useToast();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>ایجاد صفحه جدید</DialogTitle>
        {open && (
          <CreatePageForm
            onClose={() => onOpenChange(false)}
            onCreated={(page) => {
              toast.success("صفحه ساخته شد");
              onCreated(page);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreatePageForm({ onClose, onCreated }) {
  const toast = useToast();
  const [type, setType] = useState("landing");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [internalName, setInternalName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isFixedSlugType = type === "home" || type === "homeMobile";
  const finalSlug = type === "home" ? "home" : type === "homeMobile" ? "home-mobile" : slug;

  const handleTitleChange = (v) => {
    setTitle(v);
    if (!slugTouched && type === "landing") setSlug(slugify(v));
  };

  const switchType = (next) => {
    setType(next);
    if (next === "home") {
      setSlugTouched(true);
      setSlug("home");
    } else if (next === "homeMobile") {
      setSlugTouched(true);
      setSlug("home-mobile");
    } else {
      setSlugTouched(false);
      setSlug(slugify(title));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (type === "landing" && !finalSlug) {
      setError("برای لندینگ، اسلاگ لازم است.");
      return;
    }
    if (type === "landing" && (finalSlug === "home" || finalSlug === "home-mobile")) {
      setError(`اسلاگ "${finalSlug}" فقط مخصوص صفحه اصلی است.`);
      return;
    }
    setLoading(true);
    try {
      const defaultTitle =
        type === "home" ? "صفحه اصلی" : type === "homeMobile" ? "صفحه اصلی (موبایل)" : finalSlug;
      const payload = { type, title: title || defaultTitle, slug: finalSlug };
      if (internalName.trim()) payload.internalName = internalName.trim();
      const res = await pb.createPage(payload);
      onCreated(res.page || res);
    } catch (err) {
      setError(err?.response?.data?.message || "خطا در ساخت صفحه");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <Label>نوع صفحه</Label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => switchType("home")}
            className={`rounded-[var(--radius-md)] border p-3 text-start text-xs ${type === "home" ? "border-[var(--brand-500)] bg-[var(--brand-50)]" : "border-[var(--border)]"}`}
          >
            <Home size={16} className="mb-1 text-[var(--text-muted)]" />
            <p className="font-medium text-[var(--text)]">صفحه اصلی</p>
            <p className="text-[var(--text-faint)]">نسخه دسکتاپ /</p>
          </button>
          <button
            type="button"
            onClick={() => switchType("homeMobile")}
            className={`rounded-[var(--radius-md)] border p-3 text-start text-xs ${type === "homeMobile" ? "border-[var(--brand-500)] bg-[var(--brand-50)]" : "border-[var(--border)]"}`}
          >
            <Smartphone size={16} className="mb-1 text-[var(--text-muted)]" />
            <p className="font-medium text-[var(--text)]">صفحه اصلی موبایل</p>
            <p className="text-[var(--text-faint)]">همون / با چیدمان موبایل</p>
          </button>
          <button
            type="button"
            onClick={() => switchType("landing")}
            className={`rounded-[var(--radius-md)] border p-3 text-start text-xs ${type === "landing" ? "border-[var(--brand-500)] bg-[var(--brand-50)]" : "border-[var(--border)]"}`}
          >
            <Flag size={16} className="mb-1 text-[var(--text-muted)]" />
            <p className="font-medium text-[var(--text)]">لندینگ پیج</p>
            <p className="text-[var(--text-faint)]">در /landing/اسلاگ نمایش داده می‌شود</p>
          </button>
        </div>
      </div>

      <div>
        <Label>عنوان</Label>
        <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder={type === "home" ? "مثال: صفحه اصلی دلیسا" : "مثال: جشنواره محصولات آنوا"} autoFocus />
      </div>

      <div>
        <Label>اسلاگ {isFixedSlugType && <span className="text-[var(--text-faint)]">(خودکار تعیین می‌شود)</span>}</Label>
        <Input
          dir="ltr"
          value={finalSlug}
          readOnly={isFixedSlugType}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          placeholder={isFixedSlugType ? finalSlug : "anua-sale"}
          className={isFixedSlugType ? "opacity-60" : ""}
        />
      </div>

      <div>
        <Label>نام داخلی (اختیاری)</Label>
        <Input value={internalName} onChange={(e) => setInternalName(e.target.value)} placeholder="مثال: لندینگ کمپین تابستان" />
      </div>

      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          انصراف
        </Button>
        <Button type="submit" loading={loading}>
          ساخت و ورود به ویرایشگر
        </Button>
      </div>
    </form>
  );
}
