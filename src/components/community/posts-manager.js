"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, EyeOff, RotateCcw, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchCommunityPosts, moderateCommunityPost } from "@/lib/community/api";
import { Pager, PostPreview, PostStatusBadge, formatDateTime } from "./shared";

export function CommunityPostsManager() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: "", kind: "", reported: "", q: "" });
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const params = { page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
  const { data, isLoading } = useQuery({ queryKey: ["community-posts", params], queryFn: () => fetchCommunityPosts(params) });

  const mutation = useMutation({
    mutationFn: ({ id, status }) => moderateCommunityPost(id, { status }),
    onSuccess: (_, { status }) => {
      toast.success(status === "visible" ? "پست منتشر شد" : status === "hidden" ? "پست پنهان شد" : "پست حذف شد");
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      queryClient.invalidateQueries({ queryKey: ["community-stats"] });
      queryClient.invalidateQueries({ queryKey: ["community-reports"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("عملیات ناموفق بود"),
  });

  const change = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const columns = [
    { key: "post", header: "پست", render: (row) => <PostPreview post={row} /> },
    { key: "author", header: "نویسنده", render: (row) => (row.author ? <span dir="ltr" className={row.author.isBanned ? "text-[var(--danger)]" : ""}>@{row.author.username}</span> : "—") },
    { key: "status", header: "وضعیت", render: (row) => <PostStatusBadge status={row.status} /> },
    { key: "createdAt", header: "زمان", render: (row) => formatDateTime(row.createdAt) },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
          {row.status !== "visible" && row.status !== "deleted" && (
            <Button variant="ghost" size="icon" title="انتشار / تایید" onClick={() => mutation.mutate({ id: row.id, status: "visible" })}>
              <Check size={15} className="text-[var(--success)]" />
            </Button>
          )}
          {row.status === "deleted" && (
            <Button variant="ghost" size="icon" title="بازگردانی" onClick={() => mutation.mutate({ id: row.id, status: "visible" })}>
              <RotateCcw size={15} />
            </Button>
          )}
          {row.status === "visible" && (
            <Button variant="ghost" size="icon" title="پنهان‌کردن" onClick={() => mutation.mutate({ id: row.id, status: "hidden" })}>
              <EyeOff size={15} className="text-[var(--warning)]" />
            </Button>
          )}
          {row.status !== "deleted" && (
            <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleteTarget(row)}>
              <Trash2 size={15} className="text-[var(--danger)]" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="جستجو در متن پست‌ها…" value={filters.q} onChange={(e) => change("q", e.target.value)} />
        <Select className="w-40" value={filters.status} onChange={(e) => change("status", e.target.value)}>
          <option value="">همه وضعیت‌ها</option>
          <option value="visible">منتشرشده</option>
          <option value="pending">در انتظار تایید</option>
          <option value="hidden">پنهان</option>
          <option value="deleted">حذف‌شده</option>
        </Select>
        <Select className="w-36" value={filters.kind} onChange={(e) => change("kind", e.target.value)}>
          <option value="">پست و پاسخ</option>
          <option value="posts">فقط پست</option>
          <option value="replies">فقط پاسخ</option>
        </Select>
        <Select className="w-40" value={filters.reported} onChange={(e) => change("reported", e.target.value)}>
          <option value="">همه</option>
          <option value="true">گزارش‌شده‌ها</option>
        </Select>
      </div>

      <DataTable columns={columns} data={data?.posts ?? []} isLoading={isLoading} emptyMessage="پستی یافت نشد" />
      <Pager page={page} pages={data?.pages} onChange={setPage} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف پست"
        description="پست از کامیونیتی حذف می‌شود (در صورت نیاز از فیلتر «حذف‌شده» قابل بازگردانی است)."
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate({ id: deleteTarget.id, status: "deleted" })}
      />
    </div>
  );
}
