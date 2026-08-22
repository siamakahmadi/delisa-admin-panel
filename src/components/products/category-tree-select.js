"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

function buildTree(items, parentId = null) {
  return items
    .filter((item) => String(item.parent?._id || item.parent || "") === String(parentId || ""))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.name).localeCompare(String(b.name), "fa"))
    .map((item) => ({ ...item, children: buildTree(items, item._id) }));
}

function filterTree(nodes, q) {
  if (!q.trim()) return nodes;
  const needle = q.trim().toLowerCase();
  return nodes
    .map((node) => {
      const matches = String(node.name || "").toLowerCase().includes(needle);
      const children = filterTree(node.children || [], q);
      if (matches || children.length) return { ...node, children };
      return null;
    })
    .filter(Boolean);
}

function TreeNode({ node, selected, onToggle, level }) {
  const [open, setOpen] = useState(level < 1);
  const hasChildren = Boolean(node.children?.length);
  const isSelected = selected.includes(node._id);

  return (
    <div>
      <div
        className="flex items-center gap-1.5 rounded-[var(--radius-sm)] py-1.5 hover:bg-[var(--surface-muted)]"
        style={{ paddingInlineStart: level * 18 }}
      >
        {hasChildren ? (
          <button type="button" onClick={() => setOpen((v) => !v)} className="text-[var(--text-faint)]">
            <ChevronDown size={13} className={cn("transition-transform", !open && "-rotate-90")} />
          </button>
        ) : (
          <span className="w-[13px]" />
        )}
        <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={isSelected} onChange={() => onToggle(node._id)} className="h-3.5 w-3.5 accent-[var(--brand-600)]" />
          <span className={isSelected ? "font-medium text-[var(--text)]" : "text-[var(--text-muted)]"}>{node.name}</span>
          {hasChildren && <span className="text-[10px] text-[var(--text-faint)]">({node.children.length})</span>}
        </label>
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child._id} node={child} selected={selected} onToggle={onToggle} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTreeSelect({ categories = [], value = [], onChange, disabled }) {
  const [query, setQuery] = useState("");
  const tree = useMemo(() => buildTree(categories), [categories]);
  const visible = useMemo(() => filterTree(tree, query), [tree, query]);

  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  return (
    <div>
      <div className="relative mb-2">
        <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی دسته‌بندی..."
          disabled={disabled}
          className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] pe-8 ps-2.5 text-xs outline-none focus:border-[var(--brand-500)]"
        />
      </div>
      <div className="mb-2 text-[11px] text-[var(--text-faint)]">
        {value.length.toLocaleString("fa-IR")} دسته انتخاب شده
      </div>
      <div className="max-h-64 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] p-2">
        {visible.length ? (
          visible.map((node) => <TreeNode key={node._id} node={node} selected={value} onToggle={toggle} level={0} />)
        ) : (
          <p className="py-4 text-center text-xs text-[var(--text-faint)]">دسته‌ای یافت نشد</p>
        )}
      </div>
    </div>
  );
}
