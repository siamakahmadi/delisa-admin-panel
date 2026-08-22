"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Save, Trash2, ImagePlus, X, Eye, MousePointerClick } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn, formatNumber } from "@/lib/utils";

const STATUS_LABELS = { draft: "پیش‌نویس", active: "فعال", paused: "متوقف" };
const STATUS_VARIANTS = { draft: "neutral", active: "success", paused: "warning" };

const DEFAULTS = {
  title: "",
  category: "custom",
  status: "draft",
  priority: 0,
  content: {
    image: "",
    imageMobile: "",
    title: "",
    description: "",
    discountCode: "",
    ctaText: "",
    ctaLink: "",
    secondaryCtaText: "",
    secondaryCtaLink: "",
    backgroundColor: "#ffffff",
    textColor: "#0f172a",
    size: "medium",
    position: "center",
    showCloseButton: true,
  },
  targeting: { mode: "all", paths: [], excludePaths: [], devices: ["desktop", "tablet", "mobile"] },
  audience: { visitor: "all", auth: "all" },
  trigger: { event: "immediate", delaySeconds: 3, scrollPercent: 50 },
  frequency: { rule: "once_per_session", cooldownDaysAfterClose: 0 },
  schedule: { startsAt: null, endsAt: null },
};

function mergeDefaults(data) {
  if (!data) return DEFAULTS;
  return {
    ...DEFAULTS,
    ...data,
    content: { ...DEFAULTS.content, ...(data.content || {}) },
    targeting: { ...DEFAULTS.targeting, ...(data.targeting || {}) },
    audience: { ...DEFAULTS.audience, ...(data.audience || {}) },
    trigger: { ...DEFAULTS.trigger, ...(data.trigger || {}) },
    frequency: { ...DEFAULTS.frequency, ...(data.frequency || {}) },
    schedule: { ...DEFAULTS.schedule, ...(data.schedule || {}) },
  };
}

