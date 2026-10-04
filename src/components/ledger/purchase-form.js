"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, Save, Trash2, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MoneyInput } from "@/components/ui/money-input";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PaymentStatusBadge } from "./parts";
import { PaymentDialog } from "./payment-dialog";
import { SupplierDialog } from "./supplier-dialog";
import { ProductNameInput } from "./product-search";
import { createLedgerPurchase, deleteLedgerPurchase, fetchLedgerPurchase, fetchLedgerSuppliers, updateLedgerPurchase } from "@/lib/ledger/api";
import { METHOD_LABELS, todayIso, toIsoDate } from "@/lib/ledger/format";
import { formatDate, formatNumber, formatToman } from "@/lib/utils";

const blankRow = () => ({ key: crypto.randomUUID(), productId: null, name: "", quantity: 1, unitCost: "" });

export function PurchaseForm({ purchaseId, defaultSupplier }) {
  const isEdit = !!purchaseId;
  const { data, isLoading } = useQuery({
    queryKey: ["ledger", "purchase", purchaseId],
    queryFn: () => fetchLedgerPurchase(purchaseId),
    enabled: isEdit,
  });
  if (isEdit && isLoading) return <Skeleton className="h-96 w-full" />;
  const p = data?.purchase;
  const initial = p
    ? {
        supplier: p.supplier?._id || p.supplier,
        date: toIsoDate(p.date),
        dueDate: toIsoDate(p.dueDate),
        invoiceNumber: p.invoiceNumber || "",
        shipping: p.shipping || "",
        otherCosts: p.otherCosts || "",
        discount: p.discount || "",
        note: p.note || "",
        items: p.items.map((i) => ({ key: String(i._id), productId: i.product || null, name: i.name, quantity: i.quantity, unitCost: i.unitCost })),
      }
    : {
        supplier: defaultSupplier || "",
        date: todayIso(),
        dueDate: "",
        invoiceNumber: "",
        shipping: "",
        otherCosts: "",
        discount: "",
        note: "",
        items: [blankRow()],
      };
  return <PurchaseFormBody purchaseId={purchaseId} purchase={p} payments={data?.payments || []} initial={initial} />;
}

