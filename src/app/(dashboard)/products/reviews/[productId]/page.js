import { ProductReviewForm } from "@/components/products/product-review-form";

export default async function ProductReviewEditPage({ params }) {
  const { productId } = await params;
  return <ProductReviewForm productId={productId} />;
}
