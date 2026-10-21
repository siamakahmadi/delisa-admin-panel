"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Square, Trash2, Loader2, Wrench, MessageSquare, AlertCircle, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Markdown } from "@/components/agents/markdown";
import { PriceTable, KeywordTable, ApplicableItems } from "@/components/agents/result-view";
import { fetchAgentRun, cancelAgentRun, deleteAgentRun, applyAgentRun, revertAgentRun } from "@/lib/agents/api";
import { STATUS_LABELS, STATUS_VARIANTS, isActiveStatus, formatDateTime, formatNumber, durationLabel } from "@/lib/agents/format";
import { usePermissions } from "@/hooks/use-permissions";

const TOOL_LABELS = {
  searchStoreProducts: "جستجوی محصولات دلیسا",
  getStoreProduct: "خواندن محصول دلیسا",
  getPricingConfig: "بررسی هزینه و کف قیمت",
  listCompetitorSources: "فهرست رقبا",
  searchCompetitor: "جستجو در سایت رقیب",
  fetchPage: "خواندن صفحه وب",
  webSearch: "جستجوی وب",
  googleSuggest: "پیشنهاد گوگل",
  priceStats: "محاسبه آمار قیمت",
  listBlogPosts: "بررسی مقاله‌های بلاگ",
};

const STEP_ICON = { tool: Wrench, thought: MessageSquare, error: AlertCircle, info: Info };

function StepLog({ steps, active }) {
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => {
        const Icon = STEP_ICON[s.type] || Info;
        return (
          <li key={i} className="flex items-start gap-2.5 text-xs">
            <Icon size={14} className={s.type === "error" ? "mt-0.5 text-[var(--danger)]" : "mt-0.5 text-[var(--text-faint)]"} />
            <div className="min-w-0 flex-1">
              {s.type === "tool" && <span className="font-semibold">{TOOL_LABELS[s.tool] || s.tool}</span>}
              {s.type === "tool" && s.text ? <span className="text-[var(--text-muted)]"> — {s.text}</span> : s.type !== "tool" && <span className={s.type === "error" ? "text-[var(--danger)]" : "text-[var(--text-muted)]"}>{s.text}</span>}
            </div>
            <span className="shrink-0 text-[10px] text-[var(--text-faint)]">{new Date(s.at).toLocaleTimeString("fa-IR")}</span>
          </li>
        );
      })}
      {active && (
        <li className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Loader2 size={14} className="animate-spin" /> ایجنت در حال کار است…
        </li>
      )}
    </ol>
  );
}

