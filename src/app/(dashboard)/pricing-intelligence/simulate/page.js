"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarChart3, TrendingUp, AlertTriangle, Minus } from "lucide-react";
import { simulatePricing } from "@/lib/pricing-intelligence/api";
import { formatPercent } from "@/lib/pricing-intelligence/labels";
import { formatToman } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function PricingSimulatePage() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [sample, setSample] = useState([]);
  const mutation = useMutation({
    mutationFn: () => simulatePricing({}),
    onSuccess: (data) => {
      setSummary(data.summary);
      setSample(data.sample || []);
      toast.success("شبیه‌سازی انجام شد — هیچ قیمتی تغییر نکرد");
    },
    onError: () => toast.error("شبیه‌سازی ناموفق بود"),
  });

  return (
    <div>
      <PageHeader
        title="شبیه‌سازی قیمت"
        subtitle="تا ۵۰۰ محصول منتشرشده تحلیل می‌شود. قیمت واقعی تغییر نمی‌کند."
        actions={
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            اجرای شبیه‌سازی
          </Button>
        }
      />

      {summary && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={BarChart3} label="تحلیل‌شده" value={Number(summary.analyzed || 0).toLocaleString("fa-IR")} color="violet" />
            <StatCard icon={TrendingUp} label="افزایش" value={Number(summary.increasing || 0).toLocaleString("fa-IR")} color="teal" />
            <StatCard icon={Minus} label="بدون تغییر" value={Number(summary.unchanged || 0).toLocaleString("fa-IR")} color="blue" />
            <StatCard icon={AlertTriangle} label="نیاز به بررسی" value={Number(summary.needingReview || 0).toLocaleString("fa-IR")} color="amber" />
          </div>
          <Card className="mb-6">
            <CardHeader><CardTitle>اثر تخمینی روی فروش ۳۰ روزه</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <p>درآمد فعلی: {formatToman(summary.currentRevenue)}</p>
              <p>درآمد تخمینی: {formatToman(summary.estimatedRevenue)}</p>
              <p>سود ناخالص فعلی: {formatToman(summary.currentGrossProfit)}</p>
              <p>سود ناخالص تخمینی: {formatToman(summary.estimatedGrossProfit)}</p>
              <p>میانگین حاشیه قبل: {formatPercent(summary.averageMarginBefore)}</p>
              <p>میانگین حاشیه بعد: {formatPercent(summary.averageMarginAfter)}</p>
              <p>کاهش قیمت: {Number(summary.decreasing || 0).toLocaleString("fa-IR")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>نمونه محصولات</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                    <th className="px-5 py-2 text-start">محصول</th>
                    <th className="px-2 py-2 text-start">فعلی</th>
                    <th className="px-2 py-2 text-start">پیشنهادی</th>
                    <th className="px-5 py-2 text-start">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {sample.map((r) => (
                    <tr key={r.productId} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-5 py-2">{r.name}</td>
                      <td className="px-2 py-2">{formatToman(r.currentPrice)}</td>
                      <td className="px-2 py-2">{formatToman(r.recommendedPrice)}</td>
                      <td className="px-5 py-2">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      {!summary && (
        <p className="text-sm text-[var(--text-muted)]">برای دیدن اثر پیشنهادها روی حاشیه و درآمد، شبیه‌سازی را اجرا کنید.</p>
      )}
    </div>
  );
}
