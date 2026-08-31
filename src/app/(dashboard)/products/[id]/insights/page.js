import { ProductInsights } from "@/components/products/product-insights";

export default async function ProductInsightsPage({ params }) {
  const { id } = await params;
  return <ProductInsights id={id} />;
}
