"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Plus, Sparkles, Trash2, Undo2, TrendingUp, TrendingDown, ExternalLink, AlertTriangle, Wand2, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TagInput } from "@/components/ui/tag-input";
import { useToast } from "@/components/ui/toast";
import { fetchQuickFix, previewQuickFix, applyQuickFix, suggestQuickFix, undoQuickFix } from "@/lib/seo/api";
import { ENTITY_LABELS, SEVERITY, scoreColor } from "@/lib/seo/constants";
import { ScoreRing } from "./score-ring";
import { SerpPreview } from "./serp-preview";
import { TrafficDot } from "./severity-icon";

const fa = (n) => Number(n ?? 0).toLocaleString("fa-IR");
const GROUP_LABELS = { meta: "عنوان و توضیحات متا", keyword: "کلمه‌ی کلیدی", content: "محتوا", images: "تصاویر", links: "لینک‌دهی" };
const GROUP_ORDER = ["meta", "keyword", "content", "images", "links"];
// هر گروه با کدام «پیشنهاد» پر می‌شود
const SUGGEST_GROUP = { meta: "meta", keyword: "meta", content: "content", images: "alt", links: "links" };
const SUGGEST_LABEL = { meta: "پیشنهاد هوشمند", content: "پیشنهاد هوشمند", alt: "پر کردن خودکار", links: "پیشنهاد لینک" };

const TEXTAREA = "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-faint)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]";

function Counter({ value, min, max }) {
  const n = Array.from(String(value || "")).length;
  if (!min && !max) return null;
  const ok = n >= (min || 0) && n <= (max || Infinity);
  return <span dir="ltr" className={cn("tabular-nums", n === 0 ? "text-[var(--text-faint)]" : ok ? "text-[var(--success)]" : "text-[var(--warning)]")}>{fa(n)}{max ? ` / ${fa(max)}` : ""}</span>;
}

function FieldShell({ field, focused, children, extra }) {
  return (
    <div data-field={field.key} className={cn("rounded-[var(--radius-md)] border p-3 transition-colors", focused ? "border-[var(--brand-400)] bg-[var(--brand-50)]/40" : "border-[var(--border)]")}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-[var(--text)]">{field.label}</label>
        {extra}
      </div>
      {children}
      {field.hint ? <p className="mt-1.5 text-[11px] leading-5 text-[var(--text-faint)]">{field.hint}</p> : null}
    </div>
  );
}

function FieldEditor({ field, value, onChange, focused }) {
  switch (field.kind) {
    case "text":
      return (
        <FieldShell field={field} focused={focused} extra={<Counter value={value} min={field.min} max={field.max} />}>
          <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />
        </FieldShell>
      );
    case "textarea":
    case "markdown":
      return (
        <FieldShell field={field} focused={focused} extra={<Counter value={value} min={field.min} max={field.kind === "textarea" ? field.max : undefined} />}>
          <textarea className={cn(TEXTAREA, field.kind === "markdown" && "font-mono text-[13px]")} rows={field.rows || 4} value={value || ""} onChange={(e) => onChange(e.target.value)} />
        </FieldShell>
      );
    case "tags":
      return (
        <FieldShell field={field} focused={focused}>
          <TagInput value={value || []} onChange={onChange} placeholder="کلمه را بنویسید و Enter بزنید" />
        </FieldShell>
      );
    case "alts":
      return (
        <FieldShell field={field} focused={focused}>
          {(field.images || []).length === 0 ? (
            <p className="text-xs text-[var(--text-faint)]">تصویری ثبت نشده.</p>
          ) : (
            <div className="space-y-2">
              {field.images.map((url, i) => (
                <div key={url + i} className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-10 w-10 shrink-0 rounded border border-[var(--border)] object-cover" />
                  <Input value={(value || [])[i] || ""} placeholder={`توصیف تصویر ${fa(i + 1)}`} onChange={(e) => onChange(field.images.map((_, j) => (j === i ? e.target.value : (value || [])[j] || "")))} />
                </div>
              ))}
            </div>
          )}
        </FieldShell>
      );
    case "faqs": {
      const list = value || [];
      return (
        <FieldShell field={field} focused={focused} extra={<Button size="sm" variant="ghost" type="button" onClick={() => onChange([...list, { question: "", answer: "" }])}><Plus size={12} />پرسش جدید</Button>}>
          <div className="space-y-2">
            {list.map((f, i) => (
              <div key={i} className="space-y-1.5 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-2">
                <div className="flex gap-2">
                  <Input value={f.question} placeholder="پرسش" onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} />
                  <Button size="icon" variant="ghost" type="button" className="h-10 w-8" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="حذف"><Trash2 size={14} /></Button>
                </div>
                <textarea className={TEXTAREA} rows={2} value={f.answer} placeholder="پاسخ" onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} />
              </div>
            ))}
            {list.length === 0 && <p className="text-xs text-[var(--text-faint)]">هنوز پرسشی نیست.</p>}
          </div>
        </FieldShell>
      );
    }
    case "links": {
      const list = value || [];
      return (
        <FieldShell field={field} focused={focused} extra={<Button size="sm" variant="ghost" type="button" onClick={() => onChange([...list, { text: "", url: "" }])}><Plus size={12} />لینک جدید</Button>}>
          <div className="space-y-2">
            {list.map((l, i) => (
              <div key={i} className="flex gap-2">
                <Input value={l.text} placeholder="متن لینک" onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
                <Input dir="ltr" value={l.url} placeholder="/product/slug" onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                <Button size="icon" variant="ghost" type="button" className="h-10 w-8 shrink-0" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="حذف"><Trash2 size={14} /></Button>
              </div>
            ))}
            {list.length === 0 && <p className="text-xs text-[var(--text-faint)]">لینکی اضافه نشده؛ «پیشنهاد لینک» را بزنید یا دستی اضافه کنید.</p>}
          </div>
        </FieldShell>
      );
    }
    default:
      return null;
  }
}

