import { StaffDetail } from "@/components/staff/staff-detail";

export default async function StaffDetailPage({ params }) {
  const { id } = await params;
  return <StaffDetail staffId={id} />;
}
