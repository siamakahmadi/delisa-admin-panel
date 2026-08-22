"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, FolderTree, Tags, UserRound, Pencil, Rocket, PauseCircle, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { fetchPosts, deletePost, publishPost, unpublishPost } from "@/lib/blog/api";

const STATUS_TABS = [
  { value: "", label: "همه" },
  { value: "published", label: "منتشر شده" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "archived", label: "بایگانی" },
];

const STATUS_VARIANT = { published: "success", draft: "warning", archived: "neutral", scheduled: "info" };
const STATUS_LABEL = { published: "منتشر شده", draft: "پیش‌نویس", archived: "بایگانی", scheduled: "زمان‌بندی شده" };

export default function BlogListPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["blog-posts", { status, q, page }],
    queryFn: () => fetchPosts({ page, limit, status: status || undefined, q: q || undefined }),
  });

  const posts = data?.posts ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const actionMutation = useMutation({
    mutationFn: ({ action, post }) => {
      if (action === "publish") return publishPost(post._id);
      if (action === "unpublish") return unpublishPost(post._id);
      if (action === "delete") return deletePost(post._id);
      return Promise.resolve();
    },
    onSuccess: (_, { action }) => {
      toast.success(action === "publish" ? "پست منتشر شد" : action === "unpublish" ? "انتشار پست لغو شد" : "پست حذف شد");
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e?.response?.data?.message || "عملیات ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: "پست",
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
              {row.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.coverUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text)]">{row.title || "(بدون عنوان)"}</p>
              <p className="truncate text-xs text-[var(--text-faint)]">{row.excerpt}</p>
            </div>
          </div>
        ),
      },
      { key: "author", header: "نویسنده", render: (row) => row.author?.name || "-" },
      { key: "categories", header: "دسته", render: (row) => (row.categories || []).map((c) => c.name).join("، ") || "-" },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => {
          const isScheduled = row.status === "published" && row.publishedAt && new Date(row.publishedAt) > new Date();
          const key = isScheduled ? "scheduled" : row.status;
          return (
            <Badge variant={STATUS_VARIANT[key] || "neutral"} size="sm" dot>
              {STATUS_LABEL[key] || key}
            </Badge>
          );
        },
      },
      { key: "publishedAt", header: "تاریخ انتشار", render: (row) => (row.publishedAt ? formatDate(row.publishedAt) : "-") },
      { key: "views", header: "بازدید", render: (row) => (typeof row.views === "number" ? row.views.toLocaleString("fa-IR") : "-") },
      {
        key: "actions",
        header: "",
        render: (row) => (
          <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" title="ویرایش" onClick={() => router.push(`/content/blog/${row._id}`)}>
              <Pencil size={14} />
            </Button>
            {row.status === "published" ? (
              <Button variant="ghost" size="icon" title="لغو انتشار" onClick={() => actionMutation.mutate({ action: "unpublish", post: row })}>
                <PauseCircle size={14} className="text-[var(--warning)]" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" title="انتشار" onClick={() => actionMutation.mutate({ action: "publish", post: row })}>
                <Rocket size={14} className="text-[var(--success)]" />
              </Button>
            )}
            <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleteTarget(row)}>
              <Trash2 size={14} className="text-[var(--danger)]" />
            </Button>
          </div>
        ),
      },
    ],
    [router, actionMutation]
  );

  return (
    <div>
      <PageHeader
        title="بلاگ"
        subtitle="مدیریت پست‌های بلاگ، دسته‌بندی‌ها و تگ‌ها"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/content/blog/categories")}>
              <FolderTree size={15} />
              دسته‌بندی‌ها
            </Button>
            <Button variant="outline" onClick={() => router.push("/content/blog/tags")}>
              <Tags size={15} />
              تگ‌ها
            </Button>
            <Button variant="outline" onClick={() => router.push("/content/blog/author-profile")}>
              <UserRound size={15} />
              پروفایل نویسنده
            </Button>
            <Button onClick={() => router.push("/content/blog/new")}>
              <Plus size={15} />
              پست جدید
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map((t) => (
              <Button
                key={t.value}
                size="sm"
                variant={status === t.value ? "secondary" : "ghost"}
                onClick={() => {
                  setStatus(t.value);
                  setPage(1);
                }}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="جستجو در عنوان یا محتوا…"
              className="w-64"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setQ(qInput);
                  setPage(1);
                }
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                setQ(qInput);
                setPage(1);
              }}
            >
              جستجو
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={posts}
        isLoading={isLoading}
        emptyMessage="هیچ پستی یافت نشد"
        onRowClick={(row) => router.push(`/content/blog/${row._id}`)}
        pagination={{ page, pageCount, onPageChange: setPage }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف پست"
        description={deleteTarget ? `آیا از حذف «${deleteTarget.title}» مطمئن هستید؟` : ""}
        loading={actionMutation.isPending}
        onConfirm={() => actionMutation.mutate({ action: "delete", post: deleteTarget })}
      />
    </div>
  );
}
