"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchPricingProducts } from "@/lib/pricing-intelligence/api";

/* Name field that doubles as a catalog search. Typing free text is fine (goods
   that aren't in the catalog); picking a suggestion links the row to a product
   so purchases can be matched with sales. */
export function ProductNameInput({ name, productId, onChange }) {
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  const q = useDebouncedValue(name, 250);

  useEffect(() => {
    const onOutside = (e) => !ref.current?.contains(e.target) && setFocused(false);
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const searching = focused && !productId && q.trim().length >= 2;
  const { data, isFetching } = useQuery({
    queryKey: ["ledger", "product-search", q],
    queryFn: () => fetchPricingProducts({ search: q.trim(), limit: 8 }),
    enabled: searching,
  });
  const results = data?.products || [];

  return (
    <div className="relative" ref={ref}>
      <Input
        value={name}
        onFocus={() => setFocused(true)}
        onChange={(e) => onChange({ name: e.target.value, productId: null })}
        placeholder="نام کالا (برای وصل‌شدن به فروش، از لیست انتخاب کن)"
        className={productId ? "border-[var(--success)] pl-9" : ""}
      />
      {productId && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[var(--success)]">متصل</span>
      )}
      {searching && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          {isFetching && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-faint)]"><Loader2 size={12} className="animate-spin" />در حال جستجو…</div>
          )}
          {!isFetching && !results.length && (
            <div className="px-3 py-2 text-xs text-[var(--text-faint)]">محصولی در کاتالوگ پیدا نشد؛ همین نام به‌صورت آزاد ثبت می‌شود.</div>
          )}
          {results.map((p) => (
            <button
              key={p._id}
              type="button"
              onClick={() => {
                onChange({ name: p.productName, productId: p._id, unitCostHint: p.pricingConfig?.purchaseCost ?? null });
                setFocused(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-[var(--surface-muted)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--surface-muted)]">
                {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : <ImageOff size={14} className="text-[var(--text-faint)]" />}
              </span>
              <span className="truncate">{p.productName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
