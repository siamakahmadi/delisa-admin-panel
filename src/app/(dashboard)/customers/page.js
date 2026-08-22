"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Mail, Phone } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDate } from "@/lib/utils";

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => (await apiClient.get("/api/admin/customers")).data,
  });

  const customers = data ?? [];
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(
      (c) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q)
    );
  }, [data, debouncedSearch]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "نام",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-pink)] to-[var(--brand-500)] text-xs font-bold text-white">
              {row.name?.[0] ?? "?"}
            </div>
            <span className="font-medium text-[var(--text)]">{row.name || "بدون نام"}</span>
          </div>
        ),
      },
      {
        key: "phone",
        header: "شماره تماس",
        render: (row) => (
          <span dir="ltr" className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
            <Phone size={13} /> {row.phone}
          </span>
        ),
      },
      {
        key: "email",
        header: "ایمیل",
        render: (row) =>
          row.email ? (
            <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
              <Mail size={13} /> {row.email}
            </span>
          ) : (
            "-"
          ),
      },
      {
        key: "createdAt",
        header: "تاریخ عضویت",
        sortable: true,
        render: (row) => formatDate(row.createdAt),
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader title="مشتریان" subtitle={`${customers.length.toLocaleString("fa-IR")} مشتری`} />

      <div className="relative mb-4 w-full max-w-xs">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
        <Input
          placeholder="جستجوی نام، شماره یا ایمیل..."
          className="pr-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyMessage="مشتری‌ای یافت نشد"
        onRowClick={(row) => router.push(`/customers/${row._id}`)}
      />
    </div>
  );
}
