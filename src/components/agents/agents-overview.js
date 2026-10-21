"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Scale, PenLine, Search, BookOpen, Play, Settings2, AlertTriangle, Bot, Loader2, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { RunDialog } from "@/components/agents/run-dialog";
import { AgentSettingsDialog } from "@/components/agents/settings-dialog";
import { fetchAgents, fetchAgentRuns } from "@/lib/agents/api";
import { STATUS_LABELS, STATUS_VARIANTS, isActiveStatus, formatDateTime, formatNumber } from "@/lib/agents/format";
import { usePermissions } from "@/hooks/use-permissions";

const ICONS = { scale: Scale, pen: PenLine, search: Search, book: BookOpen };

function AgentCard({ agent, sources, canEdit, aiReady }) {
  const [runOpen, setRunOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const Icon = ICONS[agent.icon] || Bot;
  const last = agent.lastRun;
  const active = last && isActiveStatus(last.status);
  const disabled = !agent.setting.enabled;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)]" style={{ background: `${agent.color}1f`, color: agent.color }}>
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-[var(--text)]">{agent.name}</h3>
            {disabled && <Badge variant="warning" size="sm">غیرفعال</Badge>}
            {active && (
              <Badge variant="info" size="sm"><Loader2 size={11} className="animate-spin" /> در حال اجرا</Badge>
            )}
          </div>
          <p className="mt-1 text-xs leading-6 text-[var(--text-muted)]">{agent.short}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["کل اجراها", agent.stats.total],
          ["موفق", agent.stats.succeeded],
          ["ناموفق", agent.stats.failed],
        ].map(([label, n]) => (
          <div key={label} className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-2 py-2">
            <div className="text-base font-bold text-[var(--text)]">{formatNumber(n)}</div>
            <div className="text-[10px] text-[var(--text-faint)]">{label}</div>
          </div>
        ))}
      </div>

      <div className="min-h-[34px] text-xs text-[var(--text-muted)]">
        {last ? (
          <Link href={`/agents/runs/${last._id}`} className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 hover:bg-[var(--surface-muted)]">
            <span className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANTS[last.status]} size="sm" dot>{STATUS_LABELS[last.status]}</Badge>
              آخرین اجرا: {formatDateTime(last.createdAt)}
            </span>
            <ChevronLeft size={14} />
          </Link>
        ) : (
          "هنوز اجرا نشده"
        )}
      </div>

      <div className="mt-auto flex gap-2">
        <Button className="flex-1" onClick={() => setRunOpen(true)} disabled={!canEdit || disabled || !aiReady || active}>
          <Play size={15} /> اجرا
        </Button>
        {canEdit && (
          <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)} aria-label="تنظیمات">
            <Settings2 size={16} />
          </Button>
        )}
      </div>
      {runOpen && <RunDialog agent={agent} sources={sources} open={runOpen} onOpenChange={setRunOpen} />}
      {settingsOpen && <AgentSettingsDialog agent={agent} open={settingsOpen} onOpenChange={setSettingsOpen} />}
    </Card>
  );
}

export function AgentsOverview() {
  const { can } = usePermissions();
  const canEdit = can("agents", "edit");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    refetchInterval: (q) => (q.state.data?.agents?.some((a) => a.lastRun && isActiveStatus(a.lastRun.status)) ? 3000 : false),
  });
  const { data: runsData } = useQuery({
    queryKey: ["agent-runs", filter, page],
    queryFn: () => fetchAgentRuns({ agent: filter || undefined, page, limit: 10 }),
    refetchInterval: (q) => (q.state.data?.runs?.some((r) => isActiveStatus(r.status)) ? 3000 : false),
  });

  const nameOf = (key) => data?.agents?.find((a) => a.key === key)?.name || key;
  const totalTokens = data?.agents?.reduce((s, a) => s + (a.stats.tokens || 0), 0) || 0;

  return (
    <div>
      <PageHeader
        title="ایجنت‌های هوشمند"
        subtitle="دستیارهای تخصصی که رقبا را بررسی می‌کنند، محتوا می‌نویسند و سئو را تحلیل می‌کنند. هیچ‌چیز بدون تأیید شما روی سایت اعمال نمی‌شود."
      />

      {data && !data.aiReady && (
        <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--warning)] bg-[var(--warning-bg)] p-4 text-sm text-[var(--warning)]">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            اتصال هوش مصنوعی تنظیم نشده است. از <Link href="/ai/settings" className="font-semibold underline">دستیار هوشمند ← تنظیمات</Link> یک اتصال (مثلاً Gemini) اضافه کنید.
          </div>
        </div>
      )}
      {data && data.aiReady && !data.webSearchReady && (
        <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs text-[var(--text-muted)]">
          جستجوی وب (TAVILY_API_KEY) روی سرور تنظیم نشده؛ ایجنت‌ها فقط با رقبای تعریف‌شده در «هوش قیمت»، لینک‌های مستقیم و پیشنهادهای گوگل کار می‌کنند.
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.agents.map((a) => (
            <AgentCard key={a.key} agent={a} sources={data.competitorSources} canEdit={canEdit} aiReady={data.aiReady} />
          ))}
        </div>
      )}

      <div className="mt-8 mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold">تاریخچه‌ی اجراها</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-faint)]">مجموع توکن مصرفی: {formatNumber(totalTokens)}</span>
          <div className="w-52">
            <Select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
              <option value="">همه‌ی ایجنت‌ها</option>
              {data?.agents?.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
            </Select>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-muted)] text-xs text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-2.5 text-right font-medium">ایجنت</th>
                <th className="px-4 py-2.5 text-right font-medium">وضعیت</th>
                <th className="px-4 py-2.5 text-right font-medium">خلاصه</th>
                <th className="px-4 py-2.5 text-right font-medium">اجرا‌کننده</th>
                <th className="px-4 py-2.5 text-right font-medium">زمان</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {(runsData?.runs || []).map((r) => (
                <tr key={r._id} className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]">
                  <td className="px-4 py-3 font-medium">{nameOf(r.agent)}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANTS[r.status]} size="sm" dot>{STATUS_LABELS[r.status]}</Badge></td>
                  <td className="max-w-[320px] truncate px-4 py-3 text-xs text-[var(--text-muted)]">{r.result?.summary || r.error || "—"}</td>
                  <td className="px-4 py-3 text-xs">{r.createdBy?.name || "—"}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{formatDateTime(r.createdAt)}</td>
                  <td className="px-4 py-3 text-left"><Link href={`/agents/runs/${r._id}`} className="text-xs font-medium text-[var(--brand-600)] hover:underline">مشاهده</Link></td>
                </tr>
              ))}
              {runsData && !runsData.runs.length && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-[var(--text-faint)]">هنوز اجرایی ثبت نشده. یکی از ایجنت‌ها را اجرا کنید.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {runsData?.pages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2.5 text-xs">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>قبلی</Button>
            <span>صفحه {formatNumber(page)} از {formatNumber(runsData.pages)}</span>
            <Button variant="ghost" size="sm" disabled={page >= runsData.pages} onClick={() => setPage((p) => p + 1)}>بعدی</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
