"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useBrands, useCategories } from "@/hooks/use-taxonomies";
import {
  deleteCompetitorSource,
  deletePricingScope,
  fetchCompetitorSources,
  fetchPricingSettings,
  updatePricingSettings,
  upsertCompetitorSource,
  upsertPricingScope,
} from "@/lib/pricing-intelligence/api";
import { MODE_LABELS, STRATEGY_LABELS } from "@/lib/pricing-intelligence/labels";

export default function PricingSettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["pricing-settings"], queryFn: fetchPricingSettings });
  const { data: sourcesData } = useQuery({ queryKey: ["competitor-sources"], queryFn: fetchCompetitorSources });
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const [form, setForm] = useState(null);
  const [sourceForm, setSourceForm] = useState({ name: "", baseUrl: "", trustScore: 70, refreshIntervalHours: 24 });
  const [scopeForm, setScopeForm] = useState({ scopeType: "category", scopeId: "", targetMargin: 0.22 });

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => updatePricingSettings(form),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["pricing-settings"] });
    },
    onError: () => toast.error("ذخیره ناموفق بود"),
  });

  if (!form) return <p className="text-sm text-[var(--text-muted)]">در حال بارگذاری…</p>;

  const set = (k, v) => setForm({ ...form, [k]: v });
  const setCost = (k, v) => setForm({ ...form, costComponents: { ...form.costComponents, [k]: v } });

  const brandList = Array.isArray(brands) ? brands : brands?.items || brands?.brands || [];
  const categoryList = Array.isArray(categories) ? categories : categories?.items || categories?.categories || [];

  return (
    <div>
      <PageHeader
        title="تنظیمات موتور قیمت"
        subtitle="اولویت: محصول → برند → دسته → سراسری. حالت پیش‌فرض فقط پیشنهاد است و قیمت را عوض نمی‌کند."
        actions={<Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>ذخیره تنظیمات سراسری</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>حاشیه سود و موقعیت بازار</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Num label="حداقل حاشیه" value={form.minMargin} onChange={(v) => set("minMargin", v)} />
            <Num label="حاشیه هدف" value={form.targetMargin} onChange={(v) => set("targetMargin", v)} />
            <Num label="حاشیه ایده‌آل" value={form.idealMargin} onChange={(v) => set("idealMargin", v)} />
            <Num label="موقعیت رقابتی نسبت به میانه" value={form.competitivePosition} onChange={(v) => set("competitivePosition", v)} />
            <div>
              <Label>حالت کلی</Label>
              <Select value={form.mode} onChange={(e) => set("mode", e.target.value)}>
                {Object.entries(MODE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div>
              <Label>استراتژی پیش‌فرض</Label>
              <Select value={form.defaultStrategy || "STANDARD"} onChange={(e) => set("defaultStrategy", e.target.value)}>
                {Object.entries(STRATEGY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={!!form.aiMatchingEnabled} onChange={(e) => set("aiMatchingEnabled", e.target.checked)} />
              تطبیق کمکی با AI وقتی تطبیق فازی قطعی نیست
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={!!form.useSimplePercentRule} onChange={(e) => set("useSimplePercentRule", e.target.checked)} />
              استفاده از قانون درصدی ساده به‌جای موتور هوشمند (پیش‌فرض خاموش)
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>ایمنی و گرد کردن</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Num label="سقف افزایش خودکار ٪" value={form.maxAutomaticIncreasePercent} onChange={(v) => set("maxAutomaticIncreasePercent", v)} />
            <Num label="سقف کاهش خودکار ٪" value={form.maxAutomaticDecreasePercent} onChange={(v) => set("maxAutomaticDecreasePercent", v)} />
            <Num label="فاصله زمانی (ساعت)" value={form.cooldownHours} onChange={(v) => set("cooldownHours", v)} />
            <Num label="گام گرد کردن" value={form.roundingStep} onChange={(v) => set("roundingStep", v)} />
            <Num label="پایان روان‌شناختی (مثلاً ۹۰۰۰)" value={form.psychologicalEnding} onChange={(v) => set("psychologicalEnding", v || null)} />
            <Num label="تعدیل درصدی ساده" value={form.simpleAdjustmentPercent} onChange={(v) => set("simpleAdjustmentPercent", v)} />
            <Num label="آستانه موجودی کم" value={form.lowStockThreshold} onChange={(v) => set("lowStockThreshold", v)} />
            <Num label="آستانه موجودی زیاد" value={form.mediumStockThreshold} onChange={(v) => set("mediumStockThreshold", v)} />
            <Num label="حداقل نمونه فروش" value={form.minSalesSample} onChange={(v) => set("minSalesSample", v)} />
            <Num label="حداقل رقیب برای AUTO" value={form.minValidCompetitorsForAuto} onChange={(v) => set("minValidCompetitorsForAuto", v)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>هزینه‌های مؤثر (بدون هزینه ارسال مشتری)</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Num label="کارمزد درگاه ٪" value={form.costComponents?.paymentGatewayPercent} onChange={(v) => setCost("paymentGatewayPercent", v)} />
            <Num label="مالیات ٪" value={form.costComponents?.taxPercent} onChange={(v) => setCost("taxPercent", v)} />
            <Num label="کارمزد پلتفرم ٪" value={form.costComponents?.platformFeePercent} onChange={(v) => setCost("platformFeePercent", v)} />
            <Num label="هزینه ثابت تراکنش" value={form.costComponents?.fixedTransactionCost} onChange={(v) => setCost("fixedTransactionCost", v)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>فروشگاه‌ها برای جستجوی کلی</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--text-muted)]">
              این بخش برای جستجوی نام محصول داخل فروشگاه است. برای مقایسه دقیق، لینک صفحه همان محصول را در صفحه هر کالا بگذارید.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="نام فروشگاه" value={sourceForm.name} onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })} />
              <Input placeholder="آدرس پایه" value={sourceForm.baseUrl} onChange={(e) => setSourceForm({ ...sourceForm, baseUrl: e.target.value })} />
              <Input
                className="sm:col-span-2"
                placeholder="قالب جستجو مثلاً https://shop.example/search?q={query}"
                value={sourceForm.searchUrlTemplate || ""}
                onChange={(e) => setSourceForm({ ...sourceForm, searchUrlTemplate: e.target.value })}
              />
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await upsertCompetitorSource(sourceForm);
                    toast.success("منبع اضافه شد");
                    queryClient.invalidateQueries({ queryKey: ["competitor-sources"] });
                    setSourceForm({ name: "", baseUrl: "", trustScore: 70, refreshIntervalHours: 24 });
                  } catch {
                    toast.error("ثبت منبع ناموفق بود");
                  }
                }}
              >
                افزودن منبع
              </Button>
            </div>
            {(sourcesData?.sources || []).map((s) => (
              <div key={s._id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm">
                <span>{s.name} {s.enabled ? "" : "(خاموش)"}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await deleteCompetitorSource(s._id);
                    queryClient.invalidateQueries({ queryKey: ["competitor-sources"] });
                  }}
                >
                  حذف
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>تنظیم دسته و برند (اولویت برند بالاتر از دسته است)</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-end gap-2">
              <Select value={scopeForm.scopeType} onChange={(e) => setScopeForm({ ...scopeForm, scopeType: e.target.value, scopeId: "" })}>
                <option value="category">دسته</option>
                <option value="brand">برند</option>
              </Select>
              <Select value={scopeForm.scopeId} onChange={(e) => setScopeForm({ ...scopeForm, scopeId: e.target.value })}>
                <option value="">انتخاب</option>
                {(scopeForm.scopeType === "brand" ? brandList : categoryList).map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </Select>
              <div>
                <Label>حاشیه هدف</Label>
                <Input value={scopeForm.targetMargin} onChange={(e) => setScopeForm({ ...scopeForm, targetMargin: e.target.value })} />
              </div>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await upsertPricingScope({ ...scopeForm, targetMargin: Number(scopeForm.targetMargin) });
                    toast.success("ذخیره شد");
                    queryClient.invalidateQueries({ queryKey: ["pricing-settings"] });
                  } catch {
                    toast.error("ذخیره ناموفق بود");
                  }
                }}
              >
                ذخیره محدوده
              </Button>
            </div>
            <div className="space-y-2">
              {(data?.scopes || []).map((s) => (
                <div key={s._id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm">
                  <span>
                    {s.scopeType === "brand" ? "برند" : "دسته"} — حاشیه هدف {s.targetMargin ?? "—"} — استراتژی {s.strategy || "—"}
                  </span>
                  <Button size="sm" variant="ghost" onClick={async () => { await deletePricingScope(s._id); queryClient.invalidateQueries({ queryKey: ["pricing-settings"] }); }}>
                    حذف
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Num({ label, value, onChange }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" step="any" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
    </div>
  );
}
