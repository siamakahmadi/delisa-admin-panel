"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Trash2, Package, PackageX, Save } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ProductForm } from "./product-form";

export function EditProduct({ id }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [estimatedDaysSupply, setEstimatedDaysSupply] = useState(undefined);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await apiClient.get(`/api/admin/products/${id}`)).data,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/products/${id}`),
    onSuccess: () => {
      toast.success("محصول حذف شد");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/products");
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const stockStatusMutation = useMutation({
    mutationFn: (outOfStock) =>
      apiClient.patch(`/api/admin/products/${id}/stock-status`, { outOfStock }),
    onSuccess: (_, outOfStock) => {
      toast.success(outOfStock ? "محصول ناموجود علامت‌گذاری شد" : "محصول موجود علامت‌گذاری شد");
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("عملیات ناموفق بود"),
  });

  const fulfillmentMutation = useMutation({
    mutationFn: (days) =>
      apiClient.patch(`/api/admin/products/${id}/fulfillment`, { estimatedDaysSupply: days }),
    onSuccess: () => {
      toast.success("ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!product) return <p className="text-sm text-[var(--text-muted)]">محصول یافت نشد.</p>;

  const daysSupplyValue = estimatedDaysSupply !== undefined ? estimatedDaysSupply : (product.estimatedDaysSupply ?? "");

  return (
    <div>
      <PageHeader
        title={product.productName}
        subtitle="ویرایش محصول"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/products")}>
              <ArrowRight size={16} />
              بازگشت
            </Button>
            <Button
              variant="outline"
              loading={stockStatusMutation.isPending}
              onClick={() => stockStatusMutation.mutate(!product.isManuallyOutOfStock)}
            >
              {product.isManuallyOutOfStock ? <Package size={16} /> : <PackageX size={16} />}
              {product.isManuallyOutOfStock ? "بازگرداندن به موجود" : "علامت‌گذاری به‌عنوان ناموجود"}
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} />
              حذف
            </Button>
          </div>
        }
      />

      <Card className="mb-4 max-w-md">
        <CardContent className="flex items-end gap-3">
          <div className="flex-1">
            <Label>مدت‌زمان مصرف تقریبی (روز)</Label>
            <Input
              type="number"
              min={1}
              placeholder="مثلاً ۳۰"
              value={daysSupplyValue}
              onChange={(e) => setEstimatedDaysSupply(e.target.value === "" ? "" : Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-[var(--text-faint)]">برای یادآوری سفارش مجدد در روتین‌ساز استفاده می‌شود.</p>
          </div>
          <Button
            variant="outline"
            loading={fulfillmentMutation.isPending}
            onClick={() => fulfillmentMutation.mutate(daysSupplyValue === "" ? null : daysSupplyValue)}
          >
            <Save size={16} />
            ذخیره
          </Button>
        </CardContent>
      </Card>

      <ProductForm product={product} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف محصول"
        description="این محصول برای همیشه حذف می‌شود. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