function ScoreDelta({ before, after, delta, loading }) {
  const up = delta > 0;
  const same = delta === 0;
  return (
    <div className="flex items-center gap-3">
      <div className="text-center">
        <ScoreRing score={before} size={64} stroke={6} showLabel={false} />
        <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">فعلی</p>
      </div>
      <ArrowLeft size={16} className="text-[var(--text-faint)]" />
      <div className={cn("text-center transition-opacity", loading && "opacity-50")}>
        <ScoreRing score={after} size={64} stroke={6} showLabel={false} />
        <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">پس از ذخیره</p>
      </div>
      <div className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums", same ? "bg-[var(--surface-muted)] text-[var(--text-muted)]" : up ? "bg-[var(--success-bg)] text-[var(--success)]" : "bg-[var(--danger-bg)] text-[var(--danger)]")} dir="ltr">
        {same ? null : up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {up ? "+" : ""}{fa(delta)}
      </div>
    </div>
  );
}

/**
 * رفع سریع یک صفحه‌ی گزارش‌شده: فیلدهای مربوط را همان‌جا ویرایش، نمره‌ی بعد از
 * ذخیره را زنده ببین، ذخیره کن (واقعاً روی محصول/مقاله/دسته نوشته می‌شود) و در
 * صورت نیاز برگردان.
 *
 * props: reportId, open, onOpenChange, focusCheck (چکی که ادمین از آن آمده)،
 *        onNext() → رفتن به مورد بعدیِ لیست، onSaved() → تازه‌سازی لیست‌ها
 */
export function QuickFixDialog({ reportId, open, onOpenChange, focusCheck = null, onNext = null, onSaved = null }) {
  const { data, isLoading, error } = useQuery({ queryKey: ["seo-quickfix", reportId], queryFn: () => fetchQuickFix(reportId), enabled: !!reportId && open, staleTime: 0, gcTime: 0 });
  // نتیجه‌ی ذخیره فقط برای همان صفحه معتبر است (به شناسه‌ی گزارش گره خورده)
  const [resultState, setResultState] = useState(null);
  const result = resultState && resultState.reportId === reportId ? resultState : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0" showClose>
        {isLoading || (!data && !error) ? (
          <div className="space-y-3 p-6"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
        ) : error ? (
          <div className="p-8 text-center text-sm">
            <AlertTriangle className="mx-auto mb-2 text-[var(--warning)]" />
            <DialogTitle className="sr-only">خطا</DialogTitle>
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
  const initial = useMemo(() => Object.fromEntries((data.fields || []).map((f) => [f.key, f.value])), [data]);
  const [draft, setDraft] = useState(initial);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [suggesting, setSuggesting] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [activeCheck, setActiveCheck] = useState(focusCheck);
  const seq = useRef(0);

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

  const invalidate = () => {
    ["seo-issues", "seo-issue-pages", "seo-pages", "seo-overview", "seo-health", "seo-page"].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
    onSaved?.();
  };

  const save = useMutation({
    mutationFn: () => applyQuickFix(reportId, patch),
    onSuccess: (r) => {
      if (!r.changed) return toast.info("تغییری برای ذخیره نبود");
      setResult(r);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["seo-quickfix", reportId] });
      toast.success(`ذخیره شد · نمره ${fa(r.before.score)} ← ${fa(r.after.score)}`);
    },
    onError: (e) => toast.error("ذخیره نشد", e?.response?.data?.message || "خطای سرور"),
  });

  const undo = useMutation({
    mutationFn: () => undoQuickFix(result.jobId),
    onSuccess: () => {
      toast.success("تغییرات برگردانده شد");
      setResult(null);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["seo-quickfix", reportId] });
    },
    onError: (e) => toast.error("برگرداندن ممکن نشد", e?.response?.data?.message || ""),
  });

  const runSuggest = async (group) => {
    setSuggesting(group);
    try {
      const r = await suggestQuickFix(reportId, group);
      setDraft((d) => ({ ...d, ...r.patch }));
      toast.success(r.source === "ai" ? "پیشنهاد هوشمند اعمال شد — قبل از ذخیره بازبینی کنید" : "پیشنهاد اعمال شد");
    } catch (e) {
      toast.error("پیشنهاد ناموفق", e?.response?.data?.message || "دوباره تلاش کنید");
    } finally {
      setSuggesting("");
    }
  };

  const report = data.report;
  const failing = useMemo(() => data.failing || [], [data]);
  const focusFields = useMemo(() => new Set(failing.find((x) => x.id === activeCheck)?.fields || []), [failing, activeCheck]);
  const grouped = useMemo(() => {
    const g = {};
    for (const f of data.fields || []) (g[f.group] ||= []).push(f);
    return g;
  }, [data]);

  const fixableFailing = failing.filter((c) => c.fields.length > 0);
  const otherFailing = failing.filter((c) => c.fields.length === 0);
  const beforeScore = result ? result.before.score : report.score;
  const afterScore = result ? result.after.score : shownPreview ? shownPreview.after.score : report.score;
  const delta = result ? result.delta : shownPreview ? shownPreview.delta : 0;
  const fixedList = result ? result.fixed : shownPreview?.fixed || [];
  const brokenList = result ? result.broken : shownPreview?.broken || [];

  const renderGroup = (gk, fields, dim) => (
    <section key={gk} className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[var(--text-muted)]">{GROUP_LABELS[gk]}</h4>
        {SUGGEST_LABEL[SUGGEST_GROUP[gk]] && (gk !== "keyword" || !grouped.meta) && (
          <Button size="sm" variant="ghost" type="button" loading={suggesting === SUGGEST_GROUP[gk]} onClick={() => runSuggest(SUGGEST_GROUP[gk])}>
            <Sparkles size={12} />
            {SUGGEST_LABEL[SUGGEST_GROUP[gk]]}
          </Button>
        )}
      </div>
      <div className={cn("space-y-2", dim && "opacity-90")}>
        {fields.map((f) => (
          <FieldEditor key={f.key} field={f} value={draft[f.key]} focused={focusFields.has(f.key)} onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))} />
        ))}
      </div>
    </section>
  );

  const hasFocus = focusFields.size > 0;
  const focusGroups = GROUP_ORDER.filter((g) => (grouped[g] || []).some((f) => focusFields.has(f.key)));
  const otherGroups = GROUP_ORDER.filter((g) => grouped[g] && !focusGroups.includes(g));

  return (
      <div className="flex max-h-[90vh] flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5 pl-12">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="brand" size="sm">{ENTITY_LABELS[report.entityType] || report.entityType}</Badge>
              <Badge variant="neutral" size="sm"><Wand2 size={10} />رفع سریع</Badge>
            </div>
            <DialogTitle className="truncate">{report.label}</DialogTitle>
            <DialogDescription className="truncate text-xs" dir="ltr">{report.path}</DialogDescription>
            <div className="mt-2 flex gap-3 text-[11px]">
              {report.editUrl && <Link href={report.editUrl} className="text-[var(--brand-600)] hover:underline">ویرایش کامل</Link>}
              {report.url && <a href={report.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[var(--text-muted)] hover:underline"><ExternalLink size={10} />مشاهده در سایت</a>}
            </div>
          </div>
          <ScoreDelta before={beforeScore} after={afterScore} delta={delta} loading={previewing} />
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5 border-[var(--border)] p-5 md:border-l">
            {result && (
              <div className="rounded-[var(--radius-md)] border border-[var(--success)]/40 bg-[var(--success-bg)] p-3 text-xs">
                <p className="flex items-center gap-1.5 font-semibold text-[var(--success)]"><Check size={14} />ذخیره شد و روی {ENTITY_LABELS[report.entityType]?.split(" ")[0] || "صفحه"} اعمال شد — نمره {fa(result.before.score)} ← {fa(result.after.score)}</p>
                {(report.entityType === "product") && <p className="mt-1 text-[var(--text-muted)]">تغییرات محصول روی سایت ظرف چند ثانیه (کش ۵ دقیقه‌ای) دیده می‌شود.</p>}
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" loading={undo.isPending} onClick={() => undo.mutate()}><Undo2 size={12} />برگرداندن</Button>
                  {onNext && <Button size="sm" onClick={() => { setResult(null); onNext(); }}><SkipForward size={12} />مورد بعدی</Button>}
                </div>
              </div>
            )}

            {hasFocus ? (
              <>
                {focusGroups.map((g) => renderGroup(g, grouped[g]))}
                {otherGroups.length > 0 && (
                  <div>
                    <button type="button" className="text-xs font-medium text-[var(--brand-600)] hover:underline" onClick={() => setShowOther((s) => !s)}>{showOther ? "بستن فیلدهای دیگر" : `فیلدهای دیگر این صفحه (${fa(otherGroups.reduce((n, g) => n + grouped[g].length, 0))})`}</button>
                    {showOther && <div className="mt-3 space-y-5">{otherGroups.map((g) => renderGroup(g, grouped[g], true))}</div>}
                  </div>
                )}
              </>
            ) : (
              GROUP_ORDER.filter((g) => grouped[g]).map((g) => renderGroup(g, grouped[g]))
            )}
          </div>

          <aside className="space-y-4 p-5">
            <SerpPreview title={draft.seoTitle || report.label} description={draft.seoDescription} path={report.path} />

            {(fixedList.length > 0 || brokenList.length > 0) && (
              <div className="space-y-1.5 rounded-[var(--radius-md)] border border-[var(--border)] p-3 text-xs">
                {fixedList.length > 0 && <p className="font-semibold text-[var(--success)]">{fa(fixedList.length)} مشکل رفع می‌شود</p>}
                {fixedList.map((c) => <p key={c.id} className="flex items-start gap-1.5 text-[var(--text-muted)]"><Check size={12} className="mt-0.5 shrink-0 text-[var(--success)]" />{c.title}</p>)}
                {brokenList.length > 0 && <p className="pt-1 font-semibold text-[var(--warning)]">{fa(brokenList.length)} مورد جدید بررسی می‌شود</p>}
                {brokenList.map((c) => <p key={c.id} className="flex items-start gap-1.5 text-[var(--text-muted)]"><AlertTriangle size={12} className="mt-0.5 shrink-0 text-[var(--warning)]" />{c.message || c.title}</p>)}
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs font-semibold text-[var(--text-muted)]">مشکلات این صفحه ({fa(failing.length)})</p>
              <ul className="space-y-0.5">
                {fixableFailing.map((c) => {
                  const fixed = fixedList.some((x) => x.id === c.id);
                  return (
                    <li key={c.id}>
                      <button type="button" onClick={() => { setActiveCheck(c.id); document.querySelector(`[data-field="${c.fields[0]}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }); }} className={cn("flex w-full items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-start text-[12px] hover:bg-[var(--surface-muted)]", activeCheck === c.id && "bg-[var(--brand-50)]")}>
                        {fixed ? <Check size={13} className="mt-0.5 shrink-0 text-[var(--success)]" /> : <TrafficDot status={c.status} className="mt-1.5" />}
                        <span className={cn("min-w-0 flex-1", fixed && "text-[var(--text-faint)] line-through")}>{c.message && c.message !== c.title ? c.message : c.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {otherFailing.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-[11px] text-[var(--text-faint)]">نیازمند ویرایش در خود صفحه/کد ({fa(otherFailing.length)})</p>
                  <ul className="space-y-0.5">
                    {otherFailing.map((c) => (
                      <li key={c.id} className="flex items-start gap-2 px-2 py-1 text-[11px] text-[var(--text-muted)]">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SEVERITY[c.status]?.color }} />
                        <span className="min-w-0 flex-1">{c.message && c.message !== c.title ? c.message : c.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] p-4">
          <p className="text-[11px] text-[var(--text-faint)]">{dirty ? `${fa(Object.keys(patch).length)} فیلد تغییر کرده` : "تغییری نداده‌اید"}</p>
          <div className="flex gap-2">
            {onNext && <Button variant="ghost" onClick={() => onNext()}><SkipForward size={14} />رد کردن</Button>}
            <Button variant="outline" onClick={() => onOpenChange(false)}>بستن</Button>
            <Button disabled={!dirty || save.isPending} loading={save.isPending} onClick={() => save.mutate()}>
              <Check size={14} />
              ذخیره{shownPreview && shownPreview.delta !== 0 ? ` (${shownPreview.delta > 0 ? "+" : ""}${fa(shownPreview.delta)})` : ""}
            </Button>
          </div>
        </div>
      </div>
  );
}
