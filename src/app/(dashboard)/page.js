"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, ShoppingBag, TrendingUp, Headset } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumber, formatToman } from "@/lib/utils";
import { SeoDashboardWidget } from "@/components/seo/seo-dashboard-widget";
import { DashboardWidgetCustomizer } from "@/components/dashboard/widget-customizer";
import { useDashboardWidgetPrefs } from "@/components/dashboard/widget-visibility";
import { RecentOrdersWidget } from "@/components/dashboard/recent-orders-widget";
import { ChatActivityWidget } from "@/components/dashboard/chat-activity-widget";
import { StockAlertsWidget } from "@/components/dashboard/stock-alerts-widget";
import { PendingReviewsWidget } from "@/components/dashboard/pending-reviews-widget";

export default function DashboardPage() {
  const { ready, isVisible, setVisible } = useDashboardWidgetPrefs();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/dashboard");
      return res.data;
    },
  });

  const summary = data?.summary ?? {};
  const salesChart = Array.isArray(data?.salesChart) ? data.salesChart : [];

  // تا وقتی ترجیح‌های ذخیره‌شده از localStorage خونده نشده هیچی رو مخفی
  // نکن — وگرنه یک لحظه چشمک همه‌ی ویجت‌ها رو می‌بینی و بعد بعضی‌هاشون
  // ناپدید می‌شن.
  const show = (id) => !ready || isVisible(id);

  return (
    <div>
      <PageHeader
        title="داشبورد"
        subtitle="نمای کلی وضعیت فروشگاه دلیسا"
        actions={ready && <DashboardWidgetCustomizer isVisible={isVisible} setVisible={setVisible} />}
      />

      {show("stats") && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            label="تعداد کاربران"
            value={formatNumber(summary.totalUsers)}
            color="violet"
            isLoading={isLoading}
          />
          <StatCard
            icon={ShoppingBag}
            label="سفارشات ۷ روز اخیر"
            value={formatNumber(summary.ordersLast7Days)}
            color="blue"
            isLoading={isLoading}
          />
          <StatCard
            icon={TrendingUp}
            label="فروش ماه جاری"
            value={formatToman(summary.totalSalesThisMonth)}
            color="pink"
            isLoading={isLoading}
          />
          <StatCard
            icon={Headset}
            label="تیکت‌های فعال"
            value={formatNumber(summary.activeTickets)}
            color="amber"
            isLoading={isLoading}
          />
        </div>
      )}

      {show("seo") && (
        <div className="mt-6">
          <SeoDashboardWidget />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {show("orders") && <RecentOrdersWidget />}
        {show("chat") && <ChatActivityWidget />}
        {show("stock") && <StockAlertsWidget />}
        {show("reviews") && <PendingReviewsWidget />}
      </div>

      {show("chart") && (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>روند فروش، سود و سفارشات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart}>
                <defs>
                  <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand-500)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="orders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-amber)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent-amber)" stopOpacity={0} />
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
                  formatter={(value) => (typeof value === "number" ? formatToman(value) : value)}
                />
                <Legend />
                <Area type="monotone" dataKey="totalSales" name="فروش کل" stroke="var(--brand-500)" fill="url(#sales)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="سود" stroke="var(--success)" fill="url(#profit)" strokeWidth={2} />
                <Area type="monotone" dataKey="orders" name="تعداد سفارش" stroke="var(--accent-amber)" fill="url(#orders)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
