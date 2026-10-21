import { RunDetail } from "@/components/agents/run-detail";

export default async function AgentRunPage({ params }) {
  const { id } = await params;
  return <RunDetail runId={id} />;
}
