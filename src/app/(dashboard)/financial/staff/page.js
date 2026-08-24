"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { fetchAllStaffPayments } from "@/lib/financial/api";
import { formatToman, formatNumber } from "@/lib/utils";

export default function StaffFinancialPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ["staff-payments"], queryFn: fetchAllStaffPayments });

  const rows = data ?? [];

  const columns = useMemo(
    () => [
      { key: "name", header: "نام همکار", render: (row) => <span className="font-medium">{row.name}</span> },
      {
        key: "count",
        header: "تعداد پرداخت",
        render: (row) => formatNumber(row.payments?.length ?? 0),
      },
      {
        key: "paidTotal",
        header: "مجموع پرداخت‌شده",
        render: (row) => formatToman((row.payments || []).filter((p) => p.status === "paid").reduce((s, p) => s + (p.price || 0), 0)),
      },
      {
        key: "pendingTotal",
        header: "مجموع در انتظار",
        render: (row) => formatToman((row.payments || []).filter((p) => p.status === "pending").reduce((s, p) => s + (p.price || 0), 0)),
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader title="امور مالی همکاران" subtitle="حقوق، پورسانت و پرداخت‌های تیم داخلی" />
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        emptyMessage="همکاری یافت نشد"
        rowKey={(row) => row._id}
        onRowClick={(row) => router.push(`/financial/staff/${row._id}`)}
      />
    </div>
  );
}
