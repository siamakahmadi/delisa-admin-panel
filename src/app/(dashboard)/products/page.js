"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, ImageOff, Pencil } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useBrands, useProductTypes, useCategories } from "@/hooks/use-taxonomies";
import { formatToman } from "@/lib/utils";

const LIMIT = 20;

export default function ProductsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [brandSlug, setBrandSlug] = useState("");
  const [typeSlug, setTypeSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data: brands } = useBrands();
  const { data: productTypes } = useProductTypes();
  const { data: categories } = useCategories();

  const { data, isLoading } = useQuery({
    queryKey: ["products", { search: debouncedSearch, brandSlug, typeSlug, categorySlug, status, page }],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/products", {
        params: {
          page,
          limit: LIMIT,
          search: debouncedSearch || undefined,
          brand: brandSlug || undefined,
          productType: typeSlug || undefined,
          category: categorySlug || undefined,
          status: status || undefined,
        },
      });
      return res.data;
    },
  });

  const products = data?.products ?? [];
  const pageCount = Math.max(data?.pages ?? 1, 1);

  const columns = useMemo(
    () => [
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
              <span className="max-w-[220px] truncate font-medium text-[var(--text)]">{row.productName}</span>
            </div>
          );
        },
      },
      {
        key: "category",
        header: "دسته‌بندی",
        render: (row) => row.category?.name || "-",
      },
      {
        key: "brand",
        header: "برند",
        render: (row) => row.brand?.name || "-",
      },
      {
        key: "finalPrice",
        header: "قیمت نهایی",
        sortable: true,
        render: (row) => formatToman(row.finalPrice),
      },
      {
        key: "isPublished",
        header: "وضعیت",
        render: (row) =>
          row.isPublished ? (
            <Badge variant="success" size="sm" dot>
              منتشر شده
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm" dot>
              پیش‌نویس
            </Badge>
          ),
      },
      {
        key: "actions",
        header: "",
        render: (row) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/products/${row._id}`);
            }}
          >
            <Pencil size={15} />
          </Button>
        ),
      },
    ],
    [router]
  );

  return (
    <div>
      <PageHeader
        title="محصولات"
        subtitle={`${(data?.total ?? 0).toLocaleString("fa-IR")} محصول`}
        actions={
          <Button onClick={() => router.push("/products/new")}>
            <Plus size={16} />
            افزودن محصول
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <Input
            placeholder="جستجوی نام محصول..."
            className="pr-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          className="w-48"
          value={brandSlug}
          onChange={(e) => {
            setBrandSlug(e.target.value);
            setPage(1);
          }}
        >
          <option value="">همه برندها</option>
          {(brands ?? []).map((b) => (
            <option key={b._id} value={b.slug}>
              {b.name}
            </option>
          ))}
        </Select>
        <Select
          className="w-48"
          value={typeSlug}
          onChange={(e) => {
            setTypeSlug(e.target.value);
            setPage(1);
          }}
        >
          <option value="">همه انواع محصول</option>
          {(productTypes ?? []).map((t) => (
            <option key={t._id} value={t.slug}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select
          className="w-48"
          value={categorySlug}
          onChange={(e) => {
            setCategorySlug(e.target.value);
            setPage(1);
          }}
        >
          <option value="">همه دسته‌بندی‌ها</option>
          {(categories ?? []).map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          className="w-40"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="published">منتشر شده</option>
          <option value="draft">پیش‌نویس</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        emptyMessage="محصولی یافت نشد"
        onRowClick={(row) => router.push(`/products/${row._id}`)}
        pagination={{ page, pageCount, onPageChange: setPage }}
      />
    </div>
  );
}
