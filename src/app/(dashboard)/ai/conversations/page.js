"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { fetchAiConversations } from "@/lib/ai/api";
import { formatDateTime, formatNumber } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function AiConversationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["ai-conversations", page],
    queryFn: () => fetchAiConversations({ page, limit: PAGE_SIZE }),
  });

  const items = data?.items || [];
  const total = data?.total || 0;

  const columns = [
    {
      key: "startedAt",
      header: "شروع",
      render: (row) => <span className="whitespace-nowrap text-xs text-[var(--text-muted)]">{formatDateTime(row.startedAt)}</span>,
    },
    {
      key: "customer",
      header: "کاربر",
      render: (row) =>
        row.customer ? (
          <span className="text-sm text-[var(--text)]">
            {row.customer.firstName} {row.customer.lastName}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-faint)]">مهمان</span>
        ),
    },
    {
      key: "messageCount",
      header: "تعداد پیام",
      render: (row) => <span className="text-sm">{formatNumber(row.messageCount)}</span>,
    },
    {
      key: "productsSuggestedIds",
      header: "محصولات پیشنهادی",
      render: (row) => <span className="text-sm">{formatNumber(row.productsSuggestedIds?.length || 0)}</span>,
    },
    {
      key: "webSearchUsedCount",
      header: "جستجوی وب",
      render: (row) =>
        row.webSearchUsedCount > 0 ? (
          <Badge variant="info" size="sm">
            {row.webSearchUsedCount}×
          </Badge>
        ) : (
          <span className="text-xs text-[var(--text-faint)]">—</span>
        ),
    },
    {
      key: "avgResponseTimeMs",
      header: "زمان پاسخ",
      render: (row) => <span className="text-xs text-[var(--text-muted)]">{formatNumber(row.avgResponseTimeMs || 0)} ms</span>,
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <Badge variant={row.status === "active" ? "success" : "neutral"} size="sm" dot>
          {row.status === "active" ? "فعال" : "بسته‌شده"}
        </Badge>
      ),
    },
    {
      key: "lastActivityAt",
      header: "آخرین فعالیت",
      render: (row) => <span className="whitespace-nowrap text-xs text-[var(--text-muted)]">{formatDateTime(row.lastActivityAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="مکالمات دستیار هوشمند" subtitle="لیست گفتگوهای انجام‌شده با دستیار هوشمند دلیسا" />

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        emptyMessage="هنوز مکالمه‌ای ثبت نشده"
        onRowClick={(row) => router.push(`/ai/conversations/${row._id}`)}
      />

      <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{formatNumber(total)} مکالمه</span>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-1.5 disabled:opacity-40"
          >
            قبلی
          </button>
          <button
            disabled={(page + 1) * PAGE_SIZE >= total}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-1.5 disabled:opacity-40"
          >
            بعدی
          </button>
        </div>
      </div>
    </div>
  );
}
