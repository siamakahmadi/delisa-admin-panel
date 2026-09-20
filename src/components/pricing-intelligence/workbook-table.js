"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Calculator,
  Hash,
  ImageOff,
  MoreHorizontal,
  Percent,
  Plus,
  Search,
  Sigma,
  Store,
  Trash2,
  Type,
  Wallet,
} from "lucide-react";
import { fetchPricingWorkbook, savePricingWorkbook } from "@/lib/pricing-intelligence/api";
import {
  grossMargin,
  grossProfit,
  marketAverage,
  markupRatio,
  parseMoneyInput,
  saveLocalWorkbook,
} from "@/lib/pricing-intelligence/workbook";
import { formatPercent } from "@/lib/pricing-intelligence/labels";
import { cn, formatNumber } from "@/lib/utils";
import { ProductPickerModal } from "@/components/pricing-intelligence/product-picker-modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function newId() {
  return crypto.randomUUID();
}

function emptyRow() {
  return {
    id: newId(),
    productId: null,
    productName: "",
    sellPrice: null,
    purchaseCost: null,
    prices: {},
    image: "",
  };
}

function formatCellMoney(value) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return "";
  return formatNumber(value);
}

function marginTone(ratio) {
  if (ratio == null) return "text-[var(--text-muted)]";
  if (ratio < 0) return "text-[var(--danger)]";
  if (ratio < 0.1) return "text-[var(--warning)]";
  if (ratio >= 0.3) return "text-[var(--success)]";
  return "text-[var(--text)]";
}

function profitTone(value) {
  if (value == null) return "text-[var(--text-muted)]";
  if (value < 0) return "text-[var(--danger)]";
  return "text-[var(--text)]";
}

