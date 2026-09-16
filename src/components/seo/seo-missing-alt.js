"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Pencil, Check, ExternalLink, Package, Newspaper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { fetchMissingAltImages, setImageAlt } from "@/lib/seo/api";

const LIMIT = 24;

// یک کارت: تصویر واقعی + نام صفحه‌ای که به آن تعلق دارد + فیلد alt که
// همین‌جا (بدون رفتن به فرم ویرایش) ذخیره می‌شود. ذخیره‌شدن یعنی این
// آیتم دیگر جزو «بدون alt» نیست، پس از لیست حذف می‌شود.
function ImageCard({ item, type, onSaved }) {
  const toast = useToast();
  const [alt, setAlt] = useState("");

  const save = useMutation({
    mutationFn: () =>
      setImageAlt({
        entityType: item.entityType,
        entityId: item.entityId,
        imageIndex: item.imageIndex,
        alt,
      }),
    onSuccess: () => {
      toast.success("alt ثبت شد");
      onSaved(item);
    },
    onError: (e) => toast.error("خطا", e?.response?.data?.message || "ثبت ناموفق بود"),
  });

  return (
    <Card>
      <CardContent className="space-y-2.5 p-3">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-muted)]">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- CDN URL، برای پیش‌نمایش سریع
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageOff size={22} className="text-[var(--text-faint)]" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {type === "product" ? <Package size={12} className="shrink-0 text-[var(--text-faint)]" /> : <Newspaper size={12} className="shrink-0 text-[var(--text-faint)]" />}
            <p className="truncate text-xs font-medium text-[var(--text)]" title={item.label}>
              {item.label}
            </p>
          </div>
          <Link href={item.editUrl} target="_blank" className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[var(--brand-600)] hover:underline">
            <Pencil size={10} />
            ویرایش صفحه
            <ExternalLink size={9} />
          </Link>
        </div>
        <form
          className="flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (alt.trim()) save.mutate();
          }}
        >
          <Input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="متن جایگزین (alt) تصویر..."
            className="!h-8 text-xs"
          />
          <Button type="submit" size="icon" className="!h-8 !w-8 shrink-0" disabled={!alt.trim()} loading={save.isPending}>
            <Check size={14} />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function SeoMissingAlt() {
  const [type, setType] = useState("product");
  const [page, setPage] = useState(1);
  const [removed, setRemoved] = useState(() => new Set());
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["seo-missing-alt", type, page],
    queryFn: () => fetchMissingAltImages({ type, page, limit: LIMIT }),
  });

  const items = (data?.items || []).filter((i) => !removed.has(`${i.entityType}:${i.entityId}:${i.imageIndex ?? ""}`));
  // badge سریع به‌روزرسانی می‌شود (بدون رفتن مجدد به سرور) تا با هر ذخیره
  // هم‌زمان با ناپدیدشدن کارت از لیست، عدد باقی‌مانده هم درست بماند
  const total = Math.max(0, (data?.total || 0) - removed.size);
  const pageCount = Math.max(1, Math.ceil(total / LIMIT));

  const switchType = (t) => {
    setType(t);
    setPage(1);
    setRemoved(new Set());
  };

  const onSaved = (item) => {
    setRemoved((prev) => new Set(prev).add(`${item.entityType}:${item.entityId}:${item.imageIndex ?? ""}`));
    queryClient.invalidateQueries({ queryKey: ["seo-health"] });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <ImageOff size={16} className="text-[var(--brand-500)]" />
            تصاویر بدون متن جایگزین (alt)
          </div>
          <p className="text-xs leading-6 text-[var(--text-muted)]">
            برای هر تصویر، ببینید کجاست و مستقیماً همین‌جا برایش alt بنویسید — نیازی به باز کردن فرم ویرایش نیست. alt توصیفی هم به سئوی تصویر کمک می‌کند هم به دسترس‌پذیری (screen reader).
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={type === "product" ? "primary" : "outline"} size="sm" onClick={() => switchType("product")}>
          <Package size={13} />
          تصاویر محصولات
        </Button>
        <Button variant={type === "post" ? "primary" : "outline"} size="sm" onClick={() => switchType("post")}>
          <Newspaper size={13} />
          کاور مقالات
        </Button>
        {!isLoading && <Badge variant={total ? "warning" : "success"} size="sm">{total.toLocaleString("fa-IR")} مورد بدون alt</Badge>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[var(--text-faint)]">
            {total === 0 ? "همه‌ی تصاویر این بخش alt دارند 🎉" : "همه‌ی موارد این صفحه ثبت شد — صفحه‌ی بعد را ببینید."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((item) => (
            <ImageCard key={`${item.entityType}-${item.entityId}-${item.imageIndex ?? "cover"}`} item={item} type={type} onSaved={onSaved} />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            صفحه {page.toLocaleString("fa-IR")} از {pageCount.toLocaleString("fa-IR")}
          </span>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              قبلی
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
              بعدی
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
