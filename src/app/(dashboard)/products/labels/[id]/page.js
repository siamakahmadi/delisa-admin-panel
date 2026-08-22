import { LabelDetail } from "@/components/products/label-detail";

export default async function LabelDetailPage({ params }) {
  const { id } = await params;
  return <LabelDetail id={id} />;
}
