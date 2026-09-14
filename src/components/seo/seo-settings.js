"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Plus, Trash2, Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { fetchSeoSettings, updateSeoSettings, fetchSeoChecks, fetchSeoTemplateDefaults, previewSeoTemplate } from "@/lib/seo/api";
import { ENTITY_LABELS, MODE_LABELS, CATEGORY_LABELS } from "@/lib/seo/constants";

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3">
      <span>
        <span className="block text-sm font-medium text-[var(--text)]">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-[var(--text-faint)]">{hint}</span>}
      </span>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
    </label>
  );
}

function Num({ label, value, onChange, hint, ...rest }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} {...rest} />
      {hint && <p className="mt-1 text-[11px] text-[var(--text-faint)]">{hint}</p>}
    </div>
  );
}

const TYPE_LABELS = { category: "دسته‌بندی", brand: "برند", tag: "برچسب", productType: "نوع محصول" };

function TemplateEditor({ type, value, defaults, siteName, onChange }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const doPreview = async () => {
    setLoading(true);
    try {
      const r = await previewSeoTemplate({ title: value.title || defaults?.title || "", description: value.description || defaults?.description || "", site: siteName });
      setPreview(r);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--text)]">{TYPE_LABELS[type]}</p>
        <Button variant="ghost" size="sm" onClick={doPreview} loading={loading}>
          <Eye size={13} />
          پیش‌نمایش
        </Button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <Label>قالب عنوان</Label>
          <Input value={value.title || ""} placeholder={defaults?.title || ""} onChange={(e) => onChange({ ...value, title: e.target.value })} />
        </div>
        <div>
          <Label>قالب توضیحات متا</Label>
          <Input value={value.description || ""} placeholder={defaults?.description || ""} onChange={(e) => onChange({ ...value, description: e.target.value })} />
        </div>
      </div>
      {preview && (
        <div className="mt-2 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-2 text-xs">
          <p className="font-semibold text-[var(--text)]">{preview.title} <span className="text-[var(--text-faint)]">({Array.from(preview.title || "").length.toLocaleString("fa-IR")} کاراکتر)</span></p>
          <p className="mt-1 text-[var(--text-muted)]">{preview.description} <span className="text-[var(--text-faint)]">({Array.from(preview.description || "").length.toLocaleString("fa-IR")} کاراکتر)</span></p>
        </div>
      )}
    </div>
  );
}

