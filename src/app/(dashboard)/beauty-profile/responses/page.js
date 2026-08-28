"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { fetchBeautyProfileResponses, fetchBeautyProfileResponseDetail } from "@/lib/beauty-profile/api";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "—";
  }
}

export default function BeautyProfileResponsesPage() {
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["beauty-profile-responses", page],
    queryFn: () => fetchBeautyProfileResponses({ page, limit: 20 }),
  });

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, pages: 1 };

  const columns = [
    { key: "name", header: "مشتری", render: (row) => row.customer?.name || "بدون نام" },
    { key: "phone", header: "شماره تماس", render: (row) => <span dir="ltr">{row.customer?.phone || "—"}</span> },
    {
      key: "completionPercent",
      header: "تکمیل پروفایل",
      render: (row) => <Badge variant={row.completionPercent >= 70 ? "success" : "neutral"} size="sm">{row.completionPercent || 0}٪</Badge>,
    },
    { key: "skinType", header: "نوع پوست", render: (row) => row.skinType || "—" },
    { key: "primaryConcern", header: "دغدغه اصلی", render: (row) => row.primaryConcern || "—" },
    { key: "updatedAt", header: "آخرین بروزرسانی", render: (row) => formatDate(row.updatedAt) },
  ];

  return (
    <div>
      <PageHeader title="پاسخ‌های مشتریان" subtitle="پروفایل زیبایی هر مشتری، شامل درصد تکمیل، نوع پوست، دغدغه اصلی و امتیاز تطبیق." />

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        emptyMessage="هنوز هیچ مشتری‌ای Beauty Profile نساخته"
        onRowClick={(row) => setSelectedCustomerId(row.customer?._id)}
        pagination={{ page: meta.page, pageCount: meta.pages || 1, onPageChange: setPage }}
      />

      <ResponseDetailDialog customerId={selectedCustomerId} onClose={() => setSelectedCustomerId(null)} />
    </div>
  );
}

function ResponseDetailDialog({ customerId, onClose }) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["beauty-profile-response-detail", customerId],
    queryFn: () => fetchBeautyProfileResponseDetail(customerId),
    enabled: !!customerId,
  });

  return (
    <Dialog open={!!customerId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogTitle>{profile?.customer?.name || "پروفایل زیبایی مشتری"}</DialogTitle>
        <DialogDescription dir="ltr">{profile?.customer?.phone}</DialogDescription>

        {isLoading ? (
          <p className="mt-4 text-sm text-[var(--text-faint)]">در حال بارگذاری...</p>
        ) : profile ? (
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="mb-2 text-xs font-semibold text-[var(--text-muted)]">Delisa Match</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <ScoreRow label="تطبیق پوستی" value={profile.matchScore?.skinCompatibility} />
                <ScoreRow label="تطبیق دغدغه" value={profile.matchScore?.concernMatch} />
                <ScoreRow label="تطبیق سلیقه" value={profile.matchScore?.preferenceMatch} />
                <ScoreRow label="تطبیق بودجه" value={profile.matchScore?.budgetMatch} />
              </div>
              <div className="mt-2 text-sm font-semibold">مجموع: {profile.matchScore?.overall || 0}٪</div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold text-[var(--text-muted)]">پاسخ‌های خام</h4>
              <div className="max-h-64 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                <pre className="whitespace-pre-wrap break-words text-xs text-[var(--text)]" dir="ltr">
                  {JSON.stringify(profile.answers || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--text-faint)]">پروفایلی یافت نشد.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ScoreRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-2.5 py-1.5">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-semibold">{value || 0}٪</span>
    </div>
  );
}
