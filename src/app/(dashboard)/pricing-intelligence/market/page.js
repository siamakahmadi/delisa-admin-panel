"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PricingWorkbookTable } from "@/components/pricing-intelligence/workbook-table";

export default function PricingMarketTablePage() {
  return (
    <div>
      <PageHeader
        title="جدول مقایسه بازار"
        subtitle="محصول را با عکس اضافه کنید، قیمت رقبا را بنویسید، میانگین بازار و حاشیه سود را ببینید"
      />
      <PricingWorkbookTable />
    </div>
  );
}
