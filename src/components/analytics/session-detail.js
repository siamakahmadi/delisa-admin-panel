"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Smartphone, Tablet, Monitor, Clock, LogIn } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSessionDetail, formatDurationMs } from "@/lib/analytics/api";
import { formatDateTime } from "@/lib/utils";

const DEVICE_ICON = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };
const DEVICE_LABELS = { mobile: "موبایل", tablet: "تبلت", desktop: "دسکتاپ" };

export function SessionDetail({ sessionId }) {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-session-detail", sessionId],
    queryFn: () => fetchSessionDetail(sessionId),
  });

  const session = data?.session;
  const pageViews = data?.pageViews ?? [];
  const DeviceIcon = DEVICE_ICON[session?.device] || Monitor;

  return (
    <div>
      <PageHeader
        title="سفر بازدیدکننده"
        subtitle={sessionId}
        actions={
          <Button variant="ghost" onClick={() => router.push("/analytics/sessions")}>
            <ArrowRight size={16} />
            بازگشت
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : !session ? (
        <p className="py-10 text-center text-sm text-[var(--text-faint)]">جلسه یافت نشد</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardContent className="space-y-3 p-4">
              <h3 className="text-sm font-semibold text-[var(--text)]">اطلاعات جلسه</h3>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <DeviceIcon size={15} />
                {DEVICE_LABELS[session.device] || session.device}
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Clock size={15} />
                {formatDurationMs(session.totalDurationMs)} در {pageViews.length} صفحه
              </div>
              {session.referrer && (
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <LogIn size={15} />
                  <span className="truncate" dir="ltr">{session.referrer}</span>
                </div>
              )}
              <p className="text-xs text-[var(--text-faint)]">شروع: {formatDateTime(session.startedAt)}</p>
              <p className="text-xs text-[var(--text-faint)]">آخرین فعالیت: {formatDateTime(session.lastSeenAt)}</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">مسیر بازدید</h3>
              <ol className="relative space-y-0 border-r-2 border-[var(--border)] pr-4">
                {pageViews.map((pv, idx) => {
                  const isLast = idx === pageViews.length - 1;
                  const isDropOff = isLast && (!pv.durationMs || pv.durationMs < 3000);
                  return (
                    <li key={pv.order} className="relative pb-6 last:pb-0">
                      <span
                        className={`absolute -right-[21px] top-1 h-3 w-3 rounded-full border-2 border-[var(--surface)] ${
                          isDropOff ? "bg-[var(--danger)]" : "bg-[var(--brand-500)]"
                        }`}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-xs text-[var(--text)]" dir="ltr">{pv.path}</span>
                        <span className="shrink-0 text-xs text-[var(--text-faint)]">{formatDateTime(pv.enteredAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {pv.durationMs ? formatDurationMs(pv.durationMs) : "زمان ثبت نشد"}
                        {isDropOff && <span className="mr-1 text-[var(--danger)]">— نقطه خروج</span>}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
