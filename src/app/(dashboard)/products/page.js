"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Plus,
  ImageOff,
  Pencil,
  FileSpreadsheet,
  FileText,
  Package,
  PackageX,
  AlertTriangle,
  FileClock,
  LineChart,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StatCard } from "@/components/dashboard/stat-card";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useBrands, useProductTypes, useCategories } from "@/hooks/use-taxonomies";
import { formatToman } from "@/lib/utils";

const LIMIT = 20;
const fmt = (n) => Number(n || 0).toLocaleString("fa-IR");

// گزینه‌های خروجی: هر گروه اگه هر دو (یا هیچ‌کدوم) تیک بخوره یعنی «همه».
const EXPORT_OPTIONS = [
  { group: "status", key: "published", label: "منتشر شده" },
  { group: "status", key: "draft", label: "پیش‌نویس (منتشر نشده)" },
  { group: "stock", key: "inStock", label: "موجود" },
  { group: "stock", key: "outOfStock", label: "ناموجود" },
];
const DEFAULT_EXPORT_SELECTION = { published: true, draft: true, inStock: true, outOfStock: true };

function exportSelectionToParams(sel) {
  const status = sel.published && !sel.draft ? "published" : sel.draft && !sel.published ? "draft" : undefined;
  const stock = sel.inStock && !sel.outOfStock ? "inStock" : sel.outOfStock && !sel.inStock ? "outOfStock" : undefined;
  return { status, stock };
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function ProductsPage() {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [brandSlug, setBrandSlug] = useState("");
  const [typeSlug, setTypeSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [status, setStatus] = useState("");
  const [stock, setStock] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingNames, setExportingNames] = useState(false);
  // دیالوگ انتخاب نوع محصولات برای خروجی (متنی یا اکسل)
  const [exportDialog, setExportDialog] = useState(null); // null | "names" | "excel"
  const [exportSelection, setExportSelection] = useState(DEFAULT_EXPORT_SELECTION);

  const { data: brands } = useBrands();
  const { data: productTypes } = useProductTypes();
  const { data: categories } = useCategories();

  const filterParams = {
    search: debouncedSearch || undefined,
    brand: brandSlug || undefined,
    productType: typeSlug || undefined,
    category: categorySlug || undefined,
    status: status || undefined,
    stock: stock || undefined,
  };

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["products-summary"],
    queryFn: async () => (await apiClient.get("/api/admin/products/summary")).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products", { ...filterParams, page }],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/products", {
        params: { page, limit: LIMIT, ...filterParams },
      });
      return res.data;
    },
  });

  const products = data?.products ?? [];
  const pageCount = Math.max(data?.pages ?? 1, 1);

  const openExportDialog = (kind) => {
    // پیش‌فرض دیالوگ = همون فیلترهای فعال جدول، تا رفتار قبلی حفظ بشه
    setExportSelection({
      published: status !== "draft",
      draft: status !== "published",
      inStock: stock !== "outOfStock",
      outOfStock: stock !== "inStock",
    });
    setExportDialog(kind);
  };

  const exportSelectionValid = (exportSelection.published || exportSelection.draft) && (exportSelection.inStock || exportSelection.outOfStock);

  const runExport = () => {
    const kind = exportDialog;
    setExportDialog(null);
    const params = { ...filterParams, ...exportSelectionToParams(exportSelection) };
    return kind === "excel" ? exportExcel(params) : exportNames(params);
  };

  const exportExcel = async (params = filterParams) => {
    setExportingExcel(true);
    try {
      const res = await apiClient.get("/api/admin/products/export/excel", {
        params,
        responseType: "blob",
      });
      downloadBlob(new Blob([res.data]), `mahsoolat-${Date.now()}.xlsx`);
    } catch (e) {
      toast.error("خروجی اکسل ناموفق بود");
    } finally {
      setExportingExcel(false);
    }
  };

  const exportNames = async (params = filterParams) => {
    setExportingNames(true);
    try {
      const res = await apiClient.get("/api/admin/products/export/names", {
        params,
        responseType: "blob",
      });
      downloadBlob(new Blob([res.data]), `asami-mahsoolat-${Date.now()}.txt`);
    } catch (e) {
      toast.error("خروجی متنی ناموفق بود");
    } finally {
      setExportingNames(false);
    }
  };

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
        render: (row) =>
          Array.isArray(row.categories) && row.categories.length
            ? row.categories.map((c) => c?.name).filter(Boolean).join("، ")
            : "-",
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
        render: (row) => (
          <div className="flex flex-wrap items-center gap-1">
            {row.isPublished ? (
              <Badge variant="success" size="sm" dot>
                منتشر شده
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm" dot>
                پیش‌نویس
              </Badge>
            )}
            {row.isManuallyOutOfStock && (
              <Badge variant="danger" size="sm" dot>
                ناموجود
              </Badge>
            )}
          </div>
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
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push("/products/analytics")}>
              <LineChart size={16} />
              آمار محصولات
            </Button>
            <Button variant="outline" loading={exportingNames} onClick={() => openExportDialog("names")}>
              <FileText size={16} />
              خروجی متنی محصولات
            </Button>
            <Button variant="outline" loading={exportingExcel} onClick={() => openExportDialog("excel")}>
              <FileSpreadsheet size={16} />
              خروجی اکسل محصولات
            </Button>
            <Button onClick={() => router.push("/products/new")}>
              <Plus size={16} />
              افزودن محصول
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Package}
          label="کل محصولات"
          value={fmt(summary?.total)}
          color="violet"
          isLoading={summaryLoading}
        />
        <StatCard
          icon={PackageX}
          label="ناموجود"
          value={fmt(summary?.outOfStock)}
          color="pink"
          isLoading={summaryLoading}
        />
        <StatCard
          icon={AlertTriangle}
          label="رو به اتمام"
          value={fmt(summary?.lowStock)}
          color="amber"
          isLoading={summaryLoading}
        />
        <StatCard
          icon={FileClock}
          label="پیش‌نویس"
          value={fmt(summary?.draft)}
          color="blue"
          isLoading={summaryLoading}
        />
      </div>

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
        <Select
          className="w-40"
          value={stock}
          onChange={(e) => {
            setStock(e.target.value);
            setPage(1);
          }}
        >
          <option value="">همه موجودی‌ها</option>
          <option value="inStock">موجود</option>
          <option value="outOfStock">ناموجود</option>
        </Select>
      </div>

      <Dialog open={!!exportDialog} onOpenChange={(open) => !open && setExportDialog(null)}>
        <DialogContent>
          <DialogTitle>{exportDialog === "excel" ? "خروجی اکسل محصولات" : "خروجی متنی اسامی محصولات"}</DialogTitle>
          <DialogDescription>
            انتخاب کنید چه محصولاتی در خروجی باشند. فیلترهای فعال جدول (جستجو، برند، نوع، دسته‌بندی) هم اعمال می‌شوند.
          </DialogDescription>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { group: "status", title: "وضعیت انتشار" },
              { group: "stock", title: "وضعیت موجودی" },
            ].map(({ group, title }) => (
              <div key={group} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">{title}</p>
                <div className="space-y-2">
                  {EXPORT_OPTIONS.filter((o) => o.group === group).map((o) => (
                    <label key={o.key} className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text)]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[var(--brand-600)]"
                        checked={!!exportSelection[o.key]}
                        onChange={(e) => setExportSelection((prev) => ({ ...prev, [o.key]: e.target.checked }))}
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {!exportSelectionValid && (
            <p className="mt-3 text-xs text-[var(--danger)]">از هر گروه حداقل یک گزینه را انتخاب کنید.</p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setExportDialog(null)}>انصراف</Button>
            <Button disabled={!exportSelectionValid} onClick={runExport}>
              {exportDialog === "excel" ? <FileSpreadsheet size={16} /> : <FileText size={16} />}
              دریافت خروجی
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        emptyMessage="محصولی یافت نشد"
        onRowClick={(row) => router.push(`/products/${row._id}/insights`)}
        pagination={{ page, pageCount, onPageChange: setPage }}
      />
    </div>
  );
}
