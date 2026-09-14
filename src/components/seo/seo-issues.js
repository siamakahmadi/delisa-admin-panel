"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Pencil, ExternalLink, EyeOff, Wrench, Eye as EyeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { fetchSeoIssues, muteSeoCheck, unmuteSeoCheck } from "@/lib/seo/api";
import { SEVERITY, CATEGORY_LABELS, ENTITY_LABELS, CUSTOMER_SITE_URL, scoreColor } from "@/lib/seo/constants";
import { TrafficDot } from "./severity-icon";
import { PageReportDialog } from "./page-report-dialog";

function GroupPages({ auditId, checkId, groupTitle, onOpenReport }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ["seo-issue-pages", auditId, checkId, page], queryFn: () => fetchSeoIssues({ auditId, checkId, page, limit: 20 }), keepPreviousData: true });
  const pages = data?.pages || [];
  const pageCount = Math.ceil((data?.total || 0) / 20);
  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface-muted)]/60">
      {isLoading ? (
        <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {pages.map((p) => (
            <li key={p._id} className="flex items-center gap-3 px-4 py-2 text-xs">
              <span className="w-7 shrink-0 text-center font-semibold tabular-nums" style={{ color: scoreColor(p.score) }}>{Number(p.score).toLocaleString("fa-IR")}</span>
              <Badge variant="neutral" size="sm" className="shrink-0">{ENTITY_LABELS[p.entityType]?.split(" ")[0] || p.entityType}</Badge>
              <button type="button" onClick={() => onOpenReport(p._id)} className="min-w-0 flex-1 truncate text-start text-[var(--text)] hover:text-[var(--brand-600)]">
                {p.label || p.path}
                {p.check?.message && p.check.message !== groupTitle && <span className="mr-2 text-[var(--text-faint)]">— {p.check.message}</span>}
              </button>
              {p.editUrl && (
                <Link href={p.editUrl} className="flex shrink-0 items-center gap-1 text-[var(--brand-600)] hover:underline">
                  <Pencil size={11} />
                  ویرایش
                </Link>
              )}
              <a href={`${CUSTOMER_SITE_URL}${p.path}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[var(--text-faint)] hover:text-[var(--text)]" title="مشاهده در سایت">
                <ExternalLink size={12} />
              </a>
            </li>
          ))}
        </ul>
      )}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-4 py-2 text-[11px] text-[var(--text-muted)]">
          <span>صفحه {page.toLocaleString("fa-IR")} از {pageCount.toLocaleString("fa-IR")}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>قبلی</Button>
            <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>بعدی</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SeoIssues({ auditId, initialCheck, mutedChecks = [] }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [severity, setSeverity] = useState("");
  const [category, setCategory] = useState("");
  const [expanded, setExpanded] = useState(initialCheck || null);
  const [reportId, setReportId] = useState(null);
  // وقتی از هدر/ویجت با ?check= جدید می‌آییم، همان گروه باز شود
  const [seenCheck, setSeenCheck] = useState(initialCheck || null);
  if (initialCheck && initialCheck !== seenCheck) {
    setSeenCheck(initialCheck);
    setExpanded(initialCheck);
  }

  const { data, isLoading } = useQuery({ queryKey: ["seo-issues", auditId, severity, category], queryFn: () => fetchSeoIssues({ auditId, severity: severity || undefined, category: category || undefined }) });
  const groups = data?.groups || [];
  const muteMutation = useMutation({
    mutationFn: ({ id, mute }) => (mute ? muteSeoCheck(id) : unmuteSeoCheck(id)),
    onSuccess: (_, { mute }) => {
      toast.success(mute ? "این چک بی‌صدا شد؛ از ممیزی بعدی لحاظ نمی‌شود" : "چک دوباره فعال شد");
      queryClient.invalidateQueries({ queryKey: ["seo-overview"] });
    },
  });
  const muted = useMemo(() => new Set(mutedChecks), [mutedChecks]);

  useEffect(() => {
    if (expanded) document.getElementById(`issue-${expanded}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-40">
          <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">همه شدت‌ها</option>
            <option value="error">خطا</option>
            <option value="warning">هشدار</option>
            <option value="notice">پیشنهاد</option>
          </Select>
        </div>
        <div className="w-48">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">همه حوزه‌ها</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <span className="text-xs text-[var(--text-muted)]">{groups.length.toLocaleString("fa-IR")} نوع مشکل</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : groups.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-[var(--success)]">مشکلی با این فیلتر پیدا نشد 🎉</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const open = expanded === g.checkId;
            const isMuted = muted.has(g.checkId);
            return (
              <div id={`issue-${g.checkId}`} key={g.checkId} className={cn("overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--surface)]", open ? "border-[var(--brand-300)]" : "border-[var(--border)]")}>
                <button type="button" onClick={() => setExpanded(open ? null : g.checkId)} className="flex w-full items-center gap-3 p-4 text-start">
                  <TrafficDot status={g.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text)]">{g.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
                      <Wrench size={11} className="shrink-0" />
                      <span className="truncate">{g.howToFix}</span>
                    </p>
                  </div>
                  <Badge variant="neutral" size="sm">{CATEGORY_LABELS[g.category] || g.category}</Badge>
                  <Badge variant={SEVERITY[g.severity]?.badge} size="sm">{Number(g.count).toLocaleString("fa-IR")} مورد</Badge>
                  <ChevronDown size={15} className={cn("shrink-0 text-[var(--text-faint)] transition-transform", open && "rotate-180")} />
                </button>
                {open && (
                  <>
                    <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2">
                      <p className="text-[11px] text-[var(--text-muted)]">صفحاتی که این مشکل را دارند (بدترین نمره اول)</p>
                      <Button size="sm" variant="ghost" loading={muteMutation.isPending} onClick={() => muteMutation.mutate({ id: g.checkId, mute: !isMuted })}>
                        {isMuted ? <EyeIcon size={13} /> : <EyeOff size={13} />}
                        {isMuted ? "فعال‌سازی دوباره" : "بی‌صدا کردن این چک"}
                      </Button>
                    </div>
                    {g.category === "site" ? (
                      <div className="border-t border-[var(--border)] p-4 text-xs text-[var(--text-muted)]">{g.samples?.[0]?.label}</div>
                    ) : (
                      <GroupPages auditId={auditId} checkId={g.checkId} groupTitle={g.title} onOpenReport={setReportId} />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <PageReportDialog reportId={reportId} open={!!reportId} onOpenChange={(o) => !o && setReportId(null)} />
    </div>
  );
}