export function PricingWorkbookTable() {
  const hydrated = useRef(false);
  const skipPersist = useRef(true);
  const latestRef = useRef({ columns: [], rows: [] });
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [rowSearch, setRowSearch] = useState("");
  const [rowFilter, setRowFilter] = useState("all");
  const [saveState, setSaveState] = useState("idle");

  const { data, isLoading } = useQuery({
    queryKey: ["pricing-intelligence-workbook"],
    queryFn: fetchPricingWorkbook,
  });

  useEffect(() => {
    const wb = data?.workbook;
    if (!wb || hydrated.current) return;
    hydrated.current = true;
    skipPersist.current = true;
    setColumns(wb.columns || []);
    setRows(wb.rows || []);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: savePricingWorkbook,
    onMutate: () => setSaveState("saving"),
    onSuccess: () => setSaveState("saved"),
    onError: () => setSaveState("error"),
  });

  useEffect(() => {
    latestRef.current = { columns, rows };
    if (!hydrated.current) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    const ok = saveLocalWorkbook({ columns, rows });
    if (!ok) {
      setSaveState("error");
      return;
    }
    setSaveState("saving");
    const t = setTimeout(() => {
      saveMut.mutate({ columns, rows });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, rows]);

  useEffect(() => {
    const flush = () => saveLocalWorkbook(latestRef.current);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      flush();
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, []);

  const usedProductIds = useMemo(
    () => rows.map((r) => r.productId).filter(Boolean).map(String),
    [rows]
  );

  const visibleRows = useMemo(() => {
    const q = rowSearch.trim().toLowerCase();
    return rows.filter((row) => {
      if (q && !String(row.productName || "").toLowerCase().includes(q)) return false;
      const avg = marketAverage(row, columns);
      const sell = Number(row.sellPrice);
      if (rowFilter === "noCost") return row.purchaseCost == null;
      if (rowFilter === "noSell") return row.sellPrice == null;
      if (rowFilter === "belowMarket") return avg != null && Number.isFinite(sell) && sell < avg;
      if (rowFilter === "aboveMarket") return avg != null && Number.isFinite(sell) && sell > avg;
      if (rowFilter === "noImage") return !row.image;
      return true;
    });
  }, [rows, rowSearch, rowFilter, columns]);

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const updatePrice = (rowId, columnId, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        return { ...row, prices: { ...row.prices, [columnId]: value } };
      })
    );
  };

  const addCompetitorColumn = () => {
    const n = columns.length + 1;
    setColumns((prev) => [...prev, { id: newId(), name: `رقیب ${n.toLocaleString("fa-IR")}` }]);
  };

  const renameColumn = (id, name) => {
    setColumns((prev) => prev.map((col) => (col.id === id ? { ...col, name } : col)));
  };

  const removeColumn = (id) => {
    setColumns((prev) => prev.filter((col) => col.id !== id));
    setRows((prev) =>
      prev.map((row) => {
        const prices = { ...row.prices };
        delete prices[id];
        return { ...row, prices };
      })
    );
  };

  const addBlankRow = () => {
    setRows((prev) => [...prev, emptyRow()]);
  };

  const addProductRows = (products) => {
    const used = new Set(rows.map((r) => r.productId).filter(Boolean).map(String));
    const next = products
      .filter((p) => !used.has(String(p._id)))
      .map((product) => ({
        id: newId(),
        productId: product._id,
        productName: product.productName || "",
        sellPrice: product.recommendation?.currentPrice ?? product.finalPrice ?? null,
        purchaseCost: product.purchaseCost ?? null,
        prices: {},
        image: product.image || "",
      }));
    if (next.length) setRows((prev) => [...prev, ...next]);
  };

  const removeRow = (id) => setRows((prev) => prev.filter((row) => row.id !== id));

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-4 py-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <Input
            className="pr-9"
            placeholder="فیلتر در جدول…"
            value={rowSearch}
            onChange={(e) => setRowSearch(e.target.value)}
          />
        </div>
        <Select className="w-44" value={rowFilter} onChange={(e) => setRowFilter(e.target.value)} aria-label="فیلتر ردیف‌ها">
          <option value="all">همه ردیف‌ها</option>
          <option value="noCost">بدون قیمت خرید</option>
          <option value="noSell">بدون قیمت فروش</option>
          <option value="belowMarket">ارزان‌تر از بازار</option>
          <option value="aboveMarket">گران‌تر از بازار</option>
          <option value="noImage">بدون عکس</option>
        </Select>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span
            className={cn(
              "inline-flex h-2 w-2 rounded-full",
              saveState === "error" && "bg-[var(--danger)]",
              saveState === "saving" && "bg-[var(--accent-amber)]",
              (saveState === "saved" || saveState === "idle") && "bg-[var(--success)]"
            )}
            aria-hidden
          />
          {saveState === "error"
            ? "ذخیره نشد"
            : saveState === "saving"
              ? "در حال ذخیره"
              : "ذخیره شد"}
        </div>
        <Button onClick={() => setPickerOpen(true)}>
          <Plus size={16} />
          افزودن محصول
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
              <HeaderCell icon={Type} sticky>
                محصول
              </HeaderCell>
              <HeaderCell icon={Wallet}>قیمت فروش من</HeaderCell>
              <HeaderCell icon={Hash}>قیمت خرید</HeaderCell>
              {columns.map((col) => (
                <CompetitorHeader
                  key={col.id}
                  column={col}
                  onRename={renameColumn}
                  onRemove={removeColumn}
                  canRemove={columns.length > 1}
                />
              ))}
              <HeaderCell icon={Sigma} computed>
                میانگین بازار
              </HeaderCell>
              <HeaderCell icon={Calculator} computed>
                سود ناخالص
              </HeaderCell>
              <HeaderCell icon={Percent} computed>
                مارجین
              </HeaderCell>
              <HeaderCell icon={Percent} computed>
                مارک‌آپ
              </HeaderCell>
              <th className="w-10 px-1 py-2">
                <button
                  type="button"
                  onClick={addCompetitorColumn}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                  aria-label="افزودن ستون رقیب"
                >
                  <Plus size={16} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  <td className="px-4 py-3" colSpan={8}>
                    <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                </tr>
              ))}

            {!isLoading && !visibleRows.length && (
              <tr>
                <td colSpan={8 + columns.length} className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
                  {rows.length
                    ? "با این فیلتر ردیفی نیست. فیلتر را عوض کنید."
                    : "هنوز ردیفی نیست. از «افزودن محصول» شروع کنید."}
                </td>
              </tr>
            )}
            {!isLoading &&
              visibleRows.map((row) => {
                const avg = marketAverage(row, columns);
                const profit = grossProfit(row.sellPrice, row.purchaseCost);
                const margin = grossMargin(row.sellPrice, row.purchaseCost);
                const markup = markupRatio(row.sellPrice, row.purchaseCost);
                return (
                  <tr key={row.id} className="group border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]/60">
                    <td className="sticky right-0 z-[1] min-w-[280px] border-l border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 group-hover:bg-[var(--surface-muted)]">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
                          {row.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageOff size={16} className="text-[var(--text-faint)]" />
                          )}
                        </div>
                        <input
                          value={row.productName}
                          onChange={(e) => updateRow(row.id, { productName: e.target.value })}
                          placeholder="اسم محصول"
                          className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm font-medium outline-none placeholder:font-normal placeholder:text-[var(--text-faint)]"
                        />
                      </div>
                    </td>
                    <MoneyCell
                      value={row.sellPrice}
                      onChange={(v) => updateRow(row.id, { sellPrice: v })}
                    />
                    <MoneyCell
                      value={row.purchaseCost}
                      onChange={(v) => updateRow(row.id, { purchaseCost: v })}
                    />
                    {columns.map((col) => (
                      <MoneyCell
                        key={col.id}
                        value={row.prices?.[col.id]}
                        onChange={(v) => updatePrice(row.id, col.id, v)}
                      />
                    ))}
                    <ComputedCell>
                      {avg == null ? "—" : formatCellMoney(Math.round(avg))}
                    </ComputedCell>
                    <ComputedCell className={profitTone(profit)}>
                      {profit == null ? "—" : formatCellMoney(Math.round(profit))}
                    </ComputedCell>
                    <ComputedCell className={marginTone(margin)}>
                      {formatPercent(margin)}
                    </ComputedCell>
                    <ComputedCell className={marginTone(markup)}>
                      {formatPercent(markup)}
                    </ComputedCell>
                    <td className="px-1">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-faint)] opacity-0 hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] group-hover:opacity-100"
                        aria-label="حذف ردیف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-4 py-2">
        <p className="text-[11px] text-[var(--text-faint)]">
          سود ناخالص = فروش − خرید · مارجین = سود ÷ فروش · مارک‌آپ = سود ÷ خرید
        </p>
        <p className="text-[11px] text-[var(--text-muted)]">
          {visibleRows.length.toLocaleString("fa-IR")} از {rows.length.toLocaleString("fa-IR")} ردیف
        </p>
      </div>
      <ProductPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        excludeIds={usedProductIds}
        onAddProducts={addProductRows}
        onAddBlank={addBlankRow}
      />
    </section>
  );
}

