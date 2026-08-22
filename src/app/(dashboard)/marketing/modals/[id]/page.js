import { ModalDetail } from "@/components/marketing/modal-detail";

export default async function PromoModalDetailPage({ params }) {
  const { id } = await params;
  return <ModalDetail id={id} />;
}
