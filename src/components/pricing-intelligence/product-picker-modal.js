"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ImageOff, Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useBrands, useCategories } from "@/hooks/use-taxonomies";
import { fetchPricingProducts } from "@/lib/pricing-intelligence/api";
import { cn, formatNumber } from "@/lib/utils";

const LIMIT = 24;

export function ProductPickerModal({ open, onOpenChange, excludeIds = [], onAddProducts, onAddBlank }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [stockStatus, setStockStatus] = useState("");
  const [published, setPublished] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState({});

  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const brandList = Array.isArray(brands) ? brands : brands?.items || brands?.brands || [];
  const categoryList = Array.isArray(categories) ? categories : categories?.items || categories?.categories || [];
  const excluded = useMemo(() => new Set([...excludeIds].map(String)), [excludeIds]);

  const params = {
    search: debouncedSearch || undefined,
    stockStatus: stockStatus || undefined,
    published: published || undefined,
    brand: brand || undefined,
    category: category || undefined,
    page,
    limit: LIMIT,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["pricing-workbook-picker", params],
    queryFn: () => fetchPricingProducts(params),
    enabled: open,
  });

  const products = data?.products || [];
  const total = data?.total || 0;
  const pageCount = Math.max(1, Math.ceil(total / LIMIT));
  const selectedList = Object.values(selected);

  const resetFilters = () => {
    setSearch("");
    setStockStatus("");
    setPublished("");
    setBrand("");
    setCategory("");
    setPage(1);
  };

  const toggle = (product) => {
    const id = String(product._id);
    if (excluded.has(id)) return;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = product;
      return next;
    });
  };

  const addSelected = () => {
    if (!selectedList.length) return;
    onAddProducts(selectedList);
    setSelected({});
    onOpenChange(false);
  };

  const changeFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[min(96vw,760px)] max-w-none flex-col gap-0 overflow-hidden p-0">
        <div className="border-b border-[var(--border)] px-5 pb-4 pt-5">
          <DialogTitle>افزودن محصول به جدول</DialogTitle>
          <DialogDescription>جستجو کنید، فیلتر بزنید و چند محصول را یکجا اضافه کنید.</DialogDescription>
        </div>

        <div className="space-y-3 border-b border-[var(--border)] px-5 py-4">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <Input
              autoFocus
              className="pr-9"
              placeholder="جستجوی نام، SKU یا بارکد…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Select value={stockStatus} onChange={changeFilter(setStockStatus)} aria-label="موجودی">
              <option value="">همه موجودی‌ها</option>
              <option value="inStock">موجود</option>
              <option value="outOfStock">ناموجود</option>
              <option value="low">موجودی کم</option>
              <option value="high">موجودی زیاد</option>
            </Select>
            <Select value={published} onChange={changeFilter(setPublished)} aria-label="وضعیت انتشار">
              <option value="">همه وضعیت‌ها</option>
              <option value="true">منتشرشده</option>
              <option value="false">پیش‌نویس</option>
            </Select>
            <Select value={brand} onChange={changeFilter(setBrand)} aria-label="برند">
              <option value="">همه برندها</option>
              {brandList.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </Select>
            <Select value={category} onChange={changeFilter(setCategory)} aria-label="دسته‌بندی">
              <option value="">همه دسته‌ها</option>
              {categoryList.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          </div>
          {(search || stockStatus || published || brand || category) && (
            <button type="button" onClick={resetFilters} className="text-xs text-[var(--brand-600)] hover:underline">
              پاک کردن فیلترها
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {isLoading && (
            <p className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">در حال جستجو…</p>
          )}
          {!isLoading && !products.length && (
            <p className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
              محصولی با این فیلتر پیدا نشد. فیلتر را عوض کنید یا یک ردیف خالی بسازید.
            </p>
          )}
          {!isLoading &&
            products.map((p) => {
              const id = String(p._id);
              const already = excluded.has(id);
              const checked = Boolean(selected[id]);
              const out = isOutOfStock(p);
              return (
                <button
                  key={id}
                  type="button"
                  disabled={already}
                  onClick={() => toggle(p)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-start",
                    already ? "opacity-40" : "hover:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--brand-500)]",
                    checked && "bg-[var(--brand-50)]"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                      checked
                        ? "border-[var(--brand-600)] bg-[var(--brand-600)] text-white"
                        : "border-[var(--border)] bg-[var(--surface)]"
                    )}
                    aria-hidden
                  >
                    {checked ? <Check size={12} /> : null}
                  </span>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff size={16} className="text-[var(--text-faint)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.productName}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      {p.brand?.name ? <span>{p.brand.name}</span> : null}
                      <span className="tabular-nums">
                        {p.recommendation?.currentPrice ?? p.finalPrice
                          ? `${formatNumber(p.recommendation?.currentPrice ?? p.finalPrice)} تومان`
                          : "بدون قیمت"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={out ? "danger" : "success"} size="sm">
                      {stockLabel(p)}
                    </Badge>
                    {already ? <span className="text-[11px] text-[var(--text-faint)]">در جدول است</span> : null}
                  </div>
                </button>
              );
            })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-5 py-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              قبلی
            </Button>
            <span className="text-xs text-[var(--text-muted)]">
              {page.toLocaleString("fa-IR")} / {pageCount.toLocaleString("fa-IR")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              بعدی
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onAddBlank();
                onOpenChange(false);
              }}
            >
              <Plus size={14} />
              ردیف خالی
            </Button>
            <Button type="button" disabled={!selectedList.length} onClick={addSelected}>
              افزودن {selectedList.length ? selectedList.length.toLocaleString("fa-IR") : ""} محصول
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function isOutOfStock(product) {
  if (product.isManuallyOutOfStock) return true;
  if (product.inStock === true) return false;
  const qty = Number(product.stock);
  if (Number.isFinite(qty)) return qty <= 0;
  if (product.inStock === false) return true;
  return false;
}

function stockLabel(product) {
  if (isOutOfStock(product)) return "ناموجود";
  const qty = Number(product.stock);
  if (Number.isFinite(qty) && qty > 0) return `موجود ${qty.toLocaleString("fa-IR")}`;
  return "موجود";
}
