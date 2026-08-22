"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export const SlashMenuList = forwardRef(function SlashMenuList({ items, command }, ref) {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [items]);

  const select = (index) => {
    const item = items[index];
    if (item) command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (!items.length) return false;
      if (event.key === "ArrowDown") {
        setSelected((s) => (s + 1) % items.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelected((s) => (s - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        select(selected);
        return true;
      }
      return false;
    },
  }));

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = item.group || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries());
  }, [items]);

  if (!items.length) {
    return (
      <div className="w-64 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-lg)]">
        <p className="text-xs text-[var(--text-faint)]">موردی یافت نشد</p>
      </div>
    );
  }

  let flatIndex = -1;

  return (
    <div className="max-h-80 w-72 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-lg)]">
      {groups.map(([groupName, groupItems]) => (
        <div key={groupName || "default"} className="mb-1 last:mb-0">
          {groupName && <div className="px-2 py-1 text-[10px] font-semibold text-[var(--text-faint)]">{groupName}</div>}
          {groupItems.map((item) => {
            flatIndex += 1;
            const index = flatIndex;
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.title}
                onClick={() => select(index)}
                onMouseEnter={() => setSelected(index)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-start",
                  index === selected ? "bg-[var(--brand-50)]" : "hover:bg-[var(--surface-muted)]"
                )}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]">
                  <Icon size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-[var(--text)]">{item.title}</span>
                  {item.description && <span className="block truncate text-[11px] text-[var(--text-faint)]">{item.description}</span>}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
});