function PurchaseFormBody({ purchaseId, purchase, payments, initial }) {
  const isEdit = !!purchaseId;
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initial);
  const [syncCost, setSyncCost] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: suppliersData } = useQuery({ queryKey: ["ledger", "suppliers", "form"], queryFn: () => fetchLedgerSuppliers() });
  const suppliers = suppliersData?.suppliers || [];

  const patch = (fields) => { setDirty(true); setForm((f) => ({ ...f, ...fields })); };
  const setRow = (key, fields) => patch({ items: form.items.map((r) => (r.key === key ? { ...r, ...fields } : r)) });

  const subtotal = form.items.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unitCost) || 0), 0);
  const total = Math.max(0, subtotal + (Number(form.shipping) || 0) + (Number(form.otherCosts) || 0) - (Number(form.discount) || 0));
  const paid = purchase?.paidAmount || 0;
  const remaining = Math.max(0, total - paid);

  const validRows = form.items.filter((r) => r.name.trim());
  const problem = !form.supplier
    ? "تأمین‌کننده را انتخاب کنید"
    : !form.date
      ? "تاریخ را وارد کنید"
      : !validRows.length
        ? "حداقل یک کالا اضافه کنید"
        : validRows.some((r) => !(Number(r.quantity) > 0))
          ? "تعداد همه کالاها باید بیشتر از صفر باشد"
          : null;

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        supplier: form.supplier,
        date: form.date,
        dueDate: form.dueDate || null,
        invoiceNumber: form.invoiceNumber,
        shipping: form.shipping || 0,
        otherCosts: form.otherCosts || 0,
        discount: form.discount || 0,
        note: form.note,
        syncCost,
        items: validRows.map((r) => ({ productId: r.productId, name: r.name, quantity: r.quantity, unitCost: r.unitCost || 0 })),
      };
      return isEdit ? updateLedgerPurchase(purchaseId, payload) : createLedgerPurchase(payload);
    },
    onSuccess: (res) => {
      toast.success(
        res.syncedCosts ? `فاکتور ذخیره شد و قیمت خرید ${formatNumber(res.syncedCosts)} کالا در قیمت‌گذاری به‌روز شد` : "فاکتور ذخیره شد"
      );
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      if (!isEdit) router.replace(`/accounting/purchases/${res.purchase._id}`);
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  const remove = useMutation({
    mutationFn: () => deleteLedgerPurchase(purchaseId),
    onSuccess: () => {
      toast.success("فاکتور حذف شد");
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      router.push("/accounting/purchases");
    },
    onError: (e) => toast.error(e?.response?.data?.error || "حذف ناموفق بود"),
  });

  const back = () => {
    if (dirty && !window.confirm("تغییرات ذخیره‌نشده از بین می‌رود. خارج می‌شوید؟")) return;
    router.push("/accounting/purchases");
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "فاکتور خرید" : "فاکتور خرید جدید"}
        subtitle={isEdit ? `${purchase.supplier?.name || ""} — ${formatDate(purchase.date)}` : "کالایی که از یک تأمین‌کننده گرفته‌ای را ثبت کن"}
        actions={
          <>
            <Button variant="outline" onClick={back}><ArrowRight size={16} />بازگشت</Button>
            {isEdit && remaining > 0 && (
              <Button variant="secondary" disabled={dirty} onClick={() => setPayOpen(true)}><Wallet size={15} />ثبت پرداخت</Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader><CardTitle>مشخصات فاکتور</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>تأمین‌کننده</Label>
                <div className="flex gap-2">
                  <Select value={form.supplier} onChange={(e) => patch({ supplier: e.target.value })}>
                    <option value="">انتخاب کنید…</option>
                    {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </Select>
                  <Button type="button" variant="outline" onClick={() => setSupplierOpen(true)}><Plus size={14} />جدید</Button>
                </div>
              </div>
              <div>
                <Label>تاریخ فاکتور</Label>
                <JalaliDatePicker value={form.date} onChange={(v) => patch({ date: v })} />
              </div>
              <div>
                <Label>سررسید پرداخت (اختیاری)</Label>
                <JalaliDatePicker value={form.dueDate} onChange={(v) => patch({ dueDate: v })} placeholder="بدون سررسید" />
              </div>
              <div className="sm:col-span-2">
                <Label>شماره فاکتور تأمین‌کننده (اختیاری)</Label>
                <Input value={form.invoiceNumber} onChange={(e) => patch({ invoiceNumber: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>اقلام</CardTitle>
              <Button size="sm" variant="secondary" onClick={() => patch({ items: [...form.items, blankRow()] })}><Plus size={14} />افزودن ردیف</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.items.map((r, idx) => (
                <div key={r.key} className="grid grid-cols-12 items-end gap-2 rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                  <div className="col-span-12 sm:col-span-6">
                    {idx === 0 && <Label>کالا</Label>}
                    <ProductNameInput
                      name={r.name}
                      productId={r.productId}
                      onChange={({ name, productId, unitCostHint }) =>
                        setRow(r.key, { name, productId, ...(unitCostHint && !r.unitCost ? { unitCost: unitCostHint } : {}) })
                      }
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    {idx === 0 && <Label>تعداد</Label>}
                    <MoneyInput value={r.quantity} onChange={(v) => setRow(r.key, { quantity: v })} />
                  </div>
                  <div className="col-span-8 sm:col-span-3">
                    {idx === 0 && <Label>قیمت واحد (تومان)</Label>}
                    <MoneyInput value={r.unitCost} onChange={(v) => setRow(r.key, { unitCost: v })} />
                  </div>
                  <div className="col-span-12 flex items-center justify-between sm:col-span-1 sm:justify-end">
                    <span className="text-xs text-[var(--text-muted)] sm:hidden">جمع: {formatToman((Number(r.quantity) || 0) * (Number(r.unitCost) || 0))}</span>
                    {form.items.length > 1 && (
                      <Button variant="ghost" size="icon" title="حذف ردیف" onClick={() => patch({ items: form.items.filter((x) => x.key !== r.key) })}>
                        <Trash2 size={14} className="text-[var(--danger)]" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-xs text-[var(--text-faint)]">
                کالاهایی که از لیست محصولات انتخاب کنی («متصل») با فروش واقعی سایت تطبیق داده می‌شوند و سود و موجودی‌شان در گزارش دیده می‌شود.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>هزینه‌های جانبی و یادداشت</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div><Label>هزینه حمل</Label><MoneyInput value={form.shipping} onChange={(v) => patch({ shipping: v })} placeholder="۰" /></div>
                <div><Label>سایر هزینه‌ها</Label><MoneyInput value={form.otherCosts} onChange={(v) => patch({ otherCosts: v })} placeholder="۰" /></div>
                <div><Label>تخفیف</Label><MoneyInput value={form.discount} onChange={(v) => patch({ discount: v })} placeholder="۰" /></div>
              </div>
              <div><Label>یادداشت</Label><Input value={form.note} onChange={(e) => patch({ note: e.target.value })} /></div>
            </CardContent>
          </Card>

          {isEdit && (
            <Card>
              <CardHeader><CardTitle>پرداخت‌های این فاکتور</CardTitle></CardHeader>
              <CardContent>
                {!payments.length ? (
                  <p className="text-sm text-[var(--text-faint)]">هنوز پرداختی برای این فاکتور ثبت نشده.</p>
                ) : (
                  <ul className="divide-y divide-[var(--border)] text-sm">
                    {payments.map((pm) => (
                      <li key={pm._id} className="flex items-center justify-between py-2">
                        <span>{formatDate(pm.date)} <span className="text-[var(--text-faint)]">· {METHOD_LABELS[pm.method]}{pm.reference ? ` · ${pm.reference}` : ""}</span></span>
                        <span className="font-medium tabular-nums">{formatToman(pm.allocated)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader><CardTitle>خلاصه</CardTitle>{isEdit && <PaymentStatusBadge status={purchase.paymentStatus} />}</CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="جمع اقلام" value={formatToman(subtotal)} />
              {!!Number(form.shipping) && <Row label="حمل" value={`+ ${formatToman(form.shipping)}`} />}
              {!!Number(form.otherCosts) && <Row label="سایر هزینه‌ها" value={`+ ${formatToman(form.otherCosts)}`} />}
              {!!Number(form.discount) && <Row label="تخفیف" value={`− ${formatToman(form.discount)}`} />}
              <div className="my-2 border-t border-[var(--border)]" />
              <Row label="مبلغ فاکتور" value={formatToman(total)} strong />
              {isEdit && <Row label="پرداخت‌شده" value={formatToman(paid)} />}
              {isEdit && <Row label="مانده" value={formatToman(remaining)} strong tone={remaining ? "text-[var(--danger)]" : "text-[var(--success)]"} />}
            </CardContent>
          </Card>

          <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-md)] border border-[var(--border)] p-3 text-xs text-[var(--text-muted)]">
            <input type="checkbox" className="mt-0.5" checked={syncCost} onChange={(e) => setSyncCost(e.target.checked)} />
            <span>قیمت خرید کالاهای متصل را در «قیمت‌گذاری هوشمند» هم به‌روز کن تا حاشیه سود بر اساس این فاکتور محاسبه شود.</span>
          </label>

          <Button className="w-full" disabled={!!problem || (isEdit && !dirty)} loading={save.isPending} onClick={() => save.mutate()}>
            <Save size={16} />{isEdit ? "ذخیره تغییرات" : "ثبت فاکتور"}
          </Button>
          {problem && dirty && <p className="text-center text-xs text-[var(--danger)]">{problem}</p>}
          {isEdit && (
            <Button className="w-full" variant="ghost" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} className="text-[var(--danger)]" />حذف فاکتور
            </Button>
          )}
        </div>
      </div>

      <SupplierDialog open={supplierOpen} onOpenChange={setSupplierOpen} onSaved={(s) => s && patch({ supplier: s._id })} />
      {isEdit && <PaymentDialog open={payOpen} onOpenChange={setPayOpen} supplierId={String(form.supplier)} defaultAmount={remaining} defaultPurchaseId={purchaseId} />}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="حذف فاکتور خرید"
        description={paid > 0 ? "مبلغ‌های پرداخت‌شده برای این فاکتور حذف نمی‌شوند و به‌عنوان پیش‌پرداخت نزد تأمین‌کننده می‌مانند." : "این فاکتور حذف می‌شود."}
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}

function Row({ label, value, strong, tone }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={`tabular-nums ${strong ? "font-bold" : ""} ${tone || ""}`}>{value}</span>
    </div>
  );
}
