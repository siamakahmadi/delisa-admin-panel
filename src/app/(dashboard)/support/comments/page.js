"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, MessageSquare, Clock, CheckCircle2, Check, X, Trash2, Eye, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDateTime } from "@/lib/utils";
import {
  fetchComments,
  setCommentStatus,
  deleteComment,
  bulkApproveComments,
} from "@/lib/support/api";
import { COMMENT_STATUS_LABELS, COMMENT_STATUS_VARIANTS } from "@/lib/support/constants";

function StarRating({ value }) {
  if (!value) return <span className="text-xs text-[var(--text-faint)]">-</span>;
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < value ? "fill-[var(--warning)] text-[var(--warning)]" : "text-[var(--border)]"}
        />
      ))}
    </div>
  );
}

export default function CommentsModerationPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [selected, setSelected] = useState({});
  const [detail, setDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const perPage = 20;

  const handleTabChange = (value) => {
    setTab(value);
    setPage(1);
    setSelected({});
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    setSelected({});
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-comments", tab, page],
    queryFn: () => fetchComments({ status: tab, page, limit: perPage }),
  });

  const { data: pendingTotalData } = useQuery({
    queryKey: ["admin-comments-count", "pending"],
    queryFn: () => fetchComments({ status: "pending", page: 1, limit: 1 }),
  });
  const { data: allTotalData } = useQuery({
    queryKey: ["admin-comments-count", "all"],
    queryFn: () => fetchComments({ status: "all", page: 1, limit: 1 }),
  });

  const total = data?.total || 0;
  const pendingCount = pendingTotalData?.total ?? 0;
  const allCount = allTotalData?.total ?? 0;
  const approvedCount = Math.max(0, allCount - pendingCount);

  const filteredRows = useMemo(() => {
    const rows = data?.data || [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.productName?.toLowerCase().includes(q) || r.comment?.userName?.toLowerCase().includes(q)
    );
  }, [data, debouncedSearch]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
    queryClient.invalidateQueries({ queryKey: ["admin-comments-count"] });
  };

  const actionMutation = useMutation({
    mutationFn: ({ productId, commentId, action }) => setCommentStatus(productId, commentId, action),
    onSuccess: () => {
      invalidateAll();
      toast.success("انجام شد");
    },
    onError: () => toast.error("عملیات ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ productId, commentId }) => deleteComment(productId, commentId),
    onSuccess: () => {
      invalidateAll();
      setDeleteTarget(null);
      toast.success("نظر حذف شد");
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const bulkMutation = useMutation({
    mutationFn: (items) => bulkApproveComments(items),
    onSuccess: () => {
      invalidateAll();
      setSelected({});
      toast.success("نظرات انتخاب‌شده تایید شدند");
    },
    onError: () => toast.error("تایید دسته‌ای ناموفق بود"),
  });

  const selectedItems = Object.keys(selected)
    .filter((k) => selected[k])
    .map((k) => {
      const [productId, commentId] = k.split("|");
      return { productId, commentId };
    });

  const allSelected = filteredRows.length > 0 && filteredRows.every((r) => selected[`${r.productId}|${r.comment._id}`]);

  const columns = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--brand-600)]"
          checked={allSelected}
          onChange={(e) => {
            const checked = e.target.checked;
            setSelected((prev) => {
              const next = { ...prev };
              filteredRows.forEach((r) => {
                next[`${r.productId}|${r.comment._id}`] = checked;
              });
              return next;
            });
          }}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--brand-600)]"
          checked={!!selected[`${row.productId}|${row.comment._id}`]}
          onChange={(e) =>
            setSelected((prev) => ({ ...prev, [`${row.productId}|${row.comment._id}`]: e.target.checked }))
          }
        />
      ),
    },
    {
      key: "date",
      header: "تاریخ",
      render: (row) => <span className="whitespace-nowrap text-xs text-[var(--text-muted)]">{formatDateTime(row.comment.createdAt)}</span>,
    },
    {
      key: "product",
      header: "محصول",
      render: (row) => (
        <div className="min-w-0">
          <p className="max-w-[220px] truncate text-sm font-medium text-[var(--text)]">{row.productName}</p>
          <a
            href={`/products/${row.productId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--brand-600)] hover:underline"
          >
            مشاهده محصول <ExternalLink size={11} />
          </a>
        </div>
      ),
    },
    { key: "author", header: "نویسنده", render: (row) => <span className="text-sm">{row.comment.userName || "-"}</span> },
    { key: "rating", header: "امتیاز", render: (row) => <StarRating value={row.comment.rating} /> },
    {
      key: "body",
      header: "متن",
      render: (row) => <p className="line-clamp-2 max-w-[280px] text-xs text-[var(--text-muted)]">{row.comment.body}</p>,
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <StatusBadge
          status={row.comment.approved ? "approved" : "pending"}
          labels={COMMENT_STATUS_LABELS}
          variants={COMMENT_STATUS_VARIANTS}
        />
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="جزئیات" onClick={() => setDetail(row)}>
            <Eye size={15} />
          </Button>
          {row.comment.approved ? (
            <Button
              variant="ghost"
              size="icon"
              title="لغو تایید"
              onClick={() => actionMutation.mutate({ productId: row.productId, commentId: row.comment._id, action: "reject" })}
            >
              <X size={15} className="text-[var(--warning)]" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              title="تایید"
              onClick={() => actionMutation.mutate({ productId: row.productId, commentId: row.comment._id, action: "approve" })}
            >
              <Check size={15} className="text-[var(--success)]" />
            </Button>
          )}
          <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleteTarget(row)}>
            <Trash2 size={15} className="text-[var(--danger)]" />
          </Button>
        </div>
      ),
    },
  ];

  const pageCount = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <PageHeader title="نظرات محصولات" subtitle="مدیریت و تایید نظرات و امتیازهای ثبت‌شده روی محصولات" />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={MessageSquare} label="کل نظرات" value={allCount.toLocaleString("fa-IR")} color="blue" />
        <StatCard icon={Clock} label="در انتظار تایید" value={pendingCount.toLocaleString("fa-IR")} color="amber" />
        <StatCard icon={CheckCircle2} label="تایید شده" value={approvedCount.toLocaleString("fa-IR")} color="teal" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="pending">در انتظار تایید</TabsTrigger>
            <TabsTrigger value="approved">تایید شده</TabsTrigger>
            <TabsTrigger value="all">همه</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          {selectedItems.length > 0 && (
            <Button variant="secondary" loading={bulkMutation.isPending} onClick={() => bulkMutation.mutate(selectedItems)}>
              تایید {selectedItems.length.toLocaleString("fa-IR")} مورد انتخاب‌شده
            </Button>
          )}
          <Input
            className="w-56"
            placeholder="جستجوی محصول یا نویسنده..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredRows}
        isLoading={isLoading}
        emptyMessage="نظری یافت نشد"
        rowKey={(r) => `${r.productId}|${r.comment._id}`}
        pagination={{ page, pageCount, onPageChange: handlePageChange }}
      />

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          {detail && (
            <div>
              <DialogTitle>جزئیات نظر</DialogTitle>
              <DialogDescription asChild>
                <div className="mt-3 space-y-3 text-sm text-[var(--text)]">
                  <div>
                    <span className="text-xs text-[var(--text-faint)]">محصول: </span>
                    {detail.productName}
                  </div>
                  <div>
                    <span className="text-xs text-[var(--text-faint)]">نویسنده: </span>
                    {detail.comment.userName || "-"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-faint)]">امتیاز: </span>
                    <StarRating value={detail.comment.rating} />
                  </div>
                  <div>
                    <span className="text-xs text-[var(--text-faint)]">تاریخ: </span>
                    {formatDateTime(detail.comment.createdAt)}
                  </div>
                  <div className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3 text-[var(--text)]">
                    {detail.comment.body}
                  </div>
                </div>
              </DialogDescription>
              <div className="mt-5 flex justify-end gap-2">
                {detail.comment.approved ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      actionMutation.mutate({ productId: detail.productId, commentId: detail.comment._id, action: "reject" });
                      setDetail(null);
                    }}
                  >
                    لغو تایید
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      actionMutation.mutate({ productId: detail.productId, commentId: detail.comment._id, action: "approve" });
                      setDetail(null);
                    }}
                  >
                    تایید
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={() => {
                    setDeleteTarget(detail);
                    setDetail(null);
                  }}
                >
                  حذف
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="حذف نظر"
        description="این نظر برای همیشه حذف می‌شود. این عملیات قابل بازگشت نیست."
        loading={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate({ productId: deleteTarget.productId, commentId: deleteTarget.comment._id })
        }
      />
    </div>
  );
}
