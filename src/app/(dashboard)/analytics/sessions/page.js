"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, X, Smartphone, Tablet, Monitor, UserX } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Select } from "@/components/ui/select";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { fetchAnalyticsSessions, formatDurationMs } from "@/lib/analytics/api";
import { formatDateTime } from "@/lib/utils";

const LIMIT = 25;

const DEVICE_ICON = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };
const DEVICE_LABELS = { mobile: "موبایل", tablet: "تبلت", desktop: "دسکتاپ" };

export default function AnalyticsSessionsPage() {
  const router = useRouter();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [device, setDevice] = useState("");
  const [loggedIn, setLoggedIn] = useState("");
  const [page, setPage] = useState(1);

  const params = {
    from: from || undefined,
    to: to || undefined,
    device: device || undefined,
    loggedIn: loggedIn || undefined,
    page,
    limit: LIMIT,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-sessions", params],
    queryFn: () => fetchAnalyticsSessions(params),
  });

  const sessions = data?.sessions ?? [];
  const pageCount = data?.pageCount ?? 1;
  const hasDateFilter = Boolean(from || to);

  const columns = useMemo(
    () => [
      {
        key: "customer",
        header: "کاربر",
        render: (row) =>
          row.customer ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/customers/${row.customer.id}`);
              }}
              className="text-xs font-medium text-[var(--brand-600)] hover:underline"
            >
              {row.customer.name || row.customer.phone || "مشتری"}
            </button>
          ) : (
            <span className="flex items-center gap-1 text-xs text-[var(--text-faint)]">
              <UserX size={13} />
              مهمان
            </span>
          ),
      },
      {
        key: "entryPath",
        header: "صفحه ورود",
        render: (row) => (
          <div>
            <div className="font-mono text-xs text-[var(--text)]" dir="ltr">{row.entryPath}</div>
            {row.referrer && (
              <div className="mt-0.5 truncate text-[10px] text-[var(--text-faint)]" dir="ltr">{row.referrer}</div>
            )}
          </div>
        ),
      },
      {
        key: "device",
        header: "دستگاه",
        render: (row) => {
          const Icon = DEVICE_ICON[row.device] || Monitor;
          return (
            <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Icon size={14} />
              {DEVICE_LABELS[row.device] || row.device}
            </span>
          );
        },
      },
      { key: "pageCount", header: "تعداد صفحه", render: (row) => row.pageCount },
      { key: "totalDurationMs", header: "مدت بازدید", render: (row) => formatDurationMs(row.totalDurationMs) },
      { key: "startedAt", header: "تاریخ", render: (row) => formatDateTime(row.startedAt) },
    ],
    [router]
  );

  return (
    <div>
      <PageHeader title="جلسات بازدیدکنندگان" subtitle="لیست بازدیدهای ثبت‌شده — برای مشاهده سفر کامل هر بازدیدکننده کلیک کنید" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <CalendarRange size={15} className="shrink-0 text-[var(--text-faint)]" />
          <div className="w-36">
            <JalaliDatePicker value={from} onChange={(v) => { setFrom(v); setPage(1); }} placeholder="از تاریخ" />
          </div>
          <span className="text-xs text-[var(--text-faint)]">تا</span>
          <div className="w-36">
            <JalaliDatePicker value={to} onChange={(v) => { setTo(v); setPage(1); }} placeholder="تا تاریخ" />
          </div>
          {hasDateFilter && (
            <button onClick={() => { setFrom(""); setTo(""); setPage(1); }} className="text-[var(--text-faint)] hover:text-[var(--danger)]">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="w-40">
          <Select value={device} onChange={(e) => { setDevice(e.target.value); setPage(1); }}>
            <option value="">همه دستگاه‌ها</option>
            <option value="mobile">موبایل</option>
            <option value="tablet">تبلت</option>
            <option value="desktop">دسکتاپ</option>
          </Select>
        </div>

        <div className="w-40">
          <Select value={loggedIn} onChange={(e) => { setLoggedIn(e.target.value); setPage(1); }}>
            <option value="">همه کاربران</option>
            <option value="true">فقط واردشده‌ها</option>
            <option value="false">فقط مهمان‌ها</option>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={sessions}
        isLoading={isLoading}
        emptyMessage="جلسه‌ای یافت نشد"
        rowKey={(row) => row.sessionId}
        onRowClick={(row) => router.push(`/analytics/sessions/${row.sessionId}`)}
        pagination={{ page, pageCount, onPageChange: setPage }}
      />
    </div>
  );
}
