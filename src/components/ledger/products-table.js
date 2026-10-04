"use client";

import { useMemo } from "react";
import { ImageOff } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatToman, cn } from "@/lib/utils";

/* bought / sold / remaining per product. Sales are matched from real paid
   orders after the first purchase; shared products are split by supplied qty. */
export function LedgerProductsTable({ rows, isLoading, showSupplier = true }) {
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "کالا",
        sortable: true,
        render: (r) => (
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--surface-muted)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {r.image ? <img src={r.image} alt="" className="h-full w-full object-cover" /> : <ImageOff size={14} className="text-[var(--text-faint)]" />}
            </span>
            <span className="max-w-[220px] truncate font-medium" title={r.name}>{r.name}</span>
          </div>
        ),
      },
      ...(showSupplier ? [{ key: "supplierName", header: "تأمین‌کننده", sortable: true }] : []),
      { key: "purchasedQty", header: "خریده‌شده", sortable: true, render: (r) => <span className="tabular-nums">{formatNumber(r.purchasedQty)}</span> },
      { key: "avgCost", header: "میانگین قیمت خرید", sortable: true, render: (r) => <span className="tabular-nums">{formatToman(r.avgCost)}</span> },
      { key: "spent", header: "جمع خرید", sortable: true, render: (r) => <span className="tabular-nums">{formatToman(r.spent)}</span> },
      {
        key: "soldQty",
        header: "فروخته‌شده",
        sortable: true,
        render: (r) => (
          <span className="tabular-nums">
            {formatNumber(r.soldQty)}
            {r.oversold && <Badge variant="warning" size="sm" className="mr-1" title="فروش از مجموع خریدهای ثبت‌شده بیشتر است؛ احتمالاً بخشی از موجودی را قبل از ثبت در این دفتر داشته‌ای">بیش از خرید</Badge>}
          </span>
        ),
      },
      { key: "revenue", header: "مبلغ فروش", sortable: true, render: (r) => <span className="tabular-nums">{formatToman(r.revenue)}</span> },
      {
        key: "remainingQty",
        header: "باقی‌مانده",
        sortable: true,
        render: (r) => (
          <div className="tabular-nums">
            {formatNumber(r.remainingQty)}
            <div className="text-[11px] text-[var(--text-faint)]">{formatToman(r.remainingValue)}</div>
          </div>
        ),
      },
      {
        key: "profit",
        header: "سود تخمینی",
        sortable: true,
        render: (r) => (
          <span className={cn("tabular-nums font-medium", r.profit > 0 ? "text-[var(--success)]" : r.profit < 0 ? "text-[var(--danger)]" : "")}>
            {r.profit < 0 ? "−" : ""}{formatToman(Math.abs(r.profit))}
          </span>
        ),
      },
    ],
    [showSupplier]
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      rowKey={(r) => `${r.productId}-${r.supplierId}`}
      emptyMessage="کالایی که به محصول سایت وصل باشد ثبت نشده. در فاکتور خرید، کالا را از لیست پیشنهادی انتخاب کن."
    />
  );
}
