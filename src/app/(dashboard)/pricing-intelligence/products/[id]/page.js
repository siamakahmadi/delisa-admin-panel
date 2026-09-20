"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { MarketBars } from "@/components/pricing-intelligence/market-bars";
import {
  analyzePricingProduct,
  applyRecommendation,
  approveRecommendation,
  deleteCompetitorObservation,
  fetchPricingProduct,
  ingestCompetitorUrls,
  rejectRecommendation,
  refreshProductCompetitors,
  updateProductPricingConfig,
} from "@/lib/pricing-intelligence/api";
import { STATUS_LABELS, STRATEGY_LABELS, MODE_LABELS, formatPercent } from "@/lib/pricing-intelligence/labels";
import { formatToman, formatDateTime } from "@/lib/utils";

const textareaClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]";

export default function PricingProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [whyOpen, setWhyOpen] = useState(false);
  const [overridePrice, setOverridePrice] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [urlText, setUrlText] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["pricing-intelligence-product", id],
    queryFn: () => fetchPricingProduct(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (!data) return;
    const next = data.config?.productCfg?.purchaseCost ?? data.analysis?.purchaseCost ?? "";
    setPurchaseCost(next === 0 ? "" : next);
  }, [data]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["pricing-intelligence-product", id] });

  const analyzeMut = useMutation({
    mutationFn: () => analyzePricingProduct(id),
    onSuccess: () => { toast.success("تحلیل ذخیره شد"); invalidate(); },
    onError: () => toast.error("تحلیل ناموفق بود"),
  });
  const refreshMut = useMutation({
    mutationFn: () => refreshProductCompetitors(id, { search: true }),
    onSuccess: (res) => {
      toast.success(`جستجوی کلی: ${res.summary?.stored || 0} رقیب پیدا شد`);
      invalidate();
    },
    onError: () => toast.error("جستجوی فروشگاه‌ها ناموفق بود"),
  });
  const ingestMut = useMutation({
    mutationFn: () => ingestCompetitorUrls(id, { urls: urlText, analyze: true }),
    onSuccess: (res) => {
      const s = res.summary || {};
      if (s.stored) toast.success(`${s.stored} لینک تحلیل شد`);
      if (s.failed) toast.error(`${s.failed} لینک قیمت نداد`);
      if (!s.stored && !s.failed) toast.error("لینک معتبری پیدا نشد");
      setUrlText("");
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.error === "urls_required" ? "حداقل یک لینک محصول بگذارید" : "تحلیل لینک‌ها ناموفق بود"),
  });
  const costMut = useMutation({
    mutationFn: () => updateProductPricingConfig(id, { purchaseCost: purchaseCost === "" ? null : Number(purchaseCost) }),
    onSuccess: () => { toast.success("قیمت خرید ذخیره شد"); invalidate(); },
    onError: () => toast.error("ذخیره قیمت خرید ناموفق بود"),
  });
  const applyMut = useMutation({
    mutationFn: () =>
      applyRecommendation(data.latestRecommendation._id, {
        overridePrice: overridePrice || undefined,
        overrideReason,
      }),
    onSuccess: () => { toast.success("قیمت اعمال شد"); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.error || "اعمال ناموفق بود"),
  });
  const approveMut = useMutation({
    mutationFn: () => approveRecommendation(data.latestRecommendation._id, { overridePrice: overridePrice || undefined, overrideReason }),
    onSuccess: () => { toast.success("تأیید شد"); invalidate(); },
    onError: () => toast.error("تأیید ناموفق بود"),
  });
  const rejectMut = useMutation({
    mutationFn: () => rejectRecommendation(data.latestRecommendation._id, { reason: overrideReason }),
    onSuccess: () => { toast.success("رد شد"); invalidate(); },
    onError: () => toast.error("رد ناموفق بود"),
  });
  const configMut = useMutation({
    mutationFn: (payload) => updateProductPricingConfig(id, payload),
    onSuccess: () => { toast.success("تنظیم محصول ذخیره شد"); invalidate(); },
    onError: () => toast.error("ذخیره ناموفق بود"),
  });
  const deleteMut = useMutation({
    mutationFn: (observationId) => deleteCompetitorObservation(id, observationId),
    onSuccess: () => { toast.success("حذف شد"); invalidate(); },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  if (isLoading || !data) {
    return <p className="text-sm text-[var(--text-muted)]">در حال بارگذاری…</p>;
  }

  const a = data.analysis || {};
  const rec = data.latestRecommendation;
  const cfg = data.config?.productCfg || {};
  const st = STATUS_LABELS[a.status] || STATUS_LABELS.PENDING;
  const costHint =
    a.purchaseCostSource === "vendor"
      ? "فعلاً از کمترین قیمت فروشنده استفاده می‌شود. برای دقت، قیمت خرید خودتان را ذخیره کنید."
      : a.purchaseCostSource === "missing"
        ? "بدون قیمت خرید حاشیه سود محاسبه نمی‌شود."
        : "قیمت خرید ثبت‌شده برای این محصول.";

  return (
    <div>
      <PageHeader
        title={a.product?.productName || "جزئیات قیمت"}
        subtitle="قیمت خرید را بگذارید، لینک صفحه محصول رقبا را بچسبانید، بعد تحلیل کنید"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => router.push("/pricing-intelligence/products")}>بازگشت</Button>
            <Button loading={analyzeMut.isPending} onClick={() => analyzeMut.mutate()}>تحلیل دوباره</Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant={st.variant}>{st.label}</Badge>
        <Badge variant="neutral">اعتماد {a.confidence ?? "—"} / ۱۰۰ ({a.confidenceBand})</Badge>
        <Badge variant="brand">{STRATEGY_LABELS[a.strategy] || a.strategy}</Badge>
        <Badge variant="info">{MODE_LABELS[a.resolvedConfig?.mode] || a.resolvedConfig?.mode}</Badge>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>۱. قیمت خرید</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--text-muted)]">{costHint}</p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[180px] flex-1">
                <Label>قیمت خرید (تومان)</Label>
                <Input
                  inputMode="numeric"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value)}
                  placeholder="مثلاً 890000"
                />
              </div>
              <Button loading={costMut.isPending} onClick={() => costMut.mutate()}>ذخیره قیمت خرید</Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
              <span>هزینه مؤثر: {formatToman(a.effectiveCost)}</span>
              <span>حاشیه فعلی: {formatPercent(a.currentMargin)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>۲. لینک صفحه محصول رقبا</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--text-muted)]">
              لینک مستقیم همان محصول در فروشگاه‌های دیگر را بگذارید (هر خط یک لینک). سیستم قیمت را از صفحه می‌خواند و تحلیل می‌کند.
            </p>
            <textarea
              dir="ltr"
              rows={4}
              className={textareaClass}
              placeholder={"https://shop1.ir/product/...\nhttps://shop2.com/p/..."}
              value={urlText}
              onChange={(e) => setUrlText(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button loading={ingestMut.isPending} onClick={() => ingestMut.mutate()} disabled={!urlText.trim()}>
                خواندن لینک‌ها و تحلیل
              </Button>
              <Button variant="outline" loading={refreshMut.isPending} onClick={() => refreshMut.mutate()}>
                جستجوی کلی در فروشگاه‌ها
              </Button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              جستجوی کلی فقط وقتی کار می‌کند که در تنظیمات، فروشگاه رقیب ثبت شده باشد. برای دقت، لینک صفحه محصول بدهید.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>خلاصه قیمت</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="قیمت فعلی" value={formatToman(a.currentPrice)} />
            <Row label="قیمت پیشنهادی" value={formatToman(a.recommendedPrice)} />
            <Row label="قیمت خرید" value={formatToman(a.purchaseCost)} />
            <Row label="هزینه مؤثر" value={formatToman(a.effectiveCost)} />
            <Row label="حاشیه فعلی" value={formatPercent(a.currentMargin)} />
            <Row label="حاشیه پیشنهادی" value={formatPercent(a.expectedMargin)} />
            <Button className="mt-3 w-full" variant="outline" onClick={() => setWhyOpen(true)}>چرا این قیمت؟</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>بازار</CardTitle></CardHeader>
          <CardContent>
            <MarketBars
              current={a.currentPrice}
              recommended={a.recommendedPrice}
              lowest={a.market?.lowestPrice}
              median={a.market?.medianPrice}
              highest={a.market?.highestPrice}
            />
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              رقبا: {a.market?.validCompetitorCount ?? 0} معتبر از {a.market?.competitorCount ?? 0}
              {a.market?.averagePrice ? ` — میانگین ${formatToman(a.market.averagePrice)}` : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>فروش و موجودی</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="فروش ۳۰ روز" value={Number(a.sales?.sales30d || 0).toLocaleString("fa-IR")} />
            <Row label="بازدید" value={Number(a.sales?.views || 0).toLocaleString("fa-IR")} />
            <Row label="موجودی" value={Number(a.inventory?.currentStock || 0).toLocaleString("fa-IR")} />
            <Row label="روز موجودی" value={Number(a.inventory?.daysOfInventory || 0).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} />
          </CardContent>
        </Card>
      </div>

      {rec && rec.status !== "APPLIED" && rec.status !== "REJECTED" && rec.status !== "BLOCKED" && (
        <Card className="mb-6">
          <CardHeader><CardTitle>تأیید و اعمال</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div>
              <Label>قیمت نهایی ادمین (اختیاری)</Label>
              <Input value={overridePrice} onChange={(e) => setOverridePrice(e.target.value)} placeholder={String(a.recommendedPrice || "")} />
            </div>
            <div className="min-w-[200px] flex-1">
              <Label>دلیل</Label>
              <Input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
            </div>
            <Button variant="secondary" loading={approveMut.isPending} onClick={() => approveMut.mutate()}>تأیید</Button>
            <Button variant="outline" loading={rejectMut.isPending} onClick={() => rejectMut.mutate()}>رد</Button>
            <Button loading={applyMut.isPending} onClick={() => applyMut.mutate()}>اعمال قیمت</Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader><CardTitle>رقبای این محصول</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[var(--text-muted)]">
                  <th className="py-2 text-start">فروشگاه</th>
                  <th className="py-2 text-start">قیمت</th>
                  <th className="py-2 text-start">موجودی</th>
                  <th className="py-2 text-start">کیفیت</th>
                  <th className="py-2 text-start">خطا</th>
                  <th className="py-2 text-start"></th>
                </tr>
              </thead>
              <tbody>
                {(a.competitors || []).map((c) => (
                  <tr key={c._id} className="border-t border-[var(--border)]">
                    <td className="py-2">
                      <div>{c.competitor || "—"}</div>
                      {c.productTitle && <div className="text-[var(--text-muted)]">{c.productTitle}</div>}
                      {c.productUrl && (
                        <a className="text-[var(--brand-600)]" href={c.productUrl} target="_blank" rel="noreferrer">لینک</a>
                      )}
                    </td>
                    <td className="py-2">{c.price ? formatToman(c.price) : "—"}</td>
                    <td className="py-2">{c.availability}</td>
                    <td className="py-2">{c.quality} / تطابق {c.matchingConfidence}</td>
                    <td className="py-2 text-[var(--danger)]">{c.error || ""}</td>
                    <td className="py-2">
                      <Button size="sm" variant="ghost" onClick={() => deleteMut.mutate(c._id)}>حذف</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!(a.competitors || []).length && (
              <p className="py-4 text-sm text-[var(--text-muted)]">هنوز رقیبی نیست. لینک صفحه محصول رقبا را بالا بچسبانید.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <Button variant="ghost" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? "بستن تنظیمات پیشرفته" : "تنظیمات پیشرفته این محصول"}
        </Button>
      </div>

      {showAdvanced && (
        <Card className="mb-6">
          <CardHeader><CardTitle>استراتژی، حاشیه و محدودیت</CardTitle></CardHeader>
          <CardContent>
            <ProductConfigForm cfg={cfg} onSave={(payload) => configMut.mutate(payload)} loading={configMut.isPending} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>تاریخچه قیمت</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                <th className="px-5 py-2 text-start">زمان</th>
                <th className="px-2 py-2 text-start">قدیم</th>
                <th className="px-2 py-2 text-start">جدید</th>
                <th className="px-5 py-2 text-start">منبع</th>
              </tr>
            </thead>
            <tbody>
              {(data.history || []).map((h) => (
                <tr key={h._id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-5 py-2">{formatDateTime(h.createdAt)}</td>
                  <td className="px-2 py-2">{formatToman(h.oldValue)}</td>
                  <td className="px-2 py-2">{formatToman(h.newValue)}</td>
                  <td className="px-5 py-2">{h.changedBy} — {h.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={whyOpen} onOpenChange={setWhyOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle>چرا این قیمت؟</DialogTitle>
          <div className="mt-3 max-h-[60vh] space-y-3 overflow-auto text-sm">
            <Section title="هزینه و سود">
              <p>خرید: {formatToman(a.purchaseCost)}</p>
              <p>هزینه مؤثر: {formatToman(a.effectiveCost)}</p>
              <p>حاشیه هدف: {formatPercent(a.resolvedConfig?.targetMargin)}</p>
            </Section>
            <Section title="بازار">
              <p>میانه: {a.market?.medianPrice ? formatToman(a.market.medianPrice) : "داده بازار نیست"}</p>
              <p>رقبای معتبر: {a.market?.validCompetitorCount ?? 0}</p>
            </Section>
            {(a.reasons || []).map((r, i) => (
              <div key={i} className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3">
                <div className="mb-1 text-[11px] text-[var(--text-muted)]">{r.type}</div>
                {r.message}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
      <div className="mb-2 text-xs font-semibold">{title}</div>
      <div className="space-y-1 text-[var(--text-muted)]">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </div>
  );
}

function ProductConfigForm({ cfg, onSave, loading }) {
  const [form, setForm] = useState({
    barcode: cfg.barcode || "",
    sku: cfg.sku || "",
    size: cfg.size || "",
    variant: cfg.variant || "",
    minMargin: cfg.minMargin ?? "",
    targetMargin: cfg.targetMargin ?? "",
    idealMargin: cfg.idealMargin ?? "",
    minPrice: cfg.minPrice ?? "",
    maxPrice: cfg.maxPrice ?? "",
    competitivePosition: cfg.competitivePosition ?? "",
    strategy: cfg.strategy || "",
    mode: cfg.mode || "",
    autoPricingEnabled: !!cfg.autoPricingEnabled,
  });

  const num = (v) => (v === "" || v == null ? null : Number(v));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="بارکد" value={form.barcode} onChange={(v) => setForm({ ...form, barcode: v })} />
      <Field label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} />
      <Field label="سایز" value={form.size} onChange={(v) => setForm({ ...form, size: v })} />
      <Field label="حداقل حاشیه (۰.۱۵)" value={form.minMargin} onChange={(v) => setForm({ ...form, minMargin: v })} />
      <Field label="حاشیه هدف (۰.۲۲)" value={form.targetMargin} onChange={(v) => setForm({ ...form, targetMargin: v })} />
      <Field label="حداقل قیمت" value={form.minPrice} onChange={(v) => setForm({ ...form, minPrice: v })} />
      <Field label="حداکثر قیمت" value={form.maxPrice} onChange={(v) => setForm({ ...form, maxPrice: v })} />
      <div>
        <Label>استراتژی</Label>
        <Select value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })}>
          <option value="">از تنظیم بالاتر</option>
          {Object.entries(STRATEGY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </div>
      <div>
        <Label>حالت</Label>
        <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
          <option value="">از تنظیم بالاتر</option>
          {Object.entries(MODE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" checked={form.autoPricingEnabled} onChange={(e) => setForm({ ...form, autoPricingEnabled: e.target.checked })} />
        اعمال خودکار برای این محصول
      </label>
      <Button
        className="sm:col-span-2"
        loading={loading}
        onClick={() =>
          onSave({
            ...form,
            minMargin: num(form.minMargin),
            targetMargin: num(form.targetMargin),
            idealMargin: num(form.idealMargin),
            minPrice: num(form.minPrice),
            maxPrice: num(form.maxPrice),
            competitivePosition: num(form.competitivePosition),
            strategy: form.strategy || null,
            mode: form.mode || null,
          })
        }
      >
        ذخیره تنظیم محصول
      </Button>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
