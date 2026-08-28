"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Plus, ImageOff } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

// Shared across campaign product-lists and discount target/condition product
// pickers. `value` is an array of product ids; `onChange` receives the new
// array. `selectedProducts` (optional) pre-hydrates chip labels/images for
// ids already selected when the picker mounts (e.g. when editing), so we
// don't have to re-fetch every selected product by id on every render.
export function ProductMultiPicker({ value = [], onChange, selectedProducts = [] }) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query);
  const [known, setKnown] = useState(() => {
    const map = {};
    for (const p of selectedProducts) map[p._id] = p;
    return map;
  });

  const { data, isLoading } = useQuery({
    queryKey: ["product-picker-search", debounced],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/products", { params: { search: debounced, limit: 10 } });
      return res.data?.products ?? [];
    },
    enabled: debounced.trim().length > 0,
  });

  const results = (data ?? []).filter((p) => !value.includes(p._id));

  const add = (product) => {
    setKnown((k) => ({ ...k, [product._id]: product }));
    onChange([...value, product._id]);
    setQuery("");
  };

  const remove = (id) => onChange(value.filter((v) => v !== id));

  return (
    <div>
      <div className="relative">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
        <Input placeholder="جستجوی محصول برای افزودن..." className="pr-9" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {query.trim() && (
        <div className="mt-1.5 max-h-56 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
          {isLoading ? (
            <div className="p-3 text-center text-xs text-[var(--text-faint)]">در حال جستجو...</div>
          ) : results.length ? (
            results.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => add(p)}
                className="flex w-full items-center gap-2.5 border-b border-[var(--border)] p-2 text-right last:border-0 hover:bg-[var(--surface-muted)]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
                  {p.productImages?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.productImages[0].url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff size={12} className="text-[var(--text-faint)]" />
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm text-[var(--text)]">{p.productName}</span>
                <Plus size={14} className="shrink-0 text-[var(--brand-600)]" />
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-xs text-[var(--text-faint)]">محصولی یافت نشد</div>
          )}
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((id) => {
            const p = known[id];
            return (
              <span key={id} className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] py-1 pl-1 pr-3 text-xs text-[var(--text)]">
                {p?.productName || id}
                <button type="button" onClick={() => remove(id)} className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-[var(--border)]">
                  <X size={11} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
