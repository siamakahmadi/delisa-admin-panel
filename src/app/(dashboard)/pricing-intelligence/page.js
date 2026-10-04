"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3, AlertTriangle, BadgeCheck, TrendingDown, Sparkles, Banknote, Users, Calculator, CheckCircle2,
  ArrowLeft, ShieldCheck, Search, Play, Settings2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { useToast } from "@/components/ui/toast";
import { fetchPricingDashboard, enqueuePricingJob, applySafeRecommendations } from "@/lib/pricing-intelligence/api";
import { STATUS_LABELS, MODE_LABELS, JOB_TYPE_LABELS, JOB_STATUS_LABELS, formatPercent } from "@/lib/pricing-intelligence/labels";
import { cn, formatNumber, formatToman, formatRelativeTime } from "@/lib/utils";

const MODE_NOTE = {
  MANUAL: "موتور فقط تحلیل می‌کند؛ هیچ پیشنهادی ساخته یا اعمال نمی‌شود.",
  RECOMMEND: "موتور پیشنهاد می‌دهد، اما هیچ قیمتی بدون تأیید تو عوض نمی‌شود.",
  AUTO: "پیشنهادهای ایمن و پراطمینان (در سقف تعیین‌شده) به‌صورت خودکار اعمال می‌شوند.",
};

function Step({ n, icon: Icon, title, text, done, total, href, cta }) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const complete = total > 0 && done >= total;
  return (
    <div className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold", complete ? "bg-[var(--success-bg)] text-[var(--success)]" : "bg-[var(--brand-50)] text-[var(--brand-700)]")}>
          {complete ? <CheckCircle2 size={16} /> : formatNumber(n)}
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
        <Icon size={15} className="mr-auto text-[var(--text-faint)]" />
      </div>
      <p className="mb-3 flex-1 text-xs leading-6 text-[var(--text-muted)]">{text}</p>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">{formatNumber(done)} از {formatNumber(total)} محصول</span>
        <span className="tabular-nums text-[var(--text-faint)]">{formatNumber(pct)}٪</span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
        <div className={cn("h-full rounded-full", complete ? "bg-[var(--success)]" : "bg-[var(--brand-500)]")} style={{ width: `${pct}%` }} />
      </div>
      <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-600)] hover:underline">
        {cta}<ArrowLeft size={12} />
      </Link>
    </div>
  );
}

function ActionRow({ icon: Icon, title, text, button }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-muted)] text-[var(--text-muted)]"><Icon size={15} /></span>
        <div className="min-w-0">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs leading-5 text-[var(--text-muted)]">{text}</div>
        </div>
      </div>
      {button}
    </div>
  );
}

