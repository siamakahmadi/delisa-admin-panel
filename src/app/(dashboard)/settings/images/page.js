"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, ScanSearch, Play, Square, Upload, Image as ImageIcon, HardDrive, AlertTriangle } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { useToast } from "@/components/ui/toast";

const fmtNum = (n) => Number(n || 0).toLocaleString("fa-IR");
function fmtBytes(n) {
  const v = Number(n || 0);
  if (v >= 1024 * 1024 * 1024) return `${(v / 1024 / 1024 / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 2 })} GB`;
  if (v >= 1024 * 1024) return `${(v / 1024 / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} MB`;
  if (v >= 1024) return `${Math.round(v / 1024).toLocaleString("fa-IR")} KB`;
  return `${fmtNum(v)} B`;
}
const STATUS_LABEL = {
  running: { label: "در حال اجرا", variant: "info" },
  done: { label: "تمام شد", variant: "success" },
  failed: { label: "خطا", variant: "danger" },
  cancelled: { label: "لغو شد", variant: "neutral" },
};

export default function ImageOptimizationPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["image-optimization-settings"],
    queryFn: async () => (await apiClient.get("/api/admin/images/settings")).data,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="بهینه‌سازی تصاویر"
        subtitle="هر تصویری که از پنل آپلود می‌شود (محصول، اسلایدر، بنر، بلاگ، صفحه‌ساز…) به‌صورت خودکار ریسایز و به WebP تبدیل می‌شود. تصاویر قدیمی باکت را هم می‌توانید از همین‌جا یک‌جا بهینه کنید."
      />

      {isLoading ? (
        <Skeleton className="h-72 w-full max-w-3xl" />
      ) : (
        <SettingsForm initial={data?.imageOptimization || {}} defaults={data?.defaults || {}} />
      )}

      <TestOptimizer />
      <BucketAudit />
      <BulkOptimizer />
    </div>
  );
}

