"use client";

import { useMemo, useState } from "react";
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
import { Eye, Users, Clock, Layers, CalendarRange, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { fetchAnalyticsOverview, fetchTopPages, formatDurationMs } from "@/lib/analytics/api";
import { formatNumber, startOfMonth } from "@/lib/utils";

const DEVICE_LABELS = { mobile: "موبایل", tablet: "تبلت", desktop: "دسکتاپ" };
const DEVICE_COLORS = ["var(--brand-500)", "var(--accent-blue)", "var(--accent-amber)"];

export default function AnalyticsOverviewPage() {
  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState("");

  const params = { from: from || undefined, to: to || undefined };

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-overview", params],
    queryFn: () => fetchAnalyticsOverview(params),
  });

  const { data: topPagesData, isLoading: loadingTopPages } = useQuery({
    queryKey: ["analytics-top-pages", params],
    queryFn: () => fetchTopPages({ ...params, limit: 10 }),
  });

  const summary = data?.summary ?? {};
  const trend = data?.trend ?? [];
  const deviceBreakdown = data?.deviceBreakdown ?? [];
  const topReferrers = data?.topReferrers ?? [];
  const topPages = useMemo(
    () => (topPagesData?.items ?? []).map((i) => ({ ...i, label: i.path || "-" })),
    [topPagesData]
  );

  const hasDateFilter = Boolean(from || to);

  return (
    <div>
      <PageHeader title="آنالیتیکس" subtitle="رصد ترافیک و رفتار بازدیدکنندگان سایت مشتری" />

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="بازدیدکننده یکتا" value={formatNumber(summary.uniqueVisitors)} color="violet" isLoading={isLoading} />
        <StatCard icon={Eye} label="مجموع بازدید صفحات" value={formatNumber(summary.totalPageViews)} color="blue" isLoading={isLoading} />
        <StatCard icon={Clock} label="میانگین مدت بازدید" value={formatDurationMs(summary.avgSessionDurationMs)} color="amber" isLoading={isLoading} />
        <StatCard icon={Layers} label="میانگین صفحه در هر بازدید" value={summary.avgPagesPerSession ?? "-"} color="pink" isLoading={isLoading} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>روند بازدید</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Recharts does not support RTL — its internal x-coordinate math assumes
              LTR, so under the page's dir="rtl" the axis/bars/labels get computed
              on the wrong side of each other and overlap. Force ltr on the chart's
              own wrapper only (page around it stays rtl). */}
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="visitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand-500)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="views" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0} />
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
                <Area type="monotone" dataKey="uniqueVisitors" name="بازدیدکننده یکتا" stroke="var(--brand-500)" fill="url(#visitors)" strokeWidth={2} />
                <Area type="monotone" dataKey="pageViews" name="بازدید صفحه" stroke="var(--accent-blue)" fill="url(#views)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>پرترافیک‌ترین صفحات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPages} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="label" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={140} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      fontFamily: "var(--font-vazir)",
                    }}
                  />
                  <Bar dataKey="views" name="بازدید" fill="var(--brand-500)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {!loadingTopPages && !topPages.length && (
              <p className="py-6 text-center text-sm text-[var(--text-faint)]">داده‌ای برای این بازه یافت نشد</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تفکیک دستگاه</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceBreakdown} dataKey="count" nameKey="device" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {deviceBreakdown.map((d, i) => (
                      <Cell key={d.device} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      fontFamily: "var(--font-vazir)",
                    }}
                    formatter={(value, name) => [formatNumber(value), DEVICE_LABELS[name] || name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1.5">
              {deviceBreakdown.map((d, i) => (
                <li key={d.device} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <span className="h-2 w-2 rounded-full" style={{ background: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                    {DEVICE_LABELS[d.device] || d.device}
                  </span>
                  <span className="font-medium text-[var(--text)]">{formatNumber(d.count)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>منابع ورودی برتر</CardTitle>
        </CardHeader>
        <CardContent>
          {topReferrers.length ? (
            <ul className="divide-y divide-[var(--border)]">
              {topReferrers.map((r) => (
                <li key={r.referrer} className="flex items-center justify-between py-2 text-sm">
                  <span className="min-w-0 truncate text-[var(--text)]" dir="ltr">{r.referrer}</span>
                  <span className="shrink-0 font-medium text-[var(--text-muted)]">{formatNumber(r.count)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-[var(--text-faint)]">منبع ورودی ثبت‌شده‌ای برای این بازه وجود ندارد</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
