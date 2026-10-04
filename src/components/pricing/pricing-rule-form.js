"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, Save, Plus, Trash2, Zap, RotateCcw, Eye, TrendingUp, TrendingDown,
  AlertTriangle, History, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCategories, useBrands, useTags } from "@/hooks/use-taxonomies";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePricingRuleActions } from "@/hooks/use-pricing-rule-actions";
import { ProductMultiPicker } from "@/components/marketing/product-multi-picker";
import { EntityMultiSelect } from "@/components/marketing/entity-multi-select";
import { cn, formatToman, formatNumber, formatDateTime } from "@/lib/utils";
import { STATUS_LABELS, validateRuleForm, computePrice } from "@/lib/pricing/pricing-rule-meta";
import {
  fetchPricingRule,
  fetchPricingRuleHistory,
  createPricingRule,
  updatePricingRule,
  previewPricingRule,
} from "@/lib/pricing/pricing-rules-api";

const PERCENT_PRESETS = [1, 2, 3, 5, 10, 15];
const EXAMPLE_PRICE = 100000;

const TARGET_TYPES = [
  { value: "all", label: "همه محصولات" },
  { value: "product", label: "محصولات خاص" },
  { value: "category", label: "دسته‌بندی" },
  { value: "brand", label: "برند" },
  { value: "tag", label: "برچسب" },
];

const DEFAULTS = {
  name: "",
  description: "",
  targets: [{ type: "all", ids: [] }],
  direction: "increase",
  percent: 0,
  roundingStep: "",
  roundingMethod: "round",
  minFinalPrice: "",
  maxFinalPrice: "",
};

export function PricingRuleForm({ ruleId }) {
  const isEdit = !!ruleId;
  const { data: existing, isLoading } = useQuery({
    queryKey: ["pricing-rule", ruleId],
    queryFn: () => fetchPricingRule(ruleId),
    enabled: isEdit,
  });

  if (isEdit && isLoading) return <Skeleton className="h-96 w-full" />;
  return (
    <PricingRuleFormBody
      ruleId={ruleId}
      initial={existing ? normalizeIncoming(existing) : DEFAULTS}
    />
  );
}

function normalizeIncoming(r) {
  return {
    ...DEFAULTS,
    ...r,
    targets: r.targets?.length
      ? r.targets.map((t) => ({ type: t.type, ids: (t.ids || []).map(String) }))
      : DEFAULTS.targets,
    roundingStep: r.roundingStep ?? "",
    minFinalPrice: r.minFinalPrice ?? "",
    maxFinalPrice: r.maxFinalPrice ?? "",
  };
}

