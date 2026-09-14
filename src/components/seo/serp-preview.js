"use client";

import { CUSTOMER_SITE_URL } from "@/lib/seo/constants";

/** پیش‌نمایش نتیجه‌ی گوگل (شبیه Yoast) */
export function SerpPreview({ title, description, path, titleMax = 60, descriptionMax = 160 }) {
  const t = String(title || "").trim();
  const d = String(description || "").trim();
  const clipT = Array.from(t).length > titleMax ? `${Array.from(t).slice(0, titleMax - 1).join("")}…` : t;
  const clipD = Array.from(d).length > descriptionMax ? `${Array.from(d).slice(0, descriptionMax - 1).join("")}…` : d;
  const url = `${CUSTOMER_SITE_URL}${path || "/"}`;
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4" dir="rtl">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[10px] font-bold text-[var(--text-muted)]">د</span>
        <div className="min-w-0">
          <p className="text-[12px] leading-4 text-[var(--text)]">دلیسا</p>
          <p className="truncate text-[11px] leading-4 text-[var(--text-faint)]" dir="ltr">{url}</p>
        </div>
      </div>
      <p className="truncate text-[18px] leading-7 text-[#1a0dab] dark:text-[#8ab4f8]">{clipT || <span className="text-[var(--text-faint)]">عنوان سئو…</span>}</p>
      <p className="line-clamp-2 text-[13px] leading-5 text-[var(--text-muted)]">{clipD || <span className="text-[var(--text-faint)]">توضیحات متا…</span>}</p>
    </div>
  );
}
