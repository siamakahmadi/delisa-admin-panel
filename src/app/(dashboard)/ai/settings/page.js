"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, CheckCircle2, XCircle, Plus, Pencil, Trash2, Zap, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ConnectionDialog, CONNECTION_TYPES } from "@/components/ai/connection-dialog";
import { fetchAiSettings, updateAiSettings, fetchAiConnections, deleteAiConnection, testAiConnection } from "@/lib/ai/api";

const DEFAULTS = {
  enabled: true,
  contentAiEnabled: true,
  temperature: 0.4,
  maxOutputTokens: 900,
  webSearchEnabled: true,
  productSearchEnabled: true,
  smartSearchEnabled: true,
  conversationHistoryEnabled: true,
  contextWindowMessages: 16,
  model: { mini: "", full: "" },
  tiers: { mini: { connection: null, model: "" }, full: { connection: null, model: "" } },
  brandVoice: "",
  promptOverrides: {},
};

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
        {description && <p className="mt-0.5 text-xs text-[var(--text-faint)]">{description}</p>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-9 shrink-0 accent-[var(--brand-600)]"
      />
    </label>
  );
}

export default function AiSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: fetchAiSettings,
  });

  return (
    <div>
      <PageHeader title="تنظیمات هوش مصنوعی" subtitle="اتصال‌ها، مدل‌ها، لحن برند و قالب‌های نویسنده‌ی هوشمند (چت‌بات، سئو، تولید محتوا)" />

      {isLoading ? (
        <Skeleton className="h-96 w-full max-w-2xl" />
      ) : (
        <SettingsForm
          initial={{ ...DEFAULTS, ...(data?.settings || {}) }}
          connection={data?.connection}
          templates={data?.templates || []}
          active={data?.active}
        />
      )}
    </div>
  );
}