export default function PricingIntelligencePage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(null); // "analyze" | "refresh" | "safe"

  const { data, isLoading } = useQuery({ queryKey: ["pricing-intelligence-dashboard"], queryFn: fetchPricingDashboard });
  const m = data?.metrics || {};
  const setup = data?.setup || {};
  const attention = data?.attention || [];
  const total = setup.totalPublished || 0;

  const run = useMutation({
    mutationFn: (kind) => {
      if (kind === "safe") return applySafeRecommendations();
      if (kind === "analyze") return enqueuePricingJob({ type: "analyze", all: true });
      return enqueuePricingJob({ type: "refresh", all: true, search: true });
    },
    onSuccess: (_, kind) => {
      toast.success(kind === "safe" ? "پیشنهادهای ایمن اعمال شد" : "در صف قرار گرفت؛ نتیجه در «تاریخچه و جاب‌ها» دیده می‌شود");
      queryClient.invalidateQueries({ queryKey: ["pricing-intelligence-dashboard"] });
      setConfirm(null);
    },
    onError: () => {
      toast.error("انجام نشد");
      setConfirm(null);
    },
  });

  const CONFIRMS = {
    analyze: { title: "تحلیل همه محصولات؟", text: "برای همه محصولات منتشرشده پیشنهاد قیمت ساخته می‌شود. قیمتی تغییر نمی‌کند؛ فقط پیشنهاد می‌سازد.", label: "شروع تحلیل", variant: "primary" },
    refresh: { title: "جستجوی قیمت رقبا برای همه؟", text: "موتور در فروشگاه‌های تعریف‌شده دنبال همه محصولات می‌گردد. ممکن است چند دقیقه طول بکشد و درخواست زیادی به سایت رقبا می‌فرستد.", label: "شروع جستجو", variant: "primary" },
    safe: { title: "اعمال پیشنهادهای ایمن؟", text: "پیشنهادهای پراطمینان و داخل سقف تغییر مجاز، همین حالا روی قیمت واقعی محصولات سایت اعمال می‌شوند.", label: "اعمال روی قیمت‌ها", variant: "danger" },
  };
  const c = confirm ? CONFIRMS[confirm] : null;
  const job = setup.lastJob;
  const jobStatus = job ? JOB_STATUS_LABELS[job.status] : null;

  return (
    <div>
      <PageHeader
        title="قیمت‌گذاری هوشمند"
        subtitle="برای هر محصول، قیمت خرید، قیمت رقبا، فروش و موجودی را می‌سنجد و قیمت فروش مناسب پیشنهاد می‌دهد"
        actions={<Button variant="outline" onClick={() => router.push("/accounting")}>حساب و کتاب</Button>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--success)]"><ShieldCheck size={18} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">
            حالت فعلی: {isLoading ? "…" : MODE_LABELS[setup.mode] || "—"}
          </div>
          <div className="text-xs text-[var(--text-muted)]">{MODE_NOTE[setup.mode] || ""}</div>
        </div>
        <Button size="sm" variant="outline" onClick={() => router.push("/pricing-intelligence/settings")}><Settings2 size={13} />تغییر حالت</Button>
      </div>

      <h3 className="mb-3 text-sm font-semibold">چطور کار می‌کند؟ ۴ مرحله</h3>
      {isLoading ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Step n={1} icon={Banknote} title="قیمت خرید" text="قیمت خرید هر محصول را ثبت کن (در جدول، یا خودکار از «فاکتور خرید» در حساب و کتاب). بدون آن حاشیه سود حساب نمی‌شود." done={setup.withCost || 0} total={total} href="/pricing-intelligence/products" cta="ثبت قیمت خرید" />
          <Step n={2} icon={Users} title="قیمت رقبا" text="در «مقایسه بازار» قیمت رقبا را بنویس، یا در صفحه هر محصول لینک صفحه‌ی رقیب را بگذار تا خودکار خوانده شود." done={setup.withCompetitors || 0} total={total} href="/pricing-intelligence/market" cta="مقایسه بازار" />
          <Step n={3} icon={Calculator} title="تحلیل" text="موتور حاشیه سود، میانه‌ی بازار، فروش ۳۰ روز و موجودی را می‌سنجد و برای هر محصول یک قیمت پیشنهادی با دلیل می‌سازد." done={setup.analyzed || 0} total={total} href="/pricing-intelligence/products" cta="دیدن پیشنهادها" />
          <Step n={4} icon={BadgeCheck} title="تأیید و اعمال" text="پیشنهادها را بررسی کن و تأیید کن؛ فقط بعد از تأیید (یا «اعمال ایمن») قیمت واقعی سایت عوض می‌شود." done={m.applied7d || 0} total={Math.max(setup.analyzed || 0, m.applied7d || 0)} href="/pricing-intelligence/products" cta="بررسی و تأیید" />
        </div>
      )}

      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>اقدام‌های سریع</CardTitle></CardHeader>
          <CardContent className="divide-y divide-[var(--border)] pt-2">
            <ActionRow icon={Play} title="تحلیل همه محصولات" text="پیشنهاد قیمت برای همه محصولات منتشرشده می‌سازد. قیمتی تغییر نمی‌کند." button={<Button size="sm" variant="secondary" onClick={() => setConfirm("analyze")}>تحلیل</Button>} />
            <ActionRow icon={Search} title="جستجوی قیمت رقبا" text="در فروشگاه‌های تعریف‌شده (تنظیمات موتور) دنبال محصولات می‌گردد و قیمت‌ها را به‌روز می‌کند." button={<Button size="sm" variant="secondary" onClick={() => setConfirm("refresh")}>جستجو</Button>} />
            <ActionRow icon={ShieldCheck} title="اعمال پیشنهادهای ایمن" text="فقط پیشنهادهای پراطمینان که داخل سقف تغییر مجاز هستند را همین حالا روی قیمت اعمال می‌کند." button={<Button size="sm" onClick={() => setConfirm("safe")}>اعمال</Button>} />
            <ActionRow icon={BarChart3} title="شبیه‌سازی اثر روی فروش" text="ببین اگر همه پیشنهادها اعمال شوند درآمد و سود ۳۰ روزه چقدر عوض می‌شود — بدون تغییر واقعی." button={<Button size="sm" variant="outline" onClick={() => router.push("/pricing-intelligence/simulate")}>شبیه‌سازی</Button>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>وضعیت سیستم</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-[var(--text-muted)]">فروشگاه‌های رقیب فعال</span><b>{formatNumber(setup.sources || 0)}</b></div>
            {!setup.sources && !isLoading && (
              <p className="rounded-[var(--radius-md)] bg-[var(--warning-bg)] p-2.5 text-xs leading-5 text-[var(--warning)]">
                هنوز فروشگاه رقیبی تعریف نشده؛ جستجوی خودکار کار نمی‌کند. از «تنظیمات موتور» اضافه کن یا لینک مستقیم محصولات را بده.
              </p>
            )}
            <div className="border-t border-[var(--border)] pt-3">
              <div className="mb-1 text-xs text-[var(--text-muted)]">آخرین جاب پس‌زمینه</div>
              {job ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm">{JOB_TYPE_LABELS[job.type] || job.type}</span>
                  <span className="flex items-center gap-2">
                    {jobStatus && <Badge size="sm" variant={jobStatus.variant}>{jobStatus.label}</Badge>}
                    <span className="text-xs text-[var(--text-faint)]">{formatRelativeTime(job.finishedAt || job.startedAt)}</span>
                  </span>
                </div>
              ) : <span className="text-xs text-[var(--text-faint)]">هنوز جابی اجرا نشده</span>}
              {job?.error && <p className="mt-1 text-xs text-[var(--danger)]">{job.error}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Sparkles} label="پیشنهاد در انتظار تأیید" value={formatNumber(m.recommendationsPending)} color="blue" isLoading={isLoading} hint="پیشنهادهایی که منتظر تصمیم تو هستند" />
        <StatCard icon={AlertTriangle} label="نیازمند بررسی دستی" value={formatNumber(m.needReview)} color="amber" isLoading={isLoading} hint="موتور مطمئن نبود؛ خودت نگاه کن" />
        <StatCard icon={TrendingDown} label="زیر حاشیه سود مجاز" value={formatNumber(m.belowTargetMargin)} color="pink" isLoading={isLoading} hint="سود این محصولات کمتر از ۱۵٪ است" />
        <StatCard icon={BarChart3} label="ارزان‌تر از میانه بازار" value={formatNumber(m.belowMarket)} color="violet" isLoading={isLoading} hint="شاید بتوانی گران‌تر بفروشی" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>محصولاتی که نیاز به توجه دارند</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => router.push("/pricing-intelligence/products")}>مشاهده همه</Button>
        </CardHeader>
        <CardContent className="p-0 pt-3">
          {!attention.length && !isLoading ? (
            <p className="px-5 py-8 text-center text-sm leading-6 text-[var(--text-muted)]">
              {setup.analyzed ? "همه چیز مرتب است؛ موردی نیاز به بررسی ندارد." : "هنوز تحلیلی انجام نشده. اول قیمت خرید را ثبت کن، بعد «تحلیل همه محصولات» را بزن."}
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
                    <tr key={row._id} className="cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]" onClick={() => router.push(`/pricing-intelligence/products/${row.product}`)}>
                      <td className="px-5 py-3">{row.productDoc?.productName || "—"}</td>
                      <td className="px-2 py-3 tabular-nums">{formatToman(row.currentPrice)}</td>
                      <td className="px-2 py-3 tabular-nums">{formatToman(row.recommendedPrice)}</td>
                      <td className="px-2 py-3 tabular-nums">{row.confidence != null ? `${formatNumber(row.confidence)}٪` : "—"}</td>
                      <td className="px-5 py-3"><Badge variant={st.variant} size="sm">{st.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && !run.isPending && setConfirm(null)}
        title={c?.title || ""}
        description={c?.text || ""}
        confirmLabel={c?.label}
        variant={c?.variant}
        loading={run.isPending}
        onConfirm={() => run.mutate(confirm)}
      />
    </div>
  );
}
