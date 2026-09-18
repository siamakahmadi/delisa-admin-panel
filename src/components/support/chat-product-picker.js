"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageOff, PackageSearch, Search, X } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function ChatProductPicker({ onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 300);

  const { data = [], isLoading } = useQuery({
    queryKey: ["live-chat-product-search", debounced],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/products", {
        params: { search: debounced, limit: 8 },
      });
      return res.data?.products ?? [];
    },
    enabled: open && debounced.trim().length > 1,
  });

  return (
    <div className="relative">
      <Button
        type="button"
        variant={open ? "secondary" : "ghost"}
        size="icon"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        aria-label="ارسال کارت محصول"
      >
        <PackageSearch size={18} />
      </Button>

      {open && (
        <div className="absolute bottom-12 right-0 z-20 w-80 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
          <div className="flex items-center gap-2 border-b border-[var(--border)] p-2">
            <Search size={14} className="text-[var(--text-faint)]" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی محصول..."
              className="h-8 border-0 bg-transparent px-0 focus:ring-0"
            />
            <button type="button" onClick={() => setOpen(false)} className="p-1 text-[var(--text-faint)]" aria-label="بستن">
              <X size={14} />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {query.trim().length < 2 ? (
              <p className="p-3 text-xs text-[var(--text-faint)]">نام محصول را بنویسید</p>
            ) : isLoading ? (
              <p className="p-3 text-xs text-[var(--text-faint)]">در حال جستجو...</p>
            ) : data.length === 0 ? (
              <p className="p-3 text-xs text-[var(--text-faint)]">محصولی پیدا نشد</p>
            ) : (
              data.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  className="flex w-full items-center gap-2.5 border-b border-[var(--border)] p-2.5 text-right last:border-0 hover:bg-[var(--surface-muted)]"
                  onClick={() => {
                    onSelect(product);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <div className="flex h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-muted)]">
                    {product.productImages?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.productImages[0].url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageOff size={12} className="text-[var(--text-faint)]" />
                      </div>
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm">{product.productName}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
