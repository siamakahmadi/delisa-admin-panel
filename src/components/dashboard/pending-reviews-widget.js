"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquareText, ChevronLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchComments } from "@/lib/support/api";

export function PendingReviewsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-pending-reviews"],
    queryFn: () => fetchComments({ status: "pending", limit: 5 }),
    refetchInterval: 60000,
  });

  const rows = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText size={16} />
          نظرات منتظر تایید
        </CardTitle>
        <Link href="/support/comments" className="flex items-center gap-1 text-xs font-medium text-[var(--brand-600)] hover:underline">
          همه نظرات
          <ChevronLeft size={13} />
        </Link>
      </CardHeader>
      <CardContent className="divide-y divide-[var(--border)] p-0">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-[var(--text-faint)]">نظر منتظر تاییدی نیست 🎉</p>
        ) : (
          rows.map((row) => (
            <Link
              key={row.comment?._id}
              href="/support/comments"
              className="block px-4 py-3 transition-colors hover:bg-[var(--surface-muted)]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-[var(--text)]">
                  {row.comment?.userName || "کاربر"} · {row.productName}
                </p>
                {Number(row.comment?.rating) > 0 && (
                  <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-[var(--warning)]">
                    <Star size={11} fill="currentColor" />
                    {Number(row.comment.rating).toLocaleString("fa-IR")}
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-[var(--text-faint)]">{row.comment?.body}</p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
