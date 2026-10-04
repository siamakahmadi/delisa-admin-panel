import { PurchaseForm } from "@/components/ledger/purchase-form";

export default async function PurchaseEditorPage({ params }) {
  const { id } = await params;
  return <PurchaseForm purchaseId={id} />;
}
