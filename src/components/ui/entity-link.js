"use client";

import { ExternalLink, ImageOff } from "lucide-react";

// نمایش اسم یک موجودیت (محصول/دسته‌بندی/برند...) به‌همراه لینک مستقیم به
// صفحه‌ی واقعی‌اش روی سایت — به‌جای نمایش خام شناسه یا اسلاگ.
export function EntityLink({ name, href, image, fallback = "-" }) {
  if (!name) return <span className="text-[var(--text-faint)]">{fallback}</span>;

  return (
    <div className="flex min-w-0 items-center gap-2">
      {image !== undefined && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageOff size={14} className="text-[var(--text-faint)]" />
          )}
        </div>
      )}
      <span className="truncate font-medium text-[var(--text)]">{name}</span>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 text-[var(--text-faint)] hover:text-[var(--brand-600)]"
          title="مشاهده در سایت"
        >
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}
