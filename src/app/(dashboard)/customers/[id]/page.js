import { CustomerDetail } from "@/components/customers/customer-detail";

export default async function CustomerDetailPage({ params }) {
  const { id } = await params;
  return <CustomerDetail id={id} />;
}
