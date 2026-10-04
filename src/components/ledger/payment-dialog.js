"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MoneyInput } from "@/components/ui/money-input";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { useToast } from "@/components/ui/toast";
import { createLedgerPayment, fetchLedgerPurchases, fetchLedgerSuppliers } from "@/lib/ledger/api";
import { METHOD_LABELS, todayIso, balanceInfo } from "@/lib/ledger/format";
import { formatToman, formatDate } from "@/lib/utils";

export function PaymentDialog({ open, onOpenChange, supplierId, defaultAmount, defaultPurchaseId }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <PaymentForm
          onOpenChange={onOpenChange}
          supplierId={supplierId}
          defaultAmount={defaultAmount}
          defaultPurchaseId={defaultPurchaseId}
        />
      </DialogContent>
    </Dialog>
  );
}

// mounted only while the dialog is open, so the form always starts from props
function PaymentForm({ onOpenChange, supplierId, defaultAmount, defaultPurchaseId }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    supplier: supplierId || "",
    amount: defaultAmount || "",
    date: todayIso(),
    method: "bank_transfer",
    reference: "",
    note: "",
    purchase: defaultPurchaseId || "",
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["ledger", "suppliers", "payment-dialog"],
    queryFn: () => fetchLedgerSuppliers(),
  });
  const supplier = (suppliersData?.suppliers || []).find((s) => s._id === form.supplier);

  const { data: openData } = useQuery({
    queryKey: ["ledger", "open-purchases", form.supplier],
    queryFn: () => fetchLedgerPurchases({ supplier: form.supplier, status: "open", limit: 100 }),
    enabled: !!form.supplier,
  });
  const openPurchases = [...(openData?.purchases || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
  const chosen = openPurchases.find((p) => p._id === form.purchase);
  const due = (p) => Math.max(0, p.total - (p.paidAmount || 0));

  const pay = useMutation({
    mutationFn: () =>
      createLedgerPayment({
        supplier: form.supplier,
        amount: form.amount,
        date: form.date,
        method: form.method,
        reference: form.reference,
        note: form.note,
        ...(form.purchase ? { allocations: [{ purchase: form.purchase, amount: form.amount }] } : {}),
      }),
    onSuccess: (res) => {
      toast.success(
        res.advance > 0
          ? `پرداخت ثبت شد؛ ${formatToman(res.advance)} به‌عنوان پیش‌پرداخت ماند`
          : "پرداخت ثبت شد"
      );
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ثبت پرداخت ناموفق بود"),
  });

  const bal = balanceInfo(supplier?.balance);
  const canSubmit = form.supplier && Number(form.amount) > 0 && form.date;

  return (
    <>
        <DialogTitle>ثبت پرداخت به تأمین‌کننده</DialogTitle>
        <DialogDescription>
          پرداخت به‌صورت خودکار از قدیمی‌ترین فاکتور باز تسویه می‌شود، مگر اینکه فاکتور مشخصی را انتخاب کنی.
        </DialogDescription>

        <div className="mt-4 space-y-3">
          <div>
            <Label>تأمین‌کننده</Label>
            <Select value={form.supplier} disabled={!!supplierId} onChange={(e) => setForm({ ...form, supplier: e.target.value, purchase: "" })}>
              <option value="">انتخاب کنید…</option>
              {(suppliersData?.suppliers || []).map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </Select>
            {supplier && (
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                مانده فعلی: <span className={bal.tone}>{bal.amount ? `${formatToman(bal.amount)} (${bal.label})` : "تسویه"}</span>
                {bal.amount > 0 && bal.label === "بدهکارم" && (
                  <button type="button" className="mr-2 text-[var(--brand-600)] hover:underline" onClick={() => setForm({ ...form, amount: bal.amount })}>
                    پرداخت کل بدهی
                  </button>
                )}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>مبلغ (تومان)</Label>
              <MoneyInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
            </div>
            <div>
              <Label>تاریخ</Label>
              <JalaliDatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            </div>
          </div>

          {openPurchases.length > 0 && (
            <div>
              <Label>تسویه کدام فاکتور؟</Label>
              <Select value={form.purchase} onChange={(e) => {
                const p = openPurchases.find((x) => x._id === e.target.value);
                setForm({ ...form, purchase: e.target.value, amount: p && !form.amount ? due(p) : form.amount });
              }}>
                <option value="">خودکار (از قدیمی‌ترین)</option>
                {openPurchases.map((p) => (
                  <option key={p._id} value={p._id}>
                    {formatDate(p.date)}{p.invoiceNumber ? ` — شماره ${p.invoiceNumber}` : ""} — مانده {formatToman(due(p))}
                  </option>
                ))}
              </Select>
              {chosen && Number(form.amount) > due(chosen) && (
                <p className="mt-1 text-xs text-[var(--warning)]">مبلغ از مانده این فاکتور بیشتر است؛ اضافه‌اش پیش‌پرداخت می‌شود.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>روش پرداخت</Label>
              <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div>
              <Label>شماره پیگیری / چک (اختیاری)</Label>
              <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>یادداشت (اختیاری)</Label>
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button loading={pay.isPending} disabled={!canSubmit} onClick={() => pay.mutate()}>ثبت پرداخت</Button>
        </div>
    </>
  );
}
