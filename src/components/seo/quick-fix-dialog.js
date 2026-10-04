"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, ChevronDown, ExternalLink, Info, Sparkles, SkipForward, Undo2, Wand2, Wrench, Zap, AlertTriangle, TrendingUp, TrendingDown, Lightbulb, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { fetchQuickFix, previewQuickFix, applyQuickFix, suggestQuickFix, undoQuickFix, runQuickFixAction } from "@/lib/seo/api";
import { ENTITY_LABELS, SEVERITY, CATEGORY_LABELS } from "@/lib/seo/constants";
import { ScoreRing } from "./score-ring";
import { SerpPreview } from "./serp-preview";
import { TrafficDot } from "./severity-icon";
import { FieldEditor, fa } from "./quick-fix-fields";
import { ActionPanel } from "./quick-fix-actions";

const decode = (p) => {
  try {
    return decodeURI(p || "");
  } catch {
    return p || "";
  }
};

// گروه فیلد → نوع «پیشنهاد» سمت سرور
const SUGGEST_BY_GROUP = { meta: "meta", keyword: "meta", content: "content", images: "alt", links: "links" };
const GROUP_LABELS = { meta: "عنوان و توضیحات متا", keyword: "کلمه‌ی کلیدی", content: "محتوا", images: "تصاویر", links: "لینک‌دهی" };
const GROUP_ORDER = ["meta", "keyword", "content", "images", "links"];
const SUGGEST_LABEL = { meta: "پیشنهاد هوشمند", content: "پیشنهاد هوشمند", alt: "پر کردن خودکار", links: "پیشنهاد لینک" };

