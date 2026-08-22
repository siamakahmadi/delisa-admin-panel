"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, MousePointerClick, X } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDateTime, formatNumber } from "@/lib/utils";

const STATUS_LABELS = { draft: "پیش‌نویس", active: "فعال", paused: "متوقف" };
const STATUS_VARIANTS = { draft: "neutral", active: "success", paused: "warning" };
const CATEGORY_LABELS = {
  discount: "تخفیف ویژه",
  "first-purchase": "اولین خرید",
  festival: "جشنواره",
  announcement: "اطلاع‌رسانی",
  custom: "سفارشی",
};

export default function PromoModalsPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["promo-modals"],
    queryFn: async () => (await apiClient.get("/api/admin/modals")).data,
  });

  const modals = useMemo(() => data ?? [], [data]);

  const createMutation = useMutation({
    mutationFn: () => apiClient.post("/api/admin/modals", { title: title.trim() }),
    onSuccess: (res) => {
      toast.success("مودال ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["promo-modals"] });
      setCreateOpen(false);
      setTitle("");
      router.push(`/marketing/modals/${res.data._id}`);
    },
    onError: (err) => toast.error("خطا", err?.response?.data?.message || "ثبت ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: "عنوان",
        render: (row) => <span className="font-medium">{row.title}</span>,
      },
      {
        key: "category",
        header: "دسته‌بندی",
        render: (row) => <Badge variant="brand">{CATEGORY_LABELS[row.category] || row.category}</Badge>,
      },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => <StatusBadge status={row.status} labels={STATUS_LABELS} variants={STATUS_VARIANTS} />,
      },
      {
        key: "targeting",
        header: "صفحات هدف",
        render: (row) =>
          row.targeting?.mode === "specific" ? (
            <span className="text-xs text-[var(--text-muted)]">{(row.targeting.paths || []).length.toLocaleString("fa-IR")} مسیر</span>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">همه صفحات</span>
          ),
      },
      {
        key: "stats",
        header: "آمار",
        render: (row) => (
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1">
              <Eye size={12} /> {formatNumber(row.stats?.views)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MousePointerClick size={12} /> {formatNumber(row.stats?.clicks)}
            </span>
            <span className="inline-flex items-center gap-1">
              <X size={12} /> {formatNumber(row.stats?.closes)}
            </span>
          </div>
        ),
      },
      {
        key: "updatedAt",
        header: "آخرین ویرایش",
        sortable: true,
        render: (row) => <span className="text-xs text-[var(--text-muted)]">{formatDateTime(row.updatedAt)}</span>,
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="مودال‌های تبلیغاتی"
        subtitle={`${modals.length.toLocaleString("fa-IR")} مودال — تخفیف ویژه، اولین خرید، جشنواره و ...`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            مودال جدید
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={modals}
        isLoading={isLoading}
        emptyMessage="هنوز مودالی ساخته نشده"
        onRowClick={(row) => router.push(`/marketing/modals/${row._id}`)}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogTitle>مودال جدید</DialogTitle>
          <div className="mt-4 space-y-4">
            <div>
              <Label>عنوان داخلی مودال</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                placeholder="مثلاً: تخفیف ویژه بلک‌فرایدی"
                onKeyDown={(e) => e.key === "Enter" && title.trim() && createMutation.mutate()}
              />
              <p className="mt-1 text-xs text-[var(--text-faint)]">این عنوان فقط برای شناسایی داخلی در پنل است و به مشتری نمایش داده نمی‌شود.</p>
            </div>
            <Button className="w-full" disabled={!title.trim()} loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
              ثبت و ادامه تنظیمات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
