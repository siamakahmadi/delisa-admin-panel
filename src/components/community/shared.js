"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const POST_STATUS_LABELS = { visible: "منتشرشده", pending: "در انتظار تایید", hidden: "پنهان", deleted: "حذف‌شده" };
export const POST_STATUS_VARIANTS = { visible: "success", pending: "warning", hidden: "danger", deleted: "neutral" };
export const REASON_LABELS = { spam: "اسپم / تبلیغ", abuse: "توهین / آزار", inappropriate: "محتوای نامناسب", misinformation: "اطلاعات نادرست", other: "سایر" };

export function PostStatusBadge({ status }) {
  return (
    <Badge variant={POST_STATUS_VARIANTS[status] || "neutral"} size="sm" dot>
      {POST_STATUS_LABELS[status] || status}
    </Badge>
  );
}

export function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return String(value);
  }
}

// متن پست با عکس‌ها (کوچک) — در جدول‌های ادمین.
export function PostPreview({ post }) {
  return (
    <div className="min-w-0 max-w-[420px]">
      <p className="whitespace-pre-wrap break-words text-sm text-[var(--text)]">{post.text || <span className="text-[var(--text-faint)]">(بدون متن)</span>}</p>
      {post.images?.length ? (
        <div className="mt-1.5 flex gap-1.5">
          {post.images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="h-12 w-12 rounded-[var(--radius-sm)] object-cover" />
          ))}
        </div>
      ) : null}
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
        {post.isReply && <Badge size="sm">پاسخ</Badge>}
        {post.isQuestion && <Badge size="sm" variant="info">سوال</Badge>}
        <span>{post.likeCount} لایک</span>
        <span>· {post.replyCount} پاسخ</span>
        {post.reportCount > 0 && <span className="text-[var(--danger)]">· {post.reportCount} گزارش</span>}
      </div>
    </div>
  );
}

export function Pager({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>قبلی</Button>
      <span className="text-xs text-[var(--text-muted)]">صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}</span>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>بعدی</Button>
    </div>
  );
}
