"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { fetchLoyaltyTransactions } from "@/lib/loyalty/api";

const TYPE_LABELS = { earn: "کسب امتیاز", redeem: "مصرف امتیاز", adjust: "تنظیم دستی", reward: "پاداش سطح" };

export function LoyaltyTransactionsTab() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["loyalty-transactions", page, type],
    queryFn: () => fetchLoyaltyTransactions(page, type ? { type } : {}),
  });

  const transactions = data?.transactions ?? [];
  const total = data?.total ?? 0;
  const perPage = data?.perPage ?? 30;

  const columns = [
    { key: "customer", header: "مشتری", render: (row) => row.customer?.name || row.customer?.phone || "—" },
    { key: "sourceKey", header: "منبع", render: (row) => row.sourceKey },
    { key: "type", header: "نوع", render: (row) => TYPE_LABELS[row.type] || row.type },
    { key: "description", header: "توضیح", render: (row) => <span className="max-w-[220px] truncate">{row.description}</span> },
    {
      key: "points",
      header: "امتیاز",
      render: (row) => (
        <span className={row.points >= 0 ? "font-bold text-[var(--success-600)]" : "font-bold text-[var(--danger)]"}>
          {row.points >= 0 ? "+" : ""}
          {row.points.toLocaleString("fa-IR")}
        </span>
      ),
    },
    { key: "createdAt", header: "تاریخ", render: (row) => new Date(row.createdAt).toLocaleDateString("fa-IR") },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Select className="w-48" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">همه انواع</option>
          <option value="earn">کسب امتیاز</option>
          <option value="redeem">مصرف امتیاز</option>
          <option value="adjust">تنظیم دستی</option>
          <option value="reward">پاداش سطح</option>
        </Select>
      </div>
      <DataTable columns={columns} data={transactions} isLoading={isLoading} emptyMessage="تراکنشی یافت نشد" />
      {total > perPage && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>قبلی</Button>
          <span className="text-xs text-[var(--text-muted)]">صفحه {page} از {Math.ceil(total / perPage)}</span>
          <Button variant="outline" size="sm" disabled={page * perPage >= total} onClick={() => setPage((p) => p + 1)}>بعدی</Button>
        </div>
      )}
    </div>
  );
}
