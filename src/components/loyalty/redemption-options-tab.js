"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  fetchRedemptionOptions,
  createRedemptionOption,
  updateRedemptionOption,
  deleteRedemptionOption,
} from "@/lib/loyalty/api";

const TYPE_LABELS = { discount_code: "کد تخفیف", cart_direct: "اعمال مستقیم روی سبد خرید" };

export function LoyaltyRedemptionOptionsTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["loyalty-redemption-options"], queryFn: fetchRedemptionOptions });
  const items = data ?? [];
  const active = editing || creating;

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? updateRedemptionOption(editing._id, payload) : createRedemptionOption(payload)),
    onSuccess: () => {
      toast.success(editing ? "گزینه بروزرسانی شد" : "گزینه ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["loyalty-redemption-options"] });
      setEditing(null);
      setCreating(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRedemptionOption(id),
    onSuccess: () => {
      toast.success("حذف شد");
      queryClient.invalidateQueries({ queryKey: ["loyalty-redemption-options"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = [
    { key: "label", header: "عنوان", render: (row) => <span className="font-medium">{row.label}</span> },
    { key: "type", header: "نوع", render: (row) => <Badge size="sm" variant="neutral">{TYPE_LABELS[row.type]}</Badge> },
    {
      key: "value",
      header: "ارزش",
      render: (row) => (row.valueType === "percent" ? `${row.valueAmount}٪` : `${row.valueAmount.toLocaleString("fa-IR")} تومان`),
    },
    { key: "pointsCost", header: "هزینه (امتیاز)", render: (row) => row.pointsCost.toLocaleString("fa-IR") },
    {
      key: "enabled",
      header: "وضعیت",
      render: (row) =>
        row.enabled ? (
          <Badge variant="success" size="sm" dot>فعال</Badge>
        ) : (
          <Badge variant="neutral" size="sm" dot>غیرفعال</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setCreating(false); setEditing(row); }}>
            <Pencil size={15} />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
            <Trash2 size={15} className="text-[var(--danger)]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {!active ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">راه‌های تبدیل امتیاز به تخفیف — کاملاً در اختیار شماست، هر تعداد گزینه که بخواهید بسازید.</p>
            <Button onClick={() => { setEditing(null); setCreating(true); }}>
              <Plus size={16} />
              افزودن گزینه
            </Button>
          </div>
          <DataTable columns={columns} data={items} isLoading={isLoading} emptyMessage="گزینه‌ای یافت نشد" onRowClick={(row) => { setCreating(false); setEditing(row); }} />
        </>
      ) : (
        <RedemptionOptionForm
          key={editing?._id ?? "new"}
          editing={editing}
          isPending={saveMutation.isPending}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSubmit={(payload) => saveMutation.mutate(payload)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف گزینه"
        description="این گزینه برای همیشه حذف می‌شود. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}

function RedemptionOptionForm({ editing, isPending, onCancel, onSubmit }) {
  const toast = useToast();
  const [form, setForm] = useState({
    key: editing?.key || "",
    label: editing?.label || "",
    description: editing?.description || "",
    type: editing?.type || "discount_code",
    valueType: editing?.valueType || "fixed",
    valueAmount: editing?.valueAmount ?? 0,
    pointsCost: editing?.pointsCost ?? 100,
    maxDiscountAmount: editing?.maxDiscountAmount ?? "",
    minCartAmount: editing?.minCartAmount ?? 0,
    expiresInDays: editing?.expiresInDays ?? 30,
    enabled: editing?.enabled ?? true,
  });

  const patch = (fields) => setForm((f) => ({ ...f, ...fields }));

  const handleSubmit = () => {
    if (!editing && !form.key.trim()) {
      toast.error("کلید گزینه الزامی است");
      return;
    }
    if (!form.label.trim()) {
      toast.error("عنوان الزامی است");
      return;
    }
    onSubmit({ ...form, maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? `ویرایش: ${editing.label}` : "گزینه‌ی تبدیل امتیاز جدید"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!editing && (
            <div>
              <Label>کلید یکتا (انگلیسی، بدون فاصله)</Label>
              <Input dir="ltr" value={form.key} onChange={(e) => patch({ key: e.target.value })} placeholder="مثلاً free_shipping" />
            </div>
          )}
          <div>
            <Label>عنوان</Label>
            <Input value={form.label} onChange={(e) => patch({ label: e.target.value })} placeholder="مثلاً کد تخفیف ۲۰٪" />
          </div>
        </div>

        <div>
          <Label>توضیحات (اختیاری)</Label>
          <Input value={form.description} onChange={(e) => patch({ description: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>نحوه‌ی اعمال</Label>
            <Select value={form.type} onChange={(e) => patch({ type: e.target.value })}>
              <option value="discount_code">تولید کد تخفیف (مشتری بعداً استفاده می‌کند)</option>
              <option value="cart_direct">اعمال فوری روی سبد خرید فعلی</option>
            </Select>
          </div>
          <div>
            <Label>نوع ارزش</Label>
            <Select value={form.valueType} onChange={(e) => patch({ valueType: e.target.value })}>
              <option value="fixed">مبلغ ثابت (تومان)</option>
              <option value="percent">درصدی</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>{form.valueType === "percent" ? "درصد تخفیف" : "مبلغ تخفیف (تومان)"}</Label>
            <Input type="number" value={form.valueAmount} onChange={(e) => patch({ valueAmount: Number(e.target.value) })} />
          </div>
          <div>
            <Label>هزینه (امتیاز لازم)</Label>
            <Input type="number" value={form.pointsCost} onChange={(e) => patch({ pointsCost: Number(e.target.value) })} />
          </div>
          <div>
            <Label>اعتبار (روز)</Label>
            <Input type="number" value={form.expiresInDays} onChange={(e) => patch({ expiresInDays: Number(e.target.value) })} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {form.valueType === "percent" && (
            <div>
              <Label>سقف تخفیف (تومان، اختیاری)</Label>
              <Input type="number" value={form.maxDiscountAmount} onChange={(e) => patch({ maxDiscountAmount: e.target.value })} />
            </div>
          )}
          <div>
            <Label>حداقل مبلغ سبد خرید (تومان)</Label>
            <Input type="number" value={form.minCartAmount} onChange={(e) => patch({ minCartAmount: Number(e.target.value) })} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" checked={form.enabled} onChange={(e) => patch({ enabled: e.target.checked })} className="h-4 w-4 accent-[var(--brand-600)]" />
          فعال
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>انصراف</Button>
          <Button loading={isPending} onClick={handleSubmit}>
            <Save size={16} />
            {editing ? "ذخیره تغییرات" : "ایجاد"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
