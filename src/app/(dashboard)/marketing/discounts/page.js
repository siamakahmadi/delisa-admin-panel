"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchDiscounts, deleteDiscount } from "@/lib/marketing/discounts-api";
import { formatToman, formatNumber, formatDateTime } from "@/lib/utils";

const TYPE_LABELS = { percent: "درصدی", fixed: "مبلغ ثابت" };

export default function DiscountsPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [active, setActive] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const params = { search: debouncedSearch || undefined, active: active || undefined, limit: 100 };
  const { data, isLoading } = useQuery({
    queryKey: ["discounts", params],
    queryFn: () => fetchDiscounts(params),
  });

  const discounts = data?.discounts ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDiscount(id),
    onSuccess: () => {
      toast.success("تخفیف حذف شد");
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      { key: "name", header: "نام", render: (row) => <span className="font-medium">{row.name}</span> },
      { key: "code", header: "کد", render: (row) => (row.code ? <span className="font-mono text-xs" dir="ltr">{row.code}</span> : "—") },
      { key: "type", header: "نوع", render: (row) => TYPE_LABELS[row.type] || row.type },
      {
        key: "amount",
        header: "مقدار",
        render: (row) => (row.type === "percent" ? `${formatNumber(row.amount)}٪` : formatToman(row.amount)),
      },
      {
        key: "active",
        header: "وضعیت",
        render: (row) => (row.active ? <Badge variant="success" size="sm" dot>فعال</Badge> : <Badge variant="neutral" size="sm" dot>غیرفعال</Badge>),
      },
      { key: "usedCount", header: "تعداد استفاده", render: (row) => formatNumber(row.usedCount) },
      { key: "endAt", header: "پایان اعتبار", render: (row) => (row.endAt ? formatDateTime(row.endAt) : "نامحدود") },
      {
        key: "actions",
        header: "",
        render: (row) => (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
            <Trash2 size={15} className="text-[var(--danger)]" />
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="کدهای تخفیف"
        subtitle={`${formatNumber(data?.total)} تخفیف`}
        actions={
          <Button onClick={() => router.push("/marketing/discounts/new")}>
            <Plus size={16} />
            تخفیف جدید
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <Input placeholder="جستجوی نام تخفیف..." className="pr-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-40">
          <Select value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="">همه وضعیت‌ها</option>
            <option value="true">فعال</option>
            <option value="false">غیرفعال</option>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={discounts}
        isLoading={isLoading}
        emptyMessage="تخفیفی یافت نشد"
        rowKey={(row) => row._id}
        onRowClick={(row) => router.push(`/marketing/discounts/${row._id}`)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف تخفیف"
        description="این تخفیف برای همیشه حذف می‌شود. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