export function SeoSettings() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["seo-settings"], queryFn: fetchSeoSettings });
  const { data: checksData } = useQuery({ queryKey: ["seo-checks"], queryFn: fetchSeoChecks, staleTime: Infinity });
  const { data: tplDefaults } = useQuery({ queryKey: ["seo-template-defaults"], queryFn: fetchSeoTemplateDefaults, staleTime: Infinity });
  const [s, setS] = useState(null);
  // فرم از آخرین پاسخ سرور پر می‌شود (بعد از ذخیره هم دوباره)
  const [seeded, setSeeded] = useState(null);
  if (data?.settings && data.settings !== seeded) {
    setSeeded(data.settings);
    setS(JSON.parse(JSON.stringify(data.settings)));
  }

  const save = useMutation({
    mutationFn: () =>
      updateSeoSettings({
        siteUrl: s.siteUrl,
        siteName: s.siteName,
        schedule: s.schedule,
        crawl: s.crawl,
        thresholds: s.thresholds,
        entityTypes: s.entityTypes,
        mutedChecks: s.mutedChecks,
        keepAudits: s.keepAudits,
        templates: s.templates,
        indexingRules: s.indexingRules,
        emptyArchives: s.emptyArchives,
      }),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["seo-settings"] });
      queryClient.invalidateQueries({ queryKey: ["seo-overview"] });
    },
    onError: (e) => toast.error("خطا", e?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  if (isLoading || !s) return <Skeleton className="h-96 w-full" />;
  const set = (path, v) =>
    setS((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let o = next;
      for (let i = 0; i < keys.length - 1; i += 1) {
        const cur = o[keys[i]];
        o[keys[i]] = Array.isArray(cur) ? [...cur] : { ...(cur || {}) };
        o = o[keys[i]];
      }
      o[keys[keys.length - 1]] = v;
      return next;
    });
  const toggleType = (t) => set("entityTypes", s.entityTypes.includes(t) ? s.entityTypes.filter((x) => x !== t) : [...s.entityTypes, t]);
  const toggleMute = (id) => set("mutedChecks", s.mutedChecks.includes(id) ? s.mutedChecks.filter((x) => x !== id) : [...s.mutedChecks, id]);
  const checksByCat = (checksData?.checks || []).reduce((acc, c) => ((acc[c.category] ||= []).push(c), acc), {});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>سایت و زمان‌بندی</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>آدرس سایت مشتری</Label>
              <Input dir="ltr" value={s.siteUrl || ""} onChange={(e) => set("siteUrl", e.target.value)} placeholder={data?.resolvedSiteUrl} />
              <p className="mt-1 text-[11px] text-[var(--text-faint)]">خالی → {data?.resolvedSiteUrl}</p>
            </div>
            <Toggle label="ممیزی خودکار روزانه" hint="هر روز یک بار در ساعت مشخص (به وقت تهران)" checked={s.schedule?.enabled} onChange={(v) => set("schedule.enabled", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Num label="ساعت اجرا (۰–۲۳)" value={s.schedule?.hour} min={0} max={23} onChange={(v) => set("schedule.hour", v)} />
              <div>
                <Label>حالت اجرا</Label>
                <Select value={s.schedule?.mode || "full"} onChange={(e) => set("schedule.mode", e.target.value)}>
                  {Object.entries(MODE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </div>
            </div>
            <Num label="نگه‌داری تاریخچه (تعداد اجرا)" value={s.keepAudits} min={3} max={365} onChange={(v) => set("keepAudits", v)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>خزنده</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Toggle label="خزش HTML زنده‌ی سایت" hint="غیرفعال → فقط تحلیل محتوایی از دیتابیس" checked={s.crawl?.enabled} onChange={(v) => set("crawl.enabled", v)} />
            <Toggle label="بررسی لینک‌های شکسته" checked={s.crawl?.checkBrokenLinks} onChange={(v) => set("crawl.checkBrokenLinks", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Num label="سقف صفحات در هر اجرا" value={s.crawl?.maxPages} min={10} max={5000} onChange={(v) => set("crawl.maxPages", v)} hint="صفحات کم‌تعداد (دسته/برند/بلاگ) اول، محصولات آخر" />
              <Num label="سقف بررسی لینک" value={s.crawl?.maxLinkChecks} min={0} max={5000} onChange={(v) => set("crawl.maxLinkChecks", v)} />
              <Num label="هم‌زمانی" value={s.crawl?.concurrency} min={1} max={10} onChange={(v) => set("crawl.concurrency", v)} />
              <Num label="فاصله‌ی بین درخواست‌ها (ms)" value={s.crawl?.delayMs} min={0} max={5000} onChange={(v) => set("crawl.delayMs", v)} />
              <Num label="تایم‌اوت (ms)" value={s.crawl?.timeoutMs} min={3000} max={60000} onChange={(v) => set("crawl.timeoutMs", v)} />
            </div>
            <div>
              <Label>User-Agent</Label>
              <Input dir="ltr" value={s.crawl?.userAgent || ""} onChange={(e) => set("crawl.userAgent", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>آستانه‌ها</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Num label="حداقل طول عنوان" value={s.thresholds?.titleMin} onChange={(v) => set("thresholds.titleMin", v)} />
            <Num label="حداکثر طول عنوان" value={s.thresholds?.titleMax} onChange={(v) => set("thresholds.titleMax", v)} />
            <Num label="حداقل طول توضیحات" value={s.thresholds?.descriptionMin} onChange={(v) => set("thresholds.descriptionMin", v)} />
            <Num label="حداکثر طول توضیحات" value={s.thresholds?.descriptionMax} onChange={(v) => set("thresholds.descriptionMax", v)} />
            <Num label="حداقل کلمات محصول" value={s.thresholds?.productMinWords} onChange={(v) => set("thresholds.productMinWords", v)} />
            <Num label="حداقل کلمات مقاله" value={s.thresholds?.postMinWords} onChange={(v) => set("thresholds.postMinWords", v)} />
            <Num label="حداقل کلمات آرشیو" value={s.thresholds?.taxonomyMinWords} onChange={(v) => set("thresholds.taxonomyMinWords", v)} />
            <Num label="پاسخ کند (ms)" value={s.thresholds?.slowResponseMs} onChange={(v) => set("thresholds.slowResponseMs", v)} />
            <Num label="پاسخ خیلی کند (ms)" value={s.thresholds?.verySlowResponseMs} onChange={(v) => set("thresholds.verySlowResponseMs", v)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>بخش‌های سایت که ممیزی می‌شوند</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(ENTITY_LABELS).filter(([k]) => k !== "site").map(([k, v]) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-2.5 py-2 text-xs text-[var(--text)]">
                <input type="checkbox" checked={s.entityTypes?.includes(k)} onChange={() => toggleType(k)} className="h-3.5 w-3.5 accent-[var(--brand-600)]" />
                {v}
              </label>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قالب‌های خودکار عنوان و توضیحات متا (آرشیوها)</CardTitle>
          <span className="text-[11px] text-[var(--text-faint)]">برای صفحاتی که عنوان/توضیح اختصاصی ندارند؛ خالی = پیش‌فرض</span>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3 text-xs leading-6 text-[var(--text-muted)]">
            جای‌گذارها: <code dir="ltr">{"{name}"}</code> نام، <code dir="ltr">{"{site}"}</code> نام سایت، <code dir="ltr">{"{count}"}</code> تعداد محصول،{" "}
            <code dir="ltr">{"{brands}"}</code> برندهای پرتکرار، <code dir="ltr">{"{parent}"}</code> دسته‌ی والد. بخش داخل <code dir="ltr">[ ]</code> اگر جای‌گذارش خالی باشد
            حذف می‌شود — مثلاً <code dir="ltr">[؛ {"{count}"} محصول]</code>.
          </p>
          <div>
            <Label>نام سایت ({"{site}"})</Label>
            <Input value={s.siteName || ""} onChange={(e) => set("siteName", e.target.value)} placeholder="دلیسا" />
          </div>
          {["category", "brand", "tag", "productType"].map((type) => (
            <TemplateEditor
              key={type}
              type={type}
              value={s.templates?.[type] || { title: "", description: "" }}
              defaults={tplDefaults?.defaults?.[type]}
              siteName={s.siteName || "دلیسا"}
              onChange={(v) => set(`templates.${type}`, v)}
            />
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>قوانین ایندکس</CardTitle>
            <span className="text-[11px] text-[var(--text-faint)]">سایت با هدر X-Robots-Tag اعمال می‌کند؛ از سایت‌مپ هم حذف می‌شود</span>
          </CardHeader>
          <CardContent className="space-y-2">
            {(s.indexingRules || []).map((r, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <Input dir="ltr" className="w-44 flex-1" value={r.pattern} placeholder="/path یا /path/*" onChange={(e) => set(`indexingRules.${i}.pattern`, e.target.value)} />
                <div className="w-28">
                  <Select value={r.mode || "noindex"} onChange={(e) => set(`indexingRules.${i}.mode`, e.target.value)}>
                    <option value="noindex">noindex</option>
                    <option value="index">index</option>
                  </Select>
                </div>
                <Input className="w-40 flex-1" value={r.note || ""} placeholder="یادداشت" onChange={(e) => set(`indexingRules.${i}.note`, e.target.value)} />
                <Button variant="ghost" size="icon" onClick={() => set("indexingRules", s.indexingRules.filter((_, j) => j !== i))} aria-label="حذف">
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => set("indexingRules", [...(s.indexingRules || []), { pattern: "/", mode: "noindex", note: "" }])}>
              <Plus size={14} />
              افزودن قانون
            </Button>
            <p className="text-[11px] text-[var(--text-faint)]">الگو: مسیر دقیق (<code dir="ltr">/categories</code>) یا با ستاره (<code dir="ltr">/panel/*</code>). آخرین قانونِ منطبق برنده است.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>آرشیوهای خالی (بدون محصول)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Toggle label="noindex,follow خودکار" hint="صفحه‌ی خالی ایندکس نشود ولی لینک‌هایش دنبال شود" checked={s.emptyArchives?.noindex} onChange={(v) => set("emptyArchives.noindex", v)} />
            <Toggle label="نمایش محصولات پیشنهادی" hint="به‌جای «محصولی نیست»: دسته‌های هم‌سطح / پرفروش‌ها" checked={s.emptyArchives?.showSuggestions} onChange={(v) => set("emptyArchives.showSuggestions", v)} />
            <Num label="تعداد محصولات پیشنهادی" value={s.emptyArchives?.suggestionsLimit} min={0} max={24} onChange={(v) => set("emptyArchives.suggestionsLimit", v)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>چک‌های بی‌صدا ({(s.mutedChecks || []).length.toLocaleString("fa-IR")})</CardTitle>
          <span className="text-[11px] text-[var(--text-faint)]">چک‌های تیک‌خورده در نمره و لیست مشکلات لحاظ نمی‌شوند</span>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(checksByCat).map(([cat, list]) => (
            <div key={cat}>
              <p className="mb-1.5 text-xs font-semibold text-[var(--text-muted)]">{CATEGORY_LABELS[cat] || cat}</p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--surface-muted)]">
                    <input type="checkbox" checked={s.mutedChecks?.includes(c.id)} onChange={() => toggleMute(c.id)} className="h-3.5 w-3.5 accent-[var(--brand-600)]" />
                    <span className="truncate">{c.title}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} loading={save.isPending}>
          <Save size={15} />
          ذخیره تنظیمات
        </Button>
      </div>
    </div>
  );
}
