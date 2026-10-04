"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Search, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchQuickFixProducts, fetchQuickFixTargets, lookupQuickFix } from "@/lib/seo/api";
import { fa } from "./quick-fix-fields";

const decode = (p) => {
  try {
    return decodeURI(p || "");
  } catch {
    return p || "";
  }
};

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pr-9" />
    </div>
  );
}

/** انتخاب محصول برای افزودن به آرشیو خالی (پیشنهادهای مشابه + جست‌وجو) */
function ProductPicker({ reportId, onRun, busy }) {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 350);
  const [picked, setPicked] = useState({});
  const { data: items = [], isFetching } = useQuery({ queryKey: ["qf-products", reportId, dq], queryFn: () => fetchQuickFixProducts(reportId, dq), staleTime: 60_000 });
  const ids = Object.keys(picked).filter((k) => picked[k]);
  return (
    <div className="space-y-3">
      <SearchBox value={q} onChange={setQ} placeholder="جست‌وجوی محصول برای افزودن…" />
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
        <span>{dq ? "نتایج جست‌وجو" : "محصولات مشابه نام این صفحه"} {isFetching && <Loader2 size={11} className="mr-1 inline animate-spin" />}</span>
        {items.length > 0 && (
          <button type="button" className="text-[var(--brand-600)] hover:underline" onClick={() => setPicked(ids.length === items.length ? {} : Object.fromEntries(items.map((i) => [i.id, true])))}>
            {ids.length === items.length ? "لغو انتخاب همه" : "انتخاب همه"}
          </button>
        )}
      </div>
      <div className="grid max-h-72 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-2">
        {items.map((p) => (
          <button key={p.id} type="button" onClick={() => setPicked((s) => ({ ...s, [p.id]: !s[p.id] }))} className={cn("flex min-w-0 items-center gap-2.5 rounded-[var(--radius-md)] border p-2 text-start transition-colors", picked[p.id] ? "border-[var(--brand-500)] bg-[var(--brand-50)]" : "border-[var(--border)] hover:bg-[var(--surface-muted)]")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.image ? <img src={p.image} alt="" className="h-11 w-11 shrink-0 rounded object-cover" /> : <span className="h-11 w-11 shrink-0 rounded bg-[var(--surface-muted)]" />}
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-xs leading-5 text-[var(--text)]">{p.name}</span>
              {p.price ? <span className="text-[10px] text-[var(--text-faint)]">{fa(p.price)} تومان</span> : null}
            </span>
            <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", picked[p.id] ? "border-[var(--brand-600)] bg-[var(--brand-600)] text-white" : "border-[var(--border)]")}>{picked[p.id] && <Check size={12} />}</span>
          </button>
        ))}
        {!isFetching && items.length === 0 && <p className="col-span-full rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-4 text-center text-xs text-[var(--text-muted)]">محصول مشابهی پیدا نشد. نام دیگری را جست‌وجو کنید، یا این صفحه را غیرفعال/ریدایرکت کنید.</p>}
      </div>
      <Button disabled={!ids.length || busy} loading={busy} onClick={() => onRun({ productIds: ids })}>
        <Check size={14} />
        افزودن {ids.length ? fa(ids.length) : ""} محصول به این صفحه
      </Button>
    </div>
  );
}

/** انتخاب مقصد ریدایرکت (آرشیو مشابه / والد / صفحه) یا نوشتن مسیر دستی */
function TargetPicker({ reportId, onRun, busy, danger }) {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 350);
  const [manual, setManual] = useState("");
  const [target, setTarget] = useState("");
  const { data: suggestions = [], isFetching: loadingS } = useQuery({ queryKey: ["qf-targets", reportId], queryFn: () => fetchQuickFixTargets(reportId), staleTime: 60_000 });
  const { data: found = [], isFetching: loadingF } = useQuery({ queryKey: ["qf-lookup-archive", dq], queryFn: () => lookupQuickFix("archive", dq), enabled: !!dq, staleTime: 60_000 });
  const list = dq ? found : suggestions;
  const chosen = manual.trim() || target;
  return (
    <div className="space-y-3">
      <SearchBox value={q} onChange={setQ} placeholder="جست‌وجوی دسته/برند/برچسب مقصد…" />
      <div className="max-h-64 space-y-1.5 overflow-y-auto">
        {(loadingS || loadingF) && <p className="text-xs text-[var(--text-faint)]"><Loader2 size={12} className="ml-1 inline animate-spin" />در حال جست‌وجو…</p>}
        {list.map((t) => (
          <button key={t.path} type="button" onClick={() => { setTarget(t.path); setManual(""); }} className={cn("flex w-full min-w-0 items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-start transition-colors", target === t.path && !manual ? "border-[var(--brand-500)] bg-[var(--brand-50)]" : "border-[var(--border)] hover:bg-[var(--surface-muted)]")}>
            <span className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">{t.typeLabel}</span>
            <span className="min-w-0 flex-1 truncate text-xs text-[var(--text)]">{t.name}</span>
            {t.count != null && <span className="text-[10px] text-[var(--text-faint)]">{fa(t.count)} محصول</span>}
            <span className="max-w-[40%] truncate text-[10px] text-[var(--text-faint)]" dir="ltr">{decode(t.path)}</span>
          </button>
        ))}
        {!loadingS && !loadingF && list.length === 0 && <p className="text-xs text-[var(--text-faint)]">موردی پیدا نشد.</p>}
      </div>
      <div>
        <label className="mb-1 block text-[11px] text-[var(--text-muted)]">یا مسیر دلخواه (مثلاً /category/skin-care)</label>
        <Input dir="ltr" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="/…" />
      </div>
      {chosen && (
        <p className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-3 py-2 text-[11px] text-[var(--text-muted)]">
          این صفحه با <b>۳۰۱</b> به <span dir="ltr" className="font-medium text-[var(--text)]">{decode(chosen)}</span> منتقل می‌شود <ArrowLeft size={11} />
        </p>
      )}
      <Button variant={danger ? "danger" : "primary"} disabled={!chosen || busy} loading={busy} onClick={() => onRun({ target: chosen })}>
        غیرفعال‌سازی و ریدایرکت
      </Button>
    </div>
  );
}

