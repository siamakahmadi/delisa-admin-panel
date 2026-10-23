"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, PanelsTopLeft, Pencil, Plus, Rocket, Undo2 } from "lucide-react";
import * as pb from "@/lib/page-builder/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const LABELS = { category: "دسته", brand: "برند", tag: "برچسب" };

/**
 * Lets the admin choose, per category / brand / tag, between the default
 * product archive and a custom Page Builder page served at the same URL
 * (Page.type === type). "Custom" is simply: a published, active page exists.
 */
export function ArchivePageCard({ type, entity }) {
  const label = LABELS[type];
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const queryKey = ["cms-archive-page", type, entity._id];

  const { data: page, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await pb.fetchPages({ type, targetId: entity._id, limit: 1 });
      return res?.pages?.[0] || null;
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
  };

  const createMutation = useMutation({
    mutationFn: () => pb.createPage({ type, targetId: entity._id }),
    onSuccess: (created) => {
      refresh();
      router.push(`/content/page-builder/${created._id || created.id}`);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ساخت صفحه ناموفق بود"),
  });

  const toggleMutation = useMutation({
    mutationFn: (publish) => (publish ? pb.publishPage(page._id) : pb.unpublishPage(page._id)),
    onSuccess: (_, publish) => {
      toast.success(publish ? "صفحه اختصاصی منتشر شد" : "آرشیو محصولات دوباره نمایش داده می‌شود");
      refresh();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "عملیات ناموفق بود"),
  });

  const isCustom = page?.status === "published" && page?.isActive !== false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{`طرح صفحه ${label}`}</CardTitle>
        {page && (
          <Badge variant={isCustom ? "success" : "neutral"} size="sm" dot>
            {isCustom ? "صفحه اختصاصی فعال" : "پیش‌نویس"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ModeTile
            icon={LayoutGrid}
            title="آرشیو محصولات"
            desc={`لیست محصولات این ${label} با فیلتر و مرتب‌سازی (پیش‌فرض)`}
            active={!isCustom}
          />
          <ModeTile
            icon={PanelsTopLeft}
            title="صفحه اختصاصی (صفحه‌ساز)"
            desc="به‌جای آرشیو، صفحه‌ای که خودتان با صفحه‌ساز می‌چینید"
            active={isCustom}
          />
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          آدرس و سئوی صفحه (canonical، اسکیمای breadcrumb) تغییر نمی‌کند؛ فقط محتوا عوض می‌شود. عنوان/توضیحات سئو را از دکمه «سئو» در خود صفحه‌ساز تنظیم کنید؛ در غیر این صورت از تنظیمات سئوی همین {label} استفاده می‌شود.
        </p>

        <div className="flex flex-wrap gap-2">
          {!page && (
            <Button size="sm" loading={createMutation.isPending} disabled={isLoading} onClick={() => createMutation.mutate()}>
              <Plus size={14} />
              ساخت صفحه اختصاصی
            </Button>
          )}
          {page && (
            <>
              <Button variant="outline" size="sm" onClick={() => router.push(`/content/page-builder/${page._id}`)}>
                <Pencil size={14} />
                ویرایش در صفحه‌ساز
              </Button>
              {isCustom ? (
                <Button variant="secondary" size="sm" loading={toggleMutation.isPending} onClick={() => toggleMutation.mutate(false)}>
                  <Undo2 size={14} />
                  بازگشت به آرشیو
                </Button>
              ) : (
                <Button size="sm" loading={toggleMutation.isPending} onClick={() => toggleMutation.mutate(true)}>
                  <Rocket size={14} />
                  انتشار صفحه اختصاصی
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ModeTile({ icon: Icon, title, desc, active }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border p-3 text-xs",
        active ? "border-[var(--brand-500)] bg-[var(--brand-50)]" : "border-[var(--border)] opacity-70"
      )}
    >
      <Icon size={16} className="mb-1 text-[var(--text-muted)]" />
      <p className="font-medium text-[var(--text)]">{title}</p>
      <p className="mt-0.5 text-[var(--text-faint)]">{desc}</p>
    </div>
  );
}