function SettingsForm({ initial, connection, templates, active }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(initial);
  useEffect(() => setSettings(initial), [initial]);

  const patch = (fields) => setSettings((s) => ({ ...s, ...fields }));
  const setTier = (tier, fields) =>
    setSettings((s) => ({ ...s, tiers: { ...s.tiers, [tier]: { ...s.tiers?.[tier], ...fields } } }));
  const overrides = settings.promptOverrides || {};
  const setOverride = (id, text) => patch({ promptOverrides: { ...overrides, [id]: { instructions: text } } });

  const { data: connData } = useQuery({ queryKey: ["ai-connections"], queryFn: fetchAiConnections });
  const connections = connData?.items || [];

  const saveMutation = useMutation({
    mutationFn: () => updateAiSettings(settings),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  return (
    <div className="max-w-2xl space-y-4">
      <ConnectionsCard connections={connections} />

      <Card>
        <CardHeader>
          <CardTitle>مدل‌های فعال</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-[var(--text-faint)]">
            «سریع» برای چت، جستجوی هوشمند، پیشنهاد عنوان/متای سئو و رفع خودکار مشکلات سئو؛ «قوی» برای نوشتن مقاله‌ی کامل و پرسش‌های پیچیده‌ی چت.
            اگر اتصالی انتخاب نشود، از اتصال قدیمی (Liara در فایل .env) استفاده می‌شود.
          </p>
          {["mini", "full"].map((tier) => {
            const sel = settings.tiers?.[tier] || {};
            const conn = connections.find((c) => c._id === sel.connection);
            const act = active?.[tier];
            return (
              <div key={tier} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{tier === "mini" ? "مدل سریع (Mini)" : "مدل قوی (Full)"}</span>
                  {act && (
                    <span className="font-mono text-[11px] text-[var(--text-faint)]" dir="ltr">
                      {act.connection || "env"} · {act.model}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label>اتصال</Label>
                    <Select
                      value={sel.connection || ""}
                      onChange={(e) => {
                        const id = e.target.value || null;
                        const c = connections.find((x) => x._id === id);
                        setTier(tier, { connection: id, model: c?.models?.[0] || "" });
                      }}
                    >
                      <option value="">پیش‌فرض (Liara از .env)</option>
                      {connections.map((c) => (
                        <option key={c._id} value={c._id} disabled={!c.enabled}>
                          {c.name} — {CONNECTION_TYPES[c.type]?.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>مدل</Label>
                    {conn ? (
                      <Select dir="ltr" value={sel.model || ""} onChange={(e) => setTier(tier, { model: e.target.value })}>
                        {!conn.models.length && <option value="">— ابتدا مدل اضافه کنید —</option>}
                        {conn.models.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        dir="ltr"
                        placeholder={tier === "mini" ? "openai/gpt-5.4-mini" : "openai/gpt-5"}
                        value={settings.model?.[tier] || ""}
                        onChange={(e) => patch({ model: { ...settings.model, [tier]: e.target.value } })}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-1 text-sm">
            <span className="text-[var(--text-muted)]">جستجوی وب (Tavily)</span>
            {connection?.hasWebSearchKey ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 size={12} /> فعال
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                تنظیم نشده — پاسخ از دانش عمومی مدل
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>لحن برند و قالب‌های نویسنده‌ی هوشمند</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>لحن و قواعد برند (به همه‌ی تولیدهای محتوایی و سئو اضافه می‌شود)</Label>
            <textarea
              rows={4}
              maxLength={2000}
              value={settings.brandVoice || ""}
              onChange={(e) => patch({ brandVoice: e.target.value })}
              placeholder="مثلاً: لحن صمیمی ولی حرفه‌ای؛ مخاطب خانم‌های ۲۰ تا ۴۰ ساله؛ از کلمه‌ی «ارزان» استفاده نکن؛ همه‌ی محصولات اورجینال و دارای ضمانت اصالت‌اند."
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">دستورالعمل تکمیلی هر قالب (اختیاری)</p>
            <div className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)]">
              {templates.map((t) => (
                <details key={t.id} className="group p-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm">
                    <span>
                      {t.label}
                      {overrides[t.id]?.instructions ? <Badge variant="brand" size="sm" className="ms-2">شخصی‌سازی‌شده</Badge> : null}
                    </span>
                    <span className="text-[11px] text-[var(--text-faint)]">{t.description}</span>
                  </summary>
                  <textarea
                    rows={3}
                    maxLength={1500}
                    value={overrides[t.id]?.instructions || ""}
                    onChange={(e) => setOverride(t.id, e.target.value)}
                    placeholder="دستور اضافه برای همین قالب، مثلاً: همیشه یک جمله درباره‌ی ارسال سریع بنویس"
                    className="mt-3 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm outline-none focus:border-[var(--brand-500)]"
                  />
                </details>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>فعال‌سازی</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-[var(--border)]">
          <Toggle
            label="ابزارهای هوش مصنوعی پنل (سئو و تولید محتوا)"
            description="نویسنده‌ی هوشمند در ویرایشگرها، پیشنهاد/رفع سئو با هوش مصنوعی و تطبیق قیمت. مستقل از چت‌بات سایت است."
            checked={settings.contentAiEnabled}
            onChange={(v) => patch({ contentAiEnabled: v })}
          />
          <Toggle
            label="چت‌بات سایت (ویجت گفتگو برای کاربران)"
            description="در صورت غیرفعال بودن، ویجت چت در سایت مشتری نمایش داده نمی‌شود. روی ابزارهای پنل و جستجوی هوشمند اثری ندارد."
            checked={settings.enabled}
            onChange={(v) => patch({ enabled: v })}
          />
          <Toggle
            label="جستجوی محصولات"
            description="اجازه به دستیار برای جستجو در محصولات واقعی دلیسا"
            checked={settings.productSearchEnabled}
            onChange={(v) => patch({ productSearchEnabled: v })}
          />
          <Toggle
            label="جستجوی وب"
            description="برای سؤالات علمی/عمومی که نیاز به اطلاعات تکمیلی دارند"
            checked={settings.webSearchEnabled}
            onChange={(v) => patch({ webSearchEnabled: v })}
          />
          <Toggle
            label="جستجوی انسانی (زبان طبیعی)"
            description="جعبه جستجوی سایت مشتری — کاربر با جمله‌ی طبیعی می‌نویسد (مثلاً «ضدآفتاب برای پوست چرب که برق نزنه») و نتیجه واقعی برمی‌گردد."
            checked={settings.smartSearchEnabled}
            onChange={(v) => patch({ smartSearchEnabled: v })}
          />
          <Toggle
            label="حافظه مکالمه"
            description="حفظ context مکالمه فعلی کاربر بین پیام‌ها"
            checked={settings.conversationHistoryEnabled}
            onChange={(v) => patch({ conversationHistoryEnabled: v })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>رفتار پاسخ‌دهی</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Temperature ({settings.temperature})</Label>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => patch({ temperature: Number(e.target.value) })}
              className="w-full accent-[var(--brand-600)]"
            />
          </div>
          <div>
            <Label>حداکثر طول پاسخ (توکن)</Label>
            <Input
              type="number"
              min={100}
              max={4000}
              value={settings.maxOutputTokens}
              onChange={(e) => patch({ maxOutputTokens: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>تعداد پیام‌های حافظه مکالمه</Label>
            <Input
              type="number"
              min={4}
              max={60}
              value={settings.contextWindowMessages}
              onChange={(e) => patch({ contextWindowMessages: Number(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          <Save size={16} />
          ذخیره تنظیمات
        </Button>
      </div>
    </div>
  );
}

function ConnectionsCard({ connections }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState({ open: false, connection: null });
  const [toDelete, setToDelete] = useState(null);
  const [testingId, setTestingId] = useState(null);

  const del = useMutation({
    mutationFn: (id) => deleteAiConnection(id),
    onSuccess: () => {
      toast.success("اتصال حذف شد");
      setToDelete(null);
      qc.invalidateQueries({ queryKey: ["ai-connections"] });
      qc.invalidateQueries({ queryKey: ["ai-settings"] });
    },
    onError: (e) => toast.error("حذف ناموفق بود", e?.response?.data?.error),
  });

  const test = async (c) => {
    setTestingId(c._id);
    try {
      const r = await testAiConnection(c._id, c.models?.[0]);
      if (r.test.ok) toast.success("اتصال برقرار است", `${r.test.message} (${r.test.ms}ms)`);
      else toast.error("تست ناموفق بود", r.test.message);
      qc.invalidateQueries({ queryKey: ["ai-connections"] });
    } catch (e) {
      toast.error("تست ناموفق بود", e?.response?.data?.error);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>اتصال‌های هوش مصنوعی</CardTitle>
        <Button size="sm" onClick={() => setDialog({ open: true, connection: null })}>
          <Plus size={14} /> افزودن اتصال
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {connections.length === 0 && (
          <p className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-4 text-center text-sm text-[var(--text-muted)]">
            هنوز اتصالی اضافه نشده. با «افزودن اتصال» کلید Gemini خود را وارد کنید.
          </p>
        )}
        {connections.map((c) => (
          <div key={c._id} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <KeyRound size={15} className="text-[var(--text-faint)]" />
                <span className="text-sm font-medium">{c.name}</span>
                <Badge variant="brand" size="sm">{CONNECTION_TYPES[c.type]?.label || c.type}</Badge>
                {!c.enabled && <Badge variant="neutral" size="sm">غیرفعال</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" loading={testingId === c._id} onClick={() => test(c)}>
                  <Zap size={13} /> تست
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDialog({ open: true, connection: c })}>
                  <Pencil size={13} />
                </Button>
                <Button size="sm" variant="ghost" className="text-[var(--danger)]" onClick={() => setToDelete(c)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[11px] text-[var(--text-faint)]" dir="ltr">{c.keyMask}</span>
              <span className="text-[var(--border)]">•</span>
              {c.models.length ? (
                c.models.map((m) => (
                  <span key={m} dir="ltr" className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-muted)]">
                    {m}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-[var(--warning)]">مدلی اضافه نشده</span>
              )}
            </div>
            {c.lastTest && (
              <p className={`mt-2 flex items-center gap-1 text-[11px] ${c.lastTest.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                {c.lastTest.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                آخرین تست: {c.lastTest.message}
              </p>
            )}
          </div>
        ))}
      </CardContent>
      <ConnectionDialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} connection={dialog.connection} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="حذف اتصال"
        description={`«${toDelete?.name || ""}» حذف شود؟ اگر مدل فعال از این اتصال بود، به اتصال پیش‌فرض برمی‌گردد.`}
        confirmLabel="حذف"
        loading={del.isPending}
        onConfirm={() => del.mutate(toDelete._id)}
      />
    </Card>
  );
}