export function RunDetail({ runId }) {
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const { can } = usePermissions();
  const canEdit = can("agents", "edit");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["agent-run", runId],
    queryFn: () => fetchAgentRun(runId),
    refetchInterval: (q) => (isActiveStatus(q.state.data?.run?.status) ? 2000 : false),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["agent-run", runId] });
  const onErr = (e) => toast.error(e?.response?.data?.message || "عملیات ناموفق بود");

  const cancel = useMutation({ mutationFn: () => cancelAgentRun(runId), onSuccess: () => { toast.success("درخواست توقف ثبت شد"); refresh(); }, onError: onErr });
  const del = useMutation({
    mutationFn: () => deleteAgentRun(runId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agent-runs"] }); qc.invalidateQueries({ queryKey: ["agents"] }); router.push("/agents"); },
    onError: onErr,
  });
  const apply = useMutation({
    mutationFn: ({ indexes }) => applyAgentRun(runId, indexes),
    onSuccess: (res, vars) => {
      const ok = res.results.filter((r) => r.ok).length;
      const bad = res.results.filter((r) => !r.ok);
      if (ok) toast.success(`${ok.toLocaleString("fa-IR")} مورد اعمال شد`);
      if (bad.length) toast.error(bad[0].error || "بعضی موارد اعمال نشد");
      vars.done?.();
      refresh();
    },
    onError: onErr,
  });
  const revert = useMutation({
    mutationFn: (i) => revertAgentRun(runId, i),
    onSuccess: () => { toast.success("برگردانده شد"); refresh(); },
    onError: onErr,
  });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError || !data) return <p className="text-sm text-[var(--danger)]">اجرا پیدا نشد.</p>;

  const { run, agent, canApply } = data;
  const active = isActiveStatus(run.status);
  const items = run.result?.items || [];
  const kind = run.result?.kind;
  const paramLines = (agent?.fields || []).map((f) => [f.label, run.params?.[f.name]]).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && !v.length));

  return (
    <div>
      <Link href="/agents" className="mb-3 inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowRight size={14} /> بازگشت به ایجنت‌ها
      </Link>
      <PageHeader
        title={agent?.name || run.agent}
        subtitle={`اجرا شده در ${formatDateTime(run.createdAt)}${run.createdBy?.name ? ` توسط ${run.createdBy.name}` : ""}`}
        actions={
          canEdit && (
            <>
              {active ? (
                <Button variant="outline" onClick={() => cancel.mutate()} loading={cancel.isPending} disabled={run.cancelRequested}>
                  <Square size={14} /> {run.cancelRequested ? "در حال توقف…" : "توقف"}
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> حذف</Button>
              )}
            </>
          )
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["وضعیت", <Badge key="s" variant={STATUS_VARIANTS[run.status]} dot>{STATUS_LABELS[run.status]}</Badge>],
          ["مدت اجرا", durationLabel(run)],
          ["مدل", <span key="m" dir="ltr" className="text-xs">{run.model || "—"}</span>],
          ["مصرف", `${formatNumber((run.usage?.promptTokens || 0) + (run.usage?.completionTokens || 0))} توکن · ${formatNumber(run.usage?.toolCalls)} ابزار`],
        ].map(([label, val]) => (
          <Card key={label}><CardContent className="p-4"><div className="text-[11px] text-[var(--text-faint)]">{label}</div><div className="mt-1 text-sm font-semibold">{val}</div></CardContent></Card>
        ))}
      </div>

      {run.error && (
        <div className="mb-5 flex items-start gap-2 rounded-[var(--radius-lg)] border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger)]">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {run.error}
        </div>
      )}

      <Tabs defaultValue={active ? "log" : "result"} key={active ? "active" : "done"}>
        <TabsList>
          <TabsTrigger value="result">نتیجه{items.length ? ` (${formatNumber(items.length)})` : ""}</TabsTrigger>
          <TabsTrigger value="report">گزارش</TabsTrigger>
          <TabsTrigger value="log">مراحل کار ({formatNumber(run.steps?.length)})</TabsTrigger>
          <TabsTrigger value="params">ورودی</TabsTrigger>
        </TabsList>

        <TabsContent value="result">
          {run.result?.summary && (
            <Card className="mb-4"><CardContent className="p-4 text-sm leading-7"><b>خلاصه: </b>{run.result.summary}</CardContent></Card>
          )}
          {!items.length ? (
            <p className="py-10 text-center text-xs text-[var(--text-faint)]">{active ? "نتیجه هنوز آماده نیست…" : "آیتمی تولید نشد؛ تب «گزارش» را ببینید."}</p>
          ) : kind === "price_suggestions" ? (
            <PriceTable items={items} />
          ) : kind === "keyword_plan" ? (
            <KeywordTable items={items} />
          ) : (
            <ApplicableItems
              kind={kind}
              items={items}
              applied={run.applied || []}
              canEdit={canEdit && canApply}
              busy={apply.isPending || revert.isPending}
              onApply={(indexes, done) => apply.mutate({ indexes, done })}
              onRevert={(i) => revert.mutate(i)}
            />
          )}
        </TabsContent>

        <TabsContent value="report">
          {run.result?.report ? <Card><CardContent><Markdown text={run.result.report} /></CardContent></Card> : <p className="py-10 text-center text-xs text-[var(--text-faint)]">گزارشی ثبت نشده.</p>}
        </TabsContent>

        <TabsContent value="log">
          <Card><CardContent><StepLog steps={run.steps || []} active={active} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="params">
          <Card><CardContent>
            {paramLines.length ? (
              <dl className="space-y-2 text-sm">{paramLines.map(([l, v]) => <div key={l} className="flex gap-3"><dt className="w-40 shrink-0 text-[var(--text-muted)]">{l}</dt><dd className="whitespace-pre-wrap">{Array.isArray(v) ? v.join("، ") : String(v)}</dd></div>)}</dl>
            ) : <p className="text-xs text-[var(--text-faint)]">بدون پارامتر</p>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="حذف این اجرا؟"
        description="نتیجه و لاگ این اجرا پاک می‌شود. تغییراتی که قبلاً روی سایت اعمال کرده‌اید برنمی‌گردد."
        confirmLabel="حذف"
        loading={del.isPending}
        onConfirm={() => del.mutate()}
      />
    </div>
  );
}
