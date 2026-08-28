"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { skinTypesApi } from "@/lib/beauty/api";

const STATUS_VARIANT = { published: "success", draft: "warning" };
const STATUS_LABEL = { published: "منتشرشده", draft: "پیش‌نویس" };

export default function SkinTypesListPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["skin-types"], queryFn: skinTypesApi.list });
  const items = data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => skinTypesApi.remove(id),
    onSuccess: () => {
      toast.success("حذف شد");
      queryClient.invalidateQueries({ queryKey: ["skin-types"] });
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e?.response?.data?.error || "حذف ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "نوع پوست",
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
              {row.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.image} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text)]">{row.name}</p>
              <p dir="ltr" className="truncate text-xs text-[var(--text-faint)]">/beauty/skin-types/{row.slug}</p>
            </div>
          </div>
        ),
      },
      { key: "concerns", header: "دغدغه‌های مرتبط", render: (row) => row.commonConcerns?.length || 0 },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => (
          <Badge variant={STATUS_VARIANT[row.status] || "neutral"} size="sm" dot>
            {STATUS_LABEL[row.status] || row.status}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "",
        render: (row) => (
          <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" title="ویرایش" onClick={() => router.push(`/beauty/skin-types/${row._id}`)}>
              <Pencil size={14} />
            </Button>
            <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleteTarget(row)}>
              <Trash2 size={14} className="text-[var(--danger)]" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  );

  return (
    <div>
      <PageHeader
        title="انواع پوست"
        subtitle="مدیریت صفحات نوع پوست در Beauty Knowledge Hub"
        actions={
          <Button onClick={() => router.push("/beauty/skin-types/new")}>
            <Plus size={15} />
            نوع پوست جدید
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        emptyMessage="هنوز نوع پوستی ثبت نشده است"
        onRowClick={(row) => router.push(`/beauty/skin-types/${row._id}`)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف نوع پوست"
        description={deleteTarget ? `آیا از حذف «${deleteTarget.name}» مطمئن هستید؟` : ""}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
