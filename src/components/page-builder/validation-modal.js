"use client";

import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ValidationModal({ open, onOpenChange, issues, onJumpTo }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>قبل از انتشار این موارد را کامل کنید</DialogTitle>
        <DialogDescription>فیلدهای اجباری زیر هنوز خالی هستند.</DialogDescription>

        {issues.length === 0 ? (
          <p className="mt-4 text-xs text-[var(--text-faint)]">مشکلی یافت نشد.</p>
        ) : (
          <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto">
            {issues.map((issue, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] p-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--warning)]" />
                  <div className="text-xs">
                    <strong className="text-[var(--text)]">{issue.sectionTitle}</strong>
                    <span className="text-[var(--text-faint)]"> — {issue.componentLabel}</span>
                    <p className="text-[var(--text-faint)]">{issue.fieldLabel} الزامی است</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onJumpTo(issue);
                    onOpenChange(false);
                  }}
                >
                  برو به فیلد
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            بستن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
