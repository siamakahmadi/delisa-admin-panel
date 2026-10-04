"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EyeOff, ShieldBan, X } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchCommunityReports, resolveCommunityReport } from "@/lib/community/api";
import { Pager, PostPreview, PostStatusBadge, REASON_LABELS, formatDateTime } from "./shared";

export function CommunityReportsManager() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("open");
  const [page, setPage] = useState(1);
  const [banTarget, setBanTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["community-reports", status, page], queryFn: () => fetchCommunityReports({ status, page }) });

  const mutation = useMutation({
    mutationFn: ({ id, action, note }) => resolveCommunityReport(id, { action, note }),
    onSuccess: (_, { action }) => {
      toast.success(action === "dismiss" ? "گزارش بی‌مورد ثبت شد" : action === "hide" ? "پست پنهان شد" : "پست پنهان و کاربر مسدود شد");
      queryClient.invalidateQueries({ queryKey: ["community-reports"] });
      queryClient.invalidateQueries({ queryKey: ["community-stats"] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      setBanTarget(null);
    },
    onError: () => toast.error("عملیات ناموفق بود"),
  });

  const columns = [
    { key: "post", header: "پست گزارش‌شده", render: (row) => (row.post ? <PostPreview post={row.post} /> : <span className="text-[var(--text-faint)]">پست حذف شده</span>) },
    { key: "author", header: "نویسنده", render: (row) => (row.post?.author ? <span dir="ltr">@{row.post.author.username}</span> : "—") },
    {
      key: "reason",
      header: "دلیل",
      render: (row) => (
        <div>
          <Badge variant="warning" size="sm">{REASON_LABELS[row.reason] || row.reason}</Badge>
          {row.note && <p className="mt-1 max-w-[200px] text-xs text-[var(--text-muted)]">{row.note}</p>}
          <p className="mt-1 text-[11px] text-[var(--text-faint)]">توسط <span dir="ltr">@{row.reporter?.username || "?"}</span></p>
        </div>
      ),
    },
    { key: "state", header: "وضعیت پست", render: (row) => (row.post ? <PostStatusBadge status={row.post.status} /> : "—") },
    { key: "createdAt", header: "زمان", render: (row) => formatDateTime(row.createdAt) },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "open" ? (
          <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" title="بی‌مورد" onClick={() => mutation.mutate({ id: row.id, action: "dismiss" })}>
              <X size={15} />
            </Button>
            <Button variant="ghost" size="icon" title="پنهان‌کردن پست" onClick={() => mutation.mutate({ id: row.id, action: "hide" })}>
              <EyeOff size={15} className="text-[var(--warning)]" />
            </Button>
            <Button variant="ghost" size="icon" title="پنهان‌کردن + مسدودکردن نویسنده" onClick={() => setBanTarget(row)}>
              <ShieldBan size={15} className="text-[var(--danger)]" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select className="w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="open">باز</option>
          <option value="resolved">رسیدگی‌شده</option>
          <option value="dismissed">بی‌مورد</option>
        </Select>
        <p className="text-xs text-[var(--text-faint)]">با «پنهان‌کردن»، همه‌ی گزارش‌های باز همان پست هم بسته می‌شوند.</p>
      </div>

      <DataTable columns={columns} data={data?.reports ?? []} isLoading={isLoading} emptyMessage="گزارشی نیست" />
      <Pager page={page} pages={data?.pages} onChange={setPage} />

      <ConfirmDialog
        open={!!banTarget}
        onOpenChange={(open) => !open && setBanTarget(null)}
        title="مسدودکردن نویسنده"
        description="پست پنهان می‌شود و نویسنده دیگر نمی‌تواند در کامیونیتی فعالیت کند و پست‌هایش دیده نمی‌شود. بعداً از تب «کاربران» قابل برگشت است."
        confirmLabel="پنهان + مسدود"
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate({ id: banTarget.id, action: "ban", note: "نقض قوانین کامیونیتی" })}
      />
    </div>
  );
}
