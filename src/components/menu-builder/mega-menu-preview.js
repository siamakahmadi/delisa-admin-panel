"use client";

import { useMemo } from "react";
import { LayoutGrid } from "lucide-react";
import { ResolvedIcon } from "@/lib/menu-builder/icons";
import { itemDisplayTitle } from "./tree";

function idOf(v) {
  return v === null || v === undefined ? null : String(v);
}

/** Structural preview of a top-level item's mega-menu panel, built purely from local (unsaved) tree state. */
export function MegaMenuPreview({ items, rootId }) {
  const root = items.find((i) => idOf(i._id) === idOf(rootId));

  const columns = useMemo(() => {
    if (!root) return [];
    const directChildren = items.filter((i) => idOf(i.parentItemId) === idOf(rootId)).sort((a, b) => (a.order || 0) - (b.order || 0));
    return directChildren.map((col) => ({
      col,
      links: items.filter((i) => idOf(i.parentItemId) === idOf(col._id)).sort((a, b) => (a.order || 0) - (b.order || 0)),
    }));
  }, [items, rootId, root]);

  if (!root || root.menuStyle !== "mega" || !columns.length) return null;

  return (
    <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
        <LayoutGrid size={13} />
        پیش‌نمایش ساختار مگامنو — «{itemDisplayTitle(root)}»
      </p>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${root.columnCount || 4}, minmax(0, 1fr))` }}>
        {columns.map(({ col, links }) => (
          <div
            key={col._id}
            className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3"
            style={{ gridColumn: `span ${Math.min(col.columnSpan || 1, root.columnCount || 4)}` }}
          >
            {col.displayStyle === "featured" ? (
              <>
                {col.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={col.image} alt="" className="mb-2 h-16 w-full rounded-[var(--radius-sm)] object-cover" />
                )}
                <p className="text-xs font-medium text-[var(--text)]">{itemDisplayTitle(col)}</p>
              </>
            ) : (
              <>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--text)]">
                  {col.icon && <ResolvedIcon icon={col.icon} size={13} />}
                  {itemDisplayTitle(col)}
                </p>
                <ul className="space-y-1">
                  {links.length ? (
                    links.map((l) => (
                      <li key={l._id} className={`text-[11px] ${l.enabled === false ? "text-[var(--text-faint)] line-through" : "text-[var(--text-muted)]"}`}>
                        {itemDisplayTitle(l)}
                      </li>
                    ))
                  ) : (
                    <li className="text-[11px] text-[var(--text-faint)]">—</li>
                  )}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
