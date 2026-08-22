"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchRevisions, restoreRevision } from "@/lib/page-builder/api";
import { formatDateTime } from "@/lib/utils";

export function VersionHistoryPanel({ open, onOpenChange, pageId, onRestored }) {
  const [restoringId, setRestoringId] = useState(null);
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["cms-revisions", pageId],
    queryFn: () => fetchRevisions(pageId),
    enabled: open && !!pageId,
  });

  const revisions = data ?? [];

  async function handleRestore(rev) {
    setRestoringId(rev._id);
    setError(null);
    try {
      const res = await restoreRevision(pageId, rev._id);
      onRestored?.(res.page || res);
      onOpenChange(false);
    } catch (e) {
      setError(e?.response?.data?.message || "خطا در بازگردانی نسخه");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>تاریخچه نسخه‌ها</DialogTitle>
        <DialogDescription>بازگردانی، محتوای آن نسخه را به‌صورت پیش‌نویس بازمی‌گرداند و به‌صورت خودکار منتشر نمی‌شود.</DialogDescription>

        <div className="mt-4">
          {error && <p className="mb-2 text-xs text-[var(--danger)]">{error}</p>}
          {isLoading ? (
            <p className="py-6 text-center text-xs text-[var(--text-faint)]">در حال بارگذاری…</p>
          ) : revisions.length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--text-faint)]">هنوز نسخه‌ای منتشر نشده است.</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {revisions.map((rev) => (
                <li key={rev._id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] p-2.5">
                  <div>
                    <p className="text-xs font-medium text-[var(--text)]">{formatDateTime(rev.publishedAt || rev.createdAt)}</p>
                    {rev.publishedBy && <p className="text-[11px] text-[var(--text-faint)]">{rev.publishedBy?.name || rev.publishedBy}</p>}
                  </div>
                  <Button size="sm" variant="outline" loading={restoringId === rev._id} onClick={() => handleRestore(rev)}>
                    بازگردانی
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
