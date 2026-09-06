"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Save, Plus, Trash2, Zap, RotateCcw, Eye } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCategories, useBrands, useTags } from "@/hooks/use-taxonomies";
import { ProductMultiPicker } from "@/components/marketing/product-multi-picker";
import { EntityMultiSelect } from "@/components/marketing/entity-multi-select";
import { formatToman, formatNumber } from "@/lib/utils";
import {
  fetchPricingRule,
  createPricingRule,
  updatePricingRule,
  applyPricingRuleNow,
  revertPricingRuleNow,
  previewPricingRule,
} from "@/lib/pricing/pricing-rules-api";

const TARGET_TYPES = [
  { value: "all", label: "همه محصولات" },
  { value: "product", label: "محصولات خاص" },
  { value: "category", label: "دسته‌بندی" },
  { value: "brand", label: "برند" },
  { value: "tag", label: "برچسب" },
];

const STATUS_LABELS = {
  draft: { label: "پیش‌نویس", variant: "neutral" },
  applied: { label: "اعمال شده", variant: "success" },
  reverted: { label: "بازگردانی شده", variant: "warning" },
};

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

function PricingRuleFormBody({ ruleId, initial }) {
  const isEdit = !!ruleId;
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(initial);
  const [preview, setPreview] = useState(null);
  const patch = (fields) => setForm((f) => ({ ...f, ...fields }));

  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: tags } = useTags();

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = buildPayload(form);
      return isEdit ? updatePricingRule(ruleId, payload) : createPricingRule(payload);
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? "قانون بروزرسانی شد" : "قانون ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
      if (!isEdit && saved?._id) router.push(`/products/dynamic-price/${saved._id}`);
      else queryClient.invalidateQueries({ queryKey: ["pricing-rule", ruleId] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  const previewMutation = useMutation({
    mutationFn: () => previewPricingRule({ draft: buildPayload(form) }),
    onSuccess: (res) => setPreview(res),
    onError: (e) => toast.error(e?.response?.data?.error || "پیش‌نمایش ناموفق بود"),
  });

  const applyMutation = useMutation({
    mutationFn: () => applyPricingRuleNow(ruleId),
    onSuccess: (res) => {
      if (res.syncOk === false) {
        toast.error(`قیمت پایه ${res.affected ?? "—"} محصول تغییر کرد اما بروزرسانی کاتالوگ نمایشی سایت ناموفق بود — دوباره تلاش کنید`);
      } else {
        toast.success(`قیمت ${res.affected ?? "—"} محصول تغییر کرد`);
      }
      queryClient.invalidateQueries({ queryKey: ["pricing-rule", ruleId] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || "اعمال ناموفق بود"),
  });
  const revertMutation = useMutation({
    mutationFn: () => revertPricingRuleNow(ruleId),
    onSuccess: (res) => {
      if (res.syncOk === false) {
        toast.error(`قیمت پایه ${res.affected ?? "—"} محصول بازگردانی شد اما بروزرسانی کاتالوگ نمایشی سایت ناموفق بود — دوباره تلاش کنید`);
      } else {
        toast.success(`قیمت ${res.affected ?? "—"} محصول بازگردانی شد`);
      }
      queryClient.invalidateQueries({ queryKey: ["pricing-rule", ruleId] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || "بازگردانی ناموفق بود"),
  });

  const updateTarget = (index, fields) => {
    const next = form.targets.slice();
    next[index] = { ...next[index], ...fields };
    patch({ targets: next });
  };
  const addTarget = () => patch({ targets: [...form.targets, { type: "product", ids: [] }] });
  const removeTarget = (index) => patch({ targets: form.targets.filter((_, i) => i !== index) });

  const factor =
    form.direction === "increase"
      ? 1 + (Number(form.percent) || 0) / 100
      : 1 - (Number(form.percent) || 0) / 100;

  const status = isEdit ? STATUS_LABELS[initial.status] || STATUS_LABELS.draft : null;

  return (
    <div>
      <PageHeader
        title={isEdit ? `ویرایش قانون قیمت‌گذاری: ${initial.name}` : "قانون قیمت‌گذاری جدید"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/products/dynamic-price")}>
              <ArrowRight size={16} />
              بازگشت
            </Button>
            {isEdit && (
              <>
                <Button variant="secondary" loading={revertMutation.isPending} onClick={() => revertMutation.mutate()}>
                  <RotateCcw size={15} />
                  بازگردانی قیمت‌ها
                </Button>
                <Button variant="secondary" loading={applyMutation.isPending} onClick={() => applyMutation.mutate()}>
                  <Zap size={15} />
                  اعمال فوری روی قیمت‌ها
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="space-y-4">
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
              <Input value={form.description} onChange={(e) => patch({ description: e.target.value })} />
            </div>
            {isEdit && (
              <p className="text-xs text-[var(--text-faint)]">
                {initial.affectedCount ? `آخرین اعمال روی ${formatNumber(initial.affectedCount)} محصول انجام شد.` : "این قانون هنوز اعمال نشده است."}
              </p>
            )}
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
          <CardContent className="space-y-4">
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
                    <Button variant="ghost" size="icon" onClick={() => removeTarget(i)}>
                      <Trash2 size={14} className="text-[var(--danger)]" />
                    </Button>
                  )}
                </div>

                {t.type === "product" && <ProductMultiPicker value={t.ids} onChange={(ids) => updateTarget(i, { ids })} />}
                {t.type === "category" && <EntityMultiSelect options={categories ?? []} value={t.ids} onChange={(ids) => updateTarget(i, { ids })} />}
                {t.type === "brand" && <EntityMultiSelect options={brands ?? []} value={t.ids} onChange={(ids) => updateTarget(i, { ids })} />}
                {t.type === "tag" && <EntityMultiSelect options={tags ?? []} value={t.ids} onChange={(ids) => updateTarget(i, { ids })} />}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>جهت و درصد تغییر</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>جهت</Label>
                <Select value={form.direction} onChange={(e) => patch({ direction: e.target.value })}>
                  <option value="increase">افزایش قیمت</option>
                  <option value="decrease">کاهش قیمت</option>
                </Select>
              </div>
              <div>
                <Label>درصد (مثلاً ۰.۵ یا ۲ یا ۳)</Label>
                <Input type="number" step="0.1" min="0" value={form.percent} onChange={(e) => patch({ percent: e.target.value })} />
              </div>
            </div>
            <p className="text-xs text-[var(--text-faint)]">
              ضریب اعمالی: ×{factor.toFixed(4)} — مثال: قیمت ۱۰۰٬۰۰۰ تومانی می‌شود {formatToman(Math.round(100000 * factor))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>گرد کردن و محدوده امن (اختیاری)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>گرد کردن به (تومان)</Label>
                <Input type="number" value={form.roundingStep} onChange={(e) => patch({ roundingStep: e.target.value })} placeholder="مثلاً ۱۰۰۰" />
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
                <Input type="number" value={form.minFinalPrice} onChange={(e) => patch({ minFinalPrice: e.target.value })} />
              </div>
              <div>
                <Label>حداکثر قیمت نهایی (تومان)</Label>
                <Input type="number" value={form.maxFinalPrice} onChange={(e) => patch({ maxFinalPrice: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              پیش‌نمایش
              <Button size="sm" variant="secondary" loading={previewMutation.isPending} onClick={() => previewMutation.mutate()}>
                <Eye size={14} />
                پیش‌نمایش تغییرات
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!preview && <p className="text-sm text-[var(--text-faint)]">برای دیدن تعداد محصولات تحت تاثیر و نمونه قیمت‌ها، پیش‌نمایش بگیرید.</p>}
            {preview && (
              <div className="space-y-3">
                <p className="text-sm">
                  <span className="font-medium">{formatNumber(preview.matchedCount)}</span> محصول تحت تاثیر این قانون قرار می‌گیرند.
                  {preview.sample?.length > 0 && (
                    <> میانگین نمونه: از {formatToman(preview.avgOld)} به {formatToman(preview.avgNew)}.</>
                  )}
                </p>
                {preview.sample?.length > 0 && (
                  <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                        <tr>
                          <th className="p-2 text-right">محصول</th>
                          <th className="p-2 text-right">قیمت فعلی</th>
                          <th className="p-2 text-right">قیمت جدید</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.sample.map((row) => (
                          <tr key={row.productId} className="border-t border-[var(--border)]">
                            <td className="p-2">{row.name}</td>
                            <td className="p-2">{formatToman(row.oldPrice)}</td>
                            <td className="p-2 font-medium">{formatToman(row.newPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end pb-6">
          <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save size={16} />
            {isEdit ? "ذخیره تغییرات" : "ایجاد قانون"}
          </Button>
        </div>
      </div>
    </div>
  );
}
