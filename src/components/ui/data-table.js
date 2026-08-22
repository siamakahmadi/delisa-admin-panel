"use client";

import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronRight, ChevronLeft, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";
import { Button } from "./button";

export function DataTable({
  columns,
  data,
  isLoading,
  emptyMessage = "موردی یافت نشد",
  rowKey = (row) => row._id ?? row.id,
  onRowClick,
  pagination,
  skeletonRows = 6,
}) {
  const [sort, setSort] = useState({ key: null, dir: null });

  const sortedData = useMemo(() => {
    if (!sort.key || !sort.dir) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return data;
    const arr = [...data];
    arr.sort((a, b) => {
      const av = col.sortValue ? col.sortValue(a) : a[sort.key];
      const bv = col.sortValue ? col.sortValue(b) : b[sort.key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv), "fa");
    });
    if (sort.dir === "desc") arr.reverse();
    return arr;
  }, [data, sort, columns]);

  const toggleSort = (key, sortable) => {
    if (!sortable) return;
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: null };
    });
  };

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-start text-xs font-semibold text-[var(--text-muted)]",
                    col.sortable && "cursor-pointer select-none hover:text-[var(--text)]",
                    col.className
                  )}
                  onClick={() => toggleSort(col.key, col.sortable)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable &&
                      (sort.key === col.key ? (
                        sort.dir === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )
                      ) : (
                        <ChevronsUpDown size={12} className="opacity-40" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)] last:border-0">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && sortedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16">
                  <div className="flex flex-col items-center gap-2 text-[var(--text-faint)]">
                    <Inbox size={32} strokeWidth={1.5} />
                    <span className="text-sm">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              sortedData.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-[var(--border)] last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-[var(--surface-muted)]"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3.5 align-middle", col.cellClassName)}>
                      {col.render ? col.render(row) : (row[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3">
          <span className="text-xs text-[var(--text-muted)]">
            صفحه {pagination.page.toLocaleString("fa-IR")} از{" "}
            {Math.max(pagination.pageCount, 1).toLocaleString("fa-IR")}
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.page >= pagination.pageCount}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <ChevronLeft size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
