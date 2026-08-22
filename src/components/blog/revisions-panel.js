"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import { fetchRevisions, restoreRevision } from "@/lib/blog/api";

export function RevisionsPanel({ open, onOpenChange, postId, onRestored }) {
  const toast = useToast();
  const [restoringId, setRestoringId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["post-revisions", postId],
    queryFn: () => fetchRevisions(postId),
    enabled: open && !!postId,
  });
  const revisions = data ?? [];

  const restoreMutation = useMutation({
    mutationFn: (revId) => restoreRevision(postId, revId),
    onMutate: (revId) => setRestoringId(revId),
    onSuccess: (post) => {
      onRestored?.(post);
      toast.success("نسخه بازگردانی شد");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e?.response?.data?.message || "خطا در بازگردانی نسخه"),
    onSettled: () => setRestoringId(null),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2">
          <History size={16} />
          تاریخچه نسخه‌ها
        </DialogTitle>

        <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto">
          {isLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : revisions.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-faint)]">هنوز نسخه‌ای ذخیره نشده است.</p>
          ) : (
            revisions.map((r) => (
              <div key={r._id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text)]">{r.title || "(بدون عنوان)"}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                    {formatDateTime(r.createdAt)} — {r.createdBy?.name || "ناشناس"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={restoreMutation.isPending}
                  loading={restoringId === r._id && restoreMutation.isPending}
                  onClick={() => {
                    if (window.confirm("بازگردانی به این نسخه، محتوای فعلی را جایگزین می‌کند (وضعیت فعلی هم به عنوان یک نسخه ذخیره می‌شود). ادامه می‌دهید؟")) {
                      restoreMutation.mutate(r._id);
                    }
                  }}
                >
                  بازگردانی
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
