import { SessionDetail } from "@/components/analytics/session-detail";

export default async function SessionDetailPage({ params }) {
  const { sessionId } = await params;
  return <SessionDetail sessionId={sessionId} />;
}
