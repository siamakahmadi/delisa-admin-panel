"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Wand2, RefreshCw, Check, Replace, ArrowDownToLine, TriangleAlert } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fetchAiAssistTemplates, runAiAssist } from "@/lib/ai/api";

const GROUPS = [
  { id: "write", label: "نوشتن" },
  { id: "edit", label: "ویرایش" },
  { id: "seo", label: "سئو" },
];

const errMsg = (e) => e?.response?.data?.error || e?.response?.data?.message || e?.message || "خطا در ارتباط با هوش مصنوعی";

/**
 * پنجره‌ی «نویسنده‌ی هوشمند». سه مدل استفاده:
 *  - ویرایشگر متن: selectionText / fullText می‌دهیم؛ onApply({mode:"replace"|"append", html})
 *  - فیلد ساده (عنوان سئو، توضیح متا…): allowedTasks=["seo-title"] و onApply({mode:"replace", text})
 *  - plain=true برای textarea های بدون HTML.
 */
export function AiAssistDialog({
  open,
  onOpenChange,
  selectionText = "",
  fullText = "",
  context = {},
  plain = false,
  allowedTasks = null,
  initialTask = null,
  canAppend = true,
  hasSelection = false,
  onApply,
}) {
  const { data, isLoading } = useQuery({ queryKey: ["ai-assist-templates"], queryFn: fetchAiAssistTemplates, enabled: open, staleTime: 60_000 });
  const templates = useMemo(
    () => (data?.templates || []).filter((t) => !allowedTasks || allowedTasks.includes(t.id)),
    [data, allowedTasks]
  );
  const [task, setTask] = useState(initialTask);
  const [instruction, setInstruction] = useState("");
  const [useSelection, setUseSelection] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setResult(null);
      setError("");
      setInstruction("");
      setUseSelection(true);
      setTask(initialTask || (allowedTasks?.length === 1 ? allowedTasks[0] : null));
    }
  }, [open, initialTask, allowedTasks]);

  const tpl = templates.find((t) => t.id === task);
  const sourceIsSelection = hasSelection && useSelection;
  const sourceText = sourceIsSelection ? selectionText : fullText;

  const run = async () => {
    if (!tpl) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const r = await runAiAssist({
        task: tpl.id,
        [plain ? "text" : "html"]: sourceText || "",
        plain,
        instruction,
        context,
      });
      setResult(r);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const apply = (mode, payload) => {
    onApply?.({ mode, task: tpl?.id, ...payload });
    onOpenChange(false);
  };

  const unavailable = data && data.available === false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto" dir="rtl">
        <DialogTitle className="flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--brand-600)]" /> نویسنده‌ی هوشمند
        </DialogTitle>
        <DialogDescription>یک قالب انتخاب کنید؛ نتیجه فقط پیشنهاد است و تا تأیید شما در محتوا اعمال نمی‌شود.</DialogDescription>

        {isLoading ? (
          <Skeleton className="mt-4 h-40 w-full" />
        ) : unavailable ? (
          <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--warning-bg)] p-3 text-sm text-[var(--warning)]">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p>{data.reason || "سرویس هوش مصنوعی تنظیم نشده یا غیرفعال است."}</p>
              {data.diagnostic && (
                <p className="font-mono text-[11px] opacity-80" dir="ltr">
                  enabled={String(data.diagnostic.enabled)} · source={data.diagnostic.source} · connection={data.diagnostic.connection || "-"} · model={data.diagnostic.model}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {templates.length > 1 && (
              <div className="space-y-3">
                {GROUPS.map((g) => {
                  const items = templates.filter((t) => t.group === g.id);
                  if (!items.length) return null;
                  return (
                    <div key={g.id}>
                      <p className="mb-1.5 text-xs font-medium text-[var(--text-faint)]">{g.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            title={t.description}
                            onClick={() => {
                              setTask(t.id);
                              setResult(null);
                              setError("");
                            }}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs transition-colors",
                              task === t.id
                                ? "border-[var(--brand-500)] bg-[var(--brand-50)] font-medium text-[var(--brand-700)]"
                                : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                            )}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tpl && (
              <>
                <p className="text-xs text-[var(--text-muted)]">{tpl.description}</p>
                {(tpl.needsText || fullText || selectionText) && (
                  <div className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-muted)]">
                    {hasSelection ? (
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={useSelection} onChange={(e) => setUseSelection(e.target.checked)} className="accent-[var(--brand-600)]" />
                        فقط روی بخش انتخاب‌شده اجرا شود
                      </label>
                    ) : sourceText ? (
                      <span>روی کل متن فعلی اجرا می‌شود.</span>
                    ) : (
                      <span>متنی وجود ندارد؛ بر اساس عنوان و اطلاعات صفحه نوشته می‌شود.</span>
                    )}
                  </div>
                )}
                <div>
                  <Label>{tpl.id === "custom" ? "دستور شما" : "دستور اضافه (اختیاری)"}</Label>
                  <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    rows={2}
                    placeholder={tpl.id === "custom" ? "مثلاً: لحن را صمیمی‌تر کن و یک مثال اضافه کن" : "مثلاً: روی پوست حساس تمرکز کن"}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={run} loading={busy}>
                    {result ? <RefreshCw size={15} /> : <Wand2 size={15} />}
                    {result ? "تولید دوباره" : "تولید کن"}
                  </Button>
                  {busy && <span className="text-xs text-[var(--text-faint)]">در حال نوشتن… (ممکن است چند ثانیه طول بکشد)</span>}
                </div>
              </>
            )}

            {error && <p className="rounded-[var(--radius-md)] bg-[var(--danger-bg)] p-2.5 text-sm text-[var(--danger)]">{error}</p>}

            {result?.output === "options" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--text-faint)]">یکی را انتخاب کنید:</p>
                {result.options.map((o, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => apply("replace", { text: o })}
                    className="flex w-full items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3 text-start text-sm hover:border-[var(--brand-500)] hover:bg-[var(--brand-50)]"
                  >
                    <span>{o}</span>
                    <span className="shrink-0 text-[11px] text-[var(--text-faint)]">{o.length} نویسه</span>
                  </button>
                ))}
              </div>
            )}

            {result && result.output !== "options" && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-[var(--text-faint)]">پیشنهاد هوش مصنوعی:</p>
                {result.output === "html" ? (
                  <div
                    className="rte-content max-h-72 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
                    dangerouslySetInnerHTML={{ __html: result.result }}
                  />
                ) : (
                  <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 font-[inherit] text-sm">{result.result}</pre>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => apply("replace", result.output === "html" ? { html: result.result } : { text: result.result })}>
                    {hasSelection && useSelection ? <Replace size={15} /> : <Check size={15} />}
                    {hasSelection && useSelection ? "جایگزین انتخاب" : "اعمال"}
                  </Button>
                  {canAppend && (
                    <Button variant="outline" onClick={() => apply("append", result.output === "html" ? { html: result.result } : { text: result.result })}>
                      <ArrowDownToLine size={15} /> افزودن به انتها
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** دکمه‌ی کوچک کنار لیبل فیلدها؛ children = پنجره را باز می‌کند. */
export function AiSparkButton({ onClick, label = "هوش مصنوعی", className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[var(--brand-50)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--brand-700)] transition-colors hover:bg-[var(--brand-100)]",
        className
      )}
    >
      <Sparkles size={11} /> {label}
    </button>
  );
}
