"use client";

import { useState } from "react";
import { ExternalLink, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatToman, downloadCsv } from "@/lib/agents/format";
import { cn } from "@/lib/utils";

const CONF = { high: ["success", "بالا"], medium: ["warning", "متوسط"], low: ["danger", "کم"] };

// پیش‌نمایش HTML تولیدشده‌ی مدل داخل iframe بدون هیچ اسکریپتی (sandbox خالی).
function HtmlPreview({ html, height = 280 }) {
  const doc = `<!doctype html><html dir="rtl"><body style="font-family:Tahoma,sans-serif;font-size:14px;line-height:1.9;padding:12px;margin:0;color:#222">${html || ""}</body></html>`;
  return <iframe title="پیش‌نمایش" sandbox="" srcDoc={doc} className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white" style={{ height }} />;
}

function SelectBox({ checked, onChange, disabled }) {
  return <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />;
}

export function PriceTable({ items }) {
  const pct = (a, b) => (a && b ? Math.round(((b - a) / a) * 100) : null);
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv("delisa-price-suggestions.csv", items.map((i) => ({
              product: i.name, current_price: i.currentPrice, competitors: i.competitorCount, comp_min: i.competitorMin,
              comp_median: i.competitorMedian, comp_max: i.competitorMax, competitive: i.priceCompetitive, balanced: i.priceBalanced,
              margin: i.priceMargin, suggested: i.suggestedPrice, confidence: i.confidence, reason: i.reason, sources: i.sources,
            })))
          }
        >
          <Download size={14} /> خروجی CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
        <table className="w-full text-xs">
          <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
            <tr>
              {["محصول", "قیمت دلیسا", "رقبا (کمینه / میانه / بیشینه)", "رقابتی", "متعادل", "حاشیه‌محور", "پیشنهاد", "اطمینان"].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2 text-right font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((i, k) => {
              const diff = pct(i.currentPrice, i.suggestedPrice);
              const [cv, cl] = CONF[i.confidence] || ["neutral", i.confidence || "—"];
              return (
                <tr key={k} className="border-t border-[var(--border)] align-top">
                  <td className="min-w-[180px] px-3 py-2.5">
                    <div className="font-semibold text-[var(--text)]">{i.name}</div>
                    {i.reason && <div className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">{i.reason}</div>}
                    {(i.sources || []).slice(0, 4).map((s, n) => (
                      <a key={n} href={s} target="_blank" rel="noopener noreferrer" className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--brand-600)]">
                        <ExternalLink size={10} /> {(() => { try { return new URL(s).hostname; } catch { return s; } })()}
                      </a>
                    ))}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatToman(i.currentPrice)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {i.competitorCount ? `${formatToman(i.competitorMin)} / ${formatToman(i.competitorMedian)} / ${formatToman(i.competitorMax)}` : "رقیبی پیدا نشد"}
                    {i.competitorCount ? <div className="text-[10px] text-[var(--text-faint)]">{Number(i.competitorCount).toLocaleString("fa-IR")} رقیب</div> : null}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatToman(i.priceCompetitive)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatToman(i.priceBalanced)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatToman(i.priceMargin)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <div className="font-bold text-[var(--brand-700)]">{formatToman(i.suggestedPrice)}</div>
                    {diff !== null && (
                      <div className={cn("text-[10px]", diff > 0 ? "text-[var(--success)]" : diff < 0 ? "text-[var(--danger)]" : "")} dir="ltr">
                        {diff > 0 ? "+" : ""}{diff.toLocaleString("fa-IR")}٪
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5"><Badge variant={cv} size="sm">{cl}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-[var(--text-faint)]">قیمت‌ها فقط پیشنهادند. برای اعمال، از بخش «هوش قیمت» یا ویرایش محصول استفاده کنید.</p>
    </div>
  );
}

export function KeywordTable({ items }) {
  const PRI = { high: ["danger", "بالا"], medium: ["warning", "متوسط"], low: ["neutral", "کم"] };
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => downloadCsv("delisa-keywords.csv", items)}>
          <Download size={14} /> خروجی CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
        <table className="w-full text-xs">
          <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
            <tr>{["کلمه کلیدی", "نیت", "حجم (برآورد)", "سختی (برآورد)", "صفحه هدف", "اولویت", "نکته"].map((h) => <th key={h} className="px-3 py-2 text-right font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((i, k) => {
              const [pv, pl] = PRI[i.priority] || ["neutral", i.priority || "—"];
              return (
                <tr key={k} className="border-t border-[var(--border)] align-top">
                  <td className="px-3 py-2 font-semibold">{i.keyword}</td>
                  <td className="px-3 py-2">{i.intent}</td>
                  <td className="px-3 py-2">{i.volumeEstimate}</td>
                  <td className="px-3 py-2">{i.difficulty}</td>
                  <td className="px-3 py-2">{i.targetPage}</td>
                  <td className="px-3 py-2"><Badge variant={pv} size="sm">{pl}</Badge></td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{i.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-[var(--text-faint)]">حجم و سختی برآورد کیفی مدل‌اند، نه داده‌ی دقیق ابزار سئو.</p>
    </div>
  );
}

// آیتم‌های قابل اعمال (محتوای محصول / پیش‌نویس بلاگ) با انتخاب و اعمال/برگشت
export function ApplicableItems({ kind, items, applied, canEdit, onApply, onRevert, busy }) {
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(0);
  const appliedBy = (i) => applied.find((a) => a.itemIndex === i);
  const pending = items.map((_, i) => i).filter((i) => !appliedBy(i));
  const toggle = (i, on) => setSelected((s) => (on ? [...new Set([...s, i])] : s.filter((x) => x !== i)));

  return (
    <div className="space-y-3">
      {canEdit && pending.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-3 py-2 text-xs">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={selected.length === pending.length} onChange={(e) => setSelected(e.target.checked ? pending : [])} />
            انتخاب همه ({pending.length.toLocaleString("fa-IR")})
          </label>
          <Button size="sm" disabled={!selected.length} loading={busy} onClick={() => onApply(selected, () => setSelected([]))}>
            {kind === "blog_drafts" ? "ساخت پیش‌نویس در بلاگ" : "اعمال روی محصول"} ({selected.length.toLocaleString("fa-IR")})
          </Button>
        </div>
      )}
      {items.map((it, i) => {
        const done = appliedBy(i);
        const isOpen = open === i;
        return (
          <div key={i} className="rounded-[var(--radius-md)] border border-[var(--border)]">
            <div className="flex items-center gap-3 px-3 py-2.5">
              {canEdit && <SelectBox checked={selected.includes(i)} disabled={!!done} onChange={(on) => toggle(i, on)} />}
              <button type="button" className="flex-1 text-right text-sm font-semibold" onClick={() => setOpen(isOpen ? -1 : i)}>
                {kind === "blog_drafts" ? it.title : it.name}
              </button>
              {done ? (
                <>
                  <Badge variant="success" size="sm">{kind === "blog_drafts" ? "پیش‌نویس ساخته شد" : "اعمال شد"}</Badge>
                  {canEdit && <Button variant="ghost" size="sm" loading={busy} onClick={() => onRevert(i)}>برگردان</Button>}
                </>
              ) : (
                <Badge variant="neutral" size="sm">اعمال‌نشده</Badge>
              )}
            </div>
            {isOpen && (
              <div className="space-y-3 border-t border-[var(--border)] p-3 text-xs">
                {kind === "product_content" ? (
                  <>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Field label="عنوان سئو" value={it.seoTitle} hint={`${(it.seoTitle || "").length} نویسه`} />
                      <Field label="متا دیسکریپشن" value={it.seoDescription} hint={`${(it.seoDescription || "").length} نویسه`} />
                    </div>
                    <Field label="کلمات کلیدی" value={(it.seoKeywords || []).join("، ")} />
                    <div><div className="mb-1 font-medium text-[var(--text-muted)]">توضیحات محصول</div><HtmlPreview html={it.description} /></div>
                    {it.usageInstructions && <div><div className="mb-1 font-medium text-[var(--text-muted)]">روش مصرف</div><HtmlPreview html={it.usageInstructions} height={120} /></div>}
                    {(it.faqs || []).length > 0 && (
                      <div>
                        <div className="mb-1 font-medium text-[var(--text-muted)]">سوالات متداول</div>
                        <ul className="space-y-1.5">{it.faqs.map((f, n) => <li key={n}><b>{f.q}</b><br />{f.a}</li>)}</ul>
                      </div>
                    )}
                    {it.notes && <Field label="یادداشت ایجنت" value={it.notes} />}
                  </>
                ) : (
                  <>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Field label="اسلاگ" value={it.slug} />
                      <Field label="کلمات کلیدی" value={(it.keywords || []).join("، ")} />
                      <Field label="عنوان سئو" value={it.seoTitle} />
                      <Field label="متا دیسکریپشن" value={it.seoDescription} />
                    </div>
                    <Field label="چکیده" value={it.excerpt} />
                    <div><div className="mb-1 font-medium text-[var(--text-muted)]">متن مقاله</div><HtmlPreview html={it.contentHtml} height={420} /></div>
                    {(it.internalLinks || []).length > 0 && <Field label="لینک‌های داخلی" value={it.internalLinks.join("\n")} />}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, value, hint }) {
  return (
    <div>
      <div className="mb-0.5 font-medium text-[var(--text-muted)]">{label} {hint && <span className="font-normal text-[var(--text-faint)]">({hint})</span>}</div>
      <div className="whitespace-pre-wrap rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-2.5 py-2 leading-6">{value || "—"}</div>
    </div>
  );
}
