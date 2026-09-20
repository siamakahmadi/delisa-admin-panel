"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  AlertTriangle,
  BadgeCheck,
  Search,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { fetchPricingDashboard, enqueuePricingJob, applySafeRecommendations } from "@/lib/pricing-intelligence/api";
import { STATUS_LABELS, formatPercent } from "@/lib/pricing-intelligence/labels";
import { formatToman } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function PricingIntelligencePage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["pricing-intelligence-dashboard"],
    queryFn: fetchPricingDashboard,
  });
  const enqueue = useMutation({
    mutationFn: enqueuePricingJob,
    onSuccess: () => toast.success("جاب در صف قرار گرفت"),
    onError: () => toast.error("صف‌بندی جاب ناموفق بود"),
  });
  const applySafe = useMutation({
    mutationFn: applySafeRecommendations,
    onSuccess: () => {
      toast.success("پیشنهادهای ایمن اعمال شد");
      queryClient.invalidateQueries({ queryKey: ["pricing-intelligence-dashboard"] });
    },
    onError: () => toast.error("اعمال ایمن ناموفق بود"),
  });
  const m = data?.metrics || {};
  const attention = data?.attention || [];

  return (
    <div>
      <PageHeader
        title="قیمت‌گذاری هوشمند"
        subtitle="قیمت خرید را ثبت کنید، لینک صفحه محصول رقبا را بدهید یا فروشگاه‌ها را برای جستجوی کلی اضافه کنید"
        actions={
          <>
            <Button variant="outline" loading={enqueue.isPending} onClick={() => enqueue.mutate({ type: "analyze", all: true })}>
              تحلیل همه
            </Button>
            <Button variant="outline" loading={enqueue.isPending} onClick={() => enqueue.mutate({ type: "refresh", all: true, search: true })}>
              جستجوی رقبا (همه)
            </Button>
            <Button variant="secondary" loading={applySafe.isPending} onClick={() => applySafe.mutate()}>
              اعمال پیشنهادهای ایمن
            </Button>
            <Button variant="secondary" onClick={() => router.push("/pricing-intelligence/simulate")}>
              شبیه‌سازی
            </Button>
            <Button variant="secondary" onClick={() => router.push("/pricing-intelligence/market")}>
              مقایسه بازار
            </Button>
            <Button onClick={() => router.push("/pricing-intelligence/products")}>جدول محصولات</Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Search} label="محصولات تحلیل‌شده" value={Number(m.productsAnalyzed || 0).toLocaleString("fa-IR")} color="violet" isLoading={isLoading} />
        <StatCard icon={Sparkles} label="پیشنهاد در انتظار" value={Number(m.recommendationsPending || 0).toLocaleString("fa-IR")} color="blue" isLoading={isLoading} />
        <StatCard icon={AlertTriangle} label="نیاز به بررسی" value={Number(m.needReview || 0).toLocaleString("fa-IR")} color="amber" isLoading={isLoading} />
        <StatCard icon={BadgeCheck} label="اعمال ۷ روز" value={Number(m.applied7d || 0).toLocaleString("fa-IR")} color="teal" isLoading={isLoading} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={TrendingDown} label="زیر حاشیه هدف" value={Number(m.belowTargetMargin || 0).toLocaleString("fa-IR")} color="pink" isLoading={isLoading} />
        <StatCard icon={BarChart3} label="زیر میانه بازار" value={Number(m.belowMarket || 0).toLocaleString("fa-IR")} color="blue" isLoading={isLoading} />
        <StatCard icon={AlertTriangle} label="اعتماد پایین" value={Number(m.lowConfidence || 0).toLocaleString("fa-IR")} color="amber" isLoading={isLoading} />
        <StatCard
          icon={BadgeCheck}
          label="میانگین حاشیه"
          value={formatPercent(m.averageMargin)}
          color="violet"
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>موارد نیازمند توجه</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => router.push("/pricing-intelligence/products")}>
            مشاهده همه
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {!attention.length && !isLoading ? (
            <p className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
              هنوز پیشنهادی ثبت نشده. از جدول محصولات تحلیل را شروع کنید.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                  <th className="px-5 py-2.5 text-start font-medium">محصول</th>
                  <th className="px-2 py-2.5 text-start font-medium">قیمت فعلی</th>
                  <th className="px-2 py-2.5 text-start font-medium">پیشنهادی</th>
                  <th className="px-2 py-2.5 text-start font-medium">اعتماد</th>
                  <th className="px-5 py-2.5 text-start font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {attention.map((row) => {
                  const st = STATUS_LABELS[row.status] || STATUS_LABELS.PENDING;
                  return (
                    <tr
                      key={row._id}
                      className="cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]"
                      onClick={() => router.push(`/pricing-intelligence/products/${row.product}`)}
                    >
                      <td className="px-5 py-3">{row.productDoc?.productName || "—"}</td>
                      <td className="px-2 py-3 tabular-nums">{formatToman(row.currentPrice)}</td>
                      <td className="px-2 py-3 tabular-nums">{formatToman(row.recommendedPrice)}</td>
                      <td className="px-2 py-3 tabular-nums">{row.confidence ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge variant={st.variant} size="sm">
                          {st.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
