"use client";

import { TaxonomyManager } from "@/components/products/taxonomy-manager";

export default function ProductTypesPage() {
  return <TaxonomyManager title="نوع محصول" endpoint="/api/product-types" queryKey="product-types" imageField="icon" />;
}
