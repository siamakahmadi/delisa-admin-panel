"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchProductsWithReviewFlag, deleteReview } from "@/lib/product-reviews/api";

const LIMIT = 20;

export default function ProductReviewsPage() {
  const [tab, setTab] = useState("has");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  return (
    <div>
      <PageHeader title="نقد و بررسی" subtitle="محتوای تحریریه‌ای بلندتر برای هر محصول — برای سئو و کمک به تصمیم خرید مشتری." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="has">دارای نقد و بررسی</TabsTrigger>
            <TabsTrigger value="none">بدون نقد و بررسی</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="جستجوی محصول..."
          className="max-w-xs"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <ReviewsTable tab={tab} search={debouncedSearch} page={page} onPageChange={setPage} />
    </div>
  );
}

function ReviewsTable({ tab, search, page, onPageChange }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["product-editorial-reviews", { tab, search, page }],
    queryFn: () =>
      fetchProductsWithReviewFlag({
        page,
        limit: LIMIT,
        search: search || undefined,
        hasEditorialReview: tab === "has" ? "true" : "false",
      }),
  });

  const products = data?.products ?? [];
  const pageCount = Math.max(data?.pages ?? 1, 1);

  const deleteMutation = useMutation({
    mutationFn: (reviewId) => deleteReview(reviewId),
    onSuccess: () => {
      toast.success("نقد و بررسی حذف شد");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["product-editorial-reviews"] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "حذف ناموفق بود"),
  });

  const columns = useMemo(() => {
    const base = [
      {
        key: "productName",
        header: "محصول",
        render: (row) => {
          const img = row.productImages?.[0]?.url;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff size={16} className="text-[var(--text-faint)]" />
                )}
              </div>
              <span className="max-w-[280px] truncate font-medium text-[var(--text)]">{row.productName}</span>
            </div>
          );
        },
      },
      { key: "brand", header: "برند", render: (row) => row.brand?.name || "-" },
    ];

    if (tab === "has") {
      base.push(
        {
          key: "reviewStatus",
          header: "وضعیت نقد",
          render: (row) => {
            const review = row.editorialReview;
            if (!review) return "-";
            return (
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={review.status === "published" ? "success" : "warning"} size="sm" dot>
                  {review.status === "published" ? "منتشر شده" : "پیش‌نویس"}
                </Badge>
                {!review.enabled && (
                  <Badge variant="neutral" size="sm">
                    غیرفعال
                  </Badge>
                )}
              </div>
            );
          },
        },
        {
          key: "actions",
          header: "",
          render: (row) => (
            <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" title="ویرایش" onClick={() => router.push(`/products/reviews/${row._id}`)}>
                <Pencil size={14} />
              </Button>
              <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleteTarget(row)}>
                <Trash2 size={14} className="text-[var(--danger)]" />
              </Button>
            </div>
          ),
        }
      );
    } else {
      base.push({
        key: "actions",
        header: "",
        render: (row) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline" onClick={() => router.push(`/products/reviews/${row._id}`)}>
              <Plus size={13} />
              افزودن نقد و بررسی
            </Button>
          </div>
        ),
      });
    }

    return base;
  }, [tab, router]);

  return (
    <>
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        emptyMessage={tab === "has" ? "هنوز هیچ محصولی نقد و بررسی ندارد" : "همه محصولات نقد و بررسی دارند"}
        onRowClick={(row) => router.push(`/products/reviews/${row._id}`)}
        pagination={{ page, pageCount, onPageChange }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف نقد و بررسی"
        description={deleteTarget ? `نقد و بررسی محصول «${deleteTarget.productName}» حذف می‌شود. مطمئنید؟` : ""}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget.editorialReview._id)}
      />
    </>
  );
}
