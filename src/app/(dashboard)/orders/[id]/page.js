import { OrderDetail } from "@/components/orders/order-detail";

export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}
