"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Select } from "@/components/ui/select";
import { LedgerProductsTable } from "@/components/ledger/products-table";
import { PageHint } from "@/components/ledger/parts";
import { fetchLedgerProducts, fetchLedgerSuppliers } from "@/lib/ledger/api";

export default function LedgerProductsPage() {
  const [supplier, setSupplier] = useState("");
  const { data: sup } = useQuery({ queryKey: ["ledger", "suppliers", "filter"], queryFn: () => fetchLedgerSuppliers({ active: "all" }) });
  const { data, isLoading } = useQuery({
    queryKey: ["ledger", "products", supplier],
    queryFn: () => fetchLedgerProducts({ supplier: supplier || undefined }),
  });

  return (
    <div>
      <PageHeader title="کالاها: خرید، فروش و باقی‌مانده" subtitle="از هر کالا چقدر خریده‌ای، چقدر فروخته‌ای و چقدر مانده" />
      <PageHint>
        فروش از سفارش‌های پرداخت‌شده‌ی سایت بعد از اولین خرید همان کالا محاسبه می‌شود. اگر یک کالا را از چند تأمین‌کننده گرفته باشی، فروش به نسبت تعداد خریدشان تقسیم می‌شود؛ پس سود و باقی‌مانده «تخمینی» است.
      </PageHint>
      <div className="mb-4 w-64">
        <Select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
          <option value="">همه تأمین‌کنندگان</option>
          {(sup?.suppliers || []).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </Select>
      </div>
      <LedgerProductsTable rows={data?.products || []} isLoading={isLoading} showSupplier={!supplier} />
    </div>
  );
}
