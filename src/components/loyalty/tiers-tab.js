"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchLoyaltyTiers, createLoyaltyTier, updateLoyaltyTier, deleteLoyaltyTier } from "@/lib/loyalty/api";

export function LoyaltyTiersTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["loyalty-tiers"], queryFn: fetchLoyaltyTiers });
  const items = data ?? [];
  const active = editing || creating;

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? updateLoyaltyTier(editing._id, payload) : createLoyaltyTier(payload)),
    onSuccess: () => {
      toast.success(editing ? "سطح بروزرسانی شد" : "سطح ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["loyalty-tiers"] });
      setEditing(null);
      setCreating(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteLoyaltyTier(id),
    onSuccess: () => {
      toast.success("حذف شد");
      queryClient.invalidateQueries({ queryKey: ["loyalty-tiers"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = [
    {
      key: "label",
      header: "سطح",
      render: (row) => (
        <span className="flex items-center gap-2 font-medium">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: row.badgeColor }} />
          {row.label}
        </span>
      ),
    },
    { key: "minPoints", header: "حداقل امتیاز کل", render: (row) => row.minPoints.toLocaleString("fa-IR") },
    { key: "pointsMultiplier", header: "ضریب امتیاز خرید", render: (row) => `x${row.pointsMultiplier}` },
    {
      key: "reward",
      header: "پاداش ورود به سطح",
      render: (row) =>
        row.rewardType === "discount_code"
          ? `کد تخفیف ${row.rewardValue}٪`
          : row.rewardType === "cart_amount"
            ? `${row.rewardValue.toLocaleString("fa-IR")} تومان روی سبد`
            : "—",
    },
    { key: "perks", header: "مزایا", render: (row) => <span className="max-w-[220px] truncate text-[var(--text-muted)]">{row.perks || "—"}</span> },
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
            <p className="text-sm text-[var(--text-muted)]">سطوح باشگاه بر اساس امتیاز کل کسب‌شده (نه موجودی فعلی) تعیین می‌شوند و روی سرعت امتیازگیری از خرید اثر می‌گذارند.</p>
            <Button onClick={() => { setEditing(null); setCreating(true); }}>
              <Plus size={16} />
              افزودن سطح
            </Button>
          </div>
          <DataTable columns={columns} data={items} isLoading={isLoading} emptyMessage="سطحی یافت نشد" onRowClick={(row) => { setCreating(false); setEditing(row); }} />
        </>
      ) : (
        <TierForm
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
        title="حذف سطح"
        description="این سطح برای همیشه حذف می‌شود. اعضایی که در این سطح بودند، در محاسبه‌ی بعدی به نزدیک‌ترین سطح پایین‌تر منتقل می‌شوند."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}

function TierForm({ editing, isPending, onCancel, onSubmit }) {
  const toast = useToast();
  const [form, setForm] = useState({
    key: editing?.key || "",
    label: editing?.label || "",
    minPoints: editing?.minPoints ?? 0,
    pointsMultiplier: editing?.pointsMultiplier ?? 1,
    badgeColor: editing?.badgeColor || "#a3238e",
    perks: editing?.perks || "",
    rewardType: editing?.rewardType || "none",
    rewardValue: editing?.rewardValue ?? 0,
  });

  const patch = (fields) => setForm((f) => ({ ...f, ...fields }));

  const handleSubmit = () => {
    if (!editing && !form.key.trim()) {
      toast.error("کلید سطح الزامی است");
      return;
    }
    if (!form.label.trim()) {
      toast.error("عنوان الزامی است");
      return;
    }
    onSubmit(form);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? `ویرایش سطح: ${editing.label}` : "سطح جدید"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!editing && (
            <div>
              <Label>کلید یکتا (انگلیسی)</Label>
              <Input dir="ltr" value={form.key} onChange={(e) => patch({ key: e.target.value })} placeholder="مثلاً diamond" />
            </div>
          )}
          <div>
            <Label>عنوان سطح</Label>
            <Input value={form.label} onChange={(e) => patch({ label: e.target.value })} placeholder="مثلاً الماسی" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>حداقل امتیاز کل برای این سطح</Label>
            <Input type="number" value={form.minPoints} onChange={(e) => patch({ minPoints: Number(e.target.value) })} />
          </div>
          <div>
            <Label>ضریب امتیاز خرید</Label>
            <Input type="number" step="0.1" value={form.pointsMultiplier} onChange={(e) => patch({ pointsMultiplier: Number(e.target.value) })} />
          </div>
          <div>
            <Label>رنگ نشان</Label>
            <input type="color" value={form.badgeColor} onChange={(e) => patch({ badgeColor: e.target.value })} className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)]" />
          </div>
        </div>

        <div>
          <Label>مزایا (متن آزاد، برای نمایش به مشتری)</Label>
          <Input value={form.perks} onChange={(e) => patch({ perks: e.target.value })} placeholder="مثلاً ارسال رایگان + پشتیبانی ویژه" />
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
          <p className="mb-3 text-sm font-bold text-[var(--text)]">پاداش خودکار ورود به این سطح</p>
          <p className="mb-3 text-xs text-[var(--text-muted)]">
            وقتی امتیاز کل یک مشتری برای اولین بار به این سطح برسد، این پاداش به‌صورت خودکار (بدون اقدام مشتری) یک‌بار صادر می‌شود.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>نوع پاداش</Label>
              <Select value={form.rewardType} onChange={(e) => patch({ rewardType: e.target.value })}>
                <option value="none">بدون پاداش خودکار</option>
                <option value="discount_code">تولید کد تخفیف درصدی</option>
                <option value="cart_amount">اعمال مبلغ ثابت روی سبد خرید</option>
              </Select>
            </div>
            {form.rewardType !== "none" && (
              <div>
                <Label>{form.rewardType === "discount_code" ? "درصد تخفیف کد" : "مبلغ تخفیف (تومان)"}</Label>
                <Input type="number" value={form.rewardValue} onChange={(e) => patch({ rewardValue: Number(e.target.value) })} />
              </div>
            )}
          </div>
        </div>

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
