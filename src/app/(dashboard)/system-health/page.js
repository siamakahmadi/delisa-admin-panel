"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Database, Server, HardDrive, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { fetchSystemHealth, fetchAppLogs, clearAppLogs, fetchLiaraLogs } from "@/lib/system/api";
import { formatNumber } from "@/lib/utils";

function HealthCard({ icon: Icon, title, ok, loading, lines }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            loading
              ? "bg-[var(--surface-muted)] text-[var(--text-faint)]"
              : ok
              ? "bg-[var(--success-bg)] text-[var(--success)]"
              : "bg-[var(--danger-bg)] text-[var(--danger)]"
          }`}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text)]">{title}</span>
            {!loading && (
              <Badge variant={ok ? "success" : "danger"} size="sm" dot>
                {ok ? "متصل" : "قطع"}
              </Badge>
            )}
          </div>
          <div className="mt-1 space-y-0.5 text-xs text-[var(--text-muted)]">
            {(loading ? ["در حال بررسی..."] : lines).map((line, i) => (
              <div key={i} className="truncate">
                {line}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function levelBadgeVariant(level) {
  if (level === "error" || level === "stderr") return "danger";
  if (level === "warn") return "warning";
  return "neutral";
}

function LogLine({ entry }) {
  const time = new Date(entry.ts).toLocaleTimeString("fa-IR");
  return (
    <div className="flex items-start gap-2 border-b border-[var(--border)] px-3 py-1.5 font-mono text-[11px] last:border-0">
      <span className="shrink-0 text-[var(--text-faint)]">{time}</span>
      <Badge variant={levelBadgeVariant(entry.level || entry.stream)} size="sm" className="shrink-0">
        {entry.level || entry.stream || "log"}
      </Badge>
      <span className="whitespace-pre-wrap break-all text-[var(--text)]">{entry.message}</span>
    </div>
  );
}

function AppLogsPanel() {
  const [level, setLevel] = useState("all");
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["system-app-logs", level],
    queryFn: () => fetchAppLogs({ level, limit: 300 }),
    refetchInterval: 5000,
  });

  const clearMutation = useMutation({
    mutationFn: clearAppLogs,
    onSuccess: () => {
      toast.success("لاگ‌ها پاک شدند");
      queryClient.invalidateQueries({ queryKey: ["system-app-logs"] });
    },
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] p-3">
        <span className="text-xs text-[var(--text-muted)]">
          فقط لاگ‌های همین پروسه، از لحظه آخرین ری‌استارت سرور
        </span>
        <div className="flex items-center gap-2">
          <Select value={level} onChange={(e) => setLevel(e.target.value)} className="h-8 text-xs">
            <option value="all">همه سطوح</option>
            <option value="error">فقط خطا</option>
            <option value="warn">فقط هشدار</option>
            <option value="info">فقط اطلاعات</option>
          </Select>
          <Button variant="ghost" size="icon" title="بروزرسانی" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="پاک کردن"
            onClick={() => clearMutation.mutate()}
            loading={clearMutation.isPending}
          >
            <Trash2 size={14} className="text-[var(--danger)]" />
          </Button>
        </div>
      </div>
      <CardContent className="max-h-[520px] overflow-y-auto p-0">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-[var(--text-faint)]">در حال بارگذاری...</div>
        ) : !data?.length ? (
          <div className="p-6 text-center text-xs text-[var(--text-faint)]">لاگی ثبت نشده</div>
        ) : (
          data.map((entry) => <LogLine key={entry.id} entry={entry} />)
        )}
      </CardContent>
    </Card>
  );
}

const SINCE_OPTIONS = [
  { value: 300, label: "۵ دقیقه گذشته" },
  { value: 600, label: "۱۰ دقیقه گذشته" },
  { value: 1800, label: "۳۰ دقیقه گذشته" },
  { value: 3600, label: "۱ ساعت گذشته" },
];

function LiaraLogsPanel() {
  const [sinceSeconds, setSinceSeconds] = useState(600);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["system-liara-logs", sinceSeconds],
    queryFn: () => fetchLiaraLogs(sinceSeconds),
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] p-3">
        <span className="text-xs text-[var(--text-muted)]">لاگ واقعی دیپلوی، مستقیم از پلتفرم Liara</span>
        <div className="flex items-center gap-2">
          <Select
            value={sinceSeconds}
            onChange={(e) => setSinceSeconds(Number(e.target.value))}
            className="h-8 text-xs"
          >
            {SINCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Button variant="ghost" size="icon" title="بروزرسانی" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>
      <CardContent className="max-h-[520px] overflow-y-auto p-0">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-[var(--text-faint)]">در حال بارگذاری...</div>
        ) : data && !data.ok ? (
          <div className="p-6 text-center text-xs text-[var(--danger)]">{data.error}</div>
        ) : !data?.logs?.length ? (
          <div className="p-6 text-center text-xs text-[var(--text-faint)]">لاگی در این بازه یافت نشد</div>
        ) : (
          data.logs.map((entry, i) => (
            <LogLine key={i} entry={{ ...entry, level: entry.stream === "stderr" ? "error" : "info" }} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function SystemHealthPage() {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["system-health"],
    queryFn: fetchSystemHealth,
    refetchInterval: 15000,
  });

  const mongo = data?.mongo;
  const redis = data?.redis;
  const storage = data?.storage;

  return (
    <div>
      <PageHeader
        title="وضعیت سیستم"
        subtitle="بررسی زنده اتصال دیتابیس، Redis و استوریج، به‌همراه لاگ‌های سرور"
        actions={
          <Button variant="ghost" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw size={15} />
            بروزرسانی
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <HealthCard
          icon={Database}
          title="MongoDB"
          ok={!!mongo?.ok}
          loading={isLoading}
          lines={[
            `وضعیت: ${mongo?.status || "—"}`,
            mongo?.ms != null ? `پینگ: ${formatNumber(mongo.ms)} میلی‌ثانیه` : null,
            mongo?.error ? `خطا: ${mongo.error}` : null,
          ].filter(Boolean)}
        />
        <HealthCard
          icon={Server}
          title="Redis"
          ok={!!redis?.ok}
          loading={isLoading}
          lines={[
            `حالت فعلی: ${redis?.mode === "redis" ? "متصل به Redis" : "Fallback به حافظه داخلی"}`,
            redis?.ping?.ms != null ? `پینگ: ${formatNumber(redis.ping.ms)} میلی‌ثانیه` : null,
            redis?.lastError ? `آخرین خطا: ${redis.lastError}` : null,
          ].filter(Boolean)}
        />
        <HealthCard
          icon={HardDrive}
          title="استوریج (Liara Bucket)"
          ok={!!storage?.ok}
          loading={isLoading}
          lines={[
            storage?.bucket ? `باکت: ${storage.bucket}` : null,
            storage?.ms != null ? `پینگ: ${formatNumber(storage.ms)} میلی‌ثانیه` : null,
            storage?.error ? `خطا: ${storage.error}` : null,
          ].filter(Boolean)}
        />
      </div>

      {!isLoading && redis && redis.mode !== "redis" && (
        <div className="mb-5 rounded-[var(--radius-md)] border border-[var(--warning)] bg-[var(--warning-bg)] px-4 py-3 text-xs text-[var(--warning)]">
          Redis الان وصل نیست و کش روی حافظه داخلی همین پروسه fallback شده — یعنی بین ری‌استارت‌ها یا اگر چند نسخه از بک‌اند همزمان بالا باشه، کش مشترک نیست.
        </div>
      )}

      <Tabs defaultValue="app">
        <TabsList>
          <TabsTrigger value="app">لاگ‌های اپ (زنده)</TabsTrigger>
          <TabsTrigger value="liara">لاگ‌های Liara (دیپلوی)</TabsTrigger>
        </TabsList>
        <TabsContent value="app">
          <AppLogsPanel />
        </TabsContent>
        <TabsContent value="liara">
          <LiaraLogsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
