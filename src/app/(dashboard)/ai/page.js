"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  MessageSquare,
  Users,
  MessagesSquare,
  Clock,
  AlertTriangle,
  Search,
  Globe,
  MousePointerClick,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAiAnalyticsOverview } from "@/lib/ai/api";
import { formatNumber } from "@/lib/utils";

const RANGES = [
  { value: "today", label: "امروز" },
  { value: "7d", label: "۷ روز" },
  { value: "30d", label: "۳۰ روز" },
  { value: "3m", label: "۳ ماه" },
];

export default function AiOverviewPage() {
  const [range, setRange] = useState("7d");

  const { data, isLoading } = useQuery({
    queryKey: ["ai-analytics-overview", range],
    queryFn: () => fetchAiAnalyticsOverview({ range }),
  });

  const totals = data?.totals || {};
  const series = data?.series || [];
  const topProducts = data?.topProducts || [];

  return (
    <div>
      <PageHeader
        title="دستیار هوشمند — نمای کلی"
        subtitle="آمار و عملکرد چت‌بات فروشگاه دلیسا"
        actions={
          <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === r.value
                    ? "bg-[var(--brand-600)] text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={MessagesSquare} label="کل گفتگوها" value={formatNumber(totals.totalConversations || 0)} color="violet" isLoading={isLoading} />
        <StatCard icon={Users} label="کاربران یکتا" value={formatNumber(totals.totalUsers || 0)} color="blue" isLoading={isLoading} />
        <StatCard icon={MessageSquare} label="کل پیام‌ها" value={formatNumber(totals.totalMessages || 0)} color="teal" isLoading={isLoading} />
        <StatCard icon={Clock} label="میانگین زمان پاسخ" value={`${formatNumber(totals.avgResponseTimeMs || 0)} ms`} color="amber" isLoading={isLoading} />
        <StatCard icon={MessagesSquare} label="میانگین پیام هر گفتگو" value={formatNumber(totals.avgMessagesPerConversation || 0)} color="pink" isLoading={isLoading} />
        <StatCard icon={Search} label="استفاده از جستجوی محصول" value={formatNumber(totals.productSearchUsage || 0)} color="violet" isLoading={isLoading} />
        <StatCard icon={Globe} label="استفاده از جستجوی وب" value={formatNumber(totals.webSearchUsage || 0)} color="blue" isLoading={isLoading} />
        <StatCard icon={MousePointerClick} label="کلیک روی محصولات" value={formatNumber(totals.productClicks || 0)} color="teal" isLoading={isLoading} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={MessagesSquare} label="گفتگوهای امروز" value={formatNumber(totals.conversationsToday || 0)} color="violet" isLoading={isLoading} />
        <StatCard icon={MessagesSquare} label="گفتگوهای این هفته" value={formatNumber(totals.conversationsWeek || 0)} color="blue" isLoading={isLoading} />
        <StatCard icon={MessagesSquare} label="گفتگوهای این ماه" value={formatNumber(totals.conversationsMonth || 0)} color="teal" isLoading={isLoading} />
        <StatCard icon={AlertTriangle} label="نرخ خطا" value={`${totals.errorRate || 0}%`} color="amber" isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>روند گفتگوها</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : series.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="conversations" stroke="var(--brand-500)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-[var(--text-faint)]">داده‌ای برای نمایش وجود ندارد</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>محبوب‌ترین محصولات پیشنهادشده</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : topProducts.length ? (
              <ul className="space-y-3">
                {topProducts.map((p, i) => (
                  <li key={p.productId} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-[var(--text)]">
                      {i + 1}. {p.name || "محصول حذف‌شده"}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[var(--text-muted)]">{p.count}×</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-10 text-center text-sm text-[var(--text-faint)]">هنوز داده‌ای ثبت نشده</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
