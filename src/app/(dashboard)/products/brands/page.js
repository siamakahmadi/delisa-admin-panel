"use client";

import { Suspense } from "react";
import { TaxonomyManager } from "@/components/products/taxonomy-manager";

export default function BrandsPage() {
  return (
    <Suspense fallback={null}>
      <TaxonomyManager title="برندها" endpoint="/api/brands" queryKey="brands" imageField="logo" />
    </Suspense>
  );
}
