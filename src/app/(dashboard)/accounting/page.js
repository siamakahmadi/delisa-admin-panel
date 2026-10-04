"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilePlus2, Wallet, Receipt, HandCoins, TrendingUp, Boxes, CalendarClock, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { Balance, PageHint, PaymentStatusBadge } from "@/components/ledger/parts";
import { PaymentDialog } from "@/components/ledger/payment-dialog";
import { fetchLedgerOverview } from "@/lib/ledger/api";
import { formatDate, formatNumber, formatToman } from "@/lib/utils";

export default function AccountingOverviewPage() {
  const router = useRouter();
  const [payOpen, setPayOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["ledger", "overview"], queryFn: fetchLedgerOverview });
  const t = data?.totals || {};
  const suppliers = data?.suppliers || [];
  const open = data?.openInvoices || [];
  const empty = !isLoading && !suppliers.length;

  return (
    <div>
      <PageHeader
        title="حساب و کتاب"
        subtitle="دفتر شخصی خرید از تأمین‌کنندگان: چی گرفتی، چقدر دادی، چقدر مانده"
        actions={
          <>
            <Button variant="secondary" onClick={() => setPayOpen(true)}><Wallet size={15} />ثبت پرداخت</Button>
            <Button onClick={() => router.push("/accounting/purchases/new")}><FilePlus2 size={15} />فاکتور خرید جدید</Button>
          </>
        }
      />

      {empty ? (
        <Card>
          <CardContent className="py-10 text-center">
            <ShoppingBag size={36} className="mx-auto mb-3 text-[var(--text-faint)]" />
            <h3 className="mb-1 font-semibold">دفترت هنوز خالی است</h3>
            <p className="mx-auto mb-5 max-w-md text-sm leading-6 text-[var(--text-muted)]">
              اول یک تأمین‌کننده اضافه کن، بعد هر بار جنس گرفتی «فاکتور خرید» ثبت کن و هر بار پول دادی «پرداخت». بقیه (مانده حساب، فاکتورهای باز، سود و موجودی) خودکار حساب می‌شود.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => router.push("/accounting/suppliers")}>افزودن تأمین‌کننده</Button>
              <Button onClick={() => router.push("/accounting/purchases/new")}>اولین فاکتور خرید</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <PageHint>
            «بدهی» یعنی مبلغی که هنوز به تأمین‌کنندگان نداده‌ای. «سود تخمینی» از فروش واقعی سایت روی کالاهایی که با فاکتور ثبت و به محصول سایت وصل کرده‌ای حساب می‌شود.
          </PageHint>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={HandCoins} label="جمع بدهی به تأمین‌کنندگان" value={formatToman(t.payable)} color="pink" isLoading={isLoading} />
            <StatCard icon={Receipt} label="فاکتورهای تسویه‌نشده" value={formatNumber(t.unpaidInvoices)} color="amber" isLoading={isLoading} />
            <StatCard icon={ShoppingBag} label="خرید ۳۰ روز اخیر" value={formatToman(t.purchased30d)} color="blue" isLoading={isLoading} />
            <StatCard icon={Wallet} label="پرداخت ۳۰ روز اخیر" value={formatToman(t.paid30d)} color="teal" isLoading={isLoading} />
          </div>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard icon={TrendingUp} label="فروش کالاهای خریداری‌شده" value={formatToman(t.revenue)} color="violet" isLoading={isLoading} />
            <StatCard icon={TrendingUp} label="سود تخمینی" value={formatToman(t.profit)} color="teal" isLoading={isLoading} />
            <StatCard icon={Boxes} label="ارزش موجودی باقی‌مانده" value={formatToman(t.stockValue)} color="blue" isLoading={isLoading} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>مانده حساب با هر تأمین‌کننده</CardTitle>
                <Link href="/accounting/suppliers" className="text-xs text-[var(--brand-600)] hover:underline">همه</Link>
              </CardHeader>
              <CardContent className="p-0 pt-3">
                {isLoading ? <div className="p-5"><Skeleton className="h-32 w-full" /></div> : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                        <th className="px-5 py-2 text-start font-medium">تأمین‌کننده</th>
                        <th className="px-2 py-2 text-start font-medium">فاکتور باز</th>
                        <th className="px-5 py-2 text-start font-medium">مانده</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.slice(0, 10).map((s) => (
                        <tr key={s._id} className="cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]" onClick={() => router.push(`/accounting/suppliers/${s._id}`)}>
                          <td className="px-5 py-3 font-medium">{s.name}</td>
                          <td className="px-2 py-3 tabular-nums">{s.unpaidCount ? formatNumber(s.unpaidCount) : "—"}</td>
                          <td className="px-5 py-3"><Balance value={s.balance} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>فاکتورهای باز (پرداخت‌نشده)</CardTitle></CardHeader>
              <CardContent className="p-0 pt-3">
                {!open.length && !isLoading ? (
                  <p className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">همه فاکتورها تسویه شده 🎉</p>
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {open.map((p) => (
                      <li key={p._id}>
                        <Link href={`/accounting/purchases/${p._id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-[var(--surface-muted)]">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{p.supplier?.name}</div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
                              {formatDate(p.date)}
                              {p.dueDate && <span className="inline-flex items-center gap-1"><CalendarClock size={11} />سررسید {formatDate(p.dueDate)}</span>}
                            </div>
                          </div>
                          <div className="shrink-0 text-end">
                            <div className="font-semibold tabular-nums">{formatToman(p.due)}</div>
                            <PaymentStatusBadge status={p.paymentStatus} overdue={p.overdue} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <PaymentDialog open={payOpen} onOpenChange={setPayOpen} />
    </div>
  );
}
