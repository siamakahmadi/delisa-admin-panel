"use client";

import { useMemo, useState } from "react";
import { Search, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { CATEGORY_LABELS } from "@/lib/page-builder/field-utils";

export function Palette({ registry, onInsert, templates, onInsertTemplate, loadingTemplates }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("components");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = (registry || []).filter((t) => {
      if (!q) return true;
      return (
        t.label?.toLowerCase().includes(q) ||
        t.type?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        (t.aliases || []).some((a) => a.toLowerCase().includes(q))
      );
    });
    const byCategory = {};
    for (const t of filtered) {
      const cat = t.category || "utility";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(t);
    }
    return byCategory;
  }, [registry, query]);

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates || [];
    return (templates || []).filter((t) => t.name?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
  }, [templates, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 border-b border-[var(--border)] p-2">
        {[
          ["components", "کامپوننت‌ها"],
          ["templates", "کتابخانه بخش‌های آماده"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-[var(--radius-sm)] py-1.5 text-xs font-medium transition-colors",
              tab === key ? "bg-[var(--brand-50)] text-[var(--brand-700)]" : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-2">
        <div className="relative">
          <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <Input className="h-9 pr-8 text-xs" placeholder="جستجو..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 pt-0">
        {tab === "components" ? (
          Object.keys(grouped).length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--text-faint)]">موردی با این جستجو یافت نشد.</p>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="mb-3">
                <p className="mb-1.5 text-[11px] font-semibold text-[var(--text-faint)]">{CATEGORY_LABELS[cat] || cat}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {items.map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      title={t.description}
                      onClick={() => onInsert(t)}
                      className="flex flex-col items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border)] p-2.5 text-center hover:border-[var(--brand-500)] hover:bg-[var(--brand-50)]"
                    >
                      <Package size={16} className="text-[var(--text-muted)]" />
                      <span className="text-[11px] leading-tight text-[var(--text)]">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )
        ) : loadingTemplates ? (
          <p className="py-6 text-center text-xs text-[var(--text-faint)]">در حال بارگذاری…</p>
        ) : filteredTemplates.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--text-faint)]">هنوز بخش قابل‌استفاده مجدد ذخیره نشده است.</p>
        ) : (
          <div className="space-y-1.5">
            {filteredTemplates.map((tpl) => (
              <button
                key={tpl._id}
                type="button"
                onClick={() => onInsertTemplate(tpl)}
                className="flex w-full items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] p-2 text-start hover:border-[var(--brand-500)] hover:bg-[var(--brand-50)]"
              >
                {tpl.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tpl.thumbnailUrl} alt="" className="h-9 w-9 shrink-0 rounded-[var(--radius-sm)] object-cover" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
                    <Package size={14} className="text-[var(--text-faint)]" />
                  </div>
                )}
                <div className="min-w-0">
                  <strong className="block truncate text-xs text-[var(--text)]">{tpl.name}</strong>
                  {tpl.description && <span className="block truncate text-[11px] text-[var(--text-faint)]">{tpl.description}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
