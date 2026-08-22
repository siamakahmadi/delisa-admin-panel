"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Trash2, Wallet, ShoppingBag, TrendingUp } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatToman } from "@/lib/utils";
import { VENDOR_STATUS_LABELS, VENDOR_STATUS_VARIANT } from "@/lib/constants";

const EDITABLE_STATUSES = ["pending", "approved", "rejected"];

export function VendorDetail({ id }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-overview", id],
    queryFn: async () => (await apiClient.get(`/api/admin/vendors/${id}/overview`)).data,
  });

  const statusMutation = useMutation({
    mutationFn: (status) => apiClient.patch(`/api/admin/vendors/${id}/status`, { status }),
    onSuccess: () => {
      toast.success("وضعیت فروشنده بروزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["vendor-overview", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/admin/vendors/${id}`),
    onSuccess: () => {
      toast.success("فروشنده حذف شد");
      router.push("/vendors");
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const vendor = data?.vendor;
  if (!vendor) return <p className="text-sm text-[var(--text-muted)]">فروشنده یافت نشد.</p>;

  const summary = data?.summary ?? {};
  const products = data?.products ?? [];
  const withdrawals = data?.withdrawals ?? [];

  return (
    <div>
      <PageHeader
        title={`${vendor.firstName ?? ""} ${vendor.lastName ?? ""}`.trim() || "فروشنده"}
        subtitle={vendor.storeInfo?.storeName || vendor.contactPhone}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/vendors")}>
              <ArrowRight size={16} />
              بازگشت
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} />
              حذف فروشنده
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard icon={ShoppingBag} label="تعداد سفارشات" value={summary.totalOrders?.toLocaleString("fa-IR")} color="blue" />
        <SummaryCard icon={TrendingUp} label="درآمد کل" value={formatToman(summary.totalRevenue)} color="teal" />
        <SummaryCard icon={Wallet} label="موجودی کیف‌پول" value={formatToman(summary.walletBalance)} color="pink" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>اطلاعات فروشنده</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="شماره تماس" value={<span dir="ltr">{vendor.contactPhone}</span>} />
            <Row label="نام فروشگاه" value={vendor.storeInfo?.storeName || "-"} />
            <Row label="تاریخ عضویت" value={formatDate(vendor.createdAt)} />
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">وضعیت</span>
              <StatusBadge status={vendor.status} labels={VENDOR_STATUS_LABELS} variants={VENDOR_STATUS_VARIANT} />
            </div>
            <Select
              value={EDITABLE_STATUSES.includes(vendor.status) ? vendor.status : ""}
              disabled={statusMutation.isPending}
              onChange={(e) => statusMutation.mutate(e.target.value)}
            >
              {!EDITABLE_STATUSES.includes(vendor.status) && <option value="">انتخاب وضعیت</option>}
              {EDITABLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {VENDOR_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <Tabs defaultValue="products" className="p-5">
              <TabsList>
                <TabsTrigger value="products">محصولات ({products.length.toLocaleString("fa-IR")})</TabsTrigger>
                <TabsTrigger value="withdrawals">
                  درخواست‌های تسویه ({withdrawals.length.toLocaleString("fa-IR")})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products">
                {products.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[var(--text-faint)]">محصولی ثبت نشده است.</p>
                ) : (
                  <div className="space-y-2">
                    {products.map((p) => (
                      <div
                        key={p._id}
                        className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] p-3"
                      >
                        <span className="text-sm font-medium">{p.product?.productName || "محصول"}</span>
                        <span className="text-sm text-[var(--text-muted)]">{formatToman(p.vendorPrice)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="withdrawals">
                {withdrawals.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[var(--text-faint)]">درخواستی ثبت نشده است.</p>
                ) : (
                  <div className="space-y-2">
                    {withdrawals.map((w) => (
                      <div
                        key={w._id}
                        className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] p-3"
                      >
                        <span className="text-sm">{formatDate(w.createdAt)}</span>
                        <span className="text-sm font-semibold">{formatToman(w.amount)}</span>
                        <span className="text-xs text-[var(--text-muted)]">{w.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف فروشنده"
        description="این عملیات غیرقابل بازگشت است. فروشنده برای همیشه حذف می‌شود."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-medium text-[var(--text)]">{value}</span>
    </div>
  );
}

const GRADIENTS = {
  blue: "from-[var(--accent-blue)] to-[var(--accent-cyan)]",
  teal: "from-[var(--accent-teal)] to-[var(--accent-cyan)]",
  pink: "from-[var(--accent-pink)] to-[var(--brand-500)]",
};

function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br ${GRADIENTS[color]} text-white`}>
        <Icon size={16} />
      </div>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[var(--text)]">{value}</p>
    </div>
  );
}
