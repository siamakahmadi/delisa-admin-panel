"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Pencil, RefreshCw, Clock, FileSearch } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { fetchSeoPage, recheckSeoPage } from "@/lib/seo/api";
import { CATEGORY_LABELS, ENTITY_LABELS, CUSTOMER_SITE_URL, scoreColor } from "@/lib/seo/constants";
import { ScoreRing } from "./score-ring";
import { CheckList } from "./check-list";
import { SerpPreview } from "./serp-preview";

function Stat({ label, value, dir }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-2.5 py-2">
      <p className="text-[10px] text-[var(--text-faint)]">{label}</p>
      <p className="truncate text-xs font-semibold text-[var(--text)]" dir={dir}>{value ?? "—"}</p>
    </div>
  );
}

/** گزارش کامل یک صفحه (از جدول صفحات / لیست مشکلات) */
export function PageReportDialog({ reportId, open, onOpenChange }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: report, isLoading } = useQuery({ queryKey: ["seo-page", reportId], queryFn: () => fetchSeoPage(reportId), enabled: !!reportId && open });
  const recheck = useMutation({
    mutationFn: () => recheckSeoPage(reportId),
    onSuccess: (r) => {
      queryClient.setQueryData(["seo-page", reportId], r);
      queryClient.invalidateQueries({ queryKey: ["seo-pages"] });
      toast.success("بررسی مجدد انجام شد");
    },
    onError: (e) => toast.error("خطا", e?.response?.data?.message || "بررسی مجدد ناموفق بود"),
  });

  const r = report;
  const url = r?.url || (r?.path ? `${CUSTOMER_SITE_URL}${r.path}` : "");
  const cats = Object.entries(r?.categoryScores || {}).filter(([, v]) => v != null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        {isLoading || !r ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="max-h-[85vh] overflow-y-auto">
            <div className="flex items-start gap-4 border-b border-[var(--border)] p-5">
              <ScoreRing score={r.score} size={84} stroke={7} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand" size="sm">{ENTITY_LABELS[r.entityType] || r.entityType}</Badge>
                  {r.published === false && <Badge variant="neutral" size="sm">پیش‌نویس</Badge>}
                  {r.crawled ? <Badge variant={r.http?.status === 200 ? "success" : "danger"} size="sm">HTTP {r.http?.status ?? "—"}</Badge> : <Badge variant="neutral" size="sm">فقط تحلیل محتوا</Badge>}
                </div>
                <DialogTitle className="mt-1.5 truncate">{r.label}</DialogTitle>
                <DialogDescription className="truncate" dir="ltr">{r.path}</DialogDescription>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.editUrl && (
                    <Link href={r.editUrl}>
                      <Button size="sm">
                        <Pencil size={13} />
                        ویرایش
                      </Button>
                    </Link>
                  )}
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink size={13} />
                        مشاهده در سایت
                      </Button>
                    </a>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => recheck.mutate()} loading={recheck.isPending}>
                    <RefreshCw size={13} />
                    بررسی مجدد
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-[1fr_1.4fr]">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">نمره به تفکیک</p>
                  <div className="space-y-1.5">
                    {cats.map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 text-[11px]">
                        <span className="w-24 shrink-0 truncate text-[var(--text-muted)]">{CATEGORY_LABELS[k] || k}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                          <div className="h-full rounded-full" style={{ width: `${v}%`, background: scoreColor(v) }} />
                        </div>
                        <span className="w-6 text-end font-semibold tabular-nums" style={{ color: scoreColor(v) }}>{Number(v).toLocaleString("fa-IR")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <SerpPreview title={r.rendered?.title || r.content?.title} description={r.rendered?.description || r.content?.description} path={r.path} />

                <div className="grid grid-cols-2 gap-2">
                  <Stat label="کلمات محتوا" value={r.content?.wordCount != null ? Number(r.content.wordCount).toLocaleString("fa-IR") : null} />
                  <Stat label="کلمه‌ی کلیدی" value={r.content?.focusKeyword || "—"} />
                  <Stat label="لینک داخلی / خارجی" value={`${Number(r.rendered?.links?.internal ?? r.content?.links?.internal ?? 0).toLocaleString("fa-IR")} / ${Number(r.rendered?.links?.external ?? r.content?.links?.external ?? 0).toLocaleString("fa-IR")}`} />
                  <Stat label="لینک ورودی" value={r.content?.inboundLinks != null ? Number(r.content.inboundLinks).toLocaleString("fa-IR") : "—"} />
                  {r.crawled && (
                    <>
                      <Stat label="زمان پاسخ" value={r.http?.responseMs != null ? `${Number(r.http.responseMs).toLocaleString("fa-IR")} ms` : null} />
                      <Stat label="حجم HTML" value={r.http?.bytes ? `${Math.round(r.http.bytes / 1024).toLocaleString("fa-IR")} KB` : null} />
                      <Stat label="Canonical" value={r.rendered?.canonical || "—"} dir="ltr" />
                      <Stat label="Robots" value={r.rendered?.robots || "index,follow"} dir="ltr" />
                      <Stat label="H1" value={(r.rendered?.h1 || []).join(" | ") || "—"} />
                      <Stat label="JSON-LD" value={(r.rendered?.jsonLdTypes || []).join(", ") || "—"} dir="ltr" />
                    </>
                  )}
                </div>
                {r.http?.redirects?.length > 0 && (
                  <div className="rounded-[var(--radius-sm)] bg-[var(--warning-bg)] p-2 text-[11px] text-[var(--warning)]" dir="ltr">
                    {r.http.redirects.map((x, i) => <p key={i} className="truncate">{x}</p>)}
                  </div>
                )}
                <p className="flex items-center gap-1 text-[10px] text-[var(--text-faint)]">
                  <Clock size={10} />
                  بررسی‌شده در {new Date(r.updatedAt).toLocaleString("fa-IR")}
                </p>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
                  <FileSearch size={13} />
                  نتیجه‌ی بررسی‌ها ({(r.checks || []).length.toLocaleString("fa-IR")})
                </p>
                <CheckList checks={r.checks || []} />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
