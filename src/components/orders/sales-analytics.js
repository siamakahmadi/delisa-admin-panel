"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  ShoppingBag,
  Receipt,
  PackageCheck,
  XCircle,
  Boxes,
  CalendarRange,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EntityLink } from "@/components/ui/entity-link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { fetchSalesAnalytics } from "@/lib/orders/api";
import { productSiteUrl, categorySiteUrl } from "@/lib/siteLinks";
import { formatToman, formatNumber, startOfMonth } from "@/lib/utils";

const STATUS_COLORS = [
  "var(--brand-500)",
  "var(--accent-blue)",
  "var(--accent-amber)",
  "var(--accent-teal)",
  "var(--accent-pink)",
  "#8b5cf6",
  "#ef4444",
  "#64748b",
];

const PAYMENT_METHOD_LABELS = {
  zarinpal: "زرین‌پال",
  torobpay: "ترب‌پی",
  wallet: "کیف پول",
  free: "رایگان",
  offline: "پرداخت غیرآنلاین",
};

export function SalesAnalytics() {
  const router = useRouter();
  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState("");

  const params = { from: from || undefined, to: to || undefined };

  const { data, isLoading } = useQuery({
    queryKey: ["orders-sales-analytics", params],
    queryFn: () => fetchSalesAnalytics(params),
  });

  const summary = data?.summary ?? {};
  const revenueTrend = data?.revenueTrend ?? [];
  const statusBreakdown = data?.statusBreakdown ?? [];
  const paymentMethods = data?.paymentMethods ?? [];
  const topProductsByRevenue = data?.topProductsByRevenue ?? [];
  const topProductsByQuantity = data?.topProductsByQuantity ?? [];
  const topCategories = data?.topCategories ?? [];
  const topVendors = data?.topVendors ?? [];
  const topCustomers = data?.topCustomers ?? [];

  const hasDateFilter = Boolean(from || to);

  const productColumns = useMemo(
    () => [
      {
        key: "productName",
        header: "محصول",
        render: (row) => (
          <EntityLink name={row.productName} image={row.image} href={productSiteUrl(row.slug || row.productId)} />
        ),
      },
      { key: "quantity", header: "تعداد فروش", render: (row) => formatNumber(row.quantity) },
      { key: "orderCount", header: "تعداد سفارش", render: (row) => formatNumber(row.orderCount) },
      { key: "revenue", header: "درآمد", sortable: true, render: (row) => formatToman(row.revenue) },
    ],
    []
  );

  const categoryColumns = useMemo(
    () => [
      {
        key: "name",
        header: "دسته‌بندی",
        render: (row) => <EntityLink name={row.name} href={categorySiteUrl(row.slug)} />,
      },
      { key: "quantity", header: "تعداد فروش", render: (row) => formatNumber(row.quantity) },
      { key: "revenue", header: "درآمد", sortable: true, render: (row) => formatToman(row.revenue) },
    ],
    []
  );

  const vendorColumns = useMemo(
    () => [
      { key: "name", header: "فروشنده", render: (row) => row.name },
      { key: "phone", header: "تلفن", render: (row) => <span dir="ltr">{row.phone || "-"}</span> },
      { key: "quantity", header: "تعداد فروش", render: (row) => formatNumber(row.quantity) },
      { key: "revenue", header: "درآمد", sortable: true, render: (row) => formatToman(row.revenue) },
    ],
    []
  );

  const customerColumns = useMemo(
    () => [
      { key: "name", header: "مشتری", render: (row) => row.name },
      { key: "phone", header: "تلفن", render: (row) => <span dir="ltr">{row.phone || "-"}</span> },
      { key: "orders", header: "تعداد سفارش", render: (row) => formatNumber(row.orders) },
      { key: "revenue", header: "مجموع خرید", sortable: true, render: (row) => formatToman(row.revenue) },
    ],
    []
  );

  return (
    <div>
      <PageHeader title="آنالیتیکس فروش" subtitle="گزارش کامل درآمد، پرفروش‌ترین محصولات و رفتار خرید مشتریان" />

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Wallet} label="مجموع درآمد" value={formatToman(summary.totalRevenue)} color="violet" isLoading={isLoading} />
        <StatCard icon={ShoppingBag} label="سفارشات پرداخت‌شده" value={formatNumber(summary.paidOrders)} color="blue" isLoading={isLoading} />
        <StatCard icon={Receipt} label="میانگین ارزش سفارش" value={formatToman(summary.avgOrderValue)} color="amber" isLoading={isLoading} />
        <StatCard icon={Boxes} label="تعداد کالای فروخته‌شده" value={formatNumber(summary.totalItemsSold)} color="pink" isLoading={isLoading} />
        <StatCard icon={PackageCheck} label="سفارشات تحویل‌شده" value={formatNumber(summary.deliveredOrders)} color="teal" isLoading={isLoading} />
        <StatCard icon={XCircle} label="سفارشات لغوشده" value={formatNumber(summary.cancelledOrders)} color="pink" isLoading={isLoading} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>روند درآمد و تعداد سفارش</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand-500)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ordersCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="revenue" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="orders" orientation="right" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    fontFamily: "var(--font-vazir)",
                  }}
                  formatter={(value, name) => (name === "درآمد" ? formatToman(value) : formatNumber(value))}
                />
                <Area yAxisId="revenue" type="monotone" dataKey="revenue" name="درآمد" stroke="var(--brand-500)" fill="url(#revenue)" strokeWidth={2} />
                <Area yAxisId="orders" type="monotone" dataKey="orders" name="تعداد سفارش" stroke="var(--accent-blue)" fill="url(#ordersCount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {!isLoading && !revenueTrend.length && (
            <p className="py-6 text-center text-sm text-[var(--text-faint)]">داده‌ای برای این بازه یافت نشد</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>پرفروش‌ترین محصولات</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="revenue">
              <TabsList>
                <TabsTrigger value="revenue">بر اساس درآمد</TabsTrigger>
                <TabsTrigger value="quantity">بر اساس تعداد</TabsTrigger>
              </TabsList>
              <TabsContent value="revenue">
                <DataTable columns={productColumns} data={topProductsByRevenue} isLoading={isLoading} rowKey={(r) => r.productId} emptyMessage="فروشی در این بازه ثبت نشده" />
              </TabsContent>
              <TabsContent value="quantity">
                <DataTable columns={productColumns} data={topProductsByQuantity} isLoading={isLoading} rowKey={(r) => r.productId} emptyMessage="فروشی در این بازه ثبت نشده" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>وضعیت سفارشات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="count" nameKey="label" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {statusBreakdown.map((s, i) => (
                      <Cell key={s.status} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      fontFamily: "var(--font-vazir)",
                    }}
                    formatter={(value, name) => [formatNumber(value), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1.5">
              {statusBreakdown.map((s, i) => (
                <li key={s.status} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                    {s.label}
                  </span>
                  <span className="font-medium text-[var(--text)]">{formatNumber(s.count)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>پرفروش‌ترین دسته‌بندی‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full" dir="ltr">
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
            {!isLoading && !topCategories.length && (
              <p className="py-6 text-center text-sm text-[var(--text-faint)]">داده‌ای برای این بازه یافت نشد</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>روش‌های پرداخت</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods.length ? (
              <ul className="divide-y divide-[var(--border)]">
                {paymentMethods.map((m) => (
                  <li key={m.method} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-[var(--text)]">{PAYMENT_METHOD_LABELS[m.method] || m.method}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-[var(--text-faint)]">{formatNumber(m.count)} سفارش</span>
                      <span className="font-medium text-[var(--text)]">{formatToman(m.revenue)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-[var(--text-faint)]">داده‌ای برای این بازه یافت نشد</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>فروشندگان برتر</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={vendorColumns} data={topVendors} isLoading={isLoading} rowKey={(r) => r.vendorId} emptyMessage="داده‌ای یافت نشد" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مشتریان برتر</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={customerColumns}
              data={topCustomers}
              isLoading={isLoading}
              rowKey={(r) => r.customerId}
              emptyMessage="داده‌ای یافت نشد"
              onRowClick={(row) => router.push(`/customers/${row.customerId}`)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
