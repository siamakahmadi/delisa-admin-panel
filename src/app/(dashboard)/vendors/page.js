"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Store, Package } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDate, formatToman } from "@/lib/utils";
import { VENDOR_STATUS_LABELS, VENDOR_STATUS_VARIANT } from "@/lib/constants";

const LIMIT = 20;

export default function VendorsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading } = useQuery({
    queryKey: ["vendors", { search: debouncedSearch, status, page }],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/vendors", {
        params: { page, limit: LIMIT, search: debouncedSearch || undefined, status: status || undefined },
      });
      return res.data;
    },
  });

  const vendors = data?.vendors ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(data?.pages ?? 1, 1);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "فروشنده",
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-teal)] to-[var(--accent-cyan)] text-white">
              <Store size={14} />
            </div>
            <div>
              <div className="font-medium text-[var(--text)]">
                {row.firstName} {row.lastName}
              </div>
              <div className="text-xs text-[var(--text-faint)]">{row.storeInfo?.storeName || ""}</div>
            </div>
          </div>
        ),
      },
      {
        key: "contactPhone",
        header: "شماره تماس",
        render: (row) => <span dir="ltr">{row.contactPhone}</span>,
      },
      {
        key: "walletBalance",
        header: "موجودی کیف‌پول",
        sortable: true,
        render: (row) => formatToman(row.walletBalance),
      },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => (
          <StatusBadge status={row.status} labels={VENDOR_STATUS_LABELS} variants={VENDOR_STATUS_VARIANT} />
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
      <PageHeader
        title="فروشندگان"
        subtitle={`${total.toLocaleString("fa-IR")} فروشنده`}
        actions={
          <Button variant="outline" onClick={() => router.push("/vendors/products")}>
            <Package size={16} />
            محصولات فروشندگان
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <Input
            placeholder="جستجوی نام یا شماره تماس..."
            className="pr-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          className="w-48"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(VENDOR_STATUS_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={vendors}
        isLoading={isLoading}
        emptyMessage="فروشنده‌ای یافت نشد"
        onRowClick={(row) => router.push(`/vendors/${row._id}`)}
        pagination={{ page, pageCount, onPageChange: setPage }}
      />
    </div>
  );
}
