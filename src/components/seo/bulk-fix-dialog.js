"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Loader2, Sparkles, Wand2, AlertTriangle, Pencil, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { bulkPlanQuickFix, bulkApplyQuickFix } from "@/lib/seo/api";
import { ENTITY_LABELS } from "@/lib/seo/constants";
import { fa, TEXTAREA } from "./quick-fix-fields";

const decode = (p) => {
  try {
    return decodeURI(p || "");
  } catch {
    return p || "";
  }
};

const FIELD_LABEL = { seoTitle: "عنوان سئو", seoDescription: "توضیحات متا", keywords: "کلمات کلیدی", excerpt: "خلاصه", coverAlt: "alt تصویر شاخص", imageAlts: "alt تصاویر", h1: "H1", shortDescription: "توضیح کوتاه", description: "توضیحات", appendContent: "متن افزوده", faqs: "سوالات متداول", internalLinks: "لینک‌های داخلی" };
const SOURCE_LABEL = { ai: "هوش مصنوعی", rule: "قاعده", template: "قالب" };

function ValueView({ value }) {
  if (Array.isArray(value)) {
    if (value.length && typeof value[0] === "object") return <span className="text-[var(--text-muted)]">{fa(value.length)} مورد</span>;
    return <span className="text-[var(--text-muted)]">{value.filter(Boolean).join("، ") || "—"}</span>;
  }
  return <span className="text-[var(--text-muted)]">{String(value || "") || "—"}</span>;
}

/** ویرایش مقدار پیشنهادیِ یک فیلد داخل جدول */
function PatchField({ k, value, current, onChange }) {
  const label = FIELD_LABEL[k] || k;
  let editor;
  if (k === "imageAlts") {
    const list = Array.isArray(value) ? value : [];
    editor = (
      <div className="space-y-1">
        {list.map((v, i) => (
          <Input key={i} value={v || ""} className="h-8 text-xs" onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} />
        ))}
      </div>
    );
  } else if (k === "keywords") {
    editor = <Input value={(value || []).join("، ")} className="h-8 text-xs" onChange={(e) => onChange(e.target.value.split(/[,،]/).map((x) => x.trim()).filter(Boolean))} />;
  } else if (k === "faqs" || k === "internalLinks") {
    editor = (
      <p className="text-xs text-[var(--text-muted)]">
        {fa((value || []).length)} مورد پیشنهاد شده <span className="text-[var(--text-faint)]">(برای ویرایش، «رفع سریع» تکی را باز کنید)</span>
      </p>
    );
  } else {
    editor = <textarea className={cn(TEXTAREA, "min-h-[64px] text-xs")} rows={k === "description" || k === "appendContent" ? 5 : 3} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  }
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold text-[var(--text-faint)]">{label}</p>
      {current !== undefined && (Array.isArray(current) ? current.length > 0 : String(current || "").trim()) ? (
        <p className="line-clamp-2 text-[11px] leading-5 text-[var(--text-faint)] line-through decoration-[var(--border)]">
          <ValueView value={current} />
        </p>
      ) : null}
      {editor}
    </div>
  );
}

/**
 * رفع دسته‌ای یک گروه مشکل: برای هر صفحه یک پیشنهاد ساخته می‌شود، ادمین
 * بازبینی/ویرایش می‌کند و انتخاب‌شده‌ها یک‌جا اعمال می‌شوند.
 */
