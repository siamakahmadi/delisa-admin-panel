"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Save, Plus, Trash2, Zap, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { useToast } from "@/components/ui/toast";
import { useCategories, useBrands, useProductTypes, useTags } from "@/hooks/use-taxonomies";
import { ProductMultiPicker } from "@/components/marketing/product-multi-picker";
import { EntityMultiSelect } from "@/components/marketing/entity-multi-select";
import { fetchCampaigns } from "@/lib/marketing/campaigns-api";
import { fetchVendorsWallets } from "@/lib/financial/api";
import {
  fetchDiscount,
  createDiscount,
  updateDiscount,
  applyDiscountNow,
  revertDiscountNow,
} from "@/lib/marketing/discounts-api";

const TARGET_TYPES = [
  { value: "all", label: "همه محصولات" },
  { value: "product", label: "محصولات خاص" },
  { value: "category", label: "دسته‌بندی" },
  { value: "brand", label: "برند" },
  { value: "tag", label: "برچسب" },
  { value: "productType", label: "نوع محصول" },
  { value: "vendor", label: "فروشنده" },
  { value: "campaign", label: "کمپین" },
];

const DEFAULTS = {
  name: "",
  code: "",
  description: "",
  active: true,
  startAt: "",
  endAt: "",
  targets: [{ type: "all", ids: [] }],
  type: "percent",
  amount: 0,
  maxDiscountAmount: "",
  minDiscountAmount: "",
  applicationMode: "simple",
  tiers: [],
  bogo: { buyQty: 0, getQty: 0, getType: "same" },
  conditions: {
    minCartAmount: 0,
    minQuantity: 0,
    requiredProductIds: [],
    excludedProductIds: [],
    firstPurchaseOnly: false,
  },
  usageLimit: 0,
  perUserLimit: 1,
  stackable: false,
  priority: 100,
};

export function DiscountForm({ discountId }) {
  const isEdit = !!discountId;
  const { data: existing, isLoading } = useQuery({
    queryKey: ["discount", discountId],
    queryFn: () => fetchDiscount(discountId),
    enabled: isEdit,
  });

  if (isEdit && isLoading) return <Skeleton className="h-96 w-full" />;
  return <DiscountFormBody discountId={discountId} initial={existing ? normalizeIncoming(existing) : DEFAULTS} />;
}

function normalizeIncoming(d) {
  return {
    ...DEFAULTS,
    ...d,
    startAt: d.startAt ? new Date(d.startAt).toISOString() : "",
    endAt: d.endAt ? new Date(d.endAt).toISOString() : "",
    maxDiscountAmount: d.maxDiscountAmount ?? "",
    minDiscountAmount: d.minDiscountAmount ?? "",
    targets: d.targets?.length ? d.targets.map((t) => ({ type: t.type, ids: (t.ids || []).map(String) })) : DEFAULTS.targets,
    tiers: d.tiers || [],
    bogo: { ...DEFAULTS.bogo, ...(d.bogo || {}) },
    conditions: { ...DEFAULTS.conditions, ...(d.conditions || {}) },
  };
}