/** انتخاب تکی دسته/برند */
function LookupPicker({ kind, suggested, onRun, busy, label }) {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 300);
  const [id, setId] = useState(suggested?.id || "");
  const { data: items = [], isFetching } = useQuery({ queryKey: ["qf-lookup", kind, dq], queryFn: () => lookupQuickFix(kind, dq), staleTime: 60_000 });
  const rows = useMemo(() => (suggested && !dq ? [{ id: suggested.id, name: suggested.name, suggested: true }, ...items.filter((i) => i.id !== suggested.id)] : items), [items, suggested, dq]);
  return (
    <div className="space-y-3">
      {suggested && <p className="rounded-[var(--radius-md)] bg-[var(--success-bg)] px-3 py-2 text-[11px] text-[var(--success)]">«{suggested.name}» در نام محصول دیده شد و پیشنهاد شده است.</p>}
      <SearchBox value={q} onChange={setQ} placeholder={`جست‌وجوی ${label}…`} />
      <div className="max-h-56 space-y-1 overflow-y-auto">
        {isFetching && <p className="text-xs text-[var(--text-faint)]"><Loader2 size={12} className="ml-1 inline animate-spin" />…</p>}
        {rows.map((r) => (
          <button key={r.id} type="button" onClick={() => setId(r.id)} className={cn("flex w-full items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-start text-xs transition-colors", id === r.id ? "border-[var(--brand-500)] bg-[var(--brand-50)]" : "border-[var(--border)] hover:bg-[var(--surface-muted)]")}>
            <span className="min-w-0 flex-1 truncate text-[var(--text)]">{r.name}</span>
            {r.parent && <span className="text-[10px] text-[var(--text-faint)]">{r.parent}</span>}
            {r.suggested && <span className="rounded-full bg-[var(--success-bg)] px-1.5 text-[10px] text-[var(--success)]">پیشنهاد</span>}
            {id === r.id && <Check size={13} className="text-[var(--brand-600)]" />}
          </button>
        ))}
      </div>
      <Button disabled={!id || busy} loading={busy} onClick={() => onRun(kind === "brand" ? { brandId: id } : { categoryId: id })}>
        <Check size={14} />
        ثبت {label}
      </Button>
    </div>
  );
}

/** پنل اجرای یک اقدام: بر اساس نوع ورودی (محصول، مقصد، دسته، برند یا بدون ورودی با تأیید) */
export function ActionPanel({ solution, reportId, onRun, busy }) {
  const [confirm, setConfirm] = useState(false);
  switch (solution.input) {
    case "products":
      return <ProductPicker reportId={reportId} onRun={(p) => onRun(solution.id, p)} busy={busy} />;
    case "target":
      return <TargetPicker reportId={reportId} onRun={(p) => onRun(solution.id, p)} busy={busy} danger={solution.danger} />;
    case "category":
      return <LookupPicker kind="category" label="دسته‌بندی" suggested={solution.suggested} onRun={(p) => onRun(solution.id, p)} busy={busy} />;
    case "brand":
      return <LookupPicker kind="brand" label="برند" suggested={solution.suggested} onRun={(p) => onRun(solution.id, p)} busy={busy} />;
    default:
      return (
        <div className="space-y-3">
          {solution.danger && (
            <p className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--warning-bg)] px-3 py-2 text-xs leading-5 text-[var(--warning)]">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              این اقدام روی سایت اثر می‌گذارد؛ بعد از اجرا می‌توانید «برگرداندن» را بزنید.
            </p>
          )}
          {!confirm && solution.danger ? (
            <Button variant="outline" onClick={() => setConfirm(true)}>{solution.label}</Button>
          ) : (
            <Button variant={solution.danger ? "danger" : "primary"} loading={busy} disabled={busy} onClick={() => onRun(solution.id, {})}>
              <Check size={14} />
              {solution.danger ? "بله، اجرا کن" : solution.label}
            </Button>
          )}
        </div>
      );
  }
}
