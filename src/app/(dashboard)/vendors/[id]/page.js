import { VendorDetail } from "@/components/vendors/vendor-detail";

export default async function VendorDetailPage({ params }) {
  const { id } = await params;
  return <VendorDetail id={id} />;
}
