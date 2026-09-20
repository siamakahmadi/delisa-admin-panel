"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchPricingAudit, fetchPricingJobs } from "@/lib/pricing-intelligence/api";
import { formatDateTime } from "@/lib/utils";

export default function PricingAuditPage() {
  const { data: jobsData } = useQuery({ queryKey: ["pricing-jobs"], queryFn: fetchPricingJobs, refetchInterval: 15000 });
  const { data: auditData } = useQuery({ queryKey: ["pricing-audit"], queryFn: fetchPricingAudit });

  return (
    <div>
      <PageHeader title="تاریخچه و جاب‌ها" subtitle="وضعیت صف پس‌زمینه، اعمال قیمت و تغییرات تنظیمات" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>جاب‌های اخیر</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                  <th className="px-5 py-2 text-start">نوع</th>
                  <th className="px-2 py-2 text-start">وضعیت</th>
                  <th className="px-5 py-2 text-start">زمان</th>
                </tr>
              </thead>
              <tbody>
                {(jobsData?.jobs || []).map((j) => (
                  <tr key={j._id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-5 py-2">{j.type} {j.scope ? `(${j.scope})` : ""}</td>
                    <td className="px-2 py-2"><Badge size="sm" variant={j.status === "done" ? "success" : j.status === "failed" ? "danger" : "info"}>{j.status}</Badge></td>
                    <td className="px-5 py-2">{formatDateTime(j.finishedAt || j.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>گزارش حسابرسی</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                  <th className="px-5 py-2 text-start">عمل</th>
                  <th className="px-2 py-2 text-start">کاربر</th>
                  <th className="px-5 py-2 text-start">زمان</th>
                </tr>
              </thead>
              <tbody>
                {(auditData?.logs || []).map((l) => (
                  <tr key={l._id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-5 py-2">{l.action}</td>
                    <td className="px-2 py-2">{l.actor?.name || "سیستم"}</td>
                    <td className="px-5 py-2">{formatDateTime(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
