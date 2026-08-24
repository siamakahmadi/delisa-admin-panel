import { DiscountForm } from "@/components/marketing/discount-form";

export default async function DiscountEditorPage({ params }) {
  const { id } = await params;
  return <DiscountForm discountId={id} />;
}
