"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Eye, Boxes, Wallet, Percent, CalendarRange, X, AlertTriangle, PackageX } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EntityLink } from "@/components/ui/entity-link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { fetchProductsAnalytics } from "@/lib/products/api";
import { productSiteUrl, categorySiteUrl, brandSiteUrl } from "@/lib/siteLinks";
import { formatToman, formatNumber, startOfMonth } from "@/lib/utils";

export function ProductsAnalytics() {
  const router = useRouter();
  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState("");

  const params = { from: from || undefined, to: to || undefined };

  const { data, isLoading } = useQuery({
    queryKey: ["products-analytics", params],
    queryFn: () => fetchProductsAnalytics(params),
  });

  const summary = data?.summary ?? {};
  const viewsTrend = data?.viewsTrend ?? [];
  const topByViews = data?.topByViews ?? [];
  const topByRevenue = data?.topByRevenue ?? [];
  const topByQuantity = data?.topByQuantity ?? [];
  const topCategories = data?.topCategories ?? [];
  const topBrands = data?.topBrands ?? [];
  const lowStockList = data?.lowStockList ?? [];
  const outOfStockList = data?.outOfStockList ?? [];

  const hasDateFilter = Boolean(from || to);

  const conversionRate = summary.totalViews
    ? `${((summary.totalSalesQuantity / summary.totalViews) * 100).toFixed(1)}%`
    : "-";

  const productColumns = useMemo(
    () => [
      {
        key: "productName",
        header: "محصول",
        render: (row) => (
          <EntityLink name={row.productName} image={row.image} href={productSiteUrl(row.slug || row.productId)} />
        ),
      },
      { key: "views", header: "بازدید", render: (row) => formatNumber(row.views) },
      { key: "quantity", header: "تعداد فروش", render: (row) => formatNumber(row.quantity) },
      { key: "revenue", header: "درآمد", sortable: true, render: (row) => formatToman(row.revenue) },
      {
        key: "actions",
        header: "",
        render: (row) => (
          <button
            className="text-xs font-medium text-[var(--brand-600)] hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/products/${row.productId}/insights`);
            }}
          >
            جزئیات
          </button>
        ),
      },
    ],
    [router]
  );

  const categoryColumns = useMemo(
    () => [
      { key: "name", header: "دسته‌بندی", render: (row) => <EntityLink name={row.name} href={categorySiteUrl(row.slug)} /> },
      { key: "views", header: "بازدید", render: (row) => formatNumber(row.views) },
      { key: "quantity", header: "تعداد فروش", render: (row) => formatNumber(row.quantity) },
      { key: "revenue", header: "درآمد", sortable: true, render: (row) => formatToman(row.revenue) },
    ],
    []
  );

  const brandColumns = useMemo(
    () => [
      { key: "name", header: "برند", render: (row) => <EntityLink name={row.name} href={brandSiteUrl(row.slug)} /> },
      { key: "views", header: "بازدید", render: (row) => formatNumber(row.views) },
      { key: "quantity", header: "تعداد فروش", render: (row) => formatNumber(row.quantity) },
      { key: "revenue", header: "درآمد", sortable: true, render: (row) => formatToman(row.revenue) },
    ],
    []
  );

  const stockColumns = useMemo(
    () => [
      {
        key: "productName",
        header: "محصول",
        render: (row) => (
          <EntityLink name={row.productName} image={row.image} href={productSiteUrl(row.slug || row.productId)} />
        ),
      },
      { key: "availableQuantity", header: "موجودی", render: (row) => formatNumber(row.availableQuantity) },
      {
        key: "actions",
        header: "",
        render: (row) => (
          <button
            className="text-xs font-medium text-[var(--brand-600)] hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/products/${row.productId}/insights`);
            }}
          >
            جزئیات
          </button>
        ),
      },
    ],
    [router]
  );

  return (
    <div>
      <PageHeader title="آمار محصولات" subtitle="پربازدیدترین و پرفروش‌ترین محصولات، شکست دسته‌بندی/برند و وضعیت موجودی" />

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <CalendarRange size={15} className="shrink-0 text-[var(--text-faint)]" />
        <div className="w-36">
          <JalaliDatePicker value={from} onChange={setFrom} placeholder="از تاریخ" />
        </div>
        <span className="text-xs text-[var(--text-faint)]">تا</span>
        <div className="w-36">
          <JalaliDatePicker value={to} onChange={setTo} placeholder="تا تاریخ" />
        </div>
        {hasDateFilter && (
          <button
            onClick={() => {
              setFrom("");
              setTo("");
            }}
            className="text-[var(--text-faint)] hover:text-[var(--danger)]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Eye} label="بازدید صفحات محصول" value={formatNumber(summary.totalViews)} color="blue" isLoading={isLoading} />
        <StatCard icon={Boxes} label="تعداد کالای فروخته‌شده" value={formatNumber(summary.totalSalesQuantity)} color="violet" isLoading={isLoading} />
        <StatCard icon={Wallet} label="درآمد محصولات" value={formatToman(summary.totalSalesRevenue)} color="pink" isLoading={isLoading} />
        <StatCard icon={Percent} label="نرخ تبدیل بازدید به فروش" value={conversionRate} color="teal" isLoading={isLoading} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>روند بازدید صفحات محصول</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsTrend}>
                <defs>
                  <linearGradient id="productViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand-500)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    fontFamily: "var(--font-vazir)",
                  }}
                />
                <Area type="monotone" dataKey="views" name="بازدید" stroke="var(--brand-500)" fill="url(#productViews)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {!isLoading && !viewsTrend.length && (
            <p className="py-6 text-center text-sm text-[var(--text-faint)]">داده‌ای برای این بازه یافت نشد</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>محصولات برتر</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="views">
            <TabsList>
              <TabsTrigger value="views">پربازدیدترین</TabsTrigger>
              <TabsTrigger value="revenue">پردرآمدترین</TabsTrigger>
              <TabsTrigger value="quantity">پرفروش‌ترین (تعداد)</TabsTrigger>
            </TabsList>
            <TabsContent value="views">
              <DataTable columns={productColumns} data={topByViews} isLoading={isLoading} rowKey={(r) => r.productId} emptyMessage="داده‌ای برای این بازه یافت نشد" />
            </TabsContent>
            <TabsContent value="revenue">
              <DataTable columns={productColumns} data={topByRevenue} isLoading={isLoading} rowKey={(r) => r.productId} emptyMessage="داده‌ای برای این بازه یافت نشد" />
            </TabsContent>
            <TabsContent value="quantity">
              <DataTable columns={productColumns} data={topByQuantity} isLoading={isLoading} rowKey={(r) => r.productId} emptyMessage="داده‌ای برای این بازه یافت نشد" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>شکست بر اساس دسته‌بندی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 h-56 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCategories} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={110} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      fontFamily: "var(--font-vazir)",
                    }}
                    formatter={(value) => formatToman(value)}
                  />
                  <Bar dataKey="revenue" name="درآمد" fill="var(--brand-500)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <DataTable columns={categoryColumns} data={topCategories} isLoading={isLoading} rowKey={(r) => r.id} emptyMessage="داده‌ای یافت نشد" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>شکست بر اساس برند</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={brandColumns} data={topBrands} isLoading={isLoading} rowKey={(r) => r.id} emptyMessage="داده‌ای یافت نشد" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-[var(--accent-amber)]" />
              رو به اتمام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={stockColumns}
              data={lowStockList}
              isLoading={isLoading}
              rowKey={(r) => r.productId}
              emptyMessage="محصولی رو به اتمام نیست"
              onRowClick={(row) => router.push(`/products/${row.productId}/insights`)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageX size={16} className="text-[var(--danger)]" />
              ناموجود
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={stockColumns}
              data={outOfStockList}
              isLoading={isLoading}
              rowKey={(r) => r.productId}
              emptyMessage="محصول ناموجودی نیست"
              onRowClick={(row) => router.push(`/products/${row.productId}/insights`)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