function HeaderCell({ icon: Icon, children, sticky, computed }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-3 py-2.5 text-start text-xs font-medium text-[var(--text-muted)]",
        sticky && "sticky right-0 z-[2] border-l border-[var(--border)] bg-[var(--surface-muted)]",
        computed && "bg-[var(--surface-muted)]"
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <Icon size={13} aria-hidden />
        {children}
      </span>
    </th>
  );
}

function CompetitorHeader({ column, onRename, onRemove, canRemove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(column.name);

  useEffect(() => setDraft(column.name), [column.name]);

  return (
    <th className="min-w-[148px] px-1 py-1.5 text-start">
      <div className="flex items-center gap-0.5">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              onRename(column.id, draft.trim() || column.name);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setDraft(column.name);
                setEditing(false);
              }
            }}
            className="h-8 w-full rounded-[var(--radius-sm)] border border-[var(--brand-300)] bg-[var(--surface)] px-2 text-xs outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface)]"
          >
            <Store size={13} aria-hidden />
            <span className="truncate">{column.name}</span>
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-faint)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
              aria-label={`تنظیمات ستون ${column.name}`}
            >
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditing(true)}>تغییر نام</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              danger
              disabled={!canRemove}
              onSelect={() => canRemove && onRemove(column.id)}
            >
              حذف ستون
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </th>
  );
}

function MoneyCell({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    if (!focused) setDraft(value ?? "");
  }, [value, focused]);

  return (
    <td className="min-w-[132px] border-l border-[var(--border)] p-0">
      <input
        inputMode="numeric"
        value={focused ? draft : formatCellMoney(value)}
        onFocus={(e) => {
          setFocused(true);
          setDraft(value ?? "");
          e.target.select();
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          onChange(parseMoneyInput(e.target.value));
        }}
        onBlur={() => {
          setFocused(false);
          onChange(parseMoneyInput(draft));
        }}
        placeholder="—"
        className="h-11 w-full bg-transparent px-3 text-start tabular-nums outline-none placeholder:text-[var(--text-faint)]"
      />
    </td>
  );
}

function ComputedCell({ children, className }) {
  return (
    <td
      className={cn(
        "min-w-[120px] border-l border-[var(--border)] bg-[var(--surface-muted)]/70 px-3 py-0 tabular-nums text-[var(--text-muted)]",
        className
      )}
    >
      <div className="flex h-11 items-center">{children}</div>
    </td>
  );
}