function buildPayload(form) {
  return {
    name: form.name,
    description: form.description,
    targets: form.targets,
    direction: form.direction,
    percent: Number(form.percent) || 0,
    roundingStep: form.roundingStep === "" ? null : Number(form.roundingStep),
    roundingMethod: form.roundingMethod,
    minFinalPrice: form.minFinalPrice === "" ? null : Number(form.minFinalPrice),
    maxFinalPrice: form.maxFinalPrice === "" ? null : Number(form.maxFinalPrice),
  };
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-1">
      {options.map((o) => {
        const Icon = o.icon;
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[var(--radius-sm)] py-2 text-sm font-medium transition-colors",
              active ? "bg-[var(--surface)] shadow-[var(--shadow-sm)]" : "text-[var(--text-muted)] hover:text-[var(--text)]",
              active && o.value === "increase" && "text-[var(--success)]",
              active && o.value === "decrease" && "text-[var(--danger)]"
            )}
          >
            <Icon size={15} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function HistoryCard({ ruleId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["pricing-rule-history", ruleId],
    queryFn: () => fetchPricingRuleHistory(ruleId, { limit: 20 }),
  });
  const logs = data?.logs ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History size={16} />
          تاریخچه تغییر قیمت‌ها
          {data?.meta?.total > 0 && (
            <span className="text-xs font-normal text-[var(--text-faint)]">
              ({formatNumber(data.meta.total)} رکورد، ۲۰ مورد آخر)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-24 w-full" />}
        {!isLoading && !logs.length && (
          <p className="text-sm text-[var(--text-faint)]">هنوز تغییری با این قانون ثبت نشده است.</p>
        )}
        {logs.length > 0 && (
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                <tr>
                  <th className="p-2 text-right font-medium">محصول</th>
                  <th className="p-2 text-right font-medium">قبل</th>
                  <th className="p-2 text-right font-medium">بعد</th>
                  <th className="p-2 text-right font-medium">نوع</th>
                  <th className="p-2 text-right font-medium">زمان</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l._id} className="border-t border-[var(--border)]">
                    <td className="p-2">{l.product?.productName || "—"}</td>
                    <td className="p-2">{formatToman(l.oldValue)}</td>
                    <td className="p-2 font-medium">{formatToman(l.newValue)}</td>
                    <td className="p-2">
                      <Badge size="sm" variant={l.reason?.startsWith("pricing_rule_revert") ? "warning" : "success"}>
                        {l.reason?.startsWith("pricing_rule_revert") ? "بازگردانی" : "اعمال"}
                      </Badge>
                    </td>
                    <td className="p-2 text-[var(--text-muted)]">{formatDateTime(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PricingRuleFormBody({ ruleId, initial }) {
  const isEdit = !!ruleId;
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const actions = usePricingRuleActions();

  const [form, setForm] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const patch = (fields) => {
    setDirty(true);
    setForm((f) => ({ ...f, ...fields }));
  };

  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: tags } = useTags();

  const problem = validateRuleForm(form);
  const payload = useMemo(() => buildPayload(form), [form]);
  // preview refreshes itself shortly after the admin stops editing
  const debouncedForm = useDebouncedValue(form, 600);
  const debouncedPayload = useMemo(() => buildPayload(debouncedForm), [debouncedForm]);
  const debouncedProblem = validateRuleForm({ ...debouncedForm, name: "preview" });
  const previewKey = JSON.stringify(debouncedPayload);

  const { data: preview, isFetching: previewing, error: previewError } = useQuery({
    queryKey: ["pricing-rule-preview", previewKey],
    queryFn: () => previewPricingRule({ draft: debouncedPayload }),
    enabled: !debouncedProblem,
    placeholderData: (prev) => prev,
  });

  const saveMutation = useMutation({
    mutationFn: () => (isEdit ? updatePricingRule(ruleId, payload) : createPricingRule(payload)),
    onSuccess: (saved) => {
      toast.success(isEdit ? "قانون بروزرسانی شد" : "قانون ایجاد شد");
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
      if (!isEdit && saved?._id) router.push(`/products/dynamic-price/${saved._id}`);
      else queryClient.invalidateQueries({ queryKey: ["pricing-rule", ruleId] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  // leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const updateTarget = (index, fields) => {
    const next = form.targets.slice();
    next[index] = { ...next[index], ...fields };
    patch({ targets: next });
  };
  const addTarget = () => patch({ targets: [...form.targets, { type: "product", ids: [] }] });
  const removeTarget = (index) => patch({ targets: form.targets.filter((_, i) => i !== index) });

  const percent = Number(form.percent) || 0;
  const example = computePrice(EXAMPLE_PRICE, form);
  const status = isEdit ? STATUS_LABELS[initial.status] || STATUS_LABELS.draft : null;
  const applied = isEdit && initial.status === "applied";
  const bigChange = percent >= 20;
  const showTargetEmptyWarn = preview && preview.matchedCount === 0 && !problem;

  const back = () => {
    if (dirty && !window.confirm("تغییرات ذخیره‌نشده از بین می‌رود. خارج می‌شوید؟")) return;
    router.push("/products/dynamic-price");
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? `ویرایش قانون: ${initial.name}` : "قانون قیمت‌گذاری جدید"}
        subtitle="قیمت فروش محصولات را به‌صورت درصدی افزایش یا کاهش بدهید"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={back}>
              <ArrowRight size={16} />
              بازگشت
            </Button>
            {isEdit && applied && (
              <Button variant="secondary" loading={actions.isBusy(ruleId)} onClick={() => actions.askRevert({ _id: ruleId, name: initial.name })}>
                <RotateCcw size={15} />
                بازگردانی قیمت‌ها
              </Button>
            )}
            {isEdit && !applied && (
              <Button
                variant="secondary"
                disabled={dirty}
                title={dirty ? "ابتدا تغییرات را ذخیره کنید" : undefined}
                loading={actions.isBusy(ruleId)}
                onClick={() => actions.askApply({ _id: ruleId, name: initial.name })}
              >
                <Zap size={15} />
                اعمال روی قیمت‌ها
              </Button>
            )}
          </div>
        }
      />

      {applied && (
        <div className="mb-4 flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--warning-bg)] px-4 py-3 text-sm text-[var(--warning)]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            این قانون هم‌اکنون روی قیمت {formatNumber(initial.affectedCount)} محصول اعمال شده است. ویرایش درصد یا هدف روی قیمت‌های فعلی اثری ندارد؛
            برای اعمال نسخه‌ی جدید ابتدا «بازگردانی قیمت‌ها» و سپس «اعمال» را بزنید.
          </span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                اطلاعات پایه
                {status && <Badge variant={status.variant} size="sm" dot>{status.label}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>نام قانون</Label>
                <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="مثلاً: افزایش ۳٪ قیمت لوازم آرایشی" />
              </div>
              <div>
                <Label>توضیحات (اختیاری)</Label>
                <Input value={form.description} onChange={(e) => patch({ description: e.target.value })} placeholder="دلیل این تغییر قیمت برای همکاران" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                هدف‌گیری
                <Button size="sm" variant="secondary" onClick={addTarget}>
                  <Plus size={14} />
                  افزودن هدف
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.targets.length > 1 && (
                <p className="text-xs text-[var(--text-faint)]">محصولی که با <b>هرکدام</b> از هدف‌های زیر مطابقت داشته باشد تغییر می‌کند.</p>
              )}
              {form.targets.map((t, i) => (
                <div key={i} className="space-y-2 rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-48">
                      <Select value={t.type} onChange={(e) => updateTarget(i, { type: e.target.value, ids: [] })}>
                        {TARGET_TYPES.map((tt) => (
                          <option key={tt.value} value={tt.value}>{tt.label}</option>
                        ))}
                      </Select>
                    </div>
                    {form.targets.length > 1 && (
                      <Button variant="ghost" size="icon" title="حذف هدف" onClick={() => removeTarget(i)}>
                        <Trash2 size={14} className="text-[var(--danger)]" />
                      </Button>
                    )}
                  </div>

                  {t.type === "product" && <ProductMultiPicker value={t.ids} onChange={(ids) => updateTarget(i, { ids })} />}
                  {t.type === "category" && <EntityMultiSelect options={categories ?? []} value={t.ids} onChange={(ids) => updateTarget(i, { ids })} />}
                  {t.type === "brand" && <EntityMultiSelect options={brands ?? []} value={t.ids} onChange={(ids) => updateTarget(i, { ids })} />}
                  {t.type === "tag" && <EntityMultiSelect options={tags ?? []} value={t.ids} onChange={(ids) => updateTarget(i, { ids })} />}
                  {t.type === "all" && (
                    <p className="text-xs text-[var(--text-faint)]">قانون روی تمام محصولات دارای قیمت اعمال می‌شود.</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>جهت و درصد تغییر</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Segmented
                value={form.direction}
                onChange={(direction) => patch({ direction })}
                options={[
                  { value: "increase", label: "افزایش قیمت", icon: TrendingUp },
                  { value: "decrease", label: "کاهش قیمت", icon: TrendingDown },
                ]}
              />
              <div>
                <Label>درصد تغییر</Label>
                <Input type="number" step="0.1" min="0" value={form.percent} onChange={(e) => patch({ percent: e.target.value })} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PERCENT_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => patch({ percent: p })}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        percent === p
                          ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand-500)]"
                      )}
                    >
                      {formatNumber(p)}٪
                    </button>
                  ))}
                </div>
              </div>
              {bigChange && !problem && (
                <p className="flex items-center gap-1.5 text-xs text-[var(--warning)]">
                  <AlertTriangle size={13} />
                  تغییر {formatNumber(percent)}٪ بزرگ است؛ حتماً پیش‌نمایش را بررسی کنید.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>گرد کردن و محدوده امن (اختیاری)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>گرد کردن به (تومان)</Label>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {[1000, 5000, 10000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => patch({ roundingStep: Number(form.roundingStep) === v ? "" : v })}
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                          Number(form.roundingStep) === v
                            ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                            : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand-500)]"
                        )}
                      >
                        {formatNumber(v)}
                      </button>
                    ))}
                  </div>
                  <Input type="number" value={form.roundingStep} onChange={(e) => patch({ roundingStep: e.target.value })} placeholder="بدون گرد کردن" />
                </div>
                <div>
                  <Label>روش گرد کردن</Label>
                  <Select value={form.roundingMethod} onChange={(e) => patch({ roundingMethod: e.target.value })}>
                    <option value="round">نزدیک‌ترین</option>
                    <option value="floor">به پایین</option>
                    <option value="ceil">به بالا</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>حداقل قیمت نهایی (تومان)</Label>
                  <Input type="number" value={form.minFinalPrice} onChange={(e) => patch({ minFinalPrice: e.target.value })} placeholder="بدون محدودیت" />
                </div>
                <div>
                  <Label>حداکثر قیمت نهایی (تومان)</Label>
                  <Input type="number" value={form.maxFinalPrice} onChange={(e) => patch({ maxFinalPrice: e.target.value })} placeholder="بدون محدودیت" />
                </div>
              </div>
            </CardContent>
          </Card>

          {isEdit && <HistoryCard ruleId={ruleId} />}
        </div>

        {/* live summary + preview — sticky next to the form on wide screens */}
        <div className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Eye size={16} />پیش‌نمایش زنده</span>
                {previewing && <Loader2 size={14} className="animate-spin text-[var(--text-faint)]" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3 text-center">
                <div className="text-xs text-[var(--text-muted)]">مثال: محصول {formatToman(EXAMPLE_PRICE)}</div>
                <div className={cn("mt-1 text-lg font-bold", form.direction === "increase" ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                  {formatToman(example)}
                </div>
              </div>

              {problem && <p className="text-sm text-[var(--text-faint)]">{problem}</p>}
              {previewError && !problem && (
                <p className="text-sm text-[var(--danger)]">{previewError?.response?.data?.error || "پیش‌نمایش ناموفق بود"}</p>
              )}

              {!problem && preview && (
                <>
                  <p className="text-sm">
                    <span className="font-bold">{formatNumber(preview.matchedCount)}</span> محصول تحت تأثیر قرار می‌گیرد.
                    {preview.sample?.length > 0 && (
                      <span className="text-[var(--text-muted)]"> میانگین نمونه: {formatToman(preview.avgOld)} ← {formatToman(preview.avgNew)}</span>
                    )}
                  </p>
                  {showTargetEmptyWarn && (
                    <p className="flex items-center gap-1.5 text-xs text-[var(--warning)]">
                      <AlertTriangle size={13} />
                      هیچ محصول دارای قیمتی با این هدف‌گیری پیدا نشد.
                    </p>
                  )}
                  {preview.sample?.length > 0 && (
                    <div className="max-h-72 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)]">
                      <table className="w-full text-xs">
                        <tbody>
                          {preview.sample.map((row) => (
                            <tr key={row.productId} className="border-t border-[var(--border)] first:border-t-0">
                              <td className="max-w-[140px] truncate p-2" title={row.name}>{row.name}</td>
                              <td className="p-2 text-[var(--text-muted)] line-through">{formatToman(row.oldPrice)}</td>
                              <td className="p-2 font-medium">{formatToman(row.newPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {preview.matchedCount > preview.sample?.length && (
                    <p className="text-[11px] text-[var(--text-faint)]">فقط {formatNumber(preview.sample.length)} نمونه‌ی اول نمایش داده شده است.</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Button className="w-full" disabled={!!problem || (isEdit && !dirty)} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save size={16} />
            {isEdit ? "ذخیره تغییرات" : "ایجاد قانون"}
          </Button>
          {problem && dirty && <p className="text-center text-xs text-[var(--danger)]">{problem}</p>}
        </div>
      </div>

      {actions.dialog}
    </div>
  );
}
