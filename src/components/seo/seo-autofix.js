"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wand2, Sparkles, Play, FlaskConical, Undo2, XCircle, Loader2, ChevronDown, Pencil } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchAutofixPlan, runAutofix, cancelAutofix, fetchAutofixJobs, fetchAutofixJob, undoAutofix } from "@/lib/seo/api";
import { ENTITY_LABELS } from "@/lib/seo/constants";

const FIELD_LABELS = {
  "seo.seoTitle": "عنوان سئو",
  "seo.seoDescription": "توضیحات متا",
  "seo.seoKeywords": "کلمات کلیدی",
  "seo.title": "عنوان سئو",
  "seo.description": "توضیحات متا",
  "seo.keywords": "کلمات کلیدی",
  excerpt: "خلاصه",
  seoTitle: "عنوان سئو",
  seoDescription: "توضیحات متا",
  "seoContent.h1": "H1",
  "seoContent.shortDescription": "توضیح کوتاه آرشیو",
  "seoContent.contentHtml": "محتوای سئو",
  "seoContent.faqs": "سوالات متداول",
  "productImages.alt": "alt تصاویر",
  coverAlt: "alt کاور",
  isActive: "فعال",
  description: "توضیحات محصول",
};
const STATUS = { running: ["info", "در حال اجرا"], done: ["success", "انجام شد"], failed: ["danger", "خطا"], cancelled: ["neutral", "لغو شد"], undone: ["warning", "برگردانده شد"] };

function fmt(v) {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" ? x.question || JSON.stringify(x) : String(x))).join("، ");
  if (typeof v === "boolean") return v ? "بله" : "خیر";
  const s = String(v).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return s.length > 220 ? `${s.slice(0, 219)}…` : s;
}

