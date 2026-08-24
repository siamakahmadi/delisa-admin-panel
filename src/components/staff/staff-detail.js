"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Save, Ban, RotateCcw, Trash2, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  fetchStaffDetail,
  updateStaffInfo,
  disableStaff,
  reactivateStaff,
  deleteStaff,
  ROLE_LABELS,
} from "@/lib/staff/api";

const ROLE_OPTIONS = ["support", "admin", "product_manager", "delivery", "blogger", "vendor"];

export function StaffDetail({ staffId }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff-detail-full", staffId],
    queryFn: () => fetchStaffDetail(staffId),
  });

  const [form, setForm] = useState(null);
  const active = form || (staff ? { name: staff.name, phone: staff.phone, role: staff.role, nationalCode: staff.nationalCode || "" } : null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["staff-detail-full", staffId] });
    queryClient.invalidateQueries({ queryKey: ["staff-list"] });
  };

  const saveMutation = useMutation({
    mutationFn: () => updateStaffInfo(staffId, active),
    onSuccess: () => {
      toast.success("اطلاعات ذخیره شد");
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: () => (staff.isActive ? disableStaff(staffId) : reactivateStaff(staffId)),
    onSuccess: () => {
      toast.success(staff.isActive ? "همکار غیرفعال شد" : "همکار فعال شد");
      invalidate();
    },
    onError: () => toast.error("عملیات ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteStaff(staffId),
    onSuccess: () => {
      toast.success("همکار حذف شد");
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      router.push("/staff");
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!staff) return <p className="py-10 text-center text-sm text-[var(--text-faint)]">همکار یافت نشد</p>;

  return (
    <div>
      <PageHeader
        title={staff.name}
        subtitle={ROLE_LABELS[staff.role] || staff.role}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/staff")}>
              <ArrowRight size={16} />
              بازگشت
            </Button>
            <Button variant="secondary" onClick={() => router.push(`/financial/staff/${staffId}`)}>
              <Wallet size={15} />
              پرداخت‌های مالی
            </Button>
            <Button variant={staff.isActive ? "danger" : "secondary"} loading={toggleActiveMutation.isPending} onClick={() => toggleActiveMutation.mutate()}>
              {staff.isActive ? <Ban size={15} /> : <RotateCcw size={15} />}
              {staff.isActive ? "غیرفعال کردن" : "فعال‌سازی مجدد"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              اطلاعات همکار
              {staff.isActive ? (
                <Badge variant="success" size="sm" dot>فعال</Badge>
              ) : (
                <Badge variant="danger" size="sm" dot>غیرفعال</Badge>
              )}
              {staff.isOnline && <Badge variant="info" size="sm" dot>آنلاین</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>نام همکار</Label>
                <Input value={active.name} onChange={(e) => setForm({ ...active, name: e.target.value })} />
              </div>
              <div>
                <Label>شماره همراه</Label>
                <Input dir="ltr" value={active.phone} onChange={(e) => setForm({ ...active, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>کد ملی</Label>
                <Input dir="ltr" value={active.nationalCode} onChange={(e) => setForm({ ...active, nationalCode: e.target.value })} />
              </div>
              <div>
                <Label>موقعیت شغلی</Label>
                <Select value={active.role} onChange={(e) => setForm({ ...active, role: e.target.value })}>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                <Save size={16} />
                ذخیره تغییرات
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">منطقه خطر</h3>
            <p className="text-xs text-[var(--text-faint)]">حذف همکار غیرقابل بازگشت است و تمام اطلاعات و سابقه او پاک می‌شود.</p>
            <Button variant="danger" className="w-full" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={15} />
              حذف همکار
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف همکار"
        description="این عمل غیرقابل بازگشت است و تمام اطلاعات و سابقه این نیرو پاک می‌شود. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
