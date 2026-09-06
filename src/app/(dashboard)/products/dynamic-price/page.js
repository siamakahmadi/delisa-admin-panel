"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Zap, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  fetchPricingRules,
  deletePricingRule,
  applyPricingRuleNow,
  revertPricingRuleNow,
} from "@/lib/pricing/pricing-rules-api";
import { formatNumber, formatDateTime } from "@/lib/utils";

const TARGET_TYPE_LABELS = {
  all: "همه محصولات",
  product: "محصول خاص",
  category: "دسته‌بندی",
  brand: "برند",
  tag: "برچسب",
};

const STATUS_LABELS = {
  draft: { label: "پیش‌نویس", variant: "neutral" },
  applied: { label: "اعمال شده", variant: "success" },
  reverted: { label: "بازگردانی شده", variant: "warning" },
};

function summarizeTargets(targets = []) {
  if (!targets.length || targets.some((t) => t.type === "all")) return "همه محصولات";
  return targets
    .map((t) => `${TARGET_TYPE_LABELS[t.type] || t.type} (${t.ids?.length ?? 0})`)
    .join("، ");
}

export default function DynamicPricePage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const params = { search: debouncedSearch || undefined, status: status || undefined, limit: 100 };
  const { data, isLoading } = useQuery({
    queryKey: ["pricing-rules", params],
    queryFn: () => fetchPricingRules(params),
  });

  const rules = data?.rules ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePricingRule(id),
    onSuccess: () => {
      toast.success("قانون حذف شد");
      invalidate();
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const applyMutation = useMutation({
    mutationFn: (id) => applyPricingRuleNow(id),
    onSuccess: (res) => {
      if (res.syncOk === false) {
        toast.error(`قیمت پایه ${res.affected ?? "—"} محصول تغییر کرد اما بروزرسانی کاتالوگ نمایشی سایت ناموفق بود — دوباره تلاش کنید`);
      } else {
        toast.success(`قیمت ${res.affected ?? "—"} محصول تغییر کرد`);
      }
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.error || "اعمال ناموفق بود"),
  });

  const revertMutation = useMutation({
    mutationFn: (id) => revertPricingRuleNow(id),
    onSuccess: (res) => {
      if (res.syncOk === false) {
        toast.error(`قیمت پایه ${res.affected ?? "—"} محصول بازگردانی شد اما بروزرسانی کاتالوگ نمایشی سایت ناموفق بود — دوباره تلاش کنید`);
      } else {
        toast.success(`قیمت ${res.affected ?? "—"} محصول بازگردانی شد`);
      }
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.error || "بازگردانی ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      { key: "name", header: "نام", render: (row) => <span className="font-medium">{row.name}</span> },
      { key: "targets", header: "هدف", render: (row) => summarizeTargets(row.targets) },
      {
        key: "amount",
        header: "تغییر",
        render: (row) => (
          <Badge variant={row.direction === "increase" ? "success" : "danger"} size="sm">
            {row.direction === "increase" ? "+" : "-"}
            {formatNumber(row.percent)}٪
          </Badge>
        ),
      },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => {
          const s = STATUS_LABELS[row.status] || STATUS_LABELS.draft;
          return <Badge variant={s.variant} size="sm" dot>{s.label}</Badge>;
        },
      },
      { key: "affectedCount", header: "تعداد اعمال شده", render: (row) => formatNumber(row.affectedCount) },
      { key: "lastAppliedAt", header: "آخرین اعمال", render: (row) => (row.lastAppliedAt ? formatDateTime(row.lastAppliedAt) : "—") },
      {
        key: "actions",
        header: "",
        render: (row) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="اعمال فوری"
              loading={applyMutation.isPending && applyMutation.variables === row._id}
              onClick={(e) => { e.stopPropagation(); applyMutation.mutate(row._id); }}
            >
              <Zap size={15} className="text-[var(--success)]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="بازگردانی"
              loading={revertMutation.isPending && revertMutation.variables === row._id}
              onClick={(e) => { e.stopPropagation(); revertMutation.mutate(row._id); }}
            >
              <RotateCcw size={15} />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
              <Trash2 size={15} className="text-[var(--danger)]" />
            </Button>
          </div>
        ),
      },
    ],
    [applyMutation, revertMutation]
  );

  return (
    <div>
      <PageHeader
        title="قیمت‌گذاری پویا"
        subtitle={`${formatNumber(data?.total)} قانون`}
        actions={
          <Button onClick={() => router.push("/products/dynamic-price/new")}>
            <Plus size={16} />
            قانون جدید
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <Input placeholder="جستجوی نام قانون..." className="pr-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-40">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">همه وضعیت‌ها</option>
            <option value="draft">پیش‌نویس</option>
            <option value="applied">اعمال شده</option>
            <option value="reverted">بازگردانی شده</option>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rules}
        isLoading={isLoading}
        emptyMessage="قانون قیمت‌گذاری‌ای یافت نشد"
        rowKey={(row) => row._id}
        onRowClick={(row) => router.push(`/products/dynamic-price/${row._id}`)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف قانون قیمت‌گذاری"
        description="این قانون حذف می‌شود (قیمت‌های قبلاً اعمال‌شده تغییر نمی‌کنند مگر آنکه بازگردانی کنید). آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
