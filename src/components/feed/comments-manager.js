"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchFeedComments, deleteFeedComment } from "@/lib/feed/api";

export function FeedCommentsManager() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["feed-comments", page], queryFn: () => fetchFeedComments(page) });
  const comments = data?.comments ?? [];
  const total = data?.total ?? 0;
  const perPage = data?.perPage ?? 30;

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFeedComment(id),
    onSuccess: () => {
      toast.success("کامنت حذف شد");
      queryClient.invalidateQueries({ queryKey: ["feed-comments"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = [
    { key: "customer", header: "کاربر", render: (row) => row.customer?.name || row.customer?.phone || "—" },
    { key: "post", header: "پست", render: (row) => <span className="max-w-[220px] truncate text-[var(--text-muted)]">{row.post?.text || `پست ${row.post?.type || ""}`}</span> },
    { key: "text", header: "متن کامنت", render: (row) => <span className="max-w-[280px] truncate">{row.text}</span> },
    { key: "createdAt", header: "تاریخ", render: (row) => new Date(row.createdAt).toLocaleDateString("fa-IR") },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
          <Trash2 size={15} className="text-[var(--danger)]" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        کامنت‌ها بلافاصله بعد از ارسال روی فید نمایش داده می‌شوند (بدون تأیید ادمین) — این لیست فقط برای حذف موارد نامناسب است.
      </p>
      <DataTable columns={columns} data={comments} isLoading={isLoading} emptyMessage="کامنتی یافت نشد" />
      {total > perPage && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>قبلی</Button>
          <span className="text-xs text-[var(--text-muted)]">صفحه {page} از {Math.ceil(total / perPage)}</span>
          <Button variant="outline" size="sm" disabled={page * perPage >= total} onClick={() => setPage((p) => p + 1)}>بعدی</Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف کامنت"
        description="این کامنت برای همیشه حذف می‌شود. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
