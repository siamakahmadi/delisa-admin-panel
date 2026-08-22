"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Trash2, Search, Eye, ShoppingBag, Wallet, Clock } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/dashboard/stat-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AbandonedCartModal } from "@/components/orders/abandoned-cart-modal";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDateTime, formatNumber, formatToman } from "@/lib/utils";

const HOURS_OPTIONS = [1, 2, 6, 12, 24, 48, 72];

export default function AbandonedCartsPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailCart, setDetailCart] = useState(null);
  const [search, setSearch] = useState("");
  const [hours, setHours] = useState(2);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading } = useQuery({
    queryKey: ["abandoned-carts", hours],
    queryFn: async () => (await apiClient.get("/api/admin/abandoned-carts", { params: { hours } })).data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/abandoned-carts/${id}`),
    onSuccess: () => {
      toast.success("سبد حذف شد");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["abandoned-carts"] });
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const carts = useMemo(() => data?.data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return carts;
    return carts.filter(
      (c) => c.customer?.name?.toLowerCase().includes(q) || c.customer?.phone?.includes(q)
    );
  }, [carts, debouncedSearch]);

  const summary = useMemo(() => {
    const totalValue = carts.reduce((sum, c) => sum + (c.finalPrice || c.totalPrice || 0), 0);
    const totalItems = carts.reduce((sum, c) => sum + (c.items?.length || 0), 0);
    return { count: carts.length, totalValue, totalItems };
  }, [carts]);

  const columns = useMemo(
    () => [
      {
        key: "customer",
        header: "مشتری",
        render: (row) => (
          <div>
            <div className="font-medium text-[var(--text)]">{row.customer?.name || "مهمان"}</div>
            <div className="text-xs text-[var(--text-faint)]" dir="ltr">
              {row.customer?.phone || ""}
            </div>
          </div>
        ),
      },
      {
        key: "items",
        header: "محصولات",
        render: (row) => (
          <div>
            <span className="text-xs text-[var(--text-muted)]">
              {(row.items ?? [])
                .slice(0, 2)
                .map((it) => it.snapshotTitle || it.product?.productName)
                .filter(Boolean)
                .join("، ")}
              {row.items?.length > 2 ? ` +${row.items.length - 2}` : ""}
            </span>
          </div>
        ),
      },
      {
        key: "value",
        header: "مبلغ سبد",
        sortable: true,
        sortValue: (row) => row.finalPrice || row.totalPrice || 0,
        render: (row) => formatToman(row.finalPrice || row.totalPrice),
      },
      {
        key: "updatedAt",
        header: "آخرین بروزرسانی",
        sortable: true,
        render: (row) => formatDateTime(row.updatedAt),
      },
      {
        key: "actions",
        header: "عملیات",
        render: (row) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDetailCart(row); }}>
              <Eye size={16} />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
              <Trash2 size={16} className="text-[var(--danger)]" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="سفارشات رها‌شده"
        subtitle="سبدهای خریدی که تکمیل نشده‌اند"
        actions={
          <Button variant="outline" onClick={() => router.push("/orders")}>
            <ArrowRight size={16} />
            بازگشت به سفارشات
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={ShoppingBag} label="تعداد سبد رهاشده" value={formatNumber(summary.count)} color="violet" isLoading={isLoading} />
        <StatCard icon={Wallet} label="ارزش کل سبدها" value={formatToman(summary.totalValue)} color="pink" isLoading={isLoading} />
        <StatCard icon={Clock} label="مجموع اقلام" value={formatNumber(summary.totalItems)} color="blue" isLoading={isLoading} />
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <Input placeholder="جستجوی نام یا شماره مشتری..." className="pr-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="w-56" value={hours} onChange={(e) => setHours(Number(e.target.value))}>
          {HOURS_OPTIONS.map((h) => (
            <option key={h} value={h}>
              بدون فعالیت بیش از {h.toLocaleString("fa-IR")} ساعت
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyMessage="سبد رهاشده‌ای یافت نشد"
        rowKey={(row) => row._id}
        onRowClick={(row) => setDetailCart(row)}
      />

      <AbandonedCartModal cart={detailCart} open={!!detailCart} onOpenChange={(open) => !open && setDetailCart(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف سبد رهاشده"
        description="این سبد خرید برای همیشه حذف می‌شود. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
