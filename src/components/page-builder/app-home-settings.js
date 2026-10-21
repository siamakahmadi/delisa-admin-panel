"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy, Layers, Smartphone, Pencil, Plus, Check, CircleDashed, Image as ImageIcon, Zap, Megaphone,
  GalleryHorizontal, Sparkles, Tag, FileText, HelpCircle, Loader2,
} from "lucide-react";
import * as pb from "@/lib/page-builder/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const MODES = [
  {
    value: "mirror",
    icon: Copy,
    title: "کلون صفحه موبایل وب",
    badge: "همگام خودکار",
    desc: "اپ دقیقاً همان صفحه اصلی نسخه موبایل سایت را نشان می‌دهد. با هر تغییر در صفحه موبایل وب، اپ هم عوض می‌شود.",
  },
  {
    value: "separate",
    icon: Layers,
    title: "صفحه جدا برای اپ",
    badge: "چیدمان مستقل",
    desc: "یک صفحه اصلی مستقل فقط برای اپ می‌سازید و جدا از وب می‌چینید. تا وقتی منتشر نشود، اپ موقتاً از صفحه موبایل وب استفاده می‌کند.",
  },
];

const FEATURES = [
  ["stories", "استوری‌ها", CircleDashed],
  ["quickTabs", "تب‌های دسترسی سریع", Zap],
  ["topBanner", "بنر باریک بالا", ImageIcon],
  ["heroSlider", "اسلایدر هیرو", GalleryHorizontal],
  ["campaigns", "کمپین‌ها و بنرهای تبلیغاتی", Megaphone],
  ["brands", "بخش برندها", Tag],
  ["intro", "متن معرفی دلیسا", FileText],
  ["faq", "سوالات متداول", HelpCircle],
];

function Switch({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-[var(--brand-600)]" : "bg-[var(--border-strong,#d4d4d8)]"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
          checked ? "start-[18px]" : "start-0.5"
        )}
      />
    </button>
  );
}

const QUERY_KEY = ["app-home-settings"];

/**
 * تنظیمات صفحه اصلی اپلیکیشن موبایل: کلون موبایل وب یا چیدمان جدا + سوییچ
 * ویژگی‌های بیرون از صفحه‌ساز. نگاه کن به Settings.appHome در بک‌اند.
 */
export function AppHomeSettings({ pages = [] }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: pb.fetchAppHomeSettings });

  const mutation = useMutation({
    mutationFn: (patch) => pb.saveAppHomeSettings(patch),
    onSuccess: (result) => {
      queryClient.setQueryData(QUERY_KEY, result);
      toast.success("تنظیمات صفحه اصلی اپ ذخیره شد");
    },
    onError: () => toast.error("ذخیره تنظیمات ناموفق بود"),
  });

  const createMutation = useMutation({
    mutationFn: () => pb.createPage({ type: "homeApp", title: "صفحه اصلی اپلیکیشن" }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      const page = res?.page || res;
      router.push(`/content/page-builder/${page._id || page.id}`);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ساخت صفحه ناموفق بود"),
  });

  const mode = data?.mode === "separate" ? "separate" : "mirror";
  const features = data?.features || {};
  const appPage = pages.find((p) => p.type === "homeApp");
  const appPublished = appPage && (appPage.status === "published" || !!appPage.publishedAt);

  return (
    <Card className="mb-4">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-50)] text-[var(--brand-600)]">
            <Smartphone size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-[var(--text)]">صفحه اصلی اپلیکیشن موبایل</h3>
            <p className="text-[11px] text-[var(--text-faint)]">انتخاب کنید اپ چه چیزی را در صفحه اصلی نشان بدهد.</p>
          </div>
          {mutation.isPending ? (
            <span className="flex items-center gap-1 text-[11px] text-[var(--text-faint)]">
              <Loader2 size={12} className="animate-spin" /> در حال ذخیره…
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map(({ value, icon: Icon, title, desc, badge }) => {
            const active = mode === value;
            return (
              <button
                key={value}
                type="button"
                disabled={isLoading || mutation.isPending}
                onClick={() => value !== mode && mutation.mutate({ mode: value })}
                aria-pressed={active}
                className={cn(
                  "relative flex gap-3 rounded-[var(--radius-lg,14px)] border-2 p-4 text-start transition-all disabled:cursor-wait",
                  active
                    ? "border-[var(--brand-500)] bg-[var(--brand-50)] shadow-sm"
                    : "border-[var(--border)] hover:border-[var(--brand-200,var(--border))] hover:bg-[var(--surface-muted)]"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
                    active ? "bg-[var(--brand-600)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                  )}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text)]">{title}</span>
                    <Badge variant={active ? "success" : "neutral"} size="sm">{badge}</Badge>
                  </span>
                  <span className="mt-1 block text-xs leading-6 text-[var(--text-muted)]">{desc}</span>
                </span>
                <span
                  className={cn(
                    "absolute end-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2",
                    active ? "border-[var(--brand-600)] bg-[var(--brand-600)] text-white" : "border-[var(--border)]"
                  )}
                >
                  {active && <Check size={12} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>

        {mode === "separate" && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">صفحه اپ:</span>
              {!appPage ? (
                <Badge variant="warning" size="sm" dot>هنوز ساخته نشده — اپ از صفحه موبایل وب استفاده می‌کند</Badge>
              ) : appPublished ? (
                <Badge variant="success" size="sm" dot>منتشرشده</Badge>
              ) : (
                <Badge variant="neutral" size="sm" dot>پیش‌نویس — اپ هنوز از صفحه موبایل وب استفاده می‌کند</Badge>
              )}
            </div>
            {appPage ? (
              <Button size="sm" variant="outline" onClick={() => router.push(`/content/page-builder/${appPage._id || appPage.id}`)}>
                <Pencil size={13} />
                ویرایش صفحه اپ
              </Button>
            ) : (
              <Button size="sm" loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
                <Plus size={13} />
                ساخت صفحه اپ
              </Button>
            )}
          </div>
        )}

        <div className="border-t border-[var(--border)] pt-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--text-muted)]" />
            <p className="text-xs font-medium text-[var(--text)]">بخش‌های بیرون از صفحه‌ساز</p>
            <span className="text-[11px] text-[var(--text-faint)]">در صفحه اصلی اپ نمایش داده شوند</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(([key, label, Icon]) => {
              const on = features[key] !== false;
              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[var(--radius-md)] border px-3 py-2.5 text-xs transition-colors",
                    on ? "border-[var(--border)] bg-[var(--surface)]" : "border-dashed border-[var(--border)] bg-[var(--surface-muted)] opacity-70"
                  )}
                >
                  <Icon size={15} className={on ? "text-[var(--brand-600)]" : "text-[var(--text-faint)]"} />
                  <span className="min-w-0 flex-1 truncate text-[var(--text)]">{label}</span>
                  <Switch
                    checked={on}
                    label={label}
                    disabled={isLoading || mutation.isPending}
                    onChange={(v) => mutation.mutate({ features: { [key]: v } })}
                  />
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[var(--text-faint)]">
            هر بخش علاوه بر این سوییچ، باید در تنظیمات خودش (مثلاً «استوری‌ها» یا «برندها») هم فعال باشد.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
