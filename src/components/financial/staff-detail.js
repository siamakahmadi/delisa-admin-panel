"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, Check, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  fetchStaffDetail,
  addStaffPayment,
  updateStaffPayment,
  deleteStaffPayment,
} from "@/lib/financial/api";
import { formatToman, formatDateTime } from "@/lib/utils";

const STATUS_LABELS = { pending: "در انتظار", paid: "پرداخت‌شده", failed: "ناموفق" };
const STATUS_VARIANT = { pending: "warning", paid: "success", failed: "danger" };

export function StaffDetail({ staffId }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ period: "", price: "", status: "pending", payNumber: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff-detail", staffId],
    queryFn: () => fetchStaffDetail(staffId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["staff-detail", staffId] });

  const addMutation = useMutation({
    mutationFn: () => addStaffPayment(staffId, { ...form, price: Number(form.price) }),
    onSuccess: () => {
      toast.success("پرداخت ثبت شد");
      invalidate();
      setAddOpen(false);
      setForm({ period: "", price: "", status: "pending", payNumber: "" });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ثبت ناموفق بود"),
  });

  const markPaidMutation = useMutation({
    mutationFn: (paymentId) => updateStaffPayment(staffId, paymentId, { status: "paid", payTime: new Date().toISOString() }),
    onSuccess: () => {
      toast.success("وضعیت به‌روزرسانی شد");
      invalidate();
    },
    onError: () => toast.error("به‌روزرسانی ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (paymentId) => deleteStaffPayment(staffId, paymentId),
    onSuccess: () => {
      toast.success("پرداخت حذف شد");
      invalidate();
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const payments = staff?.payments ?? [];

  const columns = useMemo(
    () => [
      { key: "period", header: "دوره", render: (row) => row.period || "—" },
      { key: "price", header: "مبلغ", render: (row) => formatToman(row.price) },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => (
          <Badge variant={STATUS_VARIANT[row.status] || "neutral"} size="sm" dot>
            {STATUS_LABELS[row.status] || row.status}
          </Badge>
        ),
      },
      { key: "payNumber", header: "شماره پیگیری", render: (row) => <span className="font-mono text-xs" dir="ltr">{row.payNumber || "—"}</span> },
      { key: "payTime", header: "تاریخ پرداخت", render: (row) => (row.payTime ? formatDateTime(row.payTime) : "—") },
      {
        key: "actions",
        header: "",
        render: (row) => (
          <div className="flex gap-1">
            {row.status !== "paid" && (
              <Button size="sm" variant="secondary" loading={markPaidMutation.isPending} onClick={(e) => { e.stopPropagation(); markPaidMutation.mutate(row._id); }}>
                <Check size={14} />
                پرداخت شد
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
              <Trash2 size={14} className="text-[var(--danger)]" />
            </Button>
          </div>
        ),
      },
    ],
    [markPaidMutation]
  );

  return (
    <div>
      <PageHeader
        title={isLoading ? "..." : staff?.name}
        subtitle={staff?.role}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/financial/staff")}>
              <ArrowRight size={16} />
              بازگشت
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={16} />
              افزودن پرداخت
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>تاریخچه پرداخت‌ها</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={columns} data={payments} isLoading={false} emptyMessage="پرداختی ثبت نشده" rowKey={(row) => row._id} />
          </CardContent>
        </Card>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogTitle>افزودن پرداخت جدید</DialogTitle>
          <div className="mt-4 space-y-3">
            <div>
              <Label>دوره</Label>
              <Input value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} placeholder="مثلاً: مهر ۱۴۰۴" />
            </div>
            <div>
              <Label>مبلغ</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <Label>وضعیت</Label>
              <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="pending">در انتظار</option>
                <option value="paid">پرداخت‌شده</option>
                <option value="failed">ناموفق</option>
              </Select>
            </div>
            <div>
              <Label>شماره پیگیری (اختیاری)</Label>
              <Input dir="ltr" value={form.payNumber} onChange={(e) => setForm((f) => ({ ...f, payNumber: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>انصراف</Button>
              <Button loading={addMutation.isPending} onClick={() => addMutation.mutate()}>ثبت</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف پرداخت"
        description="این رکورد پرداخت برای همیشه حذف می‌شود. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
