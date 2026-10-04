"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FilePlus2, Pencil, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { Balance, PaymentStatusBadge, SectionTabs } from "@/components/ledger/parts";
import { LedgerProductsTable } from "@/components/ledger/products-table";
import { PaymentDialog } from "@/components/ledger/payment-dialog";
import { SupplierDialog } from "@/components/ledger/supplier-dialog";
import { fetchSupplierStatement } from "@/lib/ledger/api";
import { METHOD_LABELS, balanceInfo } from "@/lib/ledger/format";
import { formatDate, formatNumber, formatToman } from "@/lib/utils";
import { HandCoins, ShoppingBag, Receipt, TrendingUp } from "lucide-react";

export default function SupplierDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [tab, setTab] = useState("statement");
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["ledger", "statement", id], queryFn: () => fetchSupplierStatement(id) });

  const s = data?.supplier;
  const sum = data?.summary || {};
  const bal = balanceInfo(sum.balance);

  const entryColumns = useMemo(
    () => [
      { key: "date", header: "تاریخ", render: (r) => formatDate(r.date) },
      {
        key: "kind",
        header: "شرح",
        render: (r) =>
          r.kind === "opening" ? (
            <span className="text-[var(--text-muted)]">مانده از قبل</span>
          ) : r.kind === "purchase" ? (
            <button className="text-start hover:underline" onClick={() => router.push(`/accounting/purchases/${r.id}`)}>
              فاکتور خرید{r.ref ? ` ${r.ref}` : ""} <PaymentStatusBadge status={r.status} />
            </button>
          ) : (
            <span>پرداخت — {METHOD_LABELS[r.method] || ""}{r.ref ? ` (${r.ref})` : ""}</span>
          ),
      },
      { key: "debit", header: "بدهکار شدم", render: (r) => (r.debit ? <span className="tabular-nums text-[var(--danger)]">{formatToman(r.debit)}</span> : "—") },
      { key: "credit", header: "پرداخت کردم", render: (r) => (r.credit ? <span className="tabular-nums text-[var(--success)]">{formatToman(r.credit)}</span> : "—") },
      { key: "balance", header: "مانده", render: (r) => <Balance value={r.balance} /> },
    ],
    [router]
  );

  const purchaseColumns = useMemo(
    () => [
      { key: "date", header: "تاریخ", render: (r) => formatDate(r.date) },
      { key: "invoiceNumber", header: "شماره", render: (r) => r.invoiceNumber || "—" },
      { key: "items", header: "اقلام", render: (r) => <span className="text-[var(--text-muted)]">{r.items.map((i) => `${i.name} ×${formatNumber(i.quantity)}`).join("، ")}</span> },
      { key: "total", header: "مبلغ", render: (r) => <span className="tabular-nums">{formatToman(r.total)}</span> },
      { key: "paidAmount", header: "پرداخت‌شده", render: (r) => <span className="tabular-nums">{formatToman(r.paidAmount)}</span> },
      { key: "paymentStatus", header: "وضعیت", render: (r) => <PaymentStatusBadge status={r.paymentStatus} overdue={r.paymentStatus !== "paid" && r.dueDate && new Date(r.dueDate) < new Date()} /> },
    ],
    []
  );

  const paymentColumns = useMemo(
    () => [
      { key: "date", header: "تاریخ", render: (r) => formatDate(r.date) },
      { key: "amount", header: "مبلغ", render: (r) => <span className="font-semibold tabular-nums">{formatToman(r.amount)}</span> },
      { key: "method", header: "روش", render: (r) => METHOD_LABELS[r.method] },
      { key: "reference", header: "پیگیری", render: (r) => r.reference || "—" },
      { key: "note", header: "یادداشت", render: (r) => r.note || "—" },
    ],
    []
  );

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!s) return <p className="text-sm text-[var(--text-muted)]">تأمین‌کننده پیدا نشد.</p>;

  return (
    <div>
      <PageHeader
        title={s.name}
        subtitle={
          <span className="flex items-center gap-2">
            {s.phone && <span dir="ltr">{s.phone}</span>}
            {!s.active && <Badge size="sm" variant="neutral">بایگانی‌شده</Badge>}
          </span>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/accounting/suppliers")}><ArrowRight size={16} />بازگشت</Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil size={14} />ویرایش</Button>
            <Button variant="secondary" onClick={() => router.push(`/accounting/purchases/new?supplier=${s._id}`)}><FilePlus2 size={15} />فاکتور جدید</Button>
            <Button onClick={() => setPayOpen(true)}><Wallet size={15} />ثبت پرداخت</Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={HandCoins} label={bal.amount ? `مانده حساب (${bal.label})` : "مانده حساب"} value={bal.amount ? formatToman(bal.amount) : "تسویه"} color={sum.balance > 0 ? "pink" : "teal"} />
        <StatCard icon={ShoppingBag} label="جمع خرید" value={formatToman(sum.purchased)} color="blue" />
        <StatCard icon={Receipt} label="جمع پرداخت" value={formatToman(sum.paid)} color="teal" />
        <StatCard icon={TrendingUp} label="سود تخمینی از فروش" value={formatToman(sum.profit)} color="violet" />
      </div>
      {sum.unpaidCount > 0 && (
        <p className="mb-4 rounded-[var(--radius-md)] bg-[var(--warning-bg)] px-4 py-3 text-sm text-[var(--warning)]">
          {formatNumber(sum.unpaidCount)} فاکتور هنوز تسویه نشده؛ جمع مانده‌ی فاکتورهای باز {formatToman(sum.unpaidAmount)}.
        </p>
      )}

      <SectionTabs
        active={tab}
        onChange={setTab}
        items={[
          { id: "statement", label: "صورت‌حساب" },
          { id: "purchases", label: "فاکتورها", count: data.purchases.length },
          { id: "payments", label: "پرداخت‌ها", count: data.payments.length },
          { id: "products", label: "کالاها (خرید / فروش)", count: data.products.length },
        ]}
      />

      {tab === "statement" && <DataTable columns={entryColumns} data={data.entries} rowKey={(r) => `${r.kind}-${r.id || "o"}`} emptyMessage="هنوز تراکنشی ثبت نشده" />}
      {tab === "purchases" && <DataTable columns={purchaseColumns} data={data.purchases} emptyMessage="فاکتوری ثبت نشده" onRowClick={(r) => router.push(`/accounting/purchases/${r._id}`)} />}
      {tab === "payments" && <DataTable columns={paymentColumns} data={data.payments} emptyMessage="پرداختی ثبت نشده" />}
      {tab === "products" && <LedgerProductsTable rows={data.products} showSupplier={false} />}

      <PaymentDialog open={payOpen} onOpenChange={setPayOpen} supplierId={s._id} defaultAmount={sum.balance > 0 ? sum.balance : undefined} />
      <SupplierDialog open={editOpen} onOpenChange={setEditOpen} supplier={s} />
    </div>
  );
}
