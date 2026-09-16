"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Pencil,
  Eye,
  ShoppingBag,
  Store,
  Package,
  Star,
  ImageOff,
  ExternalLink,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatToman, formatDateTime } from "@/lib/utils";
import { productSiteUrl } from "@/lib/siteLinks";

const fmt = (n) => Number(n || 0).toLocaleString("fa-IR");

const ORDER_STATUS_LABELS = {
  pending: "در انتظار",
  submitted: "ثبت شده",
  waiting_vendor: "منتظر تأیید فروشنده",
  collecting: "در حال آماده‌سازی",
  products_collected: "آماده ارسال",
  sending: "ارسال شده",
  delivered: "تحویل شده",
  returned: "مرجوعی",
  cancelled: "لغو شده",
};

export function ProductInsights({ id }) {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product-insights", id],
    queryFn: async () => (await apiClient.get(`/api/admin/products/${id}/insights`)).data,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-10 text-center text-sm text-[var(--text-faint)]">
        محصول یافت نشد.
      </div>
    );
  }

  const { product, stats, vendors, recentOrders } = data;

  const vendorColumns = [
    {
      key: "name",
      header: "فروشنده",
      render: (row) =>
        row.id ? (
          <a
            href={`/vendors/${row.id}`}
            className="font-medium text-[var(--brand-600)] hover:underline"
          >
            {row.name}
          </a>
        ) : (
          row.name
        ),
    },
    { key: "phone", header: "تلفن", render: (row) => row.phone || "-" },
    { key: "price", header: "قیمت وندور", render: (row) => formatToman(row.price) },
    { key: "stock", header: "موجودی این وندور", render: (row) => fmt(row.stock) },
    {
      key: "approvalStatus",
      header: "وضعیت تأیید",
      render: (row) => (
        <Badge
          variant={
            row.approvalStatus === "approved"
              ? "success"
              : row.approvalStatus === "rejected"
              ? "danger"
              : "neutral"
          }
          size="sm"
          dot
        >
          {row.approvalStatus === "approved"
            ? "تأییدشده"
            : row.approvalStatus === "rejected"
            ? "ردشده"
            : "در انتظار"}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "فعال",
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "neutral"} size="sm" dot>
          {row.isActive ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
    {
      key: "totalProductsCount",
      header: "کل محصولات این فروشنده",
      render: (row) => fmt(row.totalProductsCount),
    },
  ];

  const orderColumns = [
    { key: "orderCode", header: "کد سفارش", render: (row) => row.orderCode || "-" },
    {
      key: "createdAt",
      header: "تاریخ",
      render: (row) => formatDateTime(row.createdAt),
    },
    { key: "quantity", header: "تعداد", render: (row) => fmt(row.quantity) },
    {
      key: "orderStatus",
      header: "وضعیت سفارش",
      render: (row) => ORDER_STATUS_LABELS[row.orderStatus] || row.orderStatus || "-",
    },
    { key: "customerPhone", header: "شماره مشتری", render: (row) => row.customerPhone || "-" },
  ];

  return (
    <div>
      <PageHeader
        title={product.productName}
        subtitle={
          product.slug ? (
            <a
              href={productSiteUrl(product.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-[var(--brand-600)] hover:underline"
              title="مشاهده در سایت"
            >
              {product.slug}
              <ExternalLink size={12} />
            </a>
          ) : null
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/products")}>
              <ArrowRight size={16} />
              بازگشت به لیست
            </Button>
            <Button onClick={() => router.push(`/products/${id}`)}>
              <Pencil size={16} />
              ویرایش محصول
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-muted)]">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageOff size={20} className="text-[var(--text-faint)]" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--text)]">{product.productName}</span>
              <Badge variant={product.isPublished ? "success" : "neutral"} size="sm" dot>
                {product.isPublished ? "منتشر شده" : "پیش‌نویس"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {product.brand ? `برند: ${product.brand}` : ""}
              {product.category ? ` — دسته‌بندی: ${product.category}` : ""}
            </p>
          </div>
          <div className="text-left">
            <p className="text-xs text-[var(--text-faint)]">قیمت نهایی</p>
            <p className="text-lg font-bold text-[var(--text)]">{formatToman(stats.price)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Eye} label="بازدید صفحه" value={fmt(stats.views)} color="blue" />
        <StatCard icon={ShoppingBag} label="تعداد فروش" value={fmt(stats.salesQuantity)} color="violet" />
        <StatCard icon={ShoppingBag} label="تعداد سفارش" value={fmt(stats.salesOrders)} color="pink" />
        <StatCard icon={Store} label="تعداد وندور" value={fmt(stats.vendorCount)} color="amber" />
        <StatCard icon={Package} label="موجودی کل" value={fmt(stats.totalStock)} color="teal" />
        <StatCard icon={Package} label="موجود برای فروش" value={fmt(stats.availableQuantity)} color="blue" />
        <StatCard
          icon={Star}
          label="امتیاز"
          value={`${fmt(stats.averageRating)} (${fmt(stats.ratingsCount)})`}
          color="violet"
        />
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            وندورهای این محصول ({vendors.length.toLocaleString("fa-IR")})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={vendorColumns}
            data={vendors}
            rowKey={(row) => row.id || row.name}
            emptyMessage="هیچ وندوری این محصول رو ثبت نکرده"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>آخرین سفارش‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={orderColumns}
            data={recentOrders}
            rowKey={(row) => row.orderId}
            emptyMessage="هنوز سفارشی روی این محصول ثبت نشده"
          />
        </CardContent>
      </Card>
    </div>
  );
}
