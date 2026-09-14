"use client";

import { Suspense } from "react";
import { TaxonomyManager } from "@/components/products/taxonomy-manager";

export default function ProductTypesPage() {
  return (
    <Suspense fallback={null}>
      <TaxonomyManager title="نوع محصول" endpoint="/api/product-types" queryKey="product-types" imageField="icon" />
    </Suspense>
  );
}
