"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Archive, Eye, CalendarRange, X, ShoppingBag, Clock, CalendarDays, Wallet, LineChart } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { StatusQuickSelect } from "@/components/orders/status-quick-select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useToast } from "@/components/ui/toast";
import { cn, formatDateTime, formatNumber, formatToman, startOfMonth, startOfToday, startOfWeek } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT, ORDER_STATUS_OPTIONS } from "@/lib/constants";

const LIMIT = 20;

function useOrdersCount(params) {
  return useQuery({
    queryKey: ["orders-count", params],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/orders", { params: { ...params, page: 1, limit: 1 } });
      return res.data?.total ?? 0;
    },
  });
}

export default function OrdersPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const todayCount = useOrdersCount({ startDate: startOfToday() });
  const weekCount = useOrdersCount({ startDate: startOfWeek() });
  const monthCount = useOrdersCount({ startDate: startOfMonth() });
  const pendingCount = useOrdersCount({ status: "pending" });

  const { data, isLoading } = useQuery({
    queryKey: ["orders", { search: debouncedSearch, status, startDate, endDate, page }],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/orders", {
        params: {
          page,
          limit: LIMIT,
          search: debouncedSearch || undefined,
          status: status || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      return res.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) => apiClient.patch(`/api/admin/orders/${id}/status`, { status: nextStatus }),
    onSuccess: () => {
      toast.success("وضعیت سفارش بروزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-count"] });
    },
    onError: (err) => toast.error("خطا", err?.response?.data?.error || "تغییر وضعیت ناموفق بود"),
  });

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(Math.ceil(total / LIMIT), 1);

  const hasDateFilter = Boolean(startDate || endDate);

  const columns = useMemo(
    () => [
      {
        key: "orderCode",
        header: "شناسه سفارش",
        render: (row) => <span className="font-mono text-xs">{row.orderCode || row._id?.slice(-8)}</span>,
      },
      {
        key: "customer",
        header: "نام و شماره تلفن",
        render: (row) => (
          <div>
            <div className="font-medium text-[var(--text)]">{row.customer?.name || "بدون نام"}</div>
            <div className="text-xs text-[var(--text-faint)]" dir="ltr">
              {row.customer?.phone || ""}
            </div>
          </div>
        ),
      },
      {
        key: "finalPrice",
        header: "مبلغ نهایی",
        sortable: true,
        render: (row) => formatToman(row.finalPrice ?? row.totalPrice),
      },
      {
        key: "status",
        header: "وضعیت سفارش",
        render: (row) => (
          <StatusQuickSelect
            status={row.status}
            disabled={statusMutation.isPending}
            onChange={(nextStatus) => statusMutation.mutate({ id: row._id, nextStatus })}
          />
        ),
      },
      {
        key: "createdAt",
        header: "تاریخ ثبت سفارش",
        sortable: true,
        render: (row) => formatDateTime(row.createdAt),
      },
      {
        key: "actions",
        header: "عملیات سریع",
        render: (row) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/orders/${row._id}`);
            }}
          >
            <Eye size={16} />
          </Button>
        ),
      },
    ],
    [statusMutation, router]
  );

  return (
    <div>
      <PageHeader
        title="سفارشات"
        subtitle={`${formatNumber(total)} سفارش`}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => router.push("/orders/analytics")}>
              <LineChart size={16} />
              آنالیتیکس فروش
            </Button>
            <Button variant="outline" onClick={() => router.push("/orders/abandoned")}>
              <Archive size={16} />
              سفارشات رها‌شده
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={CalendarDays} label="سفارشات امروز" value={formatNumber(todayCount.data)} color="violet" isLoading={todayCount.isLoading} />
        <StatCard icon={ShoppingBag} label="سفارشات این هفته" value={formatNumber(weekCount.data)} color="blue" isLoading={weekCount.isLoading} />
        <StatCard icon={Wallet} label="سفارشات این ماه" value={formatNumber(monthCount.data)} color="pink" isLoading={monthCount.isLoading} />
        <StatCard icon={Clock} label="در انتظار پرداخت" value={formatNumber(pendingCount.data)} color="amber" isLoading={pendingCount.isLoading} />
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              setStatus("");
              setPage(1);
            }}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
              status === "" ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            )}
          >
            همه وضعیت‌ها
          </button>
          {ORDER_STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s === status ? "" : s);
                setPage(1);
              }}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                status === s ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              )}
            >
              {ORDER_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <Input
              placeholder="جستجوی کد سفارش، نام یا شماره مشتری..."
              className="pr-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <CalendarRange size={15} className="shrink-0 text-[var(--text-faint)]" />
            <div className="w-36">
              <JalaliDatePicker
                value={startDate}
                onChange={(v) => {
                  setStartDate(v);
                  setPage(1);
                }}
                placeholder="از تاریخ"
              />
            </div>
            <span className="text-xs text-[var(--text-faint)]">تا</span>
            <div className="w-36">
              <JalaliDatePicker
                value={endDate}
                onChange={(v) => {
                  setEndDate(v);
                  setPage(1);
                }}
                placeholder="تا تاریخ"
              />
            </div>
            {hasDateFilter && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
                className="text-[var(--text-faint)] hover:text-[var(--danger)]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        emptyMessage="سفارشی یافت نشد"
        onRowClick={(row) => router.push(`/orders/${row._id}`)}
        pagination={{ page, pageCount, onPageChange: setPage }}
      />
    </div>
  );
}
