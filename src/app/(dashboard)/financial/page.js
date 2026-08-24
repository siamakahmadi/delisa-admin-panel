"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Wallet, ShoppingBag, Store, UserCog, Percent, TrendingUp, CalendarRange, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { fetchFinancialOverview } from "@/lib/financial/api";
import { formatToman, formatNumber, startOfMonth } from "@/lib/utils";

export default function FinancialOverviewPage() {
  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState("");

  const params = { from: from || undefined, to: to || undefined };
  const { data, isLoading } = useQuery({
    queryKey: ["financial-overview", params],
    queryFn: () => fetchFinancialOverview(params),
  });

  const summary = data?.summary ?? {};
  const trend = data?.trend ?? [];
  const hasDateFilter = Boolean(from || to);

  return (
    <div>
      <PageHeader title="امور مالی" subtitle="نمای کلی درآمد، تسویه فروشندگان، پرداخت همکاران و هزینه تخفیف‌ها" />

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
          <button onClick={() => { setFrom(""); setTo(""); }} className="text-[var(--text-faint)] hover:text-[var(--danger)]">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={ShoppingBag} label="درآمد کل (سفارشات موفق)" value={formatToman(summary.totalRevenue)} color="violet" isLoading={isLoading} />
        <StatCard icon={TrendingUp} label="درآمد خالص" value={formatToman(summary.netRevenue)} color="blue" isLoading={isLoading} />
        <StatCard icon={Wallet} label="تعداد سفارش موفق" value={formatNumber(summary.totalOrders)} color="pink" isLoading={isLoading} />
        <StatCard icon={Store} label="تسویه فروشندگان" value={formatToman(summary.vendorPayoutsTotal)} color="amber" isLoading={isLoading} />
        <StatCard icon={UserCog} label="پرداخت به همکاران" value={formatToman(summary.staffPaymentsTotal)} color="teal" isLoading={isLoading} />
        <StatCard icon={Percent} label="هزینه تخفیف‌ها" value={formatToman(summary.discountCostTotal)} color="pink" isLoading={isLoading} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>روند درآمد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
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
                  formatter={(value, name) => [name === "revenue" ? formatToman(value) : formatNumber(value), name === "revenue" ? "درآمد" : "سفارش"]}
                />
                <Area type="monotone" dataKey="revenue" name="revenue" stroke="var(--brand-500)" fill="url(#revenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
