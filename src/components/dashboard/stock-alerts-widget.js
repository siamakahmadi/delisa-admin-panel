"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PackageX, TrendingUp, TrendingDown } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatToman } from "@/lib/utils";

const FIELD_LABELS = { finalPrice: "قیمت نهایی", vendorPrice: "قیمت فروشنده" };

export function StockAlertsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/dashboard/alerts");
      return res.data;
    },
    refetchInterval: 60000,
  });

  const lowStock = data?.lowStock || [];
  const priceChanges = data?.recentPriceChanges || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageX size={16} />
          هشدارهای موجودی و قیمت
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <>
            <div>
              <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">موجودی کم / تمام‌شده</p>
              {lowStock.length === 0 ? (
                <p className="text-xs text-[var(--text-faint)]">موردی نیست</p>
              ) : (
                <div className="space-y-1.5">
                  {lowStock.map((item) => (
                    <Link
                      key={item.id}
                      href={item.slug ? `/products?search=${encodeURIComponent(item.productName)}` : "/products"}
                      className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-xs hover:bg-[var(--surface-muted)]"
                    >
                      <span className="truncate text-[var(--text)]">{item.productName}</span>
                      <Badge size="sm" variant={item.stock === 0 ? "danger" : "warning"}>
                        {item.stock === 0 ? "تمام‌شده" : `${item.stock.toLocaleString("fa-IR")} عدد مانده`}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">آخرین تغییرات قیمت</p>
              {priceChanges.length === 0 ? (
                <p className="text-xs text-[var(--text-faint)]">موردی نیست</p>
              ) : (
                <div className="space-y-1.5">
                  {priceChanges.map((log) => {
                    const up = Number(log.newValue) >= Number(log.oldValue);
                    return (
                      <div key={log.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-xs">
                        <span className="min-w-0 flex-1 truncate text-[var(--text)]">
                          {log.productName}
                          <span className="text-[var(--text-faint)]"> · {FIELD_LABELS[log.field] || log.field}</span>
                        </span>
                        <span className={`flex shrink-0 items-center gap-1 font-medium ${up ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {formatToman(log.newValue)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
