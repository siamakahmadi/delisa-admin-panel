import { StaffDetail } from "@/components/financial/staff-detail";

export default async function StaffFinancialDetailPage({ params }) {
  const { id } = await params;
  return <StaffDetail staffId={id} />;
}