function ScoreDelta({ before, after, delta, loading }) {
  const up = delta > 0;
  const same = !delta;
  return (
    <div className="flex shrink-0 items-center gap-2.5" dir="rtl">
      <div className="text-center">
        <ScoreRing score={before} size={52} stroke={5} showLabel={false} />
        <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">فعلی</p>
      </div>
      <ArrowLeft size={14} className="mb-3 text-[var(--text-faint)]" />
      <div className={cn("text-center transition-opacity", loading && "opacity-50")}>
        <ScoreRing score={after} size={52} stroke={5} showLabel={false} />
        <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">پس از رفع</p>
      </div>
      <div className={cn("mb-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums", same ? "bg-[var(--surface-muted)] text-[var(--text-muted)]" : up ? "bg-[var(--success-bg)] text-[var(--success)]" : "bg-[var(--danger-bg)] text-[var(--danger)]")} dir="ltr">
        {same ? null : up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {up ? "+" : ""}
        {fa(delta || 0)}
      </div>
    </div>
  );
}

/**
 * رفع سریع / راهنمای رفع یک صفحه‌ی گزارش‌شده.
 * props: reportId, open, onOpenChange, focusCheck (چکی که ادمین از آن آمده)،
 *        onNext() → مورد بعدیِ همان لیست، onSaved() → تازه‌سازی لیست‌ها
 */
export function QuickFixDialog({ reportId, open, onOpenChange, focusCheck = null, onNext = null, onSaved = null }) {
  const { data, isLoading, error } = useQuery({ queryKey: ["seo-quickfix", reportId], queryFn: () => fetchQuickFix(reportId), enabled: !!reportId && open, staleTime: Infinity, gcTime: 0, refetchOnWindowFocus: false });
  // نتیجه‌ی آخرین ذخیره/اقدام؛ به شناسه‌ی گزارش گره خورده
  const [resultState, setResultState] = useState(null);
  const result = resultState && resultState.reportId === reportId ? resultState : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-6xl overflow-hidden p-0" showClose>
        {isLoading || (!data && !error) ? (
          <div className="space-y-3 p-6">
            <DialogTitle className="sr-only">در حال بارگذاری</DialogTitle>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="p-10 text-center text-sm">
            <DialogTitle className="sr-only">خطا</DialogTitle>
            <AlertTriangle className="mx-auto mb-2 text-[var(--warning)]" />
            <p className="text-[var(--text)]">{error?.response?.data?.message || "بارگذاری ناموفق بود"}</p>
          </div>
        ) : (
          <QuickFixForm
            key={`${reportId}:${data.report?.updatedAt}`}
            data={data}
            reportId={reportId}
            focusCheck={focusCheck}
            onNext={onNext}
            onSaved={onSaved}
            onOpenChange={onOpenChange}
            result={result}
            setResult={(r) => setResultState(r ? { ...r, reportId } : null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickFixForm({ data, reportId, focusCheck, onNext, onSaved, onOpenChange, result, setResult }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const report = data.report;
  // اگر بک‌اند هنوز نسخه‌ی قدیمی باشد solutions/fields نمی‌آید؛ مودال نباید بشکند
  const failing = useMemo(() => (data.failing || []).map((c) => ({ ...c, solutions: c.solutions || [], fields: c.fields || [], manual: c.manual ?? "برای این مورد از «ویرایش کامل» استفاده کنید." })), [data]);
  const initial = useMemo(() => Object.fromEntries((data.fields || []).map((f) => [f.key, f.value])), [data]);

  const [draft, setDraft] = useState(initial);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [suggesting, setSuggesting] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [activeId, setActiveId] = useState(() => (failing.find((c) => c.id === focusCheck) || failing.find((c) => c.solutions.length) || failing[0] || {}).id || null);
  const [picked, setPicked] = useState({}); // checkId → solutionId
  const [mode, setMode] = useState("issue"); // issue | all
  const [openAction, setOpenAction] = useState(null);
  const seq = useRef(0);

  const active = failing.find((c) => c.id === activeId) || null;
  const solId = active ? picked[active.id] || (active.solutions.find((s) => s.recommended) || active.solutions[0] || {}).id : null;

  const patch = useMemo(() => {
    const p = {};
    for (const [k, v] of Object.entries(draft)) if (JSON.stringify(v) !== JSON.stringify(initial[k])) p[k] = v;
    return p;
  }, [draft, initial]);
  const dirty = Object.keys(patch).length > 0;
  const patchKey = JSON.stringify(patch);

  // پیش‌نمایش زنده‌ی نمره (بدون ذخیره)
  useEffect(() => {
    if (!dirty) return undefined;
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      setPreviewing(true);
      try {
        const r = await previewQuickFix(reportId, patch);
        if (seq.current === mine) setPreview(r);
      } catch {
        if (seq.current === mine) setPreview(null);
      } finally {
        if (seq.current === mine) setPreviewing(false);
      }
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patchKey, reportId]);
  const shownPreview = dirty && !result ? preview : null;

  const invalidate = (resolved) => {
    ["seo-issues", "seo-issue-pages", "seo-pages", "seo-overview", "seo-health", "seo-page"].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
    if (!resolved) queryClient.invalidateQueries({ queryKey: ["seo-quickfix", reportId] });
    onSaved?.();
  };

  const save = useMutation({
    mutationFn: () => applyQuickFix(reportId, patch),
    onSuccess: (r) => {
      if (!r.changed) return toast.info("تغییری برای ذخیره نبود");
      setResult({ ...r, kind: "fields", message: "تغییرات ذخیره شد و روی سایت اعمال شد" });
      invalidate(false);
      toast.success(`ذخیره شد · نمره ${fa(r.before.score)} ← ${fa(r.after.score)}`);
    },
    onError: (e) => toast.error("ذخیره نشد", e?.response?.data?.message || "خطای سرور"),
  });

  const action = useMutation({
    mutationFn: ({ id, params }) => runQuickFixAction(reportId, id, params),
    onSuccess: (r) => {
      setResult({ ...r, kind: "action" });
      invalidate(!!r.resolved);
      toast.success(r.message || "انجام شد");
    },
    onError: (e) => toast.error("اقدام انجام نشد", e?.response?.data?.message || "خطای سرور"),
  });

  const undo = useMutation({
    mutationFn: () => undoQuickFix(result.jobId),
    onSuccess: () => {
      toast.success("تغییرات برگردانده شد");
      setResult(null);
      invalidate(false);
      onOpenChange(false);
    },
    onError: (e) => toast.error("برگرداندن ممکن نشد", e?.response?.data?.message || ""),
  });

  const runSuggest = async (group) => {
    setSuggesting(group);
    try {
      const r = await suggestQuickFix(reportId, group);
      setDraft((d) => ({ ...d, ...r.patch }));
      toast.success(r.source === "ai" ? "پیشنهاد هوشمند اعمال شد — قبل از ذخیره بازبینی کنید" : "پیشنهاد اعمال شد — قبل از ذخیره بازبینی کنید");
    } catch (e) {
      toast.error("پیشنهاد ناموفق", e?.response?.data?.message || "دوباره تلاش کنید");
    } finally {
      setSuggesting("");
    }
  };

  // فیلدهای پنل «ویرایش مستقیم»: اول فیلدهای همین مشکل، بقیه جمع‌شده
  const fieldsByKey = useMemo(() => Object.fromEntries((data.fields || []).map((f) => [f.key, f])), [data]);
  const focusKeys = active?.fields?.length ? active.fields : (data.fields || []).map((f) => f.key);
  const focusFields = focusKeys.map((k) => fieldsByKey[k]).filter(Boolean);
  const otherFields = (data.fields || []).filter((f) => !focusKeys.includes(f.key));
  const suggestGroups = [...new Set(focusFields.map((f) => SUGGEST_BY_GROUP[f.group]).filter(Boolean))];

  const beforeScore = result ? result.before.score : report.score;
  const afterScore = result ? result.after.score : shownPreview ? shownPreview.after.score : report.score;
  const delta = result ? result.delta : shownPreview ? shownPreview.delta : 0;
  const fixedList = result ? result.fixed || [] : shownPreview?.fixed || [];
  const brokenList = result ? result.broken || [] : shownPreview?.broken || [];
  const resolved = !!result?.resolved;
  const hasSeoFields = !!fieldsByKey.seoTitle;
  const nextAvailable = !!onNext;

  return (
    <div className="flex h-[88vh] max-h-[860px] flex-col" dir="rtl">
      {/* ---------- سربرگ ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-6 py-4 pl-14">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="brand" size="sm">{ENTITY_LABELS[report.entityType] || report.entityType}</Badge>
            <Badge variant="neutral" size="sm">
              <Wand2 size={10} />
              {data.readOnly ? "راهنمای رفع" : "رفع سریع"}
            </Badge>
          </div>
          <DialogTitle className="truncate text-lg leading-8">{report.label}</DialogTitle>
          <DialogDescription className="mt-0 max-w-full truncate text-xs" dir="ltr" title={decode(report.path)}>
            {decode(report.path)}
          </DialogDescription>
          <div className="mt-1.5 flex gap-4 text-[11px]">
            {report.editUrl && (
              <Link href={report.editUrl} className="flex items-center gap-1 text-[var(--brand-600)] hover:underline">
                <Pencil size={11} />
                ویرایش کامل
              </Link>
            )}
            {report.url && (
              <a href={report.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[var(--text-muted)] hover:underline">
                <ExternalLink size={11} />
                مشاهده در سایت
              </a>
            )}
          </div>
        </div>
        <ScoreDelta before={beforeScore} after={afterScore} delta={delta} loading={previewing} />
      </div>

      {/* ---------- بدنه ---------- */}
      <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1fr)_330px]">
        {/* ستون کار */}
        <div className="min-h-0 min-w-0 space-y-5 overflow-y-auto p-6">
          {result && (
            <div className="rounded-[var(--radius-lg)] border border-[var(--success)]/40 bg-[var(--success-bg)] p-4">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--success)]">
                <Check size={16} />
                {result.message || "انجام شد"}
                {!resolved && <span className="font-normal text-[var(--text-muted)]">— نمره {fa(result.before.score)} ← {fa(result.after.score)}</span>}
              </p>
              {resolved && <p className="mt-1 text-xs text-[var(--text-muted)]">این صفحه با این اقدام از فهرست مشکلات کنار رفت.</p>}
              {report.entityType === "product" && !resolved && <p className="mt-1 text-xs text-[var(--text-muted)]">تغییرات محصول ظرف چند دقیقه (کش ۵ دقیقه‌ای) روی سایت دیده می‌شود.</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" loading={undo.isPending} onClick={() => undo.mutate()}>
                  <Undo2 size={13} />
                  برگرداندن
                </Button>
                {nextAvailable && (
                  <Button size="sm" onClick={() => { setResult(null); onNext(); }}>
                    <SkipForward size={13} />
                    مورد بعدی
                  </Button>
                )}
              </div>
            </div>
          )}

          {!data.readOnly && (
            <div className="flex gap-1 rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-1 text-xs">
              {[["issue", "مشکل انتخاب‌شده"], ["all", "همه‌ی ویرایش‌های این صفحه"]].map(([k, label]) => (
                <button key={k} type="button" onClick={() => setMode(k)} className={cn("flex-1 rounded-[var(--radius-sm)] px-3 py-2 font-medium transition-colors", mode === k ? "bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-sm)]" : "text-[var(--text-muted)] hover:text-[var(--text)]")}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {mode === "all" && !data.readOnly ? (
            <div className={cn("space-y-6", resolved && "pointer-events-none opacity-40")}>
              {data.visibility && (
                <section className="space-y-3">
                  <h4 className="text-xs font-bold text-[var(--text-muted)]">وضعیت ایندکس و انتشار</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.visibility.state.map((st) => (
                      <span key={st.key} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs", st.ok ? "bg-[var(--success-bg)] text-[var(--success)]" : "bg-[var(--warning-bg)] text-[var(--warning)]")}>
                        {st.ok ? <Check size={12} /> : <AlertTriangle size={12} />}
                        {st.label}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {data.visibility.actions.map((a) => {
                      const open = openAction === a.id;
                      return (
                        <div key={a.id} className={cn("overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--surface)]", open ? "border-[var(--brand-400)]" : "border-[var(--border)]")}>
                          <button type="button" onClick={() => setOpenAction(open ? null : a.id)} className="flex w-full items-start gap-3 p-3 text-start">
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-[var(--text)]">{a.label}</span>
                                {a.danger && <Badge variant="warning" size="sm">اثر روی سایت</Badge>}
                              </span>
                              <span className="mt-0.5 block text-xs leading-5 text-[var(--text-muted)]">{a.description}</span>
                            </span>
                            <ChevronDown size={15} className={cn("mt-1 shrink-0 text-[var(--text-faint)] transition-transform", open && "rotate-180")} />
                          </button>
                          {open && (
                            <div className="border-t border-[var(--border)] bg-[var(--surface-muted)]/40 p-4">
                              <ActionPanel solution={a} reportId={reportId} busy={action.isPending} onRun={(id, params) => action.mutate({ id, params })} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
              {GROUP_ORDER.filter((g) => (data.fields || []).some((f) => f.group === g)).map((g) => (
                <section key={g} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[var(--text-muted)]">{GROUP_LABELS[g]}</h4>
                    {SUGGEST_BY_GROUP[g] && (
                      <Button size="sm" variant="secondary" type="button" loading={suggesting === SUGGEST_BY_GROUP[g]} onClick={() => runSuggest(SUGGEST_BY_GROUP[g])}>
                        <Sparkles size={12} />
                        {SUGGEST_LABEL[SUGGEST_BY_GROUP[g]]}
                      </Button>
                    )}
                  </div>
                  {(data.fields || []).filter((f) => f.group === g).map((f) => (
                    <FieldEditor key={f.key} field={f} value={draft[f.key]} onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))} />
                  ))}
                </section>
              ))}
            </div>
          ) : (
          <div className={cn("space-y-5", resolved && "pointer-events-none opacity-40")}>
            {failing.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] bg-[var(--success-bg)] p-6 text-center text-sm text-[var(--success)]">🎉 این صفحه مشکلی ندارد.</div>
            ) : !active ? null : (
              <>
                {/* مشکل فعال */}
                <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex items-start gap-3">
                    <TrafficDot status={active.status} className="mt-2" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold leading-6 text-[var(--text)]">{active.title}</h3>
                        <Badge variant={SEVERITY[active.status]?.badge} size="sm">{SEVERITY[active.status]?.label}</Badge>
                        <Badge variant="neutral" size="sm">{CATEGORY_LABELS[active.category] || active.category}</Badge>
                      </div>
                      {active.message && active.message !== active.title && <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{active.message}</p>}
                    </div>
                  </div>
                  {active.why && (
                    <p className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-3 py-2 text-xs leading-6 text-[var(--text-muted)]">
                      <Info size={14} className="mt-1 shrink-0 text-[var(--info)]" />
                      {active.why}
                    </p>
                  )}
                  {active.reason && (
                    <p className="mt-2 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning-bg)] px-3 py-2 text-xs leading-6 text-[var(--warning)]">
                      <Lightbulb size={14} className="mt-1 shrink-0" />
                      <span>
                        <b>علت تشخیص‌داده‌شده:</b> {active.reason.label}
                        {active.reason.rule ? <span dir="ltr"> ({active.reason.rule})</span> : null}
                      </span>
                    </p>
                  )}
                  {active.detail?.links?.length > 0 && (
                    <ul className="mt-2 space-y-1 text-[11px] text-[var(--text-faint)]" dir="ltr">
                      {active.detail.links.map((l, i) => (
                        <li key={i} className="truncate">• {typeof l === "string" ? l : `${l.url}${l.status ? ` (${l.status})` : ""}`}</li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* راه‌حل‌ها */}
                {active.solutions.length > 0 ? (
                  <section className="space-y-2.5">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)]">
                      <Zap size={13} className="text-[var(--brand-500)]" />
                      چه کار کنیم؟ {active.solutions.length > 1 ? `(${fa(active.solutions.length)} راه‌حل)` : ""}
                    </h4>
                    {active.solutions.map((s) => {
                      const open = s.id === solId;
                      return (
                        <div key={s.id} className={cn("overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--surface)] transition-colors", open ? "border-[var(--brand-400)] shadow-[var(--shadow-sm)]" : "border-[var(--border)]")}>
                          <button type="button" onClick={() => setPicked((p) => ({ ...p, [active.id]: s.id }))} className="flex w-full items-start gap-3 p-3.5 text-start">
                            <span className={cn("mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2", open ? "border-[var(--brand-600)]" : "border-[var(--border)]")}>{open && <span className="h-2 w-2 rounded-full bg-[var(--brand-600)]" />}</span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-[var(--text)]">{s.label}</span>
                                {s.recommended && <Badge variant="success" size="sm">پیشنهادی</Badge>}
                                {s.danger && <Badge variant="warning" size="sm">اثر روی سایت</Badge>}
                              </span>
                              <span className="mt-0.5 block text-xs leading-5 text-[var(--text-muted)]">{s.description}</span>
                            </span>
                            <ChevronDown size={15} className={cn("mt-1 shrink-0 text-[var(--text-faint)] transition-transform", open && "rotate-180")} />
                          </button>
                          {open && (
                            <div className="border-t border-[var(--border)] bg-[var(--surface-muted)]/40 p-4">
                              {s.kind === "fields" ? (
                                <div className="space-y-4">
                                  {suggestGroups.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {suggestGroups.map((g) => (
                                        <Button key={g} size="sm" variant="secondary" type="button" loading={suggesting === g} onClick={() => runSuggest(g)}>
                                          <Sparkles size={12} />
                                          {SUGGEST_LABEL[g]}
                                        </Button>
                                      ))}
                                    </div>
                                  )}
                                  {focusFields.map((f) => (
                                    <FieldEditor key={f.key} field={f} value={draft[f.key]} focused onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))} />
                                  ))}
                                  {otherFields.length > 0 && (
                                    <div>
                                      <button type="button" className="text-xs font-medium text-[var(--brand-600)] hover:underline" onClick={() => setShowOther((v) => !v)}>
                                        {showOther ? "بستن فیلدهای دیگر" : `فیلدهای دیگر این صفحه (${fa(otherFields.length)})`}
                                      </button>
                                      {showOther && (
                                        <div className="mt-3 space-y-3">
                                          {otherFields.map((f) => (
                                            <FieldEditor key={f.key} field={f} value={draft[f.key]} onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))} />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : s.kind === "link" ? (
                                <Link href={s.href}>
                                  <Button>
                                    <ExternalLink size={14} />
                                    {s.label}
                                  </Button>
                                </Link>
                              ) : (
                                <ActionPanel solution={s} reportId={reportId} busy={action.isPending} onRun={(id, params) => action.mutate({ id, params })} />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </section>
                ) : (
                  <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-4">
                    <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)]">
                      <Wrench size={13} />
                      راهنمای رفع دستی
                    </h4>
                    <p className="text-xs leading-6 text-[var(--text-muted)]">{active.manual}</p>
                    {active.howToFix && <p className="mt-2 text-xs leading-6 text-[var(--text)]">{active.howToFix}</p>}
                    {report.editUrl && (
                      <Link href={report.editUrl} className="mt-3 inline-block">
                        <Button size="sm" variant="outline">
                          <Pencil size={12} />
                          ویرایش کامل صفحه
                        </Button>
                      </Link>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
          )}
        </div>

        {/* ستون کناری */}
        <aside className="min-h-0 min-w-0 space-y-4 overflow-y-auto border-[var(--border)] bg-[var(--surface-muted)]/30 p-5 md:border-r">
          {hasSeoFields && <SerpPreview title={draft.seoTitle || report.label} description={draft.seoDescription} path={decode(report.path)} />}

          {(fixedList.length > 0 || brokenList.length > 0) && (
            <div className="space-y-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-xs">
              {fixedList.length > 0 && <p className="font-semibold text-[var(--success)]">{fa(fixedList.length)} مشکل {result ? "رفع شد" : "رفع می‌شود"}</p>}
              {fixedList.map((c) => (
                <p key={c.id} className="flex items-start gap-1.5 leading-5 text-[var(--text-muted)]">
                  <Check size={12} className="mt-1 shrink-0 text-[var(--success)]" />
                  {c.title}
                </p>
              ))}
              {brokenList.length > 0 && <p className="pt-1 font-semibold text-[var(--warning)]">{fa(brokenList.length)} مورد جدید بررسی می‌شود</p>}
              {brokenList.map((c) => (
                <p key={c.id} className="flex items-start gap-1.5 leading-5 text-[var(--text-muted)]">
                  <AlertTriangle size={12} className="mt-1 shrink-0 text-[var(--warning)]" />
                  {c.message || c.title}
                </p>
              ))}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-bold text-[var(--text-muted)]">مشکلات این صفحه ({fa(failing.length)})</p>
            <ul className="space-y-1">
              {failing.map((c) => {
                const fixed = fixedList.some((x) => x.id === c.id);
                const fixable = c.solutions.length > 0;
                return (
                  <li key={c.id}>
                    <button type="button" onClick={() => setActiveId(c.id)} className={cn("flex w-full items-start gap-2 rounded-[var(--radius-md)] border px-2.5 py-2 text-start transition-colors", c.id === activeId ? "border-[var(--brand-300)] bg-[var(--brand-50)]" : "border-transparent hover:bg-[var(--surface)]")}>
                      {fixed ? <Check size={13} className="mt-1 shrink-0 text-[var(--success)]" /> : <TrafficDot status={c.status} className="mt-1.5" />}
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-[12px] leading-5 text-[var(--text)]", fixed && "text-[var(--text-faint)] line-through")}>{c.message && c.message !== c.title ? c.message : c.title}</span>
                        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--text-faint)]">
                          {fixable ? <><Zap size={9} className="text-[var(--brand-500)]" />رفع سریع</> : <><Wrench size={9} />راهنمای دستی</>}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>

      {/* ---------- پاورقی ---------- */}
      <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-6 py-3">
        <p className="text-[11px] text-[var(--text-faint)]">{dirty ? `${fa(Object.keys(patch).length)} فیلد تغییر کرده — هنوز ذخیره نشده` : data.readOnly ? "این نوع صفحه رفع سریع ندارد" : "تغییری نداده‌اید"}</p>
        <div className="flex gap-2">
          {nextAvailable && (
            <Button variant="ghost" onClick={() => onNext()}>
              <SkipForward size={14} />
              رد کردن
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            بستن
          </Button>
          {!data.readOnly && (
            <Button disabled={!dirty || save.isPending || resolved} loading={save.isPending} onClick={() => save.mutate()}>
              <Check size={14} />
              ذخیره{shownPreview && shownPreview.delta !== 0 ? ` (${shownPreview.delta > 0 ? "+" : ""}${fa(shownPreview.delta)})` : ""}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
