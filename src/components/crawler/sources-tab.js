"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Play } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchCrawlSources, deleteCrawlSource, runCrawlSource } from "@/lib/crawler/api";
import { SourceFormDialog } from "./source-form-dialog";

export function SourcesTab() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [runningId, setRunningId] = useState(null);

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["crawl-sources"],
    queryFn: fetchCrawlSources,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCrawlSource(id),
    onSuccess: () => {
      toast.success("منبع حذف شد");
      queryClient.invalidateQueries({ queryKey: ["crawl-sources"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const runMutation = useMutation({
    mutationFn: (id) => runCrawlSource(id),
    onMutate: (id) => setRunningId(id),
    onSuccess: (result) => {
      const totals = result.categories.reduce(
        (acc, c) => ({ new: acc.new + c.new, duplicate: acc.duplicate + c.duplicate, failed: acc.failed + c.failed }),
        { new: 0, duplicate: 0, failed: 0 }
      );
      toast.success(
        `کراول تمام شد: ${totals.new.toLocaleString("fa-IR")} محصول جدید، ${totals.duplicate.toLocaleString(
          "fa-IR"
        )} تکراری، ${totals.failed.toLocaleString("fa-IR")} ناموفق`
      );
      queryClient.invalidateQueries({ queryKey: ["crawl-sources"] });
      queryClient.invalidateQueries({ queryKey: ["scraped-products"] });
      queryClient.invalidateQueries({ queryKey: ["scraped-products-stats"] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "کراول ناموفق بود"),
    onSettled: () => setRunningId(null),
  });

  const columns = useMemo(
    () => [
      { key: "name", header: "نام سایت", render: (row) => <span className="font-medium">{row.name}</span> },
      {
        key: "baseUrl",
        header: "آدرس",
        render: (row) => (
          <a href={row.baseUrl} target="_blank" rel="noreferrer" dir="ltr" className="text-xs text-[var(--brand-600)] hover:underline">
            {row.baseUrl}
          </a>
        ),
      },
      {
        key: "categories",
        header: "دسته‌بندی‌ها",
        render: (row) => <span>{row.categories?.length || 0}</span>,
      },
      {
        key: "isActive",
        header: "وضعیت",
        render: (row) => (
          <Badge variant={row.isActive ? "success" : "neutral"} size="sm" dot>
            {row.isActive ? "فعال" : "غیرفعال"}
          </Badge>
        ),
      },
      {
        key: "lastCrawledAt",
        header: "آخرین کراول",
        render: (row) =>
          row.lastCrawledAt ? (
            <span className="text-xs text-[var(--text-muted)]">
              {new Date(row.lastCrawledAt).toLocaleString("fa-IR")}
            </span>
          ) : (
            <span className="text-xs text-[var(--text-faint)]">هنوز اجرا نشده</span>
          ),
      },
      {
        key: "actions",
        header: "",
        render: (row) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="اجرای کراول"
              loading={runningId === row._id}
              onClick={(e) => {
                e.stopPropagation();
                runMutation.mutate(row._id);
              }}
            >
              <Play size={15} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(row);
                setFormOpen(true);
              }}
            >
              <Pencil size={15} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(row);
              }}
            >
              <Trash2 size={15} className="text-[var(--danger)]" />
            </Button>
          </div>
        ),
      },
    ],
    [runningId]
  );

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> منبع جدید
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={sources}
        isLoading={isLoading}
        emptyMessage="هنوز منبعی اضافه نشده — با «منبع جدید» یک سایت و دسته‌بندی‌هایش را اضافه کنید"
        rowKey={(row) => row._id}
      />

      <SourceFormDialog open={formOpen} onOpenChange={setFormOpen} source={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف منبع"
        description={`منبع «${deleteTarget?.name}» حذف شود؟ محصولات قبلاً کراول‌شده از این منبع در صف باقی می‌مانند.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
