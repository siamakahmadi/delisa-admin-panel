"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Balance, PageHint } from "@/components/ledger/parts";
import { SupplierDialog } from "@/components/ledger/supplier-dialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { deleteLedgerSupplier, fetchLedgerSuppliers } from "@/lib/ledger/api";
import { formatDate, formatNumber, formatToman } from "@/lib/utils";

export default function SuppliersPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search);
  const [dialog, setDialog] = useState({ open: false, supplier: null });
  const [del, setDel] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ledger", "suppliers", q],
    queryFn: () => fetchLedgerSuppliers({ search: q || undefined }),
  });

  const remove = useMutation({
    mutationFn: (id) => deleteLedgerSupplier(id),
    onSuccess: (res) => {
      toast.success(res.archived ? "تأمین‌کننده بایگانی شد (سابقه‌اش حفظ شد)" : "حذف شد");
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      setDel(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      { key: "name", header: "تأمین‌کننده", sortable: true, render: (r) => (<div><div className="font-medium">{r.name}</div>{r.phone && <div className="text-xs text-[var(--text-faint)]" dir="ltr">{r.phone}</div>}</div>) },
      { key: "purchased", header: "جمع خرید", sortable: true, render: (r) => <span className="tabular-nums">{formatToman(r.purchased)}</span> },
      { key: "paid", header: "پرداخت‌شده", sortable: true, render: (r) => <span className="tabular-nums">{formatToman(r.paid)}</span> },
      { key: "balance", header: "مانده", sortable: true, render: (r) => <Balance value={r.balance} /> },
      { key: "unpaidCount", header: "فاکتور باز", sortable: true, render: (r) => (r.unpaidCount ? formatNumber(r.unpaidCount) : "—") },
      { key: "lastPurchaseAt", header: "آخرین خرید", render: (r) => (r.lastPurchaseAt ? formatDate(r.lastPurchaseAt) : "—") },
      {
        key: "actions",
        header: "",
        render: (r) => (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" title="ویرایش" onClick={() => setDialog({ open: true, supplier: r })}><Pencil size={14} /></Button>
            <Button variant="ghost" size="icon" title="حذف" onClick={() => setDel(r)}><Trash2 size={14} className="text-[var(--danger)]" /></Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="تأمین‌کنندگان"
        subtitle="کسانی که ازشان جنس می‌خری"
        actions={<Button onClick={() => setDialog({ open: true, supplier: null })}><Plus size={16} />تأمین‌کننده جدید</Button>}
      />
      <PageHint>روی هر تأمین‌کننده بزن تا صورت‌حساب کامل، فاکتورها، پرداخت‌ها و کالاهایی که ازش گرفته‌ای (خرید / فروش / باقی‌مانده) را ببینی.</PageHint>
      <div className="mb-4 relative w-full max-w-xs">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
        <Input placeholder="جستجوی نام…" className="pr-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <DataTable
        columns={columns}
        data={data?.suppliers || []}
        isLoading={isLoading}
        emptyMessage="هنوز تأمین‌کننده‌ای اضافه نکرده‌ای"
        onRowClick={(r) => router.push(`/accounting/suppliers/${r._id}`)}
      />
      <SupplierDialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} supplier={dialog.supplier} />
      <ConfirmDialog
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        title="حذف تأمین‌کننده"
        description="اگر برای این تأمین‌کننده فاکتور یا پرداختی ثبت شده باشد، حذف نمی‌شود و فقط بایگانی می‌شود تا سابقه‌ات از بین نرود."
        loading={remove.isPending}
        onConfirm={() => remove.mutate(del._id)}
      />
    </div>
  );
}
