"use client";

import { TaxonomyManager } from "@/components/products/taxonomy-manager";

export default function BrandsPage() {
  return <TaxonomyManager title="برندها" endpoint="/api/brands" queryKey="brands" imageField="logo" />;
}
