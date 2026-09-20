"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useBrands, useCategories } from "@/hooks/use-taxonomies";
import {
  analyzePricingProducts,
  bulkApplyRecommendations,
  bulkApproveRecommendations,
  bulkPricingStrategy,
  enqueuePricingJob,
  fetchPricingProducts,
  updatePurchaseCosts,
} from "@/lib/pricing-intelligence/api";
import { STATUS_LABELS, STRATEGY_LABELS, formatPercent, formatSignedToman } from "@/lib/pricing-intelligence/labels";
import { formatToman } from "@/lib/utils";

const LIMIT = 20;

export default function PricingProductsPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState("");
  const [strategy, setStrategy] = useState("");
  const [confidence, setConfidence] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [marketPosition, setMarketPosition] = useState("");
  const [priceDiff, setPriceDiff] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [salesPerformance, setSalesPerformance] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);

  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const brandList = Array.isArray(brands) ? brands : brands?.items || brands?.brands || [];
  const categoryList = Array.isArray(categories) ? categories : categories?.items || categories?.categories || [];

  const params = {
    search: debouncedSearch || undefined,
    status: status || undefined,
    strategy: strategy || undefined,
    confidence: confidence || undefined,
    brand: brand || undefined,
    category: category || undefined,
    marketPosition: marketPosition || undefined,
    priceDiff: priceDiff || undefined,
    stockStatus: stockStatus || undefined,
    salesPerformance: salesPerformance || undefined,
    page,
    limit: LIMIT,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["pricing-intelligence-products", params],
    queryFn: () => fetchPricingProducts(params),
  });

  const products = data?.products || [];
  const total = data?.total || 0;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pricing-intelligence-products"] });
    queryClient.invalidateQueries({ queryKey: ["pricing-intelligence-dashboard"] });
  };

  const analyzeMutation = useMutation({
    mutationFn: (ids) => analyzePricingProducts(ids),
    onSuccess: () => {
      toast.success("تحلیل انجام شد");
      invalidate();
    },
    onError: () => toast.error("تحلیل ناموفق بود"),
  });

  const approveMutation = useMutation({
    mutationFn: (ids) => bulkApproveRecommendations(ids),
    onSuccess: () => {
      toast.success("تأیید گروهی انجام شد");
      invalidate();
    },
    onError: () => toast.error("تأیید ناموفق بود"),
  });

  const applyMutation = useMutation({
    mutationFn: (ids) => bulkApplyRecommendations(ids),
    onSuccess: () => {
      toast.success("اعمال ایمن انجام شد");
      invalidate();
    },
    onError: () => toast.error("اعمال ناموفق بود"),
  });

  const strategyMutation = useMutation({
    mutationFn: bulkPricingStrategy,
    onSuccess: () => {
      toast.success("استراتژی به‌روز شد");
      invalidate();
    },
    onError: () => toast.error("تغییر استراتژی ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      {
        key: "select",
        header: "",
        render: (row) => (
          <input
            type="checkbox"
            checked={selected.includes(String(row._id))}
            onChange={(e) => {
              e.stopPropagation();
              const id = String(row._id);
              setSelected((prev) => (e.target.checked ? [...prev, id] : prev.filter((x) => x !== id)));
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      },
      {
        key: "productName",
        header: "محصول",
        sortable: true,
        render: (row) => (
          <div>
            <div className="font-medium">{row.productName}</div>
            <div className="text-xs text-[var(--text-muted)]">{row.brand?.name || "—"}</div>
          </div>
        ),
      },
      {
        key: "purchaseCost",
        header: "قیمت خرید",
        render: (row) => (
          <PurchaseCostCell productId={row._id} value={row.purchaseCost} />
        ),
      },
      {
        key: "finalPrice",
        header: "قیمت فعلی",
        sortable: true,
        render: (row) => formatToman(row.recommendation?.currentPrice ?? row.finalPrice),
      },
      {
        key: "recommended",
        header: "قیمت پیشنهادی",
        render: (row) => (row.recommendation ? formatToman(row.recommendation.recommendedPrice) : "—"),
      },
      {
        key: "diff",
        header: "تغییر",
        render: (row) =>
          row.recommendation ? formatSignedToman(row.recommendation.priceDifference) : "—",
      },
      {
        key: "margin",
        header: "حاشیه فعلی",
        render: (row) => formatPercent(row.recommendation?.currentMargin),
      },
      {
        key: "expected",
        header: "حاشیه پیشنهادی",
        render: (row) => formatPercent(row.recommendation?.expectedMargin),
      },
      {
        key: "median",
        header: "میانه بازار",
        render: (row) =>
          row.recommendation?.market?.medianPrice
            ? formatToman(row.recommendation.market.medianPrice)
            : "—",
      },
      {
        key: "competitors",
        header: "رقبا",
        render: (row) => row.recommendation?.market?.validCompetitorCount ?? "—",
      },
      {
        key: "stock",
        header: "موجودی",
        render: (row) => Number(row.stock || 0).toLocaleString("fa-IR"),
      },
      {
        key: "sales",
        header: "فروش ۳۰ روز",
        render: (row) => Number(row.recommendation?.sales?.sales30d || 0).toLocaleString("fa-IR"),
      },
      {
        key: "strategy",
        header: "استراتژی",
        render: (row) =>
          STRATEGY_LABELS[row.recommendation?.strategy || row.strategy] || row.strategy || "—",
      },
      {
        key: "confidence",
        header: "اعتماد",
        render: (row) => row.recommendation?.confidence ?? "—",
      },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => {
          const st = STATUS_LABELS[row.recommendation?.status];
          return st ? (
            <Badge variant={st.variant} size="sm">
              {st.label}
            </Badge>
          ) : (
            "—"
          );
        },
      },
    ],
    [selected]
  );

  const recIds = products
    .filter((p) => selected.includes(String(p._id)) && p.recommendation?._id)
    .map((p) => p.recommendation._id);

  return (
    <div>
      <PageHeader
        title="جدول قیمت‌گذاری"
        subtitle="روی هر محصول کلیک کنید، قیمت خرید را ثبت کنید و لینک صفحه رقبا را برای تحلیل بگذارید"
        actions={
          <Button variant="secondary" onClick={() => router.push("/products/dynamic-price")}>
            قوانین درصدی
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <Input className="pr-9" placeholder="جستجو نام، SKU، بارکد…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </Select>
        <Select value={strategy} onChange={(e) => { setStrategy(e.target.value); setPage(1); }}>
          <option value="">همه استراتژی‌ها</option>
          {Object.entries(STRATEGY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Select value={confidence} onChange={(e) => { setConfidence(e.target.value); setPage(1); }}>
          <option value="">اعتماد</option>
          <option value="high">بالا</option>
          <option value="medium">متوسط</option>
          <option value="low">پایین</option>
        </Select>
        <Select value={brand} onChange={(e) => { setBrand(e.target.value); setPage(1); }}>
          <option value="">همه برندها</option>
          {brandList.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </Select>
        <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">همه دسته‌ها</option>
          {categoryList.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </Select>
        <Select value={marketPosition} onChange={(e) => { setMarketPosition(e.target.value); setPage(1); }}>
          <option value="">موقعیت بازار</option>
          <option value="below">زیر میانه</option>
          <option value="above">بالای میانه</option>
        </Select>
        <Select value={priceDiff} onChange={(e) => { setPriceDiff(e.target.value); setPage(1); }}>
          <option value="">تغییر قیمت</option>
          <option value="up">افزایش</option>
          <option value="down">کاهش</option>
        </Select>
        <Select value={stockStatus} onChange={(e) => { setStockStatus(e.target.value); setPage(1); }}>
          <option value="">موجودی</option>
          <option value="low">کم</option>
          <option value="high">زیاد</option>
        </Select>
        <Select value={salesPerformance} onChange={(e) => { setSalesPerformance(e.target.value); setPage(1); }}>
          <option value="">فروش</option>
          <option value="low">ضعیف</option>
          <option value="high">قوی</option>
        </Select>
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
          <span>{selected.length.toLocaleString("fa-IR")} انتخاب‌شده</span>
          <Button size="sm" loading={analyzeMutation.isPending} onClick={() => analyzeMutation.mutate(selected)}>
            تحلیل انتخاب‌شده
          </Button>
          <Button size="sm" variant="secondary" loading={approveMutation.isPending} onClick={() => approveMutation.mutate(recIds)}>
            تأیید انتخاب‌شده
          </Button>
          <Button size="sm" variant="secondary" loading={applyMutation.isPending} onClick={() => applyMutation.mutate(recIds)}>
            اعمال ایمن
          </Button>
          {category && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                enqueuePricingJob({ type: "refresh", categoryId: category, search: true }).then(
                  () => toast.success("رفرش دسته در صف قرار گرفت"),
                  () => toast.error("صف‌بندی ناموفق بود")
                )
              }
            >
              جستجوی رقبا در این دسته
            </Button>
          )}
          <Select
            className="w-44"
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              strategyMutation.mutate({ productIds: selected, strategy: e.target.value });
              e.target.value = "";
            }}
          >
            <option value="">تغییر استراتژی</option>
            {Object.entries(STRATEGY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => strategyMutation.mutate({ productIds: selected, autoPricingEnabled: true })}
          >
            فعال‌سازی خودکار
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => strategyMutation.mutate({ productIds: selected, autoPricingEnabled: false })}
          >
            غیرفعال‌سازی خودکار
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/pricing-intelligence/products/${row._id}`)}
        pagination={{
          page,
          pageCount: Math.max(1, Math.ceil(total / LIMIT)),
          onPageChange: setPage,
        }}
      />
    </div>
  );
}

function PurchaseCostCell({ productId, value }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const saveMut = useMutation({
    mutationFn: () =>
      updatePurchaseCosts({
        items: [{ productId, purchaseCost: draft === "" ? null : Number(draft) }],
      }),
    onSuccess: () => {
      toast.success("قیمت خرید ذخیره شد");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["pricing-intelligence-products"] });
    },
    onError: () => toast.error("ذخیره قیمت خرید ناموفق بود"),
  });

  if (!editing) {
    return (
      <button
        type="button"
        className="text-start tabular-nums text-[var(--brand-700)]"
        onClick={(e) => {
          e.stopPropagation();
          setDraft(value ?? "");
          setEditing(true);
        }}
      >
        {value ? formatToman(value) : "ثبت"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Input
        className="h-8 w-28"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") saveMut.mutate();
          if (e.key === "Escape") setEditing(false);
        }}
        autoFocus
      />
      <Button size="sm" loading={saveMut.isPending} onClick={() => saveMut.mutate()}>
        ذخیره
      </Button>
    </div>
  );
}