function SettingsForm({ initial, defaults }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [s, setS] = useState({ ...defaults, ...initial });
  const patch = (fields) => setS((prev) => ({ ...prev, ...fields }));

  const saveMutation = useMutation({
    mutationFn: () =>
      apiClient.put("/api/admin/images/settings", {
        imageOptimization: {
          ...s,
          maxWidth: Number(s.maxWidth),
          maxHeight: Number(s.maxHeight),
          quality: Number(s.quality),
          skipBelowBytes: Math.round(Number(s.skipBelowKb ?? s.skipBelowBytes / 1024) * 1024),
        },
      }),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["image-optimization-settings"] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  const skipBelowKb = s.skipBelowKb ?? Math.round((s.skipBelowBytes || 0) / 1024);

  return (
    <Card className="max-w-3xl">
      <CardContent className="space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Upload size={16} className="text-[var(--brand-600)]" />
          بهینه‌سازی هنگام آپلود
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" checked={!!s.enabled} onChange={(e) => patch({ enabled: e.target.checked })} className="h-4 w-4 accent-[var(--brand-600)]" />
          فعال باشد (پیشنهاد می‌شود)
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>حداکثر عرض (px)</Label>
            <Input type="number" min={200} max={6000} value={s.maxWidth} onChange={(e) => patch({ maxWidth: e.target.value })} />
          </div>
          <div>
            <Label>حداکثر ارتفاع (px)</Label>
            <Input type="number" min={200} max={6000} value={s.maxHeight} onChange={(e) => patch({ maxHeight: e.target.value })} />
          </div>
          <div>
            <Label>کیفیت WebP (۴۰–۱۰۰)</Label>
            <Input type="number" min={40} max={100} value={s.quality} onChange={(e) => patch({ quality: e.target.value })} />
          </div>
        </div>
        <p className="-mt-2 text-xs text-[var(--text-faint)]">
          تصاویر بزرگ‌تر از این ابعاد کوچک می‌شوند (کوچک‌ترها بزرگ نمی‌شوند). کیفیت ۸۰–۸۵ برای فروشگاه تعادل خوبی بین وضوح و حجم است؛ بنرهای حساس به کیفیت را ۹۰ بگذارید.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>فایل‌های کوچک‌تر از (KB) دست نخورند</Label>
            <Input type="number" min={0} value={skipBelowKb} onChange={(e) => patch({ skipBelowKb: e.target.value })} />
            <p className="mt-1 text-xs text-[var(--text-faint)]">آیکون‌ها و لوگوهای ریز با تبدیل چیزی به دست نمی‌آورند.</p>
          </div>
          <label className="flex items-center gap-2 self-end pb-6 text-sm text-[var(--text)]">
            <input type="checkbox" checked={s.convertPng !== false} onChange={(e) => patch({ convertPng: e.target.checked })} className="h-4 w-4 accent-[var(--brand-600)]" />
            PNG (حتی شفاف) هم به WebP تبدیل شود
          </label>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs leading-6 text-[var(--text-muted)]">
          SVG، GIF متحرک، PDF و ویدئو هیچ‌وقت تغییر نمی‌کنند. متادیتای EXIF (موقعیت، دوربین…) حذف و جهت تصویر اصلاح می‌شود. اگر خروجی از فایل اصلی بزرگ‌تر شود، همان فایل اصلی آپلود می‌شود.
        </div>

        <div className="flex justify-end">
          <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save size={16} />
            ذخیره تنظیمات
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TestOptimizer() {
  const toast = useToast();
  const inputRef = useRef(null);
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState("");
  const testMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiClient.post("/api/admin/images/test", fd).then((r) => r.data?.result);
    },
    onSuccess: (r) => setResult(r),
    onError: (e) => toast.error(e?.response?.data?.error || "تست ناموفق بود"),
  });

  return (
    <Card className="max-w-3xl">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <ImageIcon size={16} className="text-[var(--brand-600)]" />
          تست تنظیمات روی یک تصویر
        </div>
        <p className="text-xs text-[var(--text-muted)]">یک تصویر انتخاب کنید تا ببینید با تنظیمات ذخیره‌شده چقدر کوچک می‌شود. چیزی آپلود یا ذخیره نمی‌شود.</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFileName(f.name);
              setResult(null);
              testMutation.mutate(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" loading={testMutation.isPending} onClick={() => inputRef.current?.click()}>
            <Upload size={16} />
            انتخاب تصویر
          </Button>
          {fileName && <span className="text-xs text-[var(--text-faint)]" dir="ltr">{fileName}</span>}
        </div>
        {result && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={HardDrive} label="حجم قبل" value={fmtBytes(result.before)} color="blue" />
            <StatCard icon={HardDrive} label="حجم بعد" value={result.changed ? fmtBytes(result.after) : "بدون تغییر"} color="violet" />
            <StatCard icon={ImageIcon} label="ابعاد خروجی" value={result.changed ? `${fmtNum(result.width)}×${fmtNum(result.height)}` : "—"} color="amber" />
            <StatCard icon={ScanSearch} label="صرفه‌جویی" value={`${fmtNum(result.savingPercent)}٪`} color="pink" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BucketAudit() {
  const toast = useToast();
  const [audit, setAudit] = useState(null);
  const auditMutation = useMutation({
    mutationFn: () => apiClient.get("/api/admin/images/audit").then((r) => r.data?.audit),
    onSuccess: (a) => setAudit(a),
    onError: (e) => toast.error(e?.response?.data?.error || "ممیزی ناموفق بود"),
  });

  return (
    <Card className="max-w-3xl">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <ScanSearch size={16} className="text-[var(--brand-600)]" />
            ممیزی تصاویر فعلی استوریج
          </div>
          <Button variant="outline" loading={auditMutation.isPending} onClick={() => auditMutation.mutate()}>
            اسکن باکت
          </Button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">فقط فهرست فایل‌ها خوانده می‌شود (سریع و بی‌خطر). نشان می‌دهد چند تصویر سنگین دارید و بازپردازش چقدر می‌ارزد.</p>

        {audit && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={ImageIcon} label="تصاویر" value={fmtNum(audit.images)} color="violet" />
              <StatCard icon={HardDrive} label="حجم تصاویر" value={fmtBytes(audit.imageBytes)} color="blue" />
              <StatCard icon={AlertTriangle} label="سنگین (> ۳۰۰KB)" value={fmtNum(audit.heavy)} color="amber" />
              <StatCard icon={AlertTriangle} label="خیلی سنگین (> ۱MB)" value={fmtNum(audit.veryHeavy)} color="pink" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-semibold text-[var(--text-muted)]">به تفکیک فرمت</p>
                <ul className="space-y-1 text-xs text-[var(--text)]">
                  {Object.entries(audit.byExt || {})
                    .sort((a, b) => b[1].bytes - a[1].bytes)
                    .slice(0, 8)
                    .map(([ext, v]) => (
                      <li key={ext} className="flex justify-between">
                        <span dir="ltr">.{ext}</span>
                        <span>{fmtNum(v.count)} فایل · {fmtBytes(v.bytes)}</span>
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-[var(--text-muted)]">بزرگ‌ترین فایل‌ها</p>
                <ul className="space-y-1 text-xs text-[var(--text)]">
                  {(audit.largest || []).map((f) => (
                    <li key={f.key} className="flex justify-between gap-2">
                      <span className="truncate" dir="ltr">{f.key}</span>
                      <span className="shrink-0">{fmtBytes(f.size)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BulkOptimizer() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [dryRun, setDryRun] = useState(false);
  const [prefix, setPrefix] = useState("");

  const { data } = useQuery({
    queryKey: ["image-optimization-status"],
    queryFn: async () => (await apiClient.get("/api/admin/images/optimize/status")).data,
    refetchInterval: (q) => (q.state.data?.running ? 2500 : false),
  });
  const run = data?.run;
  const running = !!data?.running;

  const startMutation = useMutation({
    mutationFn: () => apiClient.post("/api/admin/images/optimize", { dryRun, prefix }),
    onSuccess: () => {
      toast.success(dryRun ? "شبیه‌سازی شروع شد" : "بازپردازش شروع شد");
      queryClient.invalidateQueries({ queryKey: ["image-optimization-status"] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || "شروع ناموفق بود"),
  });
  const cancelMutation = useMutation({
    mutationFn: () => apiClient.post("/api/admin/images/optimize/cancel"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["image-optimization-status"] }),
  });

  useEffect(() => {
    if (!running) queryClient.invalidateQueries({ queryKey: ["image-optimization-status"] });
  }, [running, queryClient]);

  const saved = run ? Math.max(0, (run.bytesBefore || 0) - (run.bytesAfter || 0)) : 0;
  const status = run ? STATUS_LABEL[run.status] || STATUS_LABEL.done : null;

  return (
    <Card className="max-w-3xl">
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Play size={16} className="text-[var(--brand-600)]" />
          بهینه‌سازی تصاویر قدیمی
        </div>
        <p className="text-xs leading-6 text-[var(--text-muted)]">
          تصاویری که قبل از فعال‌شدن این سیستم آپلود شده‌اند (مثلاً اسلایدرهای ۱–۲ مگابایتی) با همان آدرس فعلی بازنویسی می‌شوند؛ هیچ لینکی عوض نمی‌شود. فقط فایل‌های بالای ۱۵۰KB که حداقل ۱۵٪ کوچک‌تر می‌شوند تغییر می‌کنند. در پس‌زمینه و یکی‌یکی اجرا می‌شود، پس سرور را سنگین نمی‌کند.
          <br />
          <strong>توجه:</strong> این کار برگشت‌ناپذیر است — اول با «فقط شبیه‌سازی» نتیجه را ببینید.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <Label>فقط پوشه‌ی (اختیاری)</Label>
            <Input dir="ltr" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="مثلاً sliders/ یا assets/" disabled={running} />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-[var(--text)]">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" disabled={running} />
            فقط شبیه‌سازی (چیزی بازنویسی نشود)
          </label>
          {running ? (
            <Button variant="outline" loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
              <Square size={16} />
              توقف
            </Button>
          ) : (
            <Button loading={startMutation.isPending} onClick={() => startMutation.mutate()}>
              <Play size={16} />
              {dryRun ? "شروع شبیه‌سازی" : "شروع بازپردازش"}
            </Button>
          )}
        </div>

        {run && (
          <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              <Badge variant={status.variant} size="sm" dot>{status.label}</Badge>
              {run.dryRun && <Badge variant="neutral" size="sm">شبیه‌سازی</Badge>}
              {run.prefix && <span dir="ltr">prefix: {run.prefix}</span>}
              <span>شروع: {new Date(run.startedAt).toLocaleString("fa-IR")}</span>
              {run.error && <span className="text-[var(--danger)]">{run.error}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={ScanSearch} label="بررسی‌شده" value={fmtNum(run.scanned)} color="blue" />
              <StatCard icon={ImageIcon} label="بهینه‌شده" value={fmtNum(run.optimized)} color="violet" />
              <StatCard icon={HardDrive} label="صرفه‌جویی" value={fmtBytes(saved)} color="pink" />
              <StatCard icon={AlertTriangle} label="رد شده / خطا" value={`${fmtNum(run.skipped)} / ${fmtNum(run.failed)}`} color="amber" />
            </div>
            {run.samples?.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-[var(--text-muted)]">نمونه‌های بزرگ</p>
                <ul className="space-y-1 text-xs text-[var(--text)]">
                  {run.samples.slice(0, 8).map((s) => (
                    <li key={s.key} className="flex justify-between gap-2">
                      <span className="truncate" dir="ltr">{s.key}</span>
                      <span className="shrink-0">
                        {fmtBytes(s.before)} ← {fmtBytes(s.after)} ({fmtNum(s.width)}×{fmtNum(s.height)})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
