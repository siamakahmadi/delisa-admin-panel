"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchCampaigns, createCampaign, deleteCampaign } from "@/lib/marketing/campaigns-api";
import { slugify } from "@/lib/utils";

const STATUS_LABELS = { draft: "پیش‌نویس", active: "فعال", archived: "بایگانی" };
const STATUS_VARIANT = { draft: "neutral", active: "success", archived: "warning" };

export default function CampaignsPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["campaigns"], queryFn: fetchCampaigns });
  const campaigns = data ?? [];

  const createMutation = useMutation({
    mutationFn: () => createCampaign({ title: title.trim(), slug: slug.trim(), status: "draft" }),
    onSuccess: (created) => {
      toast.success("کمپین ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setCreateOpen(false);
      setTitle("");
      setSlug("");
      setSlugTouched(false);
      router.push(`/marketing/campaigns/${created._id}`);
    },
    onError: (e) => toast.error(e?.response?.data?.error || "ایجاد ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCampaign(id),
    onSuccess: () => {
      toast.success("کمپین حذف شد");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      { key: "title", header: "عنوان", render: (row) => <span className="font-medium">{row.title}</span> },
      { key: "slug", header: "اسلاگ", render: (row) => <span dir="ltr" className="font-mono text-xs">{row.slug}</span> },
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
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
            <Trash2 size={15} className="text-[var(--danger)]" />
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="کمپین‌ها"
        subtitle="بنر و اسلایدر تبلیغاتی برای جاهای مشخصی از سایت مشتری"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            کمپین جدید
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={campaigns}
        isLoading={isLoading}
        emptyMessage="کمپینی یافت نشد"
        rowKey={(row) => row._id}
        onRowClick={(row) => router.push(`/marketing/campaigns/${row._id}`)}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogTitle>کمپین جدید</DialogTitle>
          <div className="mt-4 space-y-3">
            <div>
              <Label>عنوان</Label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                placeholder="مثلاً: جشنواره تابستانه"
              />
            </div>
            <div>
              <Label>اسلاگ</Label>
              <Input dir="ltr" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>انصراف</Button>
              <Button loading={createMutation.isPending} disabled={!title.trim() || !slug.trim()} onClick={() => createMutation.mutate()}>
                ایجاد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف کمپین"
        description="این کمپین و تمام آیتم‌های نمایشی آن برای همیشه حذف می‌شوند. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
