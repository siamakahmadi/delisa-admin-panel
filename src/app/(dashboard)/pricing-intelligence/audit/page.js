"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchPricingAudit, fetchPricingJobs } from "@/lib/pricing-intelligence/api";
import { AUDIT_ACTION_LABELS, JOB_SCOPE_LABELS, JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "@/lib/pricing-intelligence/labels";
import { formatDateTime } from "@/lib/utils";

function Empty({ text }) {
  return <p className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">{text}</p>;
}

export default function PricingAuditPage() {
  const { data: jobsData, isLoading: jobsLoading } = useQuery({ queryKey: ["pricing-jobs"], queryFn: fetchPricingJobs, refetchInterval: 15000 });
  const { data: auditData, isLoading: auditLoading } = useQuery({ queryKey: ["pricing-audit"], queryFn: fetchPricingAudit });
  const jobs = jobsData?.jobs || [];
  const logs = auditData?.logs || [];

  return (
    <div>
      <PageHeader title="تاریخچه و جاب‌ها" subtitle="چه کارهایی در پس‌زمینه اجرا شده و چه کسی چه چیزی را تغییر داده" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>جاب‌های پس‌زمینه</CardTitle><span className="text-xs text-[var(--text-faint)]">هر ۱۵ ثانیه به‌روز می‌شود</span></CardHeader>
          <CardContent className="p-0 pt-3">
            {!jobs.length && !jobsLoading ? <Empty text="هنوز جابی اجرا نشده. از «نمای کلی» تحلیل یا جستجوی رقبا را شروع کن." /> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                    <th className="px-5 py-2 text-start font-medium">کار</th>
                    <th className="px-2 py-2 text-start font-medium">وضعیت</th>
                    <th className="px-5 py-2 text-start font-medium">زمان</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => {
                    const st = JOB_STATUS_LABELS[j.status] || { label: j.status, variant: "neutral" };
                    return (
                      <tr key={j._id} className="border-b border-[var(--border)] last:border-0 align-top">
                        <td className="px-5 py-2.5">
                          {JOB_TYPE_LABELS[j.type] || j.type}
                          {j.scope && <span className="text-xs text-[var(--text-faint)]"> · {JOB_SCOPE_LABELS[j.scope] || j.scope}</span>}
                          {j.error && <div className="mt-0.5 text-xs text-[var(--danger)]">{j.error}</div>}
                        </td>
                        <td className="px-2 py-2.5"><Badge size="sm" variant={st.variant}>{st.label}</Badge></td>
                        <td className="px-5 py-2.5 text-xs text-[var(--text-muted)]">{formatDateTime(j.finishedAt || j.startedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>گزارش تغییرات</CardTitle></CardHeader>
          <CardContent className="p-0 pt-3">
            {!logs.length && !auditLoading ? <Empty text="هنوز تغییری ثبت نشده." /> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                    <th className="px-5 py-2 text-start font-medium">عمل</th>
                    <th className="px-2 py-2 text-start font-medium">کاربر</th>
                    <th className="px-5 py-2 text-start font-medium">زمان</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l._id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-5 py-2.5">{AUDIT_ACTION_LABELS[l.action] || l.action}</td>
                      <td className="px-2 py-2.5 text-[var(--text-muted)]">{l.actor?.name || "سیستم"}</td>
                      <td className="px-5 py-2.5 text-xs text-[var(--text-muted)]">{formatDateTime(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
