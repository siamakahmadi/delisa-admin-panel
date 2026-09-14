"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, ChevronDown, History, Gauge } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";
import { fetchSeoOverview, fetchSeoAudits, startSeoAudit, cancelSeoAudit } from "@/lib/seo/api";
import { MODE_LABELS, scoreColor } from "@/lib/seo/constants";
import { AuditProgress } from "@/components/seo/audit-progress";
import { SeoOverview } from "@/components/seo/seo-overview";
import { SeoIssues } from "@/components/seo/seo-issues";
import { SeoPages } from "@/components/seo/seo-pages";
import { SeoSettings } from "@/components/seo/seo-settings";
import { formatDateTime } from "@/lib/utils";

const TABS = ["overview", "issues", "pages", "history", "settings"];

function HistoryTab() {
  const { data, isLoading } = useQuery({ queryKey: ["seo-audits"], queryFn: () => fetchSeoAudits(40) });
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  const STATUS = { done: ["success", "انجام شد"], running: ["info", "در حال اجرا"], failed: ["danger", "خطا"], cancelled: ["neutral", "لغو شد"], queued: ["neutral", "در صف"] };
  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
              <th className="px-5 py-2.5 text-start font-medium">زمان</th>
              <th className="px-2 py-2.5 text-start font-medium">وضعیت</th>
              <th className="px-2 py-2.5 text-start font-medium">حالت</th>
              <th className="px-2 py-2.5 text-start font-medium">نمره</th>
              <th className="px-2 py-2.5 text-start font-medium">صفحات</th>
              <th className="px-2 py-2.5 text-start font-medium">خطا / هشدار</th>
              <th className="px-5 py-2.5 text-start font-medium">مدت</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((a) => (
              <tr key={a._id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-5 py-2.5">{formatDateTime(a.finishedAt || a.startedAt || a.createdAt)}</td>
                <td className="px-2 py-2.5"><Badge variant={STATUS[a.status]?.[0] || "neutral"} size="sm">{STATUS[a.status]?.[1] || a.status}</Badge></td>
                <td className="px-2 py-2.5 text-[var(--text-muted)]">{MODE_LABELS[a.mode]?.split(" ")[0]} · {a.trigger === "scheduled" ? "خودکار" : "دستی"}</td>
                <td className="px-2 py-2.5 font-semibold tabular-nums" style={{ color: scoreColor(a.scores?.overall) }}>{a.scores?.overall != null ? Number(a.scores.overall).toLocaleString("fa-IR") : "—"}</td>
                <td className="px-2 py-2.5 tabular-nums">{Number(a.counts?.pages || 0).toLocaleString("fa-IR")}</td>
                <td className="px-2 py-2.5 tabular-nums"><span className="text-[var(--danger)]">{Number(a.counts?.errors || 0).toLocaleString("fa-IR")}</span> / <span className="text-[var(--warning)]">{Number(a.counts?.warnings || 0).toLocaleString("fa-IR")}</span></td>
                <td className="px-5 py-2.5 text-[var(--text-muted)]">{a.durationMs ? `${Math.round(a.durationMs / 1000).toLocaleString("fa-IR")} ث` : "—"}{a.error && <span className="mr-2 text-[var(--danger)]">{a.error}</span>}</td>
              </tr>
            ))}
            {(data || []).length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-[var(--text-faint)]">هنوز اجرایی ثبت نشده</td></tr>}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function SeoCenter() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const queryClient = useQueryClient();
  // URL منبع حقیقت تب است (لینک‌های هدر/ویجت با ?tab= می‌آیند)
  const tabParam = params.get("tab");
  const tab = TABS.includes(tabParam) ? tabParam : "overview";

  const { data, isLoading } = useQuery({
    queryKey: ["seo-overview"],
    queryFn: fetchSeoOverview,
    refetchInterval: (q) => (q.state.data?.running ? 3000 : false),
  });
  const running = data?.running;
  const audit = data?.audit;

  // وقتی اجرا تمام شد، همه‌ی کش‌ها تازه شوند
  const wasRunningRef = useRef(false);
  useEffect(() => {
    if (running) wasRunningRef.current = true;
    else if (wasRunningRef.current) {
      wasRunningRef.current = false;
      queryClient.invalidateQueries({ queryKey: ["seo-health"] });
      queryClient.invalidateQueries({ queryKey: ["seo-issues"] });
      queryClient.invalidateQueries({ queryKey: ["seo-pages"] });
      queryClient.invalidateQueries({ queryKey: ["seo-audits"] });
      toast.success("ممیزی سئو تمام شد");
    }
  }, [running, queryClient, toast]);

  const start = useMutation({
    mutationFn: (mode) => startSeoAudit(mode),
    onSuccess: (r) => {
      (r.alreadyRunning ? toast.info : toast.success)(r.message);
      queryClient.invalidateQueries({ queryKey: ["seo-overview"] });
      queryClient.invalidateQueries({ queryKey: ["seo-health"] });
    },
    onError: (e) => toast.error("خطا", e?.response?.data?.message || "شروع ممیزی ناموفق بود"),
  });
  const cancel = useMutation({
    mutationFn: cancelSeoAudit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seo-overview"] }),
  });

  const changeTab = (t) => router.replace(`/seo?tab=${t}`, { scroll: false });

  return (
    <div>
      <PageHeader
        title="مرکز سئو"
        subtitle="ممیزی سراسری محصولات، بلاگ، دسته‌ها، برندها و صفحات سایت — محتوا، فنی، لینک‌دهی و داده‌ی ساختاریافته"
        actions={
          <div className="flex items-center gap-2">
            {data?.settings?.lastRunAt && !running && <span className="hidden text-[11px] text-[var(--text-faint)] sm:inline">آخرین اجرا: {formatDateTime(data.settings.lastRunAt)}</span>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button loading={start.isPending} disabled={!!running}>
                  <Play size={15} />
                  اجرای ممیزی
                  <ChevronDown size={13} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[16rem]">
                {Object.entries(MODE_LABELS).map(([k, v]) => (
                  <DropdownMenuItem key={k} onSelect={() => start.mutate(k)}>{v}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {running && (
        <div className="mb-5">
          <AuditProgress running={running} onCancel={() => cancel.mutate()} cancelling={cancel.isPending} />
        </div>
      )}

      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="issues">
            مشکلات
            {audit?.counts?.errors > 0 && <span className="mr-1.5 rounded-full bg-[var(--danger)] px-1.5 text-[10px] text-white">{Number(audit.counts.errors).toLocaleString("fa-IR")}</span>}
          </TabsTrigger>
          <TabsTrigger value="pages">صفحات</TabsTrigger>
          <TabsTrigger value="history">تاریخچه</TabsTrigger>
          <TabsTrigger value="settings">تنظیمات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : !audit ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-600)]">
                  <Gauge size={26} />
                </div>
                <p className="text-sm font-semibold text-[var(--text)]">هنوز ممیزی‌ای اجرا نشده</p>
                <p className="max-w-md text-xs text-[var(--text-muted)]">
                  ممیزی کامل، همه‌ی محصولات، مقالات، دسته‌ها، برندها و صفحات ثابت را از دیتابیس تحلیل می‌کند و صفحات سایت را زنده می‌خزد (title، canonical، H1، JSON-LD، لینک شکسته، سرعت…).
                </p>
                <Button onClick={() => start.mutate("full")} loading={start.isPending} disabled={!!running}>
                  <Play size={15} />
                  اجرای ممیزی کامل
                </Button>
              </CardContent>
            </Card>
          ) : (
            <SeoOverview audit={audit} trend={data?.trend || []} onOpenIssues={() => changeTab("issues")} />
          )}
        </TabsContent>

        <TabsContent value="issues">
          {audit ? <SeoIssues auditId={audit._id} initialCheck={params.get("check")} mutedChecks={data?.settings?.mutedChecks || []} /> : <p className="text-sm text-[var(--text-muted)]">ابتدا یک ممیزی اجرا کنید.</p>}
        </TabsContent>

        <TabsContent value="pages">
          {audit ? <SeoPages auditId={audit._id} initialType={params.get("type") || ""} /> : <p className="text-sm text-[var(--text-muted)]">ابتدا یک ممیزی اجرا کنید.</p>}
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>

        <TabsContent value="settings">
          <SeoSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SeoCenterPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <SeoCenter />
    </Suspense>
  );
}
