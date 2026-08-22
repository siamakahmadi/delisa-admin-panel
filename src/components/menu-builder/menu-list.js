"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function MenuList({ menus, selectedId, onSelect, onCreate, loading }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text)]">منوها</h3>
        <Button size="sm" variant="ghost" onClick={onCreate}>
          <Plus size={13} />
          منوی جدید
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : menus.length === 0 ? (
        <p className="p-3 text-center text-xs text-[var(--text-faint)]">هنوز منویی نساخته‌اید.</p>
      ) : (
        <ul className="space-y-1">
          {menus.map((m) => (
            <li key={m._id}>
              <button
                type="button"
                onClick={() => onSelect(m._id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-start transition-colors",
                  selectedId === m._id ? "bg-[var(--brand-50)]" : "hover:bg-[var(--surface-muted)]"
                )}
              >
                <span className={cn("truncate text-sm", selectedId === m._id ? "font-medium text-[var(--brand-700)]" : "text-[var(--text)]")}>{m.name}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="text-[10px] text-[var(--text-faint)]">{m.location || "custom"}</span>
                  {m.isPublished ? (
                    <Badge variant="success" size="sm" dot>
                      منتشر
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      پیش‌نویس
                    </Badge>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
