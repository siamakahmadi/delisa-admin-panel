"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { PaymentDialog } from "@/components/ledger/payment-dialog";
import { deleteLedgerPayment, fetchLedgerPayments, fetchLedgerSuppliers } from "@/lib/ledger/api";
import { METHOD_LABELS } from "@/lib/ledger/format";
import { formatDate, formatNumber, formatToman } from "@/lib/utils";

const LIMIT = 30;

export default function PaymentsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [supplier, setSupplier] = useState("");
  const [page, setPage] = useState(1);
  const [payOpen, setPayOpen] = useState(false);
  const [del, setDel] = useState(null);

  const { data: sup } = useQuery({ queryKey: ["ledger", "suppliers", "filter"], queryFn: () => fetchLedgerSuppliers({ active: "all" }) });
  const params = { supplier: supplier || undefined, page, limit: LIMIT };
  const { data, isLoading } = useQuery({ queryKey: ["ledger", "payments", params], queryFn: () => fetchLedgerPayments(params) });

  const remove = useMutation({
    mutationFn: (id) => deleteLedgerPayment(id),
    onSuccess: () => {
      toast.success("پرداخت حذف شد و فاکتورها دوباره محاسبه شدند");
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      setDel(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      { key: "date", header: "تاریخ", render: (r) => formatDate(r.date) },
      { key: "supplier", header: "تأمین‌کننده", render: (r) => <span className="font-medium">{r.supplier?.name || "—"}</span> },
      { key: "amount", header: "مبلغ", render: (r) => <span className="font-semibold tabular-nums">{formatToman(r.amount)}</span> },
      { key: "method", header: "روش", render: (r) => METHOD_LABELS[r.method] || r.method },
      { key: "reference", header: "پیگیری", render: (r) => r.reference || "—" },
      {
        key: "alloc",
        header: "تسویه‌شده",
        render: (r) => {
          const used = r.allocations.reduce((s, a) => s + a.amount, 0);
          const advance = r.amount - used;
          return (
            <span className="text-xs text-[var(--text-muted)]">
              {r.allocations.length ? `${formatNumber(r.allocations.length)} فاکتور` : "—"}
              {advance > 0 && <span className="text-[var(--success)]"> · پیش‌پرداخت {formatToman(advance)}</span>}
            </span>
          );
        },
      },
      { key: "actions", header: "", render: (r) => <Button variant="ghost" size="icon" title="حذف" onClick={() => setDel(r)}><Trash2 size={14} className="text-[var(--danger)]" /></Button> },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="پرداخت‌ها"
        subtitle={`${formatNumber(data?.total)} پرداخت`}
        actions={<Button onClick={() => setPayOpen(true)}><Wallet size={16} />ثبت پرداخت</Button>}
      />
      <div className="mb-4 w-56">
        <Select value={supplier} onChange={(e) => { setSupplier(e.target.value); setPage(1); }}>
          <option value="">همه تأمین‌کنندگان</option>
          {(sup?.suppliers || []).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={data?.payments || []}
        isLoading={isLoading}
        emptyMessage="پرداختی ثبت نشده"
        pagination={{ page, pageCount: Math.ceil((data?.total || 0) / LIMIT), onPageChange: setPage }}
      />
      <PaymentDialog open={payOpen} onOpenChange={setPayOpen} />
      <ConfirmDialog
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        title="حذف پرداخت"
        description="مبلغ این پرداخت دوباره به بدهی تأمین‌کننده برمی‌گردد و وضعیت فاکتورهایی که تسویه کرده بود به‌روز می‌شود."
        loading={remove.isPending}
        onConfirm={() => remove.mutate(del._id)}
      />
    </div>
  );
}
