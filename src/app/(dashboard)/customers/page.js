"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Mail, Phone } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDate, formatToman } from "@/lib/utils";
import { fetchCustomerTags, fetchSegments } from "@/lib/crm/api";

const LIFECYCLE_LABELS = { new: "جدید", active: "فعال", vip: "VIP", at_risk: "در خطر", inactive: "غیرفعال" };
const LIFECYCLE_VARIANT = { new: "info", active: "success", vip: "brand", at_risk: "warning", inactive: "neutral" };

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [segment, setSegment] = useState("");
  const [lifecycleStage, setLifecycleStage] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const { data: tags } = useQuery({ queryKey: ["customer-tags"], queryFn: fetchCustomerTags });
  const { data: segments } = useQuery({ queryKey: ["crm-segments"], queryFn: fetchSegments });

  const { data, isLoading } = useQuery({
    queryKey: ["customers", debouncedSearch, tag, segment, lifecycleStage],
    queryFn: async () =>
      (
        await apiClient.get("/api/admin/customers", {
          params: { search: debouncedSearch || undefined, tag: tag || undefined, segment: segment || undefined, lifecycleStage: lifecycleStage || undefined },
        })
      ).data,
  });

  const customers = data ?? [];

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
            <div>
              <span className="font-medium text-[var(--text)]">{row.name || "بدون نام"}</span>
              {row.tags?.length > 0 && (
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {row.tags.map((t) => (
                    <Badge key={t._id} size="sm" style={{ background: `${t.color}22`, color: t.color }}>
                      {t.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
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
        key: "lifecycleStage",
        header: "مرحله",
        render: (row) => (
          <Badge variant={LIFECYCLE_VARIANT[row.lifecycleStage] || "neutral"} size="sm">
            {LIFECYCLE_LABELS[row.lifecycleStage] || row.lifecycleStage}
          </Badge>
        ),
      },
      {
        key: "totalSpent",
        header: "مجموع خرید",
        sortable: true,
        sortValue: (row) => row.stats?.totalSpent || 0,
        render: (row) => formatToman(row.stats?.totalSpent),
      },
      {
        key: "totalOrders",
        header: "تعداد سفارش",
        sortValue: (row) => row.stats?.totalOrders || 0,
        render: (row) => (row.stats?.totalOrders ?? 0).toLocaleString("fa-IR"),
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <Input
            placeholder="جستجوی نام، شماره یا ایمیل..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select className="w-40" value={lifecycleStage} onChange={(e) => setLifecycleStage(e.target.value)}>
          <option value="">همه مراحل</option>
          {Object.entries(LIFECYCLE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </Select>
        <Select className="w-40" value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="">همه تگ‌ها</option>
          {(tags ?? []).map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select className="w-44" value={segment} onChange={(e) => setSegment(e.target.value)}>
          <option value="">همه سگمنت‌ها</option>
          {(segments ?? []).map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        emptyMessage="مشتری‌ای یافت نشد"
        onRowClick={(row) => router.push(`/customers/${row._id}`)}
      />
    </div>
  );
}
