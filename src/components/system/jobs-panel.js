"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchJobs, fetchJobLogs, setJobEnabled } from "@/lib/system/api";

const KIND_LABEL = {
  interval: "زمان‌بندی‌شده",
  cron: "کران",
  event: "رویدادی",
  custom: "سایر",
};

const STATUS_LABEL = {
  success: "موفق",
  failed: "خطا",
  running: "در حال اجرا",
  interrupted: "ناتمام",
};

const GROUPS = [
  { kind: "interval", title: "جاب‌های زمان‌بندی‌شده" },
  { kind: "cron", title: "کران‌ها" },
  { kind: "event", title: "جاب‌های رویدادی" },
  { kind: "custom", title: "سایر" },
];

function statusVariant(status) {
  if (status === "success") return "success";
  if (status === "failed" || status === "interrupted") return "danger";
  if (status === "running") return "info";
  return "neutral";
}

function formatWhen(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms) {
  if (ms == null) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${Math.round(ms / 100) / 10}s`;
}

function JobSwitch({ enabled, disabled, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        enabled ? "bg-[var(--success)]" : "bg-[var(--border)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          enabled ? "end-0.5" : "start-0.5"
        }`}
      />
    </button>
  );
}

function JobLogs({ name }) {
  const { data, isLoading } = useQuery({
    queryKey: ["system-job-logs", name],
    queryFn: () => fetchJobLogs(name),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return <div className="px-4 py-3 text-xs text-[var(--text-faint)]">در حال بارگذاری لاگ...</div>;
  }
  if (!data?.length) {
    return <div className="px-4 py-3 text-xs text-[var(--text-faint)]">هنوز اجرایی ثبت نشده</div>;
  }

  return (
    <div className="max-h-64 overflow-y-auto border-t border-[var(--border)]">
      {data.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-2 border-b border-[var(--border)] px-4 py-2 text-xs last:border-0"
        >
          <span className="shrink-0 text-[var(--text-faint)]">{formatWhen(entry.startedAt)}</span>
          <Badge variant={statusVariant(entry.status)} size="sm" className="shrink-0">
            {STATUS_LABEL[entry.status] || entry.status}
          </Badge>
          {entry.durationMs != null && (
            <span className="shrink-0 text-[var(--text-faint)]">{formatDuration(entry.durationMs)}</span>
          )}
          <span className="min-w-0 break-all text-[var(--text-muted)]">{entry.message || "—"}</span>
        </div>
      ))}
    </div>
  );
}

export function JobsPanel() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [openName, setOpenName] = useState(null);
  const [pendingOff, setPendingOff] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["system-jobs"],
    queryFn: fetchJobs,
    refetchInterval: 15000,
  });

  const toggle = useMutation({
    mutationFn: ({ name, enabled }) => setJobEnabled(name, enabled),
    onSuccess: (_result, variables) => {
      toast.success(variables.enabled ? "جاب روشن شد" : "جاب خاموش شد");
      queryClient.invalidateQueries({ queryKey: ["system-jobs"] });
      setPendingOff(null);
    },
    onError: () => toast.error("تغییر وضعیت جاب انجام نشد"),
  });

  const jobs = data || [];

  function requestToggle(job) {
    if (job.enabled && job.kind === "event") {
      setPendingOff(job);
      return;
    }
    toggle.mutate({ name: job.name, enabled: !job.enabled });
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] p-3">
          <p className="text-xs text-[var(--text-muted)]">
            خاموش یعنی اجرای بعدی انجام نمی‌شود. اگر یک جاب خطا بدهد، فقط همان اجرا ناموفق ثبت می‌شود و پروسه API بسته نمی‌شود.
          </p>
          <Button variant="ghost" size="icon" title="بروزرسانی" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw size={14} />
          </Button>
        </div>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="p-4 text-sm text-[var(--danger)]">
            لیست جاب‌ها از سرور نیامد
            {error?.response?.status ? ` (کد ${error.response.status})` : ""}. این صفحه فقط وقتی سوئیچ‌ها را نشان
            می‌دهد که بک‌اند جدید هم بالا باشد.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="p-6 text-center text-xs text-[var(--text-faint)]">در حال بارگذاری جاب‌ها...</div>
      ) : (
        GROUPS.map((group) => {
          const rows = jobs.filter((job) => job.kind === group.kind);
          if (!rows.length) return null;
          return (
            <section key={group.kind}>
              <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">{group.title}</h2>
              <div className="space-y-2">
                {rows.map((job) => (
                  <Card key={job.name}>
                    <CardContent className="flex items-start gap-3 p-4">
                      <JobSwitch
                        enabled={job.enabled}
                        disabled={toggle.isPending}
                        onClick={() => requestToggle(job)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--text)]">{job.label}</span>
                          <Badge variant="neutral" size="sm">
                            {KIND_LABEL[job.kind] || job.kind}
                          </Badge>
                          <Badge variant={job.enabled ? "success" : "neutral"} size="sm">
                            {job.enabled ? "روشن" : "خاموش"}
                          </Badge>
                          {job.lastRun && (
                            <Badge variant={statusVariant(job.lastRun.status)} size="sm">
                              آخرین اجرا: {STATUS_LABEL[job.lastRun.status] || job.lastRun.status}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{job.description}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-[var(--text-faint)]">
                          <span>{job.schedule}</span>
                          <span>آخرین شروع: {formatWhen(job.lastRun?.startedAt)}</span>
                          {job.updatedBy && <span>آخرین تغییر توسط {job.updatedBy}</span>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 px-2"
                          onClick={() => setOpenName(openName === job.name ? null : job.name)}
                        >
                          {openName === job.name ? "بستن لاگ" : "لاگ اجرا"}
                        </Button>
                      </div>
                    </CardContent>
                    {openName === job.name && <JobLogs name={job.name} />}
                  </Card>
                ))}
              </div>
            </section>
          );
        })
      )}

      <ConfirmDialog
        open={!!pendingOff}
        onOpenChange={(open) => {
          if (!open) setPendingOff(null);
        }}
        title="این جاب خاموش شود؟"
        description={
          pendingOff
            ? `${pendingOff.label} رویدادی است. تا وقتی دوباره روشنش نکنید، این کار در جریان سفارش یا اعلان انجام نمی‌شود.`
            : ""
        }
        confirmLabel="خاموش شود"
        loading={toggle.isPending}
        onConfirm={() => {
          if (!pendingOff) return;
          toggle.mutate({ name: pendingOff.name, enabled: false });
        }}
      />
    </div>
  );
}
