"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, ENTITY_LABELS, scoreColor, scoreLabel, MODE_LABELS } from "@/lib/seo/constants";
import { ScoreRing } from "./score-ring";
import { CheckList } from "./check-list";
import { TrafficDot } from "./severity-icon";
import { formatDateTime } from "@/lib/utils";

const BREAKDOWN = ["meta", "keyword", "content", "links", "images", "technical", "indexing", "structured", "social", "performance", "site"];

function KpiCard({ label, value, hint, color }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: color || "var(--text)" }}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">{hint}</p>}
    </div>
  );
}

export function SeoOverview({ audit, trend = [], onOpenIssues }) {
  if (!audit) return null;
  const s = audit.scores || {};
  const c = audit.counts || {};
  const byType = Object.entries(audit.byEntityType || {}).sort((a, b) => b[1].count - a[1].count);
  const chart = trend.map((t) => ({
    date: new Date(t.finishedAt).toLocaleString("fa-IR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    score: t.scores?.overall ?? null,
    errors: t.counts?.errors ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]">
        <Card className="flex items-center gap-5 p-6">
          <ScoreRing score={s.overall} size={150} stroke={12} />
          <div>
            <p className="text-lg font-bold text-[var(--text)]">نمره‌ی کلی سئو</p>
            <p className="text-sm" style={{ color: scoreColor(s.overall) }}>
              {scoreLabel(s.overall)} — درجه {audit.grade || "—"}
            </p>
            <p className="mt-2 text-[11px] text-[var(--text-faint)]">
              {MODE_LABELS[audit.mode]} · {formatDateTime(audit.finishedAt)}
              {audit.durationMs ? ` · ${Math.round(audit.durationMs / 1000).toLocaleString("fa-IR")} ثانیه` : ""}
            </p>
            <p className="text-[11px] text-[var(--text-faint)]">
              {Number(c.pages || 0).toLocaleString("fa-IR")} صفحه تحلیل شد · {Number(c.crawled || 0).toLocaleString("fa-IR")} صفحه خزیده شد
            </p>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard label="خطاها" value={Number(c.errors || 0).toLocaleString("fa-IR")} hint={`${Number(c.pagesWithErrors || 0).toLocaleString("fa-IR")} صفحه دارای خطا`} color="var(--danger)" />
          <KpiCard label="هشدارها" value={Number(c.warnings || 0).toLocaleString("fa-IR")} color="var(--warning)" />
          <KpiCard label="لینک‌های شکسته" value={Number(c.brokenLinks || 0).toLocaleString("fa-IR")} color={c.brokenLinks ? "var(--danger)" : "var(--success)"} />
          <KpiCard label="میانگین زمان پاسخ" value={c.avgResponseMs != null ? `${Number(c.avgResponseMs).toLocaleString("fa-IR")}ms` : "—"} color={c.avgResponseMs > 1500 ? "var(--warning)" : "var(--success)"} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>نمره به تفکیک حوزه</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {BREAKDOWN.filter((k) => s[k] != null).map((k) => (
              <div key={k} className="flex items-center gap-3 text-xs">
                <span className="w-32 shrink-0 text-[var(--text-muted)]">{CATEGORY_LABELS[k]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                  <div className="h-full rounded-full" style={{ width: `${s[k]}%`, background: scoreColor(s[k]) }} />
                </div>
                <span className="w-8 text-end font-semibold tabular-nums" style={{ color: scoreColor(s[k]) }}>{Number(s[k]).toLocaleString("fa-IR")}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>روند نمره</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56 w-full" dir="ltr">
              {chart.length < 2 ? (
                <p className="flex h-full items-center justify-center text-xs text-[var(--text-faint)]">بعد از چند اجرا، روند این‌جا نمایش داده می‌شود.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart}>
                    <defs>
                      <linearGradient id="seoScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--brand-500)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-vazir)" }} />
                    <Area type="monotone" dataKey="score" name="نمره" stroke="var(--brand-500)" fill="url(#seoScore)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>وضعیت به تفکیک بخش سایت</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="px-5 py-2 text-start font-medium">بخش</th>
                  <th className="px-2 py-2 text-start font-medium">صفحات</th>
                  <th className="px-2 py-2 text-start font-medium">خزیده</th>
                  <th className="px-2 py-2 text-start font-medium">خطا</th>
                  <th className="px-2 py-2 text-start font-medium">هشدار</th>
                  <th className="px-5 py-2 text-start font-medium">میانگین نمره</th>
                </tr>
              </thead>
              <tbody>
                {byType.map(([type, b]) => (
                  <tr key={type} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-5 py-2.5">
                      <Link href={`/seo?tab=pages&type=${type}`} className="font-medium text-[var(--text)] hover:text-[var(--brand-600)]">{ENTITY_LABELS[type] || b.label || type}</Link>
                    </td>
                    <td className="px-2 py-2.5 tabular-nums">{Number(b.count).toLocaleString("fa-IR")}</td>
                    <td className="px-2 py-2.5 tabular-nums text-[var(--text-muted)]">{Number(b.crawled || 0).toLocaleString("fa-IR")}</td>
                    <td className="px-2 py-2.5 tabular-nums text-[var(--danger)]">{Number(b.errors || 0).toLocaleString("fa-IR")}</td>
                    <td className="px-2 py-2.5 tabular-nums text-[var(--warning)]">{Number(b.warnings || 0).toLocaleString("fa-IR")}</td>
                    <td className="px-5 py-2.5">
                      <span className="font-semibold tabular-nums" style={{ color: scoreColor(b.avgScore) }}>{b.avgScore != null ? Number(b.avgScore).toLocaleString("fa-IR") : "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مهم‌ترین مشکلات</CardTitle>
            <button type="button" onClick={onOpenIssues} className="text-xs font-medium text-[var(--brand-600)] hover:underline">همه‌ی مشکلات</button>
          </CardHeader>
          <CardContent className="space-y-1">
            {(audit.issueGroups || []).slice(0, 10).map((g) => (
              <Link key={g.checkId} href={`/seo?tab=issues&check=${g.checkId}`} className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs transition-colors hover:bg-[var(--surface-muted)]">
                <TrafficDot status={g.severity} />
                <span className="min-w-0 flex-1 truncate text-[var(--text)]">{g.title}</span>
                <Badge variant="neutral" size="sm">{Number(g.count).toLocaleString("fa-IR")}</Badge>
              </Link>
            ))}
            {(audit.issueGroups || []).length === 0 && <p className="text-xs text-[var(--success)]">هیچ مشکلی ثبت نشده 🎉</p>}
          </CardContent>
        </Card>
      </div>

      {(audit.siteChecks || []).length > 0 && (
        <Card>
          <CardHeader><CardTitle>بررسی‌های سطح سایت (robots.txt، sitemap، https، …)</CardTitle></CardHeader>
          <CardContent>
            <CheckList checks={audit.siteChecks} defaultOpenPassed />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