function JobDetail({ jobId }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ["seo-autofix-job", jobId, page], queryFn: () => fetchAutofixJob(jobId, { page, limit: 40 }), refetchInterval: (q) => (q.state.data?.running ? 3000 : false) });
  if (isLoading || !data) return <Skeleton className="h-40 w-full" />;
  const job = data.job;
  const pageCount = Math.ceil((job.changesTotal || 0) / 40);
  return (
    <div className="space-y-3">
      {job.errors?.length > 0 && (
        <div className="rounded-[var(--radius-md)] bg-[var(--danger-bg)] p-3 text-xs text-[var(--danger)]">
          <p className="mb-1 font-semibold">{job.errors.length.toLocaleString("fa-IR")} خطا:</p>
          <ul className="space-y-0.5">{job.errors.slice(0, 8).map((e, i) => <li key={i}>• {e.label}: {e.message}</li>)}</ul>
        </div>
      )}
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
        <table className="w-full min-w-[720px] text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]">
              <th className="px-3 py-2 text-start font-medium">صفحه</th>
              <th className="px-3 py-2 text-start font-medium">فیلد</th>
              <th className="px-3 py-2 text-start font-medium">قبل</th>
              <th className="px-3 py-2 text-start font-medium">بعد</th>
              <th className="px-3 py-2 text-start font-medium">منبع</th>
            </tr>
          </thead>
          <tbody>
            {(job.changes || []).map((c, i) => (
              <tr key={i} className="border-b border-[var(--border)] align-top last:border-0">
                <td className="max-w-[180px] px-3 py-2">
                  <Badge variant="neutral" size="sm">{ENTITY_LABELS[c.entityType]?.split(" ")[0] || c.entityType}</Badge>
                  <p className="mt-1 truncate font-medium text-[var(--text)]">{c.label}</p>
                  {c.editUrl && (
                    <Link href={c.editUrl} className="mt-0.5 inline-flex items-center gap-1 text-[var(--brand-600)] hover:underline">
                      <Pencil size={10} />
                      ویرایش
                    </Link>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-[var(--text-muted)]">{FIELD_LABELS[c.field] || c.field}</td>
                <td className="max-w-[240px] px-3 py-2 text-[var(--text-faint)]">{fmt(c.before)}</td>
                <td className="max-w-[300px] px-3 py-2 text-[var(--text)]">{fmt(c.after)}</td>
                <td className="px-3 py-2">{c.source === "ai" ? <Badge variant="brand" size="sm">AI</Badge> : c.source === "template" ? <Badge variant="info" size="sm">قالب</Badge> : <Badge variant="neutral" size="sm">قاعده</Badge>}</td>
              </tr>
            ))}
            {(job.changes || []).length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-[var(--text-faint)]">تغییری ثبت نشده</td></tr>}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>{(job.changesTotal || 0).toLocaleString("fa-IR")} تغییر — صفحه {page.toLocaleString("fa-IR")} از {pageCount.toLocaleString("fa-IR")}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>قبلی</Button>
            <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>بعدی</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SeoAutofix() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: plan, isLoading } = useQuery({ queryKey: ["seo-autofix-plan"], queryFn: fetchAutofixPlan });
  const { data: jobsData } = useQuery({ queryKey: ["seo-autofix-jobs"], queryFn: fetchAutofixJobs, refetchInterval: (q) => (q.state.data?.running ? 3000 : 30_000) });
  const [selected, setSelected] = useState(null);
  const [openJob, setOpenJob] = useState(null);
  const [confirm, setConfirm] = useState(null); // {dryRun}
  const [undoTarget, setUndoTarget] = useState(null);

  const strategies = useMemo(() => plan?.strategies || [], [plan]);
  const chosen = useMemo(() => selected ?? new Set(strategies.filter((s) => s.defaultOn && s.count > 0).map((s) => s.id)), [selected, strategies]);
  const toggle = (id) => {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const running = jobsData?.running;
  const runningJob = (jobsData?.jobs || []).find((j) => String(j._id) === String(running));

  const run = useMutation({
    mutationFn: ({ dryRun }) => runAutofix({ strategies: [...chosen], dryRun }),
    onSuccess: (r) => {
      toast.success(r.message);
      queryClient.invalidateQueries({ queryKey: ["seo-autofix-jobs"] });
      setOpenJob(r.job?._id || null);
    },
    onError: (e) => toast.error("خطا", e?.response?.data?.message || "شروع ناموفق بود"),
  });
  const cancel = useMutation({ mutationFn: cancelAutofix, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seo-autofix-jobs"] }) });
  const undo = useMutation({
    mutationFn: (id) => undoAutofix(id),
    onSuccess: (r) => {
      toast.success(r.message);
      queryClient.invalidateQueries({ queryKey: ["seo-autofix-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["seo-autofix-job"] });
    },
    onError: (e) => toast.error("خطا", e?.response?.data?.message || "برگشت ناموفق بود"),
  });

  const totalChosen = strategies.filter((s) => chosen.has(s.id)).reduce((n, s) => n + s.count, 0);
  const aiChosen = strategies.some((s) => chosen.has(s.id) && s.needsAi);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 size={16} className="text-[var(--brand-500)]" />
            رفع خودکار مشکلات آخرین ممیزی
          </CardTitle>
          {plan?.audit && <span className="text-[11px] text-[var(--text-faint)]">بر اساس ممیزی {formatDateTime(plan.audit.finishedAt)}</span>}
        </CardHeader>
        <CardContent className="space-y-3">
          {!plan?.aiAvailable && !isLoading && (
            <p className="rounded-[var(--radius-md)] bg-[var(--warning-bg)] p-3 text-xs text-[var(--warning)]">
              سرویس هوش مصنوعی پیکربندی نشده (LIARA_API_KEY). استراتژی‌های AI اجرا نمی‌شوند؛ متای آرشیوها از قالب‌ها پر می‌شود.
            </p>
          )}
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {strategies.map((s) => (
                <label key={s.id} className={cn("flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border p-3 transition-colors", chosen.has(s.id) ? "border-[var(--brand-300)] bg-[var(--brand-50)]" : "border-[var(--border)] hover:bg-[var(--surface-muted)]", s.count === 0 && "opacity-60")}>
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--brand-600)]" checked={chosen.has(s.id)} disabled={s.count === 0} onChange={() => toggle(s.id)} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text)]">{s.label}</span>
                      <Badge variant={s.count ? "brand" : "neutral"} size="sm">{s.count.toLocaleString("fa-IR")} صفحه</Badge>
                      {s.needsAi && <Badge variant="info" size="sm"><Sparkles size={10} /> AI</Badge>}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">{s.description}</span>
                    {s.samples?.length > 0 && <span className="mt-1 block truncate text-[11px] text-[var(--text-faint)]">مثلاً: {s.samples.map((x) => x.label).join(" · ")}</span>}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
            <span className="text-xs text-[var(--text-muted)]">{totalChosen.toLocaleString("fa-IR")} صفحه انتخاب شده{aiChosen ? " — تماس‌های AI چند دقیقه طول می‌کشد" : ""}</span>
            <div className="flex-1" />
            <Button variant="outline" disabled={!totalChosen || !!running} loading={run.isPending} onClick={() => run.mutate({ dryRun: true })}>
              <FlaskConical size={15} />
              اجرای آزمایشی (بدون ذخیره)
            </Button>
            <Button disabled={!totalChosen || !!running} onClick={() => setConfirm({ dryRun: false })}>
              <Play size={15} />
              اعمال روی سایت
            </Button>
          </div>
        </CardContent>
      </Card>

      {runningJob && (
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--brand-100)] bg-[var(--brand-50)] p-4">
          <Loader2 size={18} className="animate-spin text-[var(--brand-600)]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--brand-700)]">
              {runningJob.dryRun ? "اجرای آزمایشی" : "رفع خودکار"} در حال اجرا — {runningJob.progress?.message}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {Number(runningJob.progress?.done || 0).toLocaleString("fa-IR")} از {Number(runningJob.progress?.total || 0).toLocaleString("fa-IR")} · اعمال‌شده {Number(runningJob.stats?.applied || 0).toLocaleString("fa-IR")} · تماس AI {Number(runningJob.stats?.aiCalls || 0).toLocaleString("fa-IR")}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--brand-100)]">
              <div className="h-full rounded-full bg-[var(--brand-600)] transition-all" style={{ width: `${runningJob.progress?.total ? Math.round((runningJob.progress.done / runningJob.progress.total) * 100) : 10}%` }} />
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => cancel.mutate()} loading={cancel.isPending}>
            <XCircle size={14} />
            توقف
          </Button>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>اجراهای قبلی</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(jobsData?.jobs || []).length === 0 && <p className="text-xs text-[var(--text-faint)]">هنوز اجرایی ثبت نشده.</p>}
          {(jobsData?.jobs || []).map((j) => {
            const open = openJob === String(j._id);
            return (
              <div key={j._id} className="rounded-[var(--radius-md)] border border-[var(--border)]">
                <button type="button" onClick={() => setOpenJob(open ? null : String(j._id))} className="flex w-full flex-wrap items-center gap-2 p-3 text-start text-xs">
                  <Badge variant={STATUS[j.status]?.[0] || "neutral"} size="sm">{STATUS[j.status]?.[1] || j.status}</Badge>
                  {j.dryRun && <Badge variant="neutral" size="sm">آزمایشی</Badge>}
                  <span className="text-[var(--text)]">{formatDateTime(j.startedAt)}</span>
                  <span className="text-[var(--text-muted)]">· {(j.strategies || []).length.toLocaleString("fa-IR")} استراتژی</span>
                  <span className="text-[var(--success)]">· {Number(j.stats?.applied || 0).toLocaleString("fa-IR")} تغییر</span>
                  {j.stats?.failed > 0 && <span className="text-[var(--danger)]">· {Number(j.stats.failed).toLocaleString("fa-IR")} خطا</span>}
                  <span className="flex-1" />
                  {j.status === "done" && !j.dryRun && j.stats?.applied > 0 && (
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setUndoTarget(j); }}>
                      <Undo2 size={13} />
                      برگرداندن
                    </Button>
                  )}
                  <ChevronDown size={14} className={cn("text-[var(--text-faint)] transition-transform", open && "rotate-180")} />
                </button>
                {open && <div className="border-t border-[var(--border)] p-3"><JobDetail jobId={String(j._id)} /></div>}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="اعمال رفع خودکار روی سایت"
        description={`${totalChosen.toLocaleString("fa-IR")} صفحه تغییر می‌کند. همه‌ی تغییرات با «قبل/بعد» ثبت می‌شوند و از همین‌جا قابل برگشت‌اند. ادامه می‌دهید؟`}
        confirmLabel="بله، اعمال کن" variant="primary"
        onConfirm={() => { setConfirm(null); run.mutate({ dryRun: false }); }}
      />
      <ConfirmDialog
        open={!!undoTarget}
        onOpenChange={(o) => !o && setUndoTarget(null)}
        title="برگرداندن تغییرات"
        description={`${Number(undoTarget?.stats?.applied || 0).toLocaleString("fa-IR")} تغییر به مقدار قبلی برمی‌گردد.`}
        confirmLabel="برگردان"
        onConfirm={() => { const id = undoTarget._id; setUndoTarget(null); undo.mutate(id); }}
      />
    </div>
  );
}
