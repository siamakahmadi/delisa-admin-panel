"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Trash2, Eye } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  fetchCrawlSources,
} from "@/lib/crawler/api";
import {
  fetchScrapedProducts,
  updateScrapedProductStatus,
  deleteScrapedProduct,
  fetchScrapedProductStats,
} from "@/lib/crawler/api";

const STATUS_LABELS = {
  pending: "در انتظار بررسی",
  imported: "اضافه‌شده",
  rejected: "رد‌شده",
  duplicate: "تکراری",
  failed: "ناموفق",
};
const STATUS_VARIANT = {
  pending: "warning",
  imported: "success",
  rejected: "neutral",
  duplicate: "neutral",
  failed: "danger",
};

export function ScrapedQueueTab() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("pending");
  const [sourceId, setSourceId] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const { data: sources = [] } = useQuery({ queryKey: ["crawl-sources"], queryFn: fetchCrawlSources });
  const { data: stats } = useQuery({ queryKey: ["scraped-products-stats"], queryFn: fetchScrapedProductStats });

  const { data, isLoading } = useQuery({
    queryKey: ["scraped-products", status, sourceId, page],
    queryFn: () => fetchScrapedProducts({ status, source: sourceId || undefined, page, limit: 20 }),
  });

  const items = data?.items ?? [];

  const statusMutation = useMutation({
    mutationFn: ({ id, payload }) => updateScrapedProductStatus(id, payload),
    onSuccess: () => {
      toast.success("وضعیت به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["scraped-products"] });
      queryClient.invalidateQueries({ queryKey: ["scraped-products-stats"] });
      setRejectTarget(null);
    },
    onError: () => toast.error("به‌روزرسانی ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteScrapedProduct(id),
    onSuccess: () => {
      toast.success("حذف شد");
      queryClient.invalidateQueries({ queryKey: ["scraped-products"] });
      queryClient.invalidateQueries({ queryKey: ["scraped-products-stats"] });
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      {
        key: "thumb",
        header: "",
        className: "w-16",
        render: (row) =>
          row.rawImages?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, unoptimized source thumbnails
            <img src={row.rawImages[0]} alt="" className="h-12 w-12 rounded-[var(--radius-sm)] object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-[var(--radius-sm)] bg-[var(--surface-muted)]" />
          ),
      },
      {
        key: "rawTitle",
        header: "عنوان خام",
        render: (row) => (
          <div className="max-w-[260px]">
            <p className="truncate font-medium">{row.rawTitle || "—"}</p>
            <p className="truncate text-xs text-[var(--text-faint)]">{row.source?.name}</p>
          </div>
        ),
      },
      {
        key: "rawPrice",
        header: "قیمت خام",
        render: (row) => (row.rawPrice ? `${row.rawPrice.toLocaleString("fa-IR")} ${row.rawCurrency || ""}` : "—"),
      },
      {
        key: "extractionMethod",
        header: "روش استخراج",
        render: (row) => (
          <Badge variant="info" size="sm">
            {row.extractionMethod}
          </Badge>
        ),
      },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => (
          <Badge variant={STATUS_VARIANT[row.status] || "neutral"} size="sm" dot>
            {STATUS_LABELS[row.status] || row.status}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "",
        render: (row) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDetail(row); }}>
              <Eye size={15} />
            </Button>
            <a href={row.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon">
                <ExternalLink size={15} />
              </Button>
            </a>
            {row.status === "pending" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setRejectTarget(row);
                }}
              >
                رد کردن
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                deleteMutation.mutate(row._id);
              }}
            >
              <Trash2 size={15} className="text-[var(--danger)]" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteMutation]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select className="w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label} {stats?.[value] != null ? `(${stats[value].toLocaleString("fa-IR")})` : ""}
            </option>
          ))}
        </Select>
        <Select className="w-56" value={sourceId} onChange={(e) => { setSourceId(e.target.value); setPage(1); }}>
          <option value="">همه‌ی منابع</option>
          {sources.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      <p className="mb-3 text-xs text-[var(--text-faint)]">
        این‌ها محصولات خامِ کراول‌شده‌اند — هنوز بازنویسی نشده‌اند. برای افزودن به دلیسا، از Claude Code یا هر
        کلاینت MCP دیگر بخواهید با ابزار <code dir="ltr">list_scraped_products</code> این صف را بخواند، محتوا را
        بازنویسی کند و با <code dir="ltr">create_product</code> اضافه‌شان کند.
      </p>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        emptyMessage="آیتمی در این فیلتر پیدا نشد"
        rowKey={(row) => row._id}
        pagination={
          data
            ? { page: data.page, pageCount: data.pageCount, onPageChange: setPage }
            : undefined
        }
      />

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-xl">
          <DialogTitle>{detail?.rawTitle}</DialogTitle>
          {detail && (
            <div className="mt-3 max-h-[70vh] space-y-3 overflow-y-auto text-sm">
              <div className="flex flex-wrap gap-2">
                {detail.rawImages?.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" className="h-20 w-20 rounded-[var(--radius-sm)] object-cover" />
                ))}
              </div>
              <p className="whitespace-pre-wrap text-[var(--text-muted)]">{detail.rawDescription || "بدون توضیحات خام"}</p>
              <a href={detail.sourceUrl} target="_blank" rel="noreferrer" dir="ltr" className="block truncate text-xs text-[var(--brand-600)] hover:underline">
                {detail.sourceUrl}
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(v) => !v && setRejectTarget(null)}
        title="رد کردن این محصول"
        description={`«${rejectTarget?.rawTitle}» دیگر در صف بررسی نشان داده نمی‌شود.`}
        confirmLabel="رد کردن"
        loading={statusMutation.isPending}
        onConfirm={() => statusMutation.mutate({ id: rejectTarget._id, payload: { status: "rejected" } })}
      />
    </div>
  );
}
