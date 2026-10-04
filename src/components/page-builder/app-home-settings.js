"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Layers, Smartphone, Pencil, Plus } from "lucide-react";
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
    desc: "اپ دقیقاً همان صفحه اصلی نسخه موبایل سایت را نشان می‌دهد. با هر تغییر در صفحه موبایل وب، اپ هم عوض می‌شود.",
  },
  {
    value: "separate",
    icon: Layers,
    title: "صفحه جدا برای اپ",
    desc: "یک صفحه اصلی مستقل فقط برای اپ می‌سازید و جدا از وب می‌چینید. تا وقتی منتشر نشود، اپ موقتاً از صفحه موبایل وب استفاده می‌کند.",
  },
];

const FEATURES = [
  ["stories", "استوری‌ها"],
  ["quickTabs", "تب‌های دسترسی سریع"],
  ["topBanner", "بنر باریک بالا"],
  ["heroSlider", "اسلایدر هیرو"],
  ["campaigns", "کمپین‌ها و بنرهای تبلیغاتی"],
  ["brands", "بخش برندها"],
  ["intro", "متن معرفی دلیسا"],
  ["faq", "سوالات متداول"],
];

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
        <div className="flex flex-wrap items-center gap-2">
          <Smartphone size={16} className="text-[var(--text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--text)]">صفحه اصلی اپلیکیشن موبایل</h3>
          {mutation.isPending && <span className="text-[11px] text-[var(--text-faint)]">در حال ذخیره…</span>}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {MODES.map(({ value, icon: Icon, title, desc }) => (
            <button
              key={value}
              type="button"
              disabled={isLoading || mutation.isPending}
              onClick={() => value !== mode && mutation.mutate({ mode: value })}
              className={cn(
                "rounded-[var(--radius-md)] border p-3 text-start text-xs transition-colors",
                mode === value ? "border-[var(--brand-500)] bg-[var(--brand-50)]" : "border-[var(--border)] hover:bg-[var(--surface-muted)]"
              )}
            >
              <Icon size={16} className="mb-1 text-[var(--text-muted)]" />
              <p className="font-medium text-[var(--text)]">{title}</p>
              <p className="mt-0.5 leading-5 text-[var(--text-faint)]">{desc}</p>
            </button>
          ))}
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

        <div>
          <p className="mb-2 text-xs text-[var(--text-muted)]">بخش‌های بیرون از صفحه‌ساز که در صفحه اصلی اپ نمایش داده شوند:</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FEATURES.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={features[key] !== false}
                  disabled={isLoading || mutation.isPending}
                  onChange={(e) => mutation.mutate({ features: { [key]: e.target.checked } })}
                  className="h-4 w-4 accent-[var(--brand-600)]"
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-5 text-[var(--text-faint)]">
            هر بخش علاوه بر این سوییچ، باید در تنظیمات خودش (مثلاً «استوری‌ها» یا «برندها») هم فعال باشد.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