export function BulkFixDialog({ checkId, title, open, onOpenChange, onDone }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-6xl overflow-hidden p-0">
        {open && checkId ? <BulkInner key={checkId} checkId={checkId} title={title} onOpenChange={onOpenChange} onDone={onDone} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function BulkInner({ checkId, title, onOpenChange, onDone }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [overrides, setOverrides] = useState({}); // reportId → { selected, choice, edit }
  const [applying, setApplying] = useState(false);
  const [summary, setSummary] = useState(null);

  const { data: plan, isFetching: loading, error: planError, refetch } = useQuery({
    queryKey: ["seo-bulk-plan", checkId, page],
    queryFn: () => bulkPlanQuickFix(checkId, page),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  const error = planError ? planError?.response?.data?.message || "ساخت پیشنهادها ناموفق بود" : "";

  const rows = useMemo(
    () =>
      (plan?.rows || []).map((x) => {
        const o = overrides[x.reportId] || {};
        return {
          ...x,
          selected: o.selected ?? (x.kind === "patch" || x.kind === "action"),
          choice: o.choice ?? (x.actionId || "skip"),
          edit: o.edit ?? (x.patch ? x.patch : null),
        };
      }),
    [plan, overrides]
  );
  const setRow = (reportId, fields) => setOverrides((m) => ({ ...m, [reportId]: { ...(m[reportId] || {}), ...fields } }));

  const goPage = (p) => {
    setPage(p);
    setSummary(null);
  };

  const patchRows = rows.filter((r) => r.kind === "patch");
  const applicable = rows.filter((r) => r.selected && ((r.kind === "patch" && r.edit && Object.keys(r.edit).length) || (r.kind === "action" && r.choice && r.choice !== "skip")));

  const apply = async () => {
    setApplying(true);
    try {
      const items = applicable.map((r) => (r.kind === "action" ? { reportId: r.reportId, actionId: r.choice } : { reportId: r.reportId, patch: r.edit }));
      const res = await bulkApplyQuickFix(items);
      setSummary(res);
      ["seo-issues", "seo-issue-pages", "seo-pages", "seo-overview", "seo-health"].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
      onDone?.();
      toast.success(`${fa(res.applied)} صفحه اصلاح شد${res.failed ? ` · ${fa(res.failed)} ناموفق` : ""}`);
      setOverrides({});
      await refetch();
    } catch (e) {
      toast.error("اعمال دسته‌ای ناموفق بود", e?.response?.data?.message || "");
    } finally {
      setApplying(false);
    }
  };

  const allSelected = rows.length > 0 && rows.filter((r) => r.kind === "patch" || r.kind === "action").every((r) => r.selected);

  return (
        <div className="flex h-[88vh] max-h-[860px] flex-col" dir="rtl">
          <div className="border-b border-[var(--border)] px-6 py-4 pl-14">
            <div className="mb-1 flex items-center gap-1.5">
              <Badge variant="brand" size="sm"><Wand2 size={10} />رفع دسته‌ای</Badge>
              {plan && <Badge variant="neutral" size="sm">{fa(plan.total)} صفحه با این مشکل</Badge>}
            </div>
            <DialogTitle className="text-base leading-7">{title}</DialogTitle>
            <DialogDescription className="text-xs leading-6">
              برای هر صفحه پیشنهادی ساخته شده؛ هر کدام را می‌توانید ویرایش یا از انتخاب خارج کنید، بعد «اعمال» را بزنید. هر تغییر قابل برگشت است (از تب «رفع خودکار» → تاریخچه).
            </DialogDescription>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-[var(--text-muted)]">
                <Loader2 className="animate-spin" />
                در حال ساخت پیشنهاد برای {fa(15)} صفحه…
              </div>
            ) : error ? (
              <div className="p-10 text-center text-sm">
                <AlertTriangle className="mx-auto mb-2 text-[var(--warning)]" />
                {error}
              </div>
            ) : rows.length === 0 ? (
              <div className="space-y-2 p-10 text-center text-sm text-[var(--success)]">
                <p>🎉 صفحه‌ای با این مشکل نمانده است.</p>
                {summary && (
                  <p className="text-xs text-[var(--text-muted)]">
                    {fa(summary.applied)} صفحه اصلاح شد · مجموع بهبود نمره‌ی صفحات <span dir="ltr">{summary.totalDelta > 0 ? "+" : ""}{fa(summary.totalDelta)}</span>
                  </p>
                )}
              </div>
            ) : (
              <>
                {summary && (
                  <div className="m-6 mb-0 rounded-[var(--radius-lg)] border border-[var(--success)]/40 bg-[var(--success-bg)] p-3 text-xs">
                    <p className="font-semibold text-[var(--success)]">
                      {fa(summary.applied)} صفحه اصلاح شد · مجموع بهبود نمره‌ی صفحات <span dir="ltr">{summary.totalDelta > 0 ? "+" : ""}{fa(summary.totalDelta)}</span>
                      {summary.failed > 0 && <span className="text-[var(--danger)]"> · {fa(summary.failed)} ناموفق</span>}
                    </p>
                  </div>
                )}
                <ul className="divide-y divide-[var(--border)]">
                  {rows.map((r) => (
                    <li key={r.reportId} className={cn("grid gap-4 px-6 py-4 md:grid-cols-[28px_minmax(0,0.9fr)_minmax(0,1.6fr)]", !r.selected && "opacity-60")}>
                      <div className="pt-1">
                        {(r.kind === "patch" || r.kind === "action") && (
                          <input type="checkbox" className="h-4 w-4 accent-[var(--brand-600)]" checked={r.selected} onChange={(e) => setRow(r.reportId, { selected: e.target.checked })} aria-label="انتخاب" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--text)]" title={r.label}>{r.label}</p>
                        <p className="truncate text-[11px] text-[var(--text-faint)]" dir="ltr" title={decode(r.path)}>{decode(r.path)}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant="neutral" size="sm">{ENTITY_LABELS[r.entityType]?.split(" ")[0] || r.entityType}</Badge>
                          <span className="text-[11px] tabular-nums text-[var(--text-muted)]">نمره {fa(r.score)}</span>
                          {r.editUrl && (
                            <Link href={r.editUrl} className="flex items-center gap-0.5 text-[11px] text-[var(--brand-600)] hover:underline">
                              <Pencil size={10} />
                              ویرایش
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 space-y-3">
                        {r.kind === "patch" && r.edit && (
                          <>
                            {Object.keys(r.edit).map((k) => (
                              <PatchField key={k} k={k} value={r.edit[k]} current={r.current?.[k]} onChange={(v) => setRow(r.reportId, { edit: { ...r.edit, [k]: v } })} />
                            ))}
                            {r.source && (
                              <p className="flex items-center gap-1 text-[10px] text-[var(--text-faint)]">
                                <Sparkles size={10} />
                                پیشنهاد: {SOURCE_LABEL[r.source] || r.source}
                                {r.source === "rule" && " — کلی است؛ بازبینی کنید"}
                              </p>
                            )}
                          </>
                        )}
                        {r.kind === "action" && (
                          <div className="space-y-2">
                            {r.reason && <p className="flex items-start gap-1.5 text-xs leading-5 text-[var(--text-muted)]"><AlertTriangle size={12} className="mt-1 shrink-0 text-[var(--warning)]" />{r.reason}</p>}
                            <select className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-2 text-xs" value={r.choice} onChange={(e) => setRow(r.reportId, { choice: e.target.value })}>
                              {(r.alternatives || []).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                              <option value="skip">بدون اقدام</option>
                            </select>
                            {r.manualOnly?.length > 0 && <p className="text-[10px] text-[var(--text-faint)]">راه‌حل‌های نیازمند ورودی (از «رفع سریع» تکی): {r.manualOnly.join("، ")}</p>}
                          </div>
                        )}
                        {r.kind === "none" && (
                          <div className="space-y-1.5 text-xs text-[var(--text-muted)]">
                            <p>{r.reason || "برای این صفحه پیشنهاد خودکاری ساخته نشد."}</p>
                            {r.alternatives?.length > 0 && <p className="text-[10px] text-[var(--text-faint)]">گزینه‌ها: {r.alternatives.map((a) => a.label).join("، ")}</p>}
                            {r.manualOnly?.length > 0 && <p className="text-[10px] text-[var(--text-faint)]">با ورودی دستی: {r.manualOnly.join("، ")}</p>}
                            <p className="text-[10px] text-[var(--text-faint)]">برای تصمیم روی همین صفحه «رفع سریع» تکی را از لیست باز کنید.</p>
                          </div>
                        )}
                        {r.kind === "error" && <p className="text-xs text-[var(--danger)]">{r.error}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-6 py-3">
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              {plan?.pageCount > 1 && (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => goPage(page - 1)} aria-label="قبلی"><ChevronRight size={14} /></Button>
                  <span className="px-1 tabular-nums">{fa(page)} / {fa(plan.pageCount)}</span>
                  <Button size="sm" variant="outline" disabled={page >= plan.pageCount || loading} onClick={() => goPage(page + 1)} aria-label="بعدی"><ChevronLeft size={14} /></Button>
                </div>
              )}
              {patchRows.length > 0 && (
                <button type="button" className="text-[var(--brand-600)] hover:underline" onClick={() => setOverrides((m) => ({ ...m, ...Object.fromEntries(rows.filter((x) => x.kind === "patch" || x.kind === "action").map((x) => [x.reportId, { ...(m[x.reportId] || {}), selected: !allSelected }])) }))}>
                  {allSelected ? "لغو انتخاب همه" : "انتخاب همه"}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>بستن</Button>
              <Button disabled={!applicable.length || applying || loading} loading={applying} onClick={apply}>
                <Check size={14} />
                اعمال روی {fa(applicable.length)} صفحه
                <ArrowLeft size={13} className="opacity-0" />
              </Button>
            </div>
          </div>
        </div>
  );
}