function DiscountFormBody({ discountId, initial }) {
  const isEdit = !!discountId;
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(initial);
  const patch = (fields) => setForm((f) => ({ ...f, ...fields }));
  const patchConditions = (fields) => setForm((f) => ({ ...f, conditions: { ...f.conditions, ...fields } }));

  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: productTypes } = useProductTypes();
  const { data: tags } = useTags();
  const { data: campaigns } = useQuery({ queryKey: ["campaigns"], queryFn: fetchCampaigns });
  const { data: vendorsData } = useQuery({ queryKey: ["vendors-wallets", ""], queryFn: () => fetchVendorsWallets({}) });
  const vendors = (vendorsData?.vendors ?? []).map((v) => ({ _id: v._id, name: [v.firstName, v.lastName].filter(Boolean).join(" ") || v.storeInfo?.storeName || v.contactPhone }));
  const campaignOptions = (campaigns ?? []).map((c) => ({ _id: c._id, name: c.title }));

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        amount: Number(form.amount) || 0,
        maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
        minDiscountAmount: form.minDiscountAmount === "" ? null : Number(form.minDiscountAmount),
        usageLimit: Number(form.usageLimit) || 0,
        perUserLimit: Number(form.perUserLimit) || 1,
        priority: Number(form.priority) || 100,
        startAt: form.startAt || undefined,
        endAt: form.endAt || null,
        code: form.code?.trim() || undefined,
      };
      return isEdit ? updateDiscount(discountId, payload) : createDiscount(payload);
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? "تخفیف بروزرسانی شد" : "تخفیف ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      if (!isEdit && saved?._id) router.push(`/marketing/discounts/${saved._id}`);
      else queryClient.invalidateQueries({ queryKey: ["discount", discountId] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  const applyMutation = useMutation({
    mutationFn: () => applyDiscountNow(discountId),
    onSuccess: (res) => toast.success(`تخفیف روی ${res.affected ?? "—"} محصول اعمال شد`),
    onError: (e) => toast.error(e?.response?.data?.error || "اعمال ناموفق بود"),
  });
  const revertMutation = useMutation({
    mutationFn: () => revertDiscountNow(discountId),
    onSuccess: () => toast.success("تخفیف از روی محصولات برداشته شد"),
    onError: (e) => toast.error(e?.response?.data?.error || "بازگردانی ناموفق بود"),
  });

  const updateTarget = (index, fields) => {
    const next = form.targets.slice();
    next[index] = { ...next[index], ...fields };
    patch({ targets: next });
  };
  const addTarget = () => patch({ targets: [...form.targets, { type: "product", ids: [] }] });
  const removeTarget = (index) => patch({ targets: form.targets.filter((_, i) => i !== index) });

  const addTier = () => patch({ tiers: [...form.tiers, { minPrice: 0, maxPrice: null, type: "percent", amount: 0 }] });
  const updateTier = (index, fields) => {
    const next = form.tiers.slice();
    next[index] = { ...next[index], ...fields };
    patch({ tiers: next });
  };
  const removeTier = (index) => patch({ tiers: form.tiers.filter((_, i) => i !== index) });

  return (
    <div>
      <PageHeader
        title={isEdit ? `ویرایش تخفیف: ${initial.name}` : "تخفیف جدید"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/marketing/discounts")}>
              <ArrowRight size={16} />
              بازگشت
            </Button>
            {isEdit && (
              <>
                <Button variant="secondary" loading={revertMutation.isPending} onClick={() => revertMutation.mutate()}>
                  <RotateCcw size={15} />
                  بازگردانی از کاتالوگ
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
          <CardHeader><CardTitle>اطلاعات پایه</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>نام تخفیف</Label>
                <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="مثلاً: تخفیف اولین خرید" />
              </div>
              <div>
                <Label>کد تخفیف (اختیاری)</Label>
                <Input dir="ltr" value={form.code} onChange={(e) => patch({ code: e.target.value.toUpperCase() })} placeholder="مثلاً: WELCOME10" />
              </div>
            </div>
            <div>
              <Label>توضیحات</Label>
              <Input value={form.description} onChange={(e) => patch({ description: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>شروع اعتبار</Label>
                <JalaliDatePicker value={form.startAt} onChange={(v) => patch({ startAt: v })} placeholder="از الان" />
              </div>
              <div>
                <Label>پایان اعتبار (اختیاری)</Label>
                <JalaliDatePicker value={form.endAt} onChange={(v) => patch({ endAt: v })} placeholder="نامحدود" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--text)]">
              <input type="checkbox" checked={form.active} onChange={(e) => patch({ active: e.target.checked })} className="h-4 w-4 accent-[var(--brand-600)]" />
              فعال
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center justify-between">هدف‌گیری<Button size="sm" variant="secondary" onClick={addTarget}><Plus size={14} />افزودن هدف</Button></CardTitle></CardHeader>
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
                {t.type === "productType" && <EntityMultiSelect options={productTypes ?? []} value={t.ids} onChange={(ids) => updateTarget(i, { ids })} />}
                {t.type === "vendor" && <EntityMultiSelect options={vendors} value={t.ids} onChange={(ids) => updateTarget(i, { ids })} />}
                {t.type === "campaign" && <EntityMultiSelect options={campaignOptions} value={t.ids} onChange={(ids) => updateTarget(i, { ids })} emptyLabel="کمپینی یافت نشد" />}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>نوع و مقدار تخفیف</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>نوع</Label>
                <Select value={form.type} onChange={(e) => patch({ type: e.target.value })}>
                  <option value="percent">درصدی</option>
                  <option value="fixed">مبلغ ثابت</option>
                </Select>
              </div>
              <div>
                <Label>{form.type === "percent" ? "درصد تخفیف" : "مبلغ تخفیف (تومان)"}</Label>
                <Input type="number" value={form.amount} onChange={(e) => patch({ amount: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>سقف مبلغ تخفیف (اختیاری)</Label>
                <Input type="number" value={form.maxDiscountAmount} onChange={(e) => patch({ maxDiscountAmount: e.target.value })} />
              </div>
              <div>
                <Label>کف مبلغ تخفیف (اختیاری)</Label>
                <Input type="number" value={form.minDiscountAmount} onChange={(e) => patch({ minDiscountAmount: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>حالت اعمال</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="w-56">
              <Select value={form.applicationMode} onChange={(e) => patch({ applicationMode: e.target.value })}>
                <option value="simple">ساده</option>
                <option value="tiered">پلکانی (بر اساس قیمت)</option>
                <option value="bogo">بخر و ببر (BOGO)</option>
              </Select>
            </div>

            {form.applicationMode === "tiered" && (
              <div className="space-y-2">
                {form.tiers.map((tier, i) => (
                  <div key={i} className="grid grid-cols-1 gap-2 rounded-[var(--radius-md)] border border-[var(--border)] p-3 sm:grid-cols-5">
                    <div>
                      <Label>حداقل قیمت</Label>
                      <Input type="number" value={tier.minPrice} onChange={(e) => updateTier(i, { minPrice: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>حداکثر قیمت</Label>
                      <Input type="number" value={tier.maxPrice ?? ""} onChange={(e) => updateTier(i, { maxPrice: e.target.value === "" ? null : Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>نوع</Label>
                      <Select value={tier.type} onChange={(e) => updateTier(i, { type: e.target.value })}>
                        <option value="percent">درصدی</option>
                        <option value="fixed">ثابت</option>
                      </Select>
                    </div>
                    <div>
                      <Label>مقدار</Label>
                      <Input type="number" value={tier.amount} onChange={(e) => updateTier(i, { amount: Number(e.target.value) })} />
                    </div>
                    <div className="flex items-end">
                      <Button variant="ghost" size="icon" onClick={() => removeTier(i)}>
                        <Trash2 size={14} className="text-[var(--danger)]" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="secondary" onClick={addTier}><Plus size={14} />افزودن پله</Button>
              </div>
            )}

            {form.applicationMode === "bogo" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label>تعداد خرید</Label>
                  <Input type="number" value={form.bogo.buyQty} onChange={(e) => patch({ bogo: { ...form.bogo, buyQty: Number(e.target.value) } })} />
                </div>
                <div>
                  <Label>تعداد هدیه</Label>
                  <Input type="number" value={form.bogo.getQty} onChange={(e) => patch({ bogo: { ...form.bogo, getQty: Number(e.target.value) } })} />
                </div>
                <div>
                  <Label>نوع هدیه</Label>
                  <Select value={form.bogo.getType} onChange={(e) => patch({ bogo: { ...form.bogo, getType: e.target.value } })}>
                    <option value="same">همان محصول</option>
                    <option value="cheapest">ارزان‌ترین آیتم سبد</option>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>شرایط اعمال</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>حداقل مبلغ سبد خرید (تومان)</Label>
                <Input type="number" value={form.conditions.minCartAmount} onChange={(e) => patchConditions({ minCartAmount: Number(e.target.value) })} />
              </div>
              <div>
                <Label>حداقل تعداد کالا</Label>
                <Input type="number" value={form.conditions.minQuantity} onChange={(e) => patchConditions({ minQuantity: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>محصولات الزامی در سبد (حداقل یکی)</Label>
              <ProductMultiPicker value={form.conditions.requiredProductIds} onChange={(ids) => patchConditions({ requiredProductIds: ids })} />
            </div>
            <div>
              <Label>محصولات مستثنی (نباید در سبد باشند)</Label>
              <ProductMultiPicker value={form.conditions.excludedProductIds} onChange={(ids) => patchConditions({ excludedProductIds: ids })} />
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--text)]">
              <input type="checkbox" checked={form.conditions.firstPurchaseOnly} onChange={(e) => patchConditions({ firstPurchaseOnly: e.target.checked })} className="h-4 w-4 accent-[var(--brand-600)]" />
              فقط برای اولین خرید مشتری
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>محدودیت استفاده</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label>سقف کل استفاده (۰ = نامحدود)</Label>
                <Input type="number" value={form.usageLimit} onChange={(e) => patch({ usageLimit: e.target.value })} />
              </div>
              <div>
                <Label>سقف هر مشتری</Label>
                <Input type="number" value={form.perUserLimit} onChange={(e) => patch({ perUserLimit: e.target.value })} />
              </div>
              <div>
                <Label>اولویت (کمتر = بالاتر)</Label>
                <Input type="number" value={form.priority} onChange={(e) => patch({ priority: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--text)]">
              <input type="checkbox" checked={form.stackable} onChange={(e) => patch({ stackable: e.target.checked })} className="h-4 w-4 accent-[var(--brand-600)]" />
              قابل ترکیب با سایر تخفیف‌ها
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end pb-6">
          <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save size={16} />
            {isEdit ? "ذخیره تغییرات" : "ایجاد تخفیف"}
          </Button>
        </div>
      </div>
    </div>
  );
}
