"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FilePlus2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge } from "@/components/ledger/parts";
import { fetchLedgerPurchases, fetchLedgerSuppliers } from "@/lib/ledger/api";
import { formatDate, formatNumber, formatToman } from "@/lib/utils";

const LIMIT = 30;

export default function PurchasesPage() {
  const router = useRouter();
  const [supplier, setSupplier] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data: sup } = useQuery({ queryKey: ["ledger", "suppliers", "filter"], queryFn: () => fetchLedgerSuppliers({ active: "all" }) });
  const params = { supplier: supplier || undefined, status: status || undefined, page, limit: LIMIT };
  const { data, isLoading } = useQuery({ queryKey: ["ledger", "purchases", params], queryFn: () => fetchLedgerPurchases(params) });

  const columns = useMemo(
    () => [
      { key: "date", header: "تاریخ", render: (r) => formatDate(r.date) },
      { key: "supplier", header: "تأمین‌کننده", render: (r) => <span className="font-medium">{r.supplier?.name || "—"}</span> },
      { key: "invoiceNumber", header: "شماره", render: (r) => r.invoiceNumber || "—" },
      { key: "items", header: "اقلام", render: (r) => (<span className="text-[var(--text-muted)]">{formatNumber(r.items.length)} قلم{r.items[0] ? ` — ${r.items[0].name}${r.items.length > 1 ? "…" : ""}` : ""}</span>) },
      { key: "total", header: "مبلغ", render: (r) => <span className="tabular-nums">{formatToman(r.total)}</span> },
      { key: "paidAmount", header: "پرداخت‌شده", render: (r) => <span className="tabular-nums">{formatToman(r.paidAmount)}</span> },
      { key: "paymentStatus", header: "وضعیت", render: (r) => <PaymentStatusBadge status={r.paymentStatus} overdue={r.paymentStatus !== "paid" && r.dueDate && new Date(r.dueDate) < new Date()} /> },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="فاکتورهای خرید"
        subtitle={`${formatNumber(data?.total)} فاکتور`}
        actions={<Button onClick={() => router.push("/accounting/purchases/new")}><FilePlus2 size={16} />فاکتور جدید</Button>}
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-56">
          <Select value={supplier} onChange={(e) => { setSupplier(e.target.value); setPage(1); }}>
            <option value="">همه تأمین‌کنندگان</option>
            {(sup?.suppliers || []).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
        </div>
        <div className="w-44">
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">همه وضعیت‌ها</option>
            <option value="open">باز (پرداخت‌نشده یا ناقص)</option>
            <option value="unpaid">پرداخت‌نشده</option>
            <option value="partial">پرداخت ناقص</option>
            <option value="paid">تسویه‌شده</option>
          </Select>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={data?.purchases || []}
        isLoading={isLoading}
        emptyMessage="فاکتوری پیدا نشد"
        onRowClick={(r) => router.push(`/accounting/purchases/${r._id}`)}
        pagination={{ page, pageCount: Math.ceil((data?.total || 0) / LIMIT), onPageChange: setPage }}
      />
    </div>
  );
}
