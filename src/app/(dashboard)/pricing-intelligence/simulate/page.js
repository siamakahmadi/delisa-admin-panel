"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, Minus, Play } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { simulatePricing } from "@/lib/pricing-intelligence/api";
import { STATUS_LABELS, formatPercent } from "@/lib/pricing-intelligence/labels";
import { cn, formatNumber, formatToman } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

function Compare({ label, before, after, money = true }) {
  const diff = (after || 0) - (before || 0);
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-4">
      <div className="mb-2 text-xs text-[var(--text-muted)]">{label}</div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-[var(--text-muted)] tabular-nums">{money ? formatToman(before) : formatPercent(before)}</span>
        <span className="text-[var(--text-faint)]">←</span>
        <span className="text-base font-bold tabular-nums">{money ? formatToman(after) : formatPercent(after)}</span>
      </div>
      {money && (
        <div className={cn("mt-1.5 text-xs tabular-nums", diff > 0 ? "text-[var(--success)]" : diff < 0 ? "text-[var(--danger)]" : "text-[var(--text-faint)]")}>
          {diff > 0 ? "+" : diff < 0 ? "−" : ""}{formatToman(Math.abs(diff))}
        </div>
      )}
    </div>
  );
}

export default function PricingSimulatePage() {
  const toast = useToast();
  const [result, setResult] = useState(null);
  const mutation = useMutation({
    mutationFn: () => simulatePricing({}),
    onSuccess: (data) => {
      setResult(data);
      toast.success("شبیه‌سازی انجام شد — هیچ قیمتی تغییر نکرد");
    },
    onError: () => toast.error("شبیه‌سازی ناموفق بود"),
  });
  const summary = result?.summary;
  const sample = result?.sample || [];

  return (
    <div>
      <PageHeader
        title="شبیه‌سازی قیمت"
        subtitle="ببین اگر پیشنهادهای موتور اعمال شوند، سود و درآمد ۳۰ روزه چه می‌شود"
        actions={
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            <Play size={15} />{summary ? "اجرای دوباره" : "اجرای شبیه‌سازی"}
          </Button>
        }
      />
      <p className="mb-4 rounded-[var(--radius-md)] bg-[var(--info-bg)] px-4 py-3 text-sm leading-6 text-[var(--info)]">
        شبیه‌سازی تا ۵۰۰ محصول منتشرشده را تحلیل می‌کند و فرض می‌گیرد تعداد فروش ۳۰ روز گذشته با قیمت جدید هم تکرار شود. این فقط یک تخمین است و هیچ قیمت واقعی عوض نمی‌شود. ممکن است ۱ تا ۲ دقیقه طول بکشد.
      </p>

      {mutation.isPending && <p className="mb-4 text-sm text-[var(--text-muted)]">در حال تحلیل محصولات… کمی صبر کن.</p>}

      {summary ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={BarChart3} label="محصول تحلیل‌شده" value={formatNumber(summary.analyzed)} color="violet" />
            <StatCard icon={TrendingUp} label="پیشنهاد افزایش قیمت" value={formatNumber(summary.increasing)} color="teal" />
            <StatCard icon={TrendingDown} label="پیشنهاد کاهش قیمت" value={formatNumber(summary.decreasing)} color="pink" />
            <StatCard icon={Minus} label="بدون تغییر" value={formatNumber(summary.unchanged)} color="blue" hint={summary.needingReview ? `${formatNumber(summary.needingReview)} مورد نیاز به بررسی دستی` : undefined} />
          </div>

          <Card className="mb-6">
            <CardHeader><CardTitle>اثر تخمینی روی ۳۰ روز فروش</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Compare label="درآمد" before={summary.currentRevenue} after={summary.estimatedRevenue} />
              <Compare label="سود ناخالص" before={summary.currentGrossProfit} after={summary.estimatedGrossProfit} />
              <Compare label="میانگین حاشیه سود" before={summary.averageMarginBefore} after={summary.averageMarginAfter} money={false} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>نمونه محصولات ({formatNumber(sample.length)} مورد اول)</CardTitle></CardHeader>
            <CardContent className="p-0 pt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                      <th className="px-5 py-2 text-start font-medium">محصول</th>
                      <th className="px-2 py-2 text-start font-medium">قیمت فعلی</th>
                      <th className="px-2 py-2 text-start font-medium">پیشنهادی</th>
                      <th className="px-2 py-2 text-start font-medium">تغییر</th>
                      <th className="px-5 py-2 text-start font-medium">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sample.map((r) => {
                      const diff = (r.recommendedPrice || 0) - (r.currentPrice || 0);
                      const pct = r.currentPrice ? (diff / r.currentPrice) * 100 : 0;
                      const st = STATUS_LABELS[r.status] || { label: r.status, variant: "neutral" };
                      return (
                        <tr key={r.productId} className="border-b border-[var(--border)] last:border-0">
                          <td className="px-5 py-2.5">{r.name}</td>
                          <td className="px-2 py-2.5 tabular-nums">{formatToman(r.currentPrice)}</td>
                          <td className="px-2 py-2.5 tabular-nums">{formatToman(r.recommendedPrice)}</td>
                          <td className={cn("px-2 py-2.5 tabular-nums", diff > 0 ? "text-[var(--success)]" : diff < 0 ? "text-[var(--danger)]" : "text-[var(--text-faint)]")}>
                            {diff === 0 ? "—" : `${diff > 0 ? "+" : "−"}${formatNumber(Math.round(Math.abs(pct) * 10) / 10)}٪`}
                          </td>
                          <td className="px-5 py-2.5"><Badge size="sm" variant={st.variant}>{st.label}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        !mutation.isPending && (
          <Card>
            <CardContent className="py-10 text-center">
              <AlertTriangle size={30} className="mx-auto mb-3 text-[var(--text-faint)]" />
              <p className="text-sm text-[var(--text-muted)]">برای دیدن اثر پیشنهادها روی سود و درآمد، «اجرای شبیه‌سازی» را بزن.</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
