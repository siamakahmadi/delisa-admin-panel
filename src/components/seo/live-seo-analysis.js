"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Gauge, Radar, ExternalLink, Sparkles, Check, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { analyzeSeoDraft, fetchEntityReport, suggestSeoWithAi } from "@/lib/seo/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { scoreColor, scoreLabel, CUSTOMER_SITE_URL } from "@/lib/seo/constants";
import { ScoreRing } from "./score-ring";
import { CheckList } from "./check-list";
import { SerpPreview } from "./serp-preview";
import { TrafficDot } from "./severity-icon";

/**
 * تحلیل زنده‌ی سئو داخل ویرایشگر (شبیه Yoast). با هر تغییر در payload، بعد از
 * ۶۰۰ms به /api/admin/seo/analyze می‌فرستد و چراغ‌ها/نمره را به‌روز می‌کند.
 * اگر entityType+entityId داده شود، آخرین نتیجه‌ی خزش زنده هم زیر آن می‌آید.
 */
export function LiveSeoAnalysis({ payload, entityType, entityId, className, aiContext, onApplySuggestion }) {
  const toast = useToast();
  const [suggestion, setSuggestion] = useState(null);
  const [suggesting, setSuggesting] = useState(false);
  const [result, setResult] = useState(null);

  const askAi = async () => {
    setSuggesting(true);
    try {
      const r = await suggestSeoWithAi({
        entityType: payload.entityType,
        title: payload.title,
        contentHtml: payload.contentHtml,
        currentSeoTitle: payload.seoTitle,
        currentDescription: payload.metaDescription,
        keywords: payload.keywords,
        ...(aiContext || {}),
      });
      setSuggestion(r);
    } catch (e) {
      toast.error("خطا", e?.response?.data?.message || "تولید پیشنهاد ناموفق بود");
    } finally {
      setSuggesting(false);
    }
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef(null);
  const seq = useRef(0);
  const key = useMemo(() => JSON.stringify(payload), [payload]);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const mine = ++seq.current;
      setLoading(true);
      try {
        const r = await analyzeSeoDraft(JSON.parse(key));
        if (mine === seq.current) {
          setResult(r);
          setError("");
        }
      } catch (e) {
        if (mine === seq.current) setError(e?.response?.data?.message || "تحلیل ناموفق بود");
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer.current);
  }, [key]);

  const { data: report } = useQuery({
    queryKey: ["seo-entity-report", entityType, entityId],
    queryFn: () => fetchEntityReport(entityType, entityId),
    enabled: !!entityType && !!entityId,
    staleTime: 60_000,
  });
  const crawlChecks = useMemo(() => (report?.checks || []).filter((c) => c.status !== "passed" && c.status !== "skipped" && (c.category === "technical" || c.category === "indexing" || c.category === "structured" || c.category === "social" || c.category === "performance" || c.id === "links-broken" || c.id === "links-low-inbound")), [report]);

  const score = result?.score ?? null;
  const counts = result?.counts || {};

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4 rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3">
        <ScoreRing score={score} size={64} stroke={6} showLabel={false} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text)]">
            <Gauge size={14} className="text-[var(--brand-500)]" />
            تحلیل سئو: <span style={{ color: scoreColor(score) }}>{scoreLabel(score)}</span>
            {loading && <Loader2 size={12} className="animate-spin text-[var(--text-faint)]" />}
          </p>
          {result ? (
            <p className="mt-0.5 flex flex-wrap gap-2 text-[11px]">
              <span className="text-[var(--danger)]">{Number(counts.errors || 0).toLocaleString("fa-IR")} خطا</span>
              <span className="text-[var(--warning)]">{Number(counts.warnings || 0).toLocaleString("fa-IR")} هشدار</span>
              <span className="text-[var(--info)]">{Number(counts.notices || 0).toLocaleString("fa-IR")} پیشنهاد</span>
              <span className="text-[var(--success)]">{Number(counts.passed || 0).toLocaleString("fa-IR")} درست</span>
              {result.summary?.focusKeyword && <span className="text-[var(--text-faint)]">· کلمه‌ی کلیدی: «{result.summary.focusKeyword}»</span>}
              {result.summary?.wordCount != null && <span className="text-[var(--text-faint)]">· {Number(result.summary.wordCount).toLocaleString("fa-IR")} کلمه</span>}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">{error || "در حال تحلیل…"}</p>
          )}
        </div>
      </div>

      {onApplySuggestion && (
        <div className="space-y-2">
          {!suggestion ? (
            <Button variant="outline" size="sm" onClick={askAi} loading={suggesting} className="w-full">
              <Sparkles size={14} className="text-[var(--brand-500)]" />
              پیشنهاد عنوان، توضیحات متا و کلمه‌ی کلیدی با هوش مصنوعی
            </Button>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-[var(--brand-100)] bg-[var(--brand-50)] p-3 text-xs">
              <p className="mb-2 flex items-center gap-1.5 font-semibold text-[var(--brand-700)]">
                <Sparkles size={13} />
                پیشنهاد هوش مصنوعی (قبل از اعمال بازبینی کنید)
              </p>
              <div className="space-y-1.5 text-[var(--text)]">
                <p><span className="text-[var(--text-faint)]">عنوان سئو: </span>{suggestion.seoTitle}</p>
                <p><span className="text-[var(--text-faint)]">توضیحات متا: </span>{suggestion.metaDescription}</p>
                <p><span className="text-[var(--text-faint)]">کلمه‌ی کلیدی: </span>{suggestion.focusKeyword}{suggestion.keywords?.length > 1 ? ` · ${suggestion.keywords.slice(1).join("، ")}` : ""}</p>
                {suggestion.excerpt && payload.entityType === "post" && <p><span className="text-[var(--text-faint)]">خلاصه: </span>{suggestion.excerpt}</p>}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => { onApplySuggestion(suggestion); setSuggestion(null); toast.success("پیشنهاد اعمال شد — فراموش نکنید ذخیره کنید"); }}>
                  <Check size={13} />
                  اعمال در فرم
                </Button>
                <Button size="sm" variant="ghost" onClick={askAi} loading={suggesting}>پیشنهاد دیگر</Button>
                <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)}>
                  <X size={13} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <SerpPreview title={result?.summary?.title || payload.seoTitle || payload.title} description={result?.summary?.description || payload.metaDescription} path={payload.path} />

      {result && <CheckList checks={result.checks} compact />}

      {report && (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
          <p className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <Radar size={13} />
              آخرین خزش زنده‌ی صفحه ({new Date(report.updatedAt).toLocaleDateString("fa-IR")})
              <span className="tabular-nums" style={{ color: scoreColor(report.score) }}>نمره {Number(report.score).toLocaleString("fa-IR")}</span>
            </span>
            <a href={`${CUSTOMER_SITE_URL}${report.path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[var(--brand-600)] hover:underline">
              <ExternalLink size={11} />
              صفحه
            </a>
          </p>
          {crawlChecks.length === 0 ? (
            <p className="text-[11px] text-[var(--success)]">در خزش زنده مشکل فنی‌ای دیده نشد.</p>
          ) : (
            <ul className="space-y-1">
              {crawlChecks.slice(0, 8).map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-[12px] text-[var(--text)]">
                  <TrafficDot status={c.status} className="mt-1.5" />
                  <span>{c.message || c.title}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/seo?tab=pages" className="mt-2 block text-[11px] text-[var(--brand-600)] hover:underline">گزارش کامل در مرکز سئو</Link>
        </div>
      )}
    </div>
  );
}
