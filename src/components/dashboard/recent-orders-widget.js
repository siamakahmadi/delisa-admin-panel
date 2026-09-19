"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch, ChevronLeft } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatToman, formatRelativeTime } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT } from "@/lib/constants";

export function RecentOrdersWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-recent-orders"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/orders", { params: { page: 1, limit: 6 } });
      return res.data?.data || [];
    },
    refetchInterval: 30000,
  });

  const orders = data || [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <PackageSearch size={16} />
          سفارشات جدید
        </CardTitle>
        <Link href="/orders" className="flex items-center gap-1 text-xs font-medium text-[var(--brand-600)] hover:underline">
          همه سفارشات
          <ChevronLeft size={13} />
        </Link>
      </CardHeader>
      <CardContent className="divide-y divide-[var(--border)] p-0">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : orders.length === 0 ? (
          <p className="p-6 text-center text-sm text-[var(--text-faint)]">هنوز سفارشی ثبت نشده</p>
        ) : (
          orders.map((order) => (
            <Link
              key={order._id}
              href={`/orders?highlight=${order._id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-muted)]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text)]">
                  {order.customer?.name || order.customer?.phone || "مشتری مهمان"}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                  {formatToman(order.totalAmount)} · {formatRelativeTime(order.createdAt)}
                </p>
              </div>
              <Badge size="sm" variant={ORDER_STATUS_VARIANT[order.status] || "neutral"}>
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </Badge>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
