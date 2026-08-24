"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ImageOff } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { fetchStaffList, createStaff, ROLE_LABELS } from "@/lib/staff/api";

const ROLE_OPTIONS = ["support", "admin", "product_manager", "delivery", "blogger"];

export default function StaffPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", role: "support", nationalCode: "" });

  const { data, isLoading } = useQuery({ queryKey: ["staff-list"], queryFn: fetchStaffList });
  const staff = data ?? [];

  const createMutation = useMutation({
    mutationFn: () => createStaff(form),
    onSuccess: () => {
      toast.success("همکار با موفقیت اضافه شد");
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      setCreateOpen(false);
      setForm({ name: "", phone: "", role: "support", nationalCode: "" });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "افزودن ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "همکار",
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-muted)]">
              {row.profile ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.profile} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageOff size={14} className="text-[var(--text-faint)]" />
              )}
            </div>
            <span className="font-medium text-[var(--text)]">{row.name}</span>
          </div>
        ),
      },
      { key: "role", header: "موقعیت شغلی", render: (row) => ROLE_LABELS[row.role] || row.role },
      { key: "phone", header: "شماره تلفن", render: (row) => <span dir="ltr">{row.phone}</span> },
      {
        key: "isOnline",
        header: "وضعیت فعالیت",
        render: (row) => (row.isOnline ? <Badge variant="success" size="sm" dot>آنلاین</Badge> : <Badge variant="neutral" size="sm" dot>آفلاین</Badge>),
      },
      {
        key: "isActive",
        header: "وضعیت دسترسی",
        render: (row) => (row.isActive ? <Badge variant="success" size="sm" dot>فعال</Badge> : <Badge variant="danger" size="sm" dot>غیرفعال</Badge>),
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="کارکنان"
        subtitle="کارکنان و دسترسی‌های داخلی تیم"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            افزودن همکار
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={staff}
        isLoading={isLoading}
        emptyMessage="هنوز همکاری ثبت نشده است"
        rowKey={(row) => row._id}
        onRowClick={(row) => router.push(`/staff/${row._id}`)}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogTitle>افزودن همکار جدید</DialogTitle>
          <div className="mt-4 space-y-3">
            <div>
              <Label>نام همکار</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>شماره همراه</Label>
              <Input dir="ltr" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>کد ملی (اختیاری)</Label>
              <Input dir="ltr" value={form.nationalCode} onChange={(e) => setForm((f) => ({ ...f, nationalCode: e.target.value }))} />
            </div>
            <div>
              <Label>موقعیت شغلی</Label>
              <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>انصراف</Button>
              <Button loading={createMutation.isPending} disabled={!form.name.trim() || !form.phone.trim()} onClick={() => createMutation.mutate()}>
                افزودن
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
