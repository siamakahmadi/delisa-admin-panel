"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { useToast } from "@/components/ui/toast";
import { createLedgerSupplier, updateLedgerSupplier } from "@/lib/ledger/api";

const EMPTY = { name: "", phone: "", note: "", openingBalance: "" };

export function SupplierDialog({ open, onOpenChange, supplier, onSaved }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <SupplierForm supplier={supplier} onOpenChange={onOpenChange} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  );
}

// mounted only while the dialog is open, so the form always starts from props
function SupplierForm({ supplier, onOpenChange, onSaved }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!supplier?._id;
  const [form, setForm] = useState(
    supplier
      ? { name: supplier.name || "", phone: supplier.phone || "", note: supplier.note || "", openingBalance: supplier.openingBalance || "" }
      : EMPTY
  );

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...form, openingBalance: form.openingBalance === "" ? 0 : form.openingBalance };
      return isEdit ? updateLedgerSupplier(supplier._id, payload) : createLedgerSupplier(payload);
    },
    onSuccess: (res) => {
      toast.success(isEdit ? "تأمین‌کننده بروزرسانی شد" : "تأمین‌کننده اضافه شد");
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      onOpenChange(false);
      onSaved?.(res.supplier);
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  return (
    <>
        <DialogTitle>{isEdit ? "ویرایش تأمین‌کننده" : "تأمین‌کننده جدید"}</DialogTitle>
        <DialogDescription>کسی که ازش جنس می‌خری؛ لازم نیست حتماً وندور سایت باشد.</DialogDescription>
        <div className="mt-4 space-y-3">
          <div>
            <Label>نام</Label>
            <Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثلاً: پخش آرایشی الف" />
          </div>
          <div>
            <Label>تلفن (اختیاری)</Label>
            <Input dir="ltr" className="text-right" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>مانده از قبل (تومان)</Label>
            <MoneyInput value={form.openingBalance} onChange={(v) => setForm({ ...form, openingBalance: v })} placeholder="۰" />
            <p className="mt-1 text-xs text-[var(--text-faint)]">
              اگر قبل از شروع این دفتر به او بدهکاری، مبلغ را مثبت بنویس. اگر او به تو بدهکار است، منفی (مثلاً -۵۰۰۰۰۰).
            </p>
          </div>
          <div>
            <Label>یادداشت (اختیاری)</Label>
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button loading={save.isPending} disabled={!form.name.trim()} onClick={() => save.mutate()}>
            {isEdit ? "ذخیره" : "افزودن"}
          </Button>
        </div>
    </>
  );
}
