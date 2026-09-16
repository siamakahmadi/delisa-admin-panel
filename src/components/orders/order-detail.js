"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Send,
  Trash2,
  User,
  MapPin,
  Package,
  Truck,
  CreditCard,
  Store,
  History,
  ExternalLink,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusQuickSelect } from "@/components/orders/status-quick-select";
import { useToast } from "@/components/ui/toast";
import { formatDateTime, formatToman } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT } from "@/lib/constants";
import { productSiteUrl } from "@/lib/siteLinks";

const PAYMENT_METHOD_LABELS = {
  zarinpal: "زرین‌پال",
  torobpay: "ترب‌پی",
  wallet: "کیف پول",
  free: "رایگان",
  offline: "آفلاین",
};

const PAYMENT_STATUS_LABELS = {
  pending: "در انتظار",
  success: "موفق",
  failed: "ناموفق",
};

export function OrderDetail({ id }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await apiClient.get(`/api/admin/orders/${id}`)).data.data,
  });

  const statusMutation = useMutation({
    mutationFn: (status) => apiClient.patch(`/api/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success("وضعیت سفارش بروزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) => toast.error("خطا", err?.response?.data?.error || "تغییر وضعیت ناموفق بود"),
  });

  const addNoteMutation = useMutation({
    mutationFn: (text) => apiClient.post(`/api/admin/orders/${id}/notes`, { text }),
    onSuccess: () => {
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["order", id] });
    },
    onError: (err) => toast.error("خطا", err?.response?.data?.error || "ثبت یادداشت ناموفق بود"),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId) => apiClient.delete(`/api/admin/orders/${id}/notes/${noteId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order", id] }),
  });

  const vendors = useMemo(() => {
    if (!order?.products?.length) return [];
    const map = new Map();
    order.products.forEach((item) => {
      if (!item.vendor) return;
      if (!map.has(item.vendor)) map.set(item.vendor, { name: item.vendor, phone: item.vendorPhone });
    });
    return Array.from(map.values());
  }, [order]);

  const timeline = useMemo(() => {
    if (!order) return [];
    const historyEvents = (order.statusHistory ?? []).map((h) => ({
      type: "status",
      label: `تغییر وضعیت به «${ORDER_STATUS_LABELS[h.status] || h.status}»`,
      by: h.updatedBy?.name,
      at: h.updatedAt,
    }));
    const notifEvents = (order.notifications ?? []).map((n) => ({
      type: "notification",
      label: n.title || n.shortDescription,
      by: n.channels?.join("، "),
      at: n.createdAt,
    }));
    return [...historyEvents, ...notifEvents].sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [order]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-sm text-[var(--text-muted)]">سفارش یافت نشد.</p>;
  }

  return (
    <div>
      <PageHeader
        title={`سفارش ${order.orderCode || ""}`}
        subtitle={formatDateTime(order.createdAt)}
        actions={
          <Button variant="outline" onClick={() => router.push("/orders")}>
            <ArrowRight size={16} />
            بازگشت به لیست
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package size={16} />
                اقلام سفارش ({order.products?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-xs text-[var(--text-muted)]">
                      <th className="px-4 py-2.5 text-start font-semibold">محصول</th>
                      <th className="px-4 py-2.5 text-start font-semibold">تعداد</th>
                      <th className="px-4 py-2.5 text-start font-semibold">قیمت واحد</th>
                      <th className="px-4 py-2.5 text-start font-semibold">تخفیف</th>
                      <th className="px-4 py-2.5 text-start font-semibold">مالیات</th>
                      <th className="px-4 py-2.5 text-start font-semibold">قیمت نهایی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.products ?? []).map((item, i) => (
                      <tr key={i} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {item.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.thumbnail}
                                alt=""
                                className="h-8 w-8 shrink-0 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] object-cover"
                              />
                            ) : null}
                            <span className="max-w-[180px] truncate font-medium text-[var(--text)]">
                              {item.title || "محصول"}
                            </span>
                            {(item.productSlug || item.productId) && (
                              <a
                                href={productSiteUrl(item.productSlug || item.productId)}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 text-[var(--text-faint)] hover:text-[var(--brand-600)]"
                                title="مشاهده در سایت"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                          <span className="text-xs text-[var(--text-faint)]">فروشنده: {item.vendor || "-"}</span>
                        </td>
                        <td className="px-4 py-3">{item.quantity?.toLocaleString("fa-IR")}</td>
                        <td className="px-4 py-3">{formatToman(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-[var(--danger)]">{formatToman(item.itemDiscount)}</td>
                        <td className="px-4 py-3">{formatToman(item.itemTax)}</td>
                        <td className="px-4 py-3 font-semibold">{formatToman(item.itemFinalTotal ?? item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5 border-t border-[var(--border)] px-4 py-4 text-sm">
                <Row label="جمع کل" value={formatToman(order.totalPrice)} />
                <Row label="تخفیف" value={formatToman(order.discountAmount)} danger />
                <Row label="مالیات" value={formatToman(order.taxAmount)} />
                <Row label="هزینه پست" value={formatToman(order.shippingAmount)} />
                <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-2 text-base font-bold">
                  <span>مبلغ نهایی</span>
                  <span className="text-[var(--brand-600)]">{formatToman(order.finalPrice)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History size={16} />
                لاگ‌های سفارش
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-xs text-[var(--text-faint)]">رخدادی ثبت نشده است.</p>
              ) : (
                <ol className="space-y-4 border-e-2 border-[var(--border)] pe-4">
                  {timeline.map((event, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -right-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--brand-500)]" />
                      <p className="text-sm text-[var(--text)]">{event.label}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                        {[event.by, formatDateTime(event.at)].filter(Boolean).join(" · ")}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>یادداشت‌های داخلی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="یادداشت جدید..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && note.trim()) addNoteMutation.mutate(note.trim());
                  }}
                />
                <Button
                  size="icon"
                  disabled={!note.trim()}
                  loading={addNoteMutation.isPending}
                  onClick={() => note.trim() && addNoteMutation.mutate(note.trim())}
                >
                  <Send size={16} />
                </Button>
              </div>
              <div className="space-y-2">
                {(order.notes ?? []).length === 0 && (
                  <p className="text-xs text-[var(--text-faint)]">یادداشتی ثبت نشده است.</p>
                )}
                {(order.notes ?? []).map((n) => (
                  <div
                    key={n._id}
                    className="flex items-start justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3 text-sm"
                  >
                    <div>
                      <p className="text-[var(--text)]">{n.text}</p>
                      <p className="mt-1 text-xs text-[var(--text-faint)]">
                        {n.createdBy?.name || "ادمین"} · {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteNoteMutation.mutate(n._id)}
                      className="shrink-0 text-[var(--text-faint)] hover:text-[var(--danger)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>وضعیت سفارش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusQuickSelect status={order.status} disabled={statusMutation.isPending} onChange={(s) => statusMutation.mutate(s)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={16} />
                مشتری
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {order.customer?._id ? (
                <button
                  onClick={() => router.push(`/customers/${order.customer._id}`)}
                  className="font-medium text-[var(--brand-600)] hover:underline"
                >
                  {order.customer?.name || "بدون نام"}
                </button>
              ) : (
                <p className="font-medium text-[var(--text)]">{order.customer?.name || "بدون نام"}</p>
              )}
              <p dir="ltr" className="text-[var(--text-muted)]">
                {order.customer?.phone}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={16} />
                گیرنده و آدرس تحویل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-[var(--text-muted)]">
              {order.address ? (
                <>
                  <p className="font-medium text-[var(--text)]">{order.address?.fullName}</p>
                  <p dir="ltr">{order.address?.phone}</p>
                  <p>
                    {order.address?.city} - {order.address?.street}
                  </p>
                  {order.address?.postalCode && <p>کدپستی: {order.address.postalCode}</p>}
                  {order.address?.locationNote && <p>{order.address.locationNote}</p>}
                </>
              ) : (
                <p>آدرسی ثبت نشده است.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={16} />
                اطلاعات درگاه پرداخت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="روش پرداخت" value={PAYMENT_METHOD_LABELS[order.payment?.method] || order.payment?.method || "-"} />
              <Row
                label="وضعیت پرداخت"
                value={
                  <StatusBadge
                    status={order.payment?.status}
                    labels={PAYMENT_STATUS_LABELS}
                    variants={{ success: "success", pending: "warning", failed: "danger" }}
                  />
                }
              />
              <Row label="مبلغ" value={formatToman(order.payment?.amount)} />
              {order.payment?.refId && <Row label="کد پیگیری" value={<span dir="ltr">{order.payment.refId}</span>} />}
              <Row label="زمان پرداخت" value={formatDateTime(order.payment?.paidAt)} />
            </CardContent>
          </Card>

          {vendors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store size={16} />
                  فروشندگان سفارش
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {vendors.map((v, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[var(--text)]">{v.name}</span>
                    <span dir="ltr" className="text-xs text-[var(--text-faint)]">
                      {v.phone}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck size={16} />
                وضعیت ارسال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.delivery ? (
                <>
                  <Row label="پیک" value={order.delivery?.name} />
                  <Row label="شماره تماس" value={<span dir="ltr">{order.delivery?.phone}</span>} />
                  <Row
                    label="وضعیت پیک"
                    value={
                      order.delivery?.isOnline ? (
                        <span className="text-[var(--success)]">آنلاین</span>
                      ) : (
                        <span className="text-[var(--text-faint)]">آفلاین</span>
                      )
                    }
                  />
                </>
              ) : (
                <p className="text-[var(--text-faint)]">پیکی تخصیص داده نشده است.</p>
              )}
              {order.trackingCode && <Row label="کد رهگیری" value={<span dir="ltr">{order.trackingCode}</span>} />}
              {order.deliveredAt && <Row label="زمان تحویل" value={formatDateTime(order.deliveredAt)} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, danger }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={danger ? "font-medium text-[var(--danger)]" : "font-medium text-[var(--text)]"}>{value}</span>
    </div>
  );
}
