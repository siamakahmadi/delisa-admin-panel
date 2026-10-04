"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PricingWorkbookTable } from "@/components/pricing-intelligence/workbook-table";

export default function PricingMarketTablePage() {
  return (
    <div>
      <PageHeader
        title="جدول مقایسه بازار"
        subtitle="محصول را اضافه کن، قیمت رقبا را بنویس و میانگین بازار و حاشیه سودت را همان لحظه ببین"
      />
      <PricingWorkbookTable />
    </div>
  );
}