export function ModalDetail({ id }) {
  const { data, isLoading } = useQuery({
    queryKey: ["promo-modal", id],
    queryFn: async () => (await apiClient.get(`/api/admin/modals/${id}`)).data,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return <ModalForm id={id} initial={mergeDefaults(data)} initialStats={data.stats} />;
}

function ModalForm({ id, initial, initialStats }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initial);
  const [stats, setStats] = useState(initialStats);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const patch = (fields) => setForm((f) => ({ ...f, ...fields }));
  const patchSection = (section, fields) => setForm((f) => ({ ...f, [section]: { ...f[section], ...fields } }));

  const saveMutation = useMutation({
    mutationFn: () => apiClient.put(`/api/admin/modals/${id}`, form),
    onSuccess: (res) => {
      toast.success("مودال ذخیره شد");
      setForm(mergeDefaults(res.data));
      setStats(res.data.stats);
      queryClient.invalidateQueries({ queryKey: ["promo-modal", id] });
      queryClient.invalidateQueries({ queryKey: ["promo-modals"] });
    },
    onError: (err) => toast.error("خطا", err?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/admin/modals/${id}`),
    onSuccess: () => {
      toast.success("مودال حذف شد");
      queryClient.invalidateQueries({ queryKey: ["promo-modals"] });
      router.push("/marketing/modals");
    },
    onError: (err) => toast.error("خطا", err?.response?.data?.message || "حذف ناموفق بود"),
  });

  return (
    <div>
      <PageHeader
        title={form.title || "مودال"}
        subtitle={
          <span className="inline-flex items-center gap-3">
            <StatusBadge status={form.status} labels={STATUS_LABELS} variants={STATUS_VARIANTS} />
            <span className="inline-flex items-center gap-1 text-xs">
              <Eye size={12} /> {formatNumber(stats?.views)} بازدید
            </span>
            <span className="inline-flex items-center gap-1 text-xs">
              <MousePointerClick size={12} /> {formatNumber(stats?.clicks)} کلیک
            </span>
          </span>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/marketing/modals")}>
              <ArrowRight size={16} />
              بازگشت
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} />
              حذف
            </Button>
            <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              <Save size={16} />
              ذخیره
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardContent className="pt-5">
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label>عنوان داخلی</Label>
                <Input value={form.title} onChange={(e) => patch({ title: e.target.value })} />
              </div>
              <div>
                <Label>دسته‌بندی</Label>
                <Select value={form.category} onChange={(e) => patch({ category: e.target.value })}>
                  <option value="discount">تخفیف ویژه</option>
                  <option value="first-purchase">اولین خرید</option>
                  <option value="festival">جشنواره</option>
                  <option value="announcement">اطلاع‌رسانی</option>
                  <option value="custom">سفارشی</option>
                </Select>
              </div>
              <div>
                <Label>وضعیت</Label>
                <Select value={form.status} onChange={(e) => patch({ status: e.target.value })}>
                  <option value="draft">پیش‌نویس</option>
                  <option value="active">فعال (نمایش در سایت)</option>
                  <option value="paused">متوقف</option>
                </Select>
              </div>
            </div>

            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">محتوا</TabsTrigger>
                <TabsTrigger value="targeting">صفحات نمایش</TabsTrigger>
                <TabsTrigger value="conditions">شرایط نمایش</TabsTrigger>
                <TabsTrigger value="schedule">زمان‌بندی</TabsTrigger>
              </TabsList>

              <TabsContent value="content">
                <ContentTab content={form.content} onChange={(f) => patchSection("content", f)} />
              </TabsContent>

              <TabsContent value="targeting">
                <TargetingTab targeting={form.targeting} onChange={(f) => patchSection("targeting", f)} />
              </TabsContent>

              <TabsContent value="conditions">
                <ConditionsTab
                  audience={form.audience}
                  trigger={form.trigger}
                  frequency={form.frequency}
                  onAudienceChange={(f) => patchSection("audience", f)}
                  onTriggerChange={(f) => patchSection("trigger", f)}
                  onFrequencyChange={(f) => patchSection("frequency", f)}
                />
              </TabsContent>

              <TabsContent value="schedule">
                <ScheduleTab schedule={form.schedule} priority={form.priority} onScheduleChange={(f) => patchSection("schedule", f)} onPriorityChange={(v) => patch({ priority: v })} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <ModalPreview content={form.content} />
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف مودال"
        description={`آیا از حذف «${form.title}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}

function ContentTab({ content, onChange }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>تصویر (دسکتاپ)</Label>
          <ImageField value={content.image} onChange={(v) => onChange({ image: v })} />
        </div>
        <div>
          <Label>تصویر (موبایل — اختیاری)</Label>
          <ImageField value={content.imageMobile} onChange={(v) => onChange({ imageMobile: v })} />
        </div>
      </div>

      <div>
        <Label>عنوان مودال</Label>
        <Input value={content.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="مثلاً: ۲۰٪ تخفیف اولین خرید شما!" />
      </div>

      <div>
        <Label>توضیحات</Label>
        <textarea
          value={content.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-faint)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
          placeholder="متن توضیحی مودال..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>کد تخفیف (اختیاری)</Label>
          <Input dir="ltr" value={content.discountCode} onChange={(e) => onChange({ discountCode: e.target.value.toUpperCase() })} placeholder="SUMMER20" />
        </div>
        <div />
        <div>
          <Label>متن دکمه اصلی</Label>
          <Input value={content.ctaText} onChange={(e) => onChange({ ctaText: e.target.value })} placeholder="مشاهده تخفیف‌ها" />
        </div>
        <div>
          <Label>لینک دکمه اصلی</Label>
          <Input dir="ltr" value={content.ctaLink} onChange={(e) => onChange({ ctaLink: e.target.value })} placeholder="/landing/summer-sale" />
        </div>
        <div>
          <Label>متن دکمه دوم (اختیاری)</Label>
          <Input value={content.secondaryCtaText} onChange={(e) => onChange({ secondaryCtaText: e.target.value })} placeholder="فعلاً نه" />
        </div>
        <div>
          <Label>لینک دکمه دوم</Label>
          <Input dir="ltr" value={content.secondaryCtaLink} onChange={(e) => onChange({ secondaryCtaLink: e.target.value })} placeholder="اختیاری" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>رنگ پس‌زمینه</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={content.backgroundColor || "#ffffff"} onChange={(e) => onChange({ backgroundColor: e.target.value })} className="h-10 w-12 shrink-0 cursor-pointer rounded-[var(--radius-md)] border border-[var(--border)] bg-transparent" />
            <Input dir="ltr" value={content.backgroundColor} onChange={(e) => onChange({ backgroundColor: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>رنگ متن</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={content.textColor || "#0f172a"} onChange={(e) => onChange({ textColor: e.target.value })} className="h-10 w-12 shrink-0 cursor-pointer rounded-[var(--radius-md)] border border-[var(--border)] bg-transparent" />
            <Input dir="ltr" value={content.textColor} onChange={(e) => onChange({ textColor: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label>اندازه</Label>
          <Select value={content.size} onChange={(e) => onChange({ size: e.target.value })}>
            <option value="small">کوچک</option>
            <option value="medium">متوسط</option>
            <option value="large">بزرگ</option>
            <option value="full">تمام‌صفحه</option>
          </Select>
        </div>
        <div>
          <Label>موقعیت نمایش</Label>
          <Select value={content.position} onChange={(e) => onChange({ position: e.target.value })}>
            <option value="center">وسط صفحه</option>
            <option value="top">بالای صفحه</option>
            <option value="bottom">پایین صفحه</option>
            <option value="bottom-right">پایین راست</option>
            <option value="bottom-left">پایین چپ</option>
          </Select>
        </div>
        <label className="mt-6 flex h-10 items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" checked={content.showCloseButton} onChange={(e) => onChange({ showCloseButton: e.target.checked })} className="h-4 w-4 accent-[var(--brand-600)]" />
          نمایش دکمه بستن
        </label>
      </div>
    </div>
  );
}

function TargetingTab({ targeting, onChange }) {
  const devices = [
    { value: "desktop", label: "دسکتاپ" },
    { value: "tablet", label: "تبلت" },
    { value: "mobile", label: "موبایل" },
  ];

  const toggleDevice = (v) => {
    const set = new Set(targeting.devices || []);
    if (set.has(v)) set.delete(v);
    else set.add(v);
    onChange({ devices: Array.from(set) });
  };

  return (
    <div className="space-y-5">
      <div>
        <Label>در چه صفحاتی نمایش داده شود؟</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ mode: "all" })}
            className={cn(
              "flex-1 rounded-[var(--radius-md)] border px-4 py-3 text-start text-sm transition-colors",
              targeting.mode === "all" ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]" : "border-[var(--border)] hover:bg-[var(--surface-muted)]"
            )}
          >
            <div className="font-medium">همه صفحات سایت</div>
            <div className="mt-0.5 text-xs opacity-80">می‌توانید برخی مسیرها را استثنا کنید (مثلاً پرداخت)</div>
          </button>
          <button
            type="button"
            onClick={() => onChange({ mode: "specific" })}
            className={cn(
              "flex-1 rounded-[var(--radius-md)] border px-4 py-3 text-start text-sm transition-colors",
              targeting.mode === "specific" ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]" : "border-[var(--border)] hover:bg-[var(--surface-muted)]"
            )}
          >
            <div className="font-medium">فقط صفحات مشخص</div>
            <div className="mt-0.5 text-xs opacity-80">مثلاً فقط صفحه اصلی یا یک لندینگ خاص</div>
          </button>
        </div>
      </div>

      {targeting.mode === "specific" ? (
        <div>
          <Label>مسیرهای هدف</Label>
          <TagInput value={targeting.paths} onChange={(v) => onChange({ paths: v })} placeholder="/ یا /landing/summer-sale یا /product* برای همه صفحات محصول" />
          <PathsHelp />
        </div>
      ) : (
        <div>
          <Label>مسیرهای استثنا (اختیاری)</Label>
          <TagInput value={targeting.excludePaths} onChange={(v) => onChange({ excludePaths: v })} placeholder="/checkout* یا /panel*" />
          <PathsHelp />
        </div>
      )}

      <div>
        <Label>نمایش روی دستگاه‌ها</Label>
        <div className="flex gap-2">
          {devices.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => toggleDevice(d.value)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                (targeting.devices || []).includes(d.value) ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PathsHelp() {
  return <p className="mt-1.5 text-xs text-[var(--text-faint)]">هر مسیر را با Enter اضافه کنید. برای شامل‌شدن همه زیرمسیرها از * در انتها استفاده کنید، مثال: /product*</p>;
}

const VISITOR_OPTIONS = [
  { value: "all", label: "همه بازدیدکننده‌ها" },
  { value: "new", label: "فقط بازدیدکننده‌های جدید (اولین ورود به سایت)" },
  { value: "returning", label: "فقط کاربرانی که قبلاً سایت را دیده‌اند" },
];

const AUTH_OPTIONS = [
  { value: "all", label: "فرقی نمی‌کند" },
  { value: "guest", label: "فقط کاربران مهمان (وارد نشده)" },
  { value: "logged_in", label: "فقط کاربران وارد شده" },
];

const TRIGGER_OPTIONS = [
  { value: "immediate", label: "بلافاصله بعد از باز شدن صفحه" },
  { value: "delay", label: "بعد از چند ثانیه تاخیر" },
  { value: "scroll", label: "بعد از اسکرول تا درصد مشخصی از صفحه" },
  { value: "exit_intent", label: "هنگام قصد خروج از صفحه (فقط دسکتاپ)" },
];

const FREQUENCY_OPTIONS = [
  { value: "always", label: "هر بار که صفحه لود می‌شود" },
  { value: "once_per_session", label: "فقط یک‌بار در هر سشن (اولین سشن هم شامل می‌شود)" },
  { value: "once_per_day", label: "فقط یک‌بار در روز" },
  { value: "once_ever", label: "فقط یک‌بار برای همیشه" },
];

function ConditionsTab({ audience, trigger, frequency, onAudienceChange, onTriggerChange, onFrequencyChange }) {
  return (
    <div className="space-y-6">
      <div>
        <Label>مخاطب هدف</Label>
        <Select value={audience.visitor} onChange={(e) => onAudienceChange({ visitor: e.target.value })}>
          {VISITOR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>وضعیت ورود کاربر</Label>
        <Select value={audience.auth} onChange={(e) => onAudienceChange({ auth: e.target.value })}>
          {AUTH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="border-t border-[var(--border)] pt-5">
        <Label>چه زمانی نمایش داده شود؟ (تریگر)</Label>
        <Select value={trigger.event} onChange={(e) => onTriggerChange({ event: e.target.value })}>
          {TRIGGER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        {trigger.event === "delay" && (
          <div className="mt-3 max-w-xs">
            <Label>تاخیر (ثانیه)</Label>
            <Input type="number" min={0} value={trigger.delaySeconds} onChange={(e) => onTriggerChange({ delaySeconds: Number(e.target.value) })} />
          </div>
        )}

        {trigger.event === "scroll" && (
          <div className="mt-3 max-w-xs">
            <Label>درصد اسکرول</Label>
            <Input type="number" min={1} max={100} value={trigger.scrollPercent} onChange={(e) => onTriggerChange({ scrollPercent: Number(e.target.value) })} />
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)] pt-5">
        <Label>محدودیت تکرار نمایش</Label>
        <Select value={frequency.rule} onChange={(e) => onFrequencyChange({ rule: e.target.value })}>
          {FREQUENCY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        <div className="mt-3 max-w-xs">
          <Label>بعد از بستن توسط کاربر، حداقل چند روز دیگر نشان داده نشود</Label>
          <Input type="number" min={0} value={frequency.cooldownDaysAfterClose} onChange={(e) => onFrequencyChange({ cooldownDaysAfterClose: Number(e.target.value) })} />
          <p className="mt-1 text-xs text-[var(--text-faint)]">۰ یعنی بدون محدودیت اضافه؛ فقط قانون بالا اعمال می‌شود.</p>
        </div>
      </div>
    </div>
  );
}

function ScheduleTab({ schedule, priority, onScheduleChange, onPriorityChange }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>تاریخ شروع (اختیاری)</Label>
          <JalaliDatePicker value={schedule.startsAt} onChange={(v) => onScheduleChange({ startsAt: v })} />
        </div>
        <div>
          <Label>تاریخ پایان (اختیاری)</Label>
          <JalaliDatePicker value={schedule.endsAt} onChange={(v) => onScheduleChange({ endsAt: v })} />
        </div>
      </div>
      <p className="text-xs text-[var(--text-faint)]">در صورت خالی‌بودن، مودال (تا وقتی وضعیت آن «فعال» باشد) بدون محدودیت زمانی نمایش داده می‌شود.</p>

      <div className="max-w-xs">
        <Label>اولویت نمایش</Label>
        <Input type="number" value={priority} onChange={(e) => onPriorityChange(Number(e.target.value))} />
        <p className="mt-1 text-xs text-[var(--text-faint)]">اگر چند مودال همزمان واجد شرایط یک صفحه باشند، فقط یکی نمایش داده می‌شود؛ عدد بزرگ‌تر اولویت بیشتری دارد.</p>
      </div>
    </div>
  );
}

async function uploadModalImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "promo-modals");
  const res = await apiClient.post("/api/admin/uploads/image", fd);
  return res.data;
}

function ImageField({ value, onChange }) {
  const inputRef = useRef(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadModalImage(file);
      if (!res?.url) throw new Error("سرور آدرس تصویر را برنگرداند");
      onChange(res.url);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-32 w-full object-cover" />
          <button type="button" onClick={() => onChange("")} className="absolute left-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[var(--text-faint)] transition-colors hover:border-[var(--brand-400)] hover:text-[var(--brand-600)] disabled:opacity-50"
        >
          <ImagePlus size={20} />
          <span className="text-xs">{uploading ? "در حال آپلود..." : "افزودن تصویر"}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  );
}

function ModalPreview({ content }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>پیش‌نمایش</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-[280px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-6">
          <div
            className="w-full max-w-[260px] overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]"
            style={{ backgroundColor: content.backgroundColor || "#fff", color: content.textColor || "#0f172a" }}
          >
            {content.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.image} alt="" className="h-32 w-full object-cover" />
            )}
            <div className="space-y-2 p-4 text-center">
              {content.title && <h4 className="text-sm font-bold">{content.title}</h4>}
              {content.description && <p className="text-xs opacity-80">{content.description}</p>}
              {content.discountCode && (
                <div className="mx-auto inline-block rounded-[var(--radius-sm)] border border-dashed px-3 py-1 font-mono text-xs tracking-wider">
                  {content.discountCode}
                </div>
              )}
              {content.ctaText && (
                <div className="mt-2 rounded-[var(--radius-md)] bg-[var(--brand-600)] px-3 py-2 text-xs font-medium text-white">{content.ctaText}</div>
              )}
              {content.secondaryCtaText && <div className="text-[11px] opacity-60">{content.secondaryCtaText}</div>}
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-[var(--text-faint)]">
          پیش‌نمایش تقریبی است؛ ظاهر نهایی در سایت بسته به اندازه ({content.size}) و موقعیت ({content.position}) انتخابی متفاوت خواهد بود.
        </p>
      </CardContent>
    </Card>
  );
}
