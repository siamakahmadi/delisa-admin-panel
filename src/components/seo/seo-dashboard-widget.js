"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Gauge, ChevronLeft, Loader2, Play, Wrench } from "lucide-react";
import { fetchSeoHealth } from "@/lib/seo/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, ENTITY_LABELS, SEVERITY, scoreColor, PHASE_LABELS } from "@/lib/seo/constants";
import { ScoreRing } from "./score-ring";
import { TrafficDot } from "./severity-icon";
import { formatDateTime } from "@/lib/utils";

const BREAKDOWN = ["meta", "content", "keyword", "links", "images", "technical", "indexing", "structured", "social", "performance"];

/** ویجت داشبورد: نمره‌ی کلی + تفکیک دسته‌ها + مهم‌ترین مشکلات */
export function SeoDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["seo-health"],
    queryFn: fetchSeoHealth,
    refetchInterval: (q) => (q.state.data?.running ? 5000 : 90_000),
    staleTime: 30_000,
  });

  const score = data?.score ?? null;
  const scores = data?.scores || {};
  const running = data?.running;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge size={16} className="text-[var(--brand-500)]" />
          سلامت سئوی سایت
        </CardTitle>
        <Link href="/seo" className="flex items-center gap-1 text-xs font-medium text-[var(--brand-600)] hover:underline">
          مرکز سئو
          <ChevronLeft size={13} />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex gap-6">
            <Skeleton className="h-28 w-28 rounded-full" />
            <div className="flex-1 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ) : !data?.hasAudit && !running ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">هنوز هیچ ممیزی سئویی اجرا نشده است.</p>
            <Link href="/seo">
              <Button size="sm">
                <Play size={14} />
                اجرای اولین ممیزی
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr_1fr]">
            <div className="flex flex-col items-center gap-2">
              <ScoreRing score={score} size={128} stroke={10} />
              {running ? (
                <p className="flex items-center gap-1.5 text-xs text-[var(--brand-600)]">
                  <Loader2 size={12} className="animate-spin" />
                  {PHASE_LABELS[running.progress?.phase] || "در حال ممیزی"}
                </p>
              ) : (
                <p className="text-[11px] text-[var(--text-faint)]">آخرین ممیزی: {formatDateTime(data.finishedAt)}</p>
              )}
              <div className="flex gap-3 text-[11px]">
                <span className="text-[var(--danger)]">{(data?.counts?.errors ?? 0).toLocaleString("fa-IR")} خطا</span>
                <span className="text-[var(--warning)]">{(data?.counts?.warnings ?? 0).toLocaleString("fa-IR")} هشدار</span>
                <span className="text-[var(--info)]">{(data?.counts?.notices ?? 0).toLocaleString("fa-IR")} پیشنهاد</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--text-muted)]">تفکیک نمره</p>
              {BREAKDOWN.filter((k) => scores[k] != null).map((k) => (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="w-28 shrink-0 truncate text-[var(--text-muted)]">{CATEGORY_LABELS[k]}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${scores[k]}%`, background: scoreColor(scores[k]) }} />
                  </div>
                  <span className="w-7 text-end font-semibold tabular-nums" style={{ color: scoreColor(scores[k]) }}>
                    {Number(scores[k]).toLocaleString("fa-IR")}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">مهم‌ترین موارد برای رفع</p>
              <ul className="space-y-1">
                {(data?.topIssues || []).slice(0, 6).map((g) => {
                  const sample = g.samples?.[0];
                  const href = g.count === 1 && sample?.editUrl ? sample.editUrl : `/seo?tab=issues&check=${g.checkId}`;
                  return (
                    <li key={g.checkId}>
                      <Link href={href} className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs transition-colors hover:bg-[var(--surface-muted)]">
                        <TrafficDot status={g.severity} />
                        <span className="min-w-0 flex-1 truncate text-[var(--text)]">{g.title}</span>
                        <span className="shrink-0 text-[11px] text-[var(--text-faint)]">
                          {g.count.toLocaleString("fa-IR")} {sample?.entityType && sample.entityType !== "site" ? ENTITY_LABELS[sample.entityType]?.split(" ")[0] : ""}
                        </span>
                        <Wrench size={12} className="shrink-0" style={{ color: SEVERITY[g.severity]?.color }} />
                      </Link>
                    </li>
                  );
                })}
                {(data?.topIssues || []).length === 0 && <li className="text-xs text-[var(--success)]">مشکلی باقی نمانده 🎉</li>}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
