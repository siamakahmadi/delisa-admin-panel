"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, CalendarRange, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchTransactions } from "@/lib/financial/api";
import { formatToman, formatDateTime } from "@/lib/utils";

const LIMIT = 25;

const PAYMENT_METHOD_LABELS = {
  zarinpal: "زرین‌پال",
  torobpay: "تروب‌پی",
  wallet: "کیف پول",
  free: "رایگان",
  offline: "آفلاین",
};

const PAYMENT_STATUS_VARIANT = { success: "success", pending: "warning", failed: "danger" };
const PAYMENT_STATUS_LABELS = { success: "موفق", pending: "در انتظار", failed: "ناموفق" };

export default function TransactionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const params = {
    page,
    limit: LIMIT,
    search: debouncedSearch || undefined,
    paymentStatus: paymentStatus || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", params],
    queryFn: () => fetchTransactions(params),
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
        header: "مشتری",
        render: (row) => (
          <div>
            <div className="font-medium text-[var(--text)]">{row.customer?.name || "بدون نام"}</div>
            <div className="text-xs text-[var(--text-faint)]" dir="ltr">{row.customer?.phone || ""}</div>
          </div>
        ),
      },
      {
        key: "method",
        header: "روش پرداخت",
        render: (row) => PAYMENT_METHOD_LABELS[row.payment?.method] || row.payment?.method || "—",
      },
      {
        key: "amount",
        header: "مبلغ",
        render: (row) => formatToman(row.payment?.amount ?? row.finalPrice),
      },
      {
        key: "paymentStatus",
        header: "وضعیت پرداخت",
        render: (row) => (
          <Badge variant={PAYMENT_STATUS_VARIANT[row.payment?.status] || "neutral"} size="sm" dot>
            {PAYMENT_STATUS_LABELS[row.payment?.status] || row.payment?.status || "—"}
          </Badge>
        ),
      },
      {
        key: "paidAt",
        header: "تاریخ پرداخت",
        render: (row) => (row.payment?.paidAt ? formatDateTime(row.payment.paidAt) : "—"),
      },
      {
        key: "refId",
        header: "کد پیگیری",
        render: (row) => <span className="font-mono text-xs" dir="ltr">{row.payment?.refId || "—"}</span>,
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader title="تراکنش‌های مشتریان" subtitle={`${total.toLocaleString("fa-IR")} تراکنش`} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <Input
            placeholder="جستجوی کد سفارش، نام یا شماره مشتری..."
            className="pr-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="w-44">
          <Select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}>
            <option value="">همه وضعیت‌های پرداخت</option>
            <option value="success">موفق</option>
            <option value="pending">در انتظار</option>
            <option value="failed">ناموفق</option>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarRange size={15} className="shrink-0 text-[var(--text-faint)]" />
          <div className="w-36">
            <JalaliDatePicker value={startDate} onChange={(v) => { setStartDate(v); setPage(1); }} placeholder="از تاریخ" />
          </div>
          <span className="text-xs text-[var(--text-faint)]">تا</span>
          <div className="w-36">
            <JalaliDatePicker value={endDate} onChange={(v) => { setEndDate(v); setPage(1); }} placeholder="تا تاریخ" />
          </div>
          {hasDateFilter && (
            <button onClick={() => { setStartDate(""); setEndDate(""); setPage(1); }} className="text-[var(--text-faint)] hover:text-[var(--danger)]">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        emptyMessage="تراکنشی یافت نشد"
        onRowClick={(row) => router.push(`/orders/${row._id}`)}
        pagination={{ page, pageCount, onPageChange: setPage }}
      />
    </div>
  );
}
