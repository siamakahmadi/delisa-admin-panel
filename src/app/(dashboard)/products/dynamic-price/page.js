"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Zap, RotateCcw, Copy, TrendingUp, TrendingDown } from "lucide-react";
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
  createPricingRule,
} from "@/lib/pricing/pricing-rules-api";
import { STATUS_LABELS, summarizeTargets } from "@/lib/pricing/pricing-rule-meta";
import { usePricingRuleActions } from "@/hooks/use-pricing-rule-actions";
import { formatNumber, formatDateTime } from "@/lib/utils";

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

  const duplicateMutation = useMutation({
    mutationFn: (rule) =>
      createPricingRule({
        name: `${rule.name} (کپی)`,
        description: rule.description,
        targets: rule.targets,
        direction: rule.direction,
        percent: rule.percent,
        roundingStep: rule.roundingStep,
        roundingMethod: rule.roundingMethod,
        minFinalPrice: rule.minFinalPrice,
        maxFinalPrice: rule.maxFinalPrice,
      }),
    onSuccess: (saved) => {
      toast.success("نسخه‌ی جدید به‌صورت پیش‌نویس ساخته شد");
      invalidate();
      if (saved?._id) router.push(`/products/dynamic-price/${saved._id}`);
    },
    onError: (e) => toast.error(e?.response?.data?.error || "کپی ناموفق بود"),
  });

  const actions = usePricingRuleActions();

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "نام",
        render: (row) => (
          <div>
            <div className="font-medium">{row.name}</div>
            {row.description && (
              <div className="mt-0.5 line-clamp-1 text-xs text-[var(--text-faint)]">{row.description}</div>
            )}
          </div>
        ),
      },
      { key: "targets", header: "هدف", render: (row) => <span className="text-[var(--text-muted)]">{summarizeTargets(row.targets)}</span> },
      {
        key: "amount",
        header: "تغییر",
        render: (row) => {
          const up = row.direction === "increase";
          const Icon = up ? TrendingUp : TrendingDown;
          return (
            <Badge variant={up ? "success" : "danger"} size="sm">
              <Icon size={12} />
              {up ? "+" : "−"}
              {formatNumber(row.percent)}٪
            </Badge>
          );
        },
      },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => {
          const s = STATUS_LABELS[row.status] || STATUS_LABELS.draft;
          return <Badge variant={s.variant} size="sm" dot>{s.label}</Badge>;
        },
      },
      {
        key: "affectedCount",
        header: "محصولات اعمال‌شده",
        render: (row) => (row.status === "applied" ? formatNumber(row.affectedCount) : "—"),
      },
      {
        key: "lastAppliedAt",
        header: "آخرین اعمال",
        render: (row) => (row.lastAppliedAt ? formatDateTime(row.lastAppliedAt) : "—"),
      },
      {
        key: "actions",
        header: "",
        render: (row) => {
          const applied = row.status === "applied";
          const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
          return (
            <div className="flex items-center gap-1">
              {applied ? (
                <Button
                  variant="ghost"
                  size="icon"
                  title="بازگردانی قیمت‌ها"
                  loading={actions.isBusy(row._id)}
                  onClick={stop(() => actions.askRevert(row))}
                >
                  <RotateCcw size={15} className="text-[var(--warning)]" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  title="اعمال روی قیمت‌ها"
                  loading={actions.isBusy(row._id)}
                  onClick={stop(() => actions.askApply(row))}
                >
                  <Zap size={15} className="text-[var(--success)]" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                title="کپی قانون"
                loading={duplicateMutation.isPending && duplicateMutation.variables?._id === row._id}
                onClick={stop(() => duplicateMutation.mutate(row))}
              >
                <Copy size={15} />
              </Button>
              <Button variant="ghost" size="icon" title="حذف" onClick={stop(() => setDeleteTarget(row))}>
                <Trash2 size={15} className="text-[var(--danger)]" />
              </Button>
            </div>
          );
        },
      },
    ],
    [actions, duplicateMutation]
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

      <p className="mb-4 rounded-[var(--radius-md)] bg-[var(--info-bg)] px-4 py-3 text-sm text-[var(--info)]">
        هر قانون قیمت فروش (قیمت نهایی) محصولات هدف را به‌صورت درصدی تغییر می‌دهد. قبل از اعمال، پیش‌نمایش بگیرید؛
        بعد از اعمال می‌توانید با «بازگردانی» قیمت‌ها را برگردانید. یک قانون را فقط وقتی می‌شود دوباره اعمال کرد که بازگردانی شده باشد.
      </p>

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

      {actions.dialog}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف قانون قیمت‌گذاری"
        description={
          deleteTarget?.status === "applied"
            ? "این قانون هنوز روی قیمت‌ها اعمال شده است. با حذف آن دیگر نمی‌توانید قیمت‌ها را با «بازگردانی» برگردانید. بهتر است ابتدا بازگردانی کنید."
            : "این قانون حذف می‌شود. آیا مطمئن هستید؟"
        }
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
