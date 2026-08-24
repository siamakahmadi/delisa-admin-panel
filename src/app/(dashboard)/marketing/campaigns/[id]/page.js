import { CampaignEditor } from "@/components/marketing/campaign-editor";

export default async function CampaignEditorPage({ params }) {
  const { id } = await params;
  return <CampaignEditor campaignId={id} />;
}
