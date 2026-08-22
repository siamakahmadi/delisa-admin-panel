"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { createPreviewToken } from "@/lib/page-builder/api";
import { onSaveSettled, flushPageSave } from "@/lib/page-builder/autosave";

const CUSTOMER_SITE_URL = process.env.NEXT_PUBLIC_CUSTOMER_SITE_URL;

const BREAKPOINTS = [
  ["desktop", "دسکتاپ", 1200],
  ["tablet", "تبلت", 768],
  ["mobile", "موبایل", 375],
];

export function LivePreviewPanel({ open, onOpenChange, pageId }) {
  const [breakpoint, setBreakpoint] = useState("desktop");
  const [refreshTick, setRefreshTick] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["cms-preview-token", pageId, refreshTick],
    queryFn: async () => {
      if (!CUSTOMER_SITE_URL) {
        throw new Error(
          "NEXT_PUBLIC_CUSTOMER_SITE_URL تنظیم نشده — بدون آن پیش‌نمایش به آدرس خود پنل ادمین اشاره می‌کند."
        );
      }
      await flushPageSave(pageId).catch(() => {});
      const res = await createPreviewToken(pageId, 60 * 30);
      const path = res?.previewUrl || "/";
      return `${CUSTOMER_SITE_URL}${path}`;
    },
    enabled: open && !!pageId,
    retry: false,
  });

  useEffect(() => {
    if (!open) return undefined;
    return onSaveSettled(() => {
      const t = setTimeout(() => refetch(), 500);
      return () => clearTimeout(t);
    });
  }, [open, refetch]);

  const activeWidth = BREAKPOINTS.find(([id]) => id === breakpoint)?.[2] || 1200;
  const finalUrl = data ? `${data}${data.includes("?") ? "&" : "?"}_cb=${refreshTick}` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogTitle>پیش‌نمایش زنده</DialogTitle>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {BREAKPOINTS.map(([id, label, width]) => (
              <button
                key={id}
                onClick={() => setBreakpoint(id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  breakpoint === id ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]" : "border-[var(--border)] text-[var(--text-muted)]"
                )}
              >
                {label} ({width}px)
              </button>
            ))}
          </div>
          <button onClick={() => setRefreshTick((c) => c + 1)} disabled={isLoading} className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)]">
            <RefreshCw size={13} />
            تازه‌سازی
          </button>
        </div>

        {error && <p className="mt-2 text-xs text-[var(--danger)]">{error.message || "خطا در ساخت پیش‌نمایش زنده"}</p>}

        <div className="mt-3 flex max-h-[65vh] justify-center overflow-y-auto rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-4">
          {isLoading && !finalUrl ? (
            <div className="flex h-96 items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
              <Spinner size={18} />
              در حال آماده‌سازی پیش‌نمایش…
            </div>
          ) : finalUrl ? (
            <iframe key={finalUrl} src={finalUrl} title="پیش‌نمایش زنده صفحه" style={{ width: activeWidth }} className="h-[60vh] rounded-[var(--radius-md)] border border-[var(--border)] bg-white" />
          ) : (
            <p className="py-10 text-xs text-[var(--text-faint)]">پیش‌نمایشی موجود نیست</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
