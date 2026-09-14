"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils";

export default function LabelsPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await apiClient.get("/api/admin/tags")).data,
  });

  const tags = useMemo(() => data ?? [], [data]);

  const createMutation = useMutation({
    mutationFn: () => apiClient.post("/api/admin/tags", { title: title.trim(), slug: slugify(title) }),
    onSuccess: (res) => {
      toast.success("برچسب ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setCreateOpen(false);
      setTitle("");
      router.push(`/products/labels/${res.data._id}`);
    },
    onError: (err) => toast.error("خطا", err?.response?.data?.message || "ثبت ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: "برچسب",
        render: (row) => (
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full border border-[var(--border)]"
              style={{ background: row.color || "var(--surface-muted)" }}
            />
            <span className="font-medium">{row.title}</span>
          </div>
        ),
      },
      { key: "slug", header: "اسلاگ", render: (row) => <span dir="ltr">{row.slug}</span> },
      {
        key: "products",
        header: "تعداد محصولات",
        render: (row) => (row.products?.length ?? 0).toLocaleString("fa-IR"),
      },
      {
        key: "sortOrder",
        header: "ترتیب",
        render: (row) => (row.sortOrder ?? 0).toLocaleString("fa-IR"),
      },
      {
        key: "isActive",
        header: "صفحه در سایت",
        render: (row) =>
          row.isActive === false ? (
            <span className="rounded-full bg-[var(--danger-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--danger)]">غیرفعال</span>
          ) : (
            <span className="rounded-full bg-[var(--success-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--success)]">فعال</span>
          ),
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="برچسب‌ها"
        subtitle={`${tags.length.toLocaleString("fa-IR")} برچسب`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/products")}>
              <ArrowRight size={16} />
              بازگشت
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              برچسب جدید
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={tags}
        isLoading={isLoading}
        emptyMessage="برچسبی یافت نشد"
        onRowClick={(row) => router.push(`/products/labels/${row._id}`)}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogTitle>برچسب جدید</DialogTitle>
          <div className="mt-4 space-y-4">
            <div>
              <Label>نام برچسب</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="مثلاً پرفروش‌ترین‌ها" />
            </div>
            <Button className="w-full" disabled={!title.trim()} loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
              ثبت و ادامه
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
