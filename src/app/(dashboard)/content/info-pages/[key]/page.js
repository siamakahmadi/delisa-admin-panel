import { InfoPageEditor } from "@/components/info-pages/info-page-editor";

export default async function EditInfoPage({ params }) {
  const { key } = await params;
  return <InfoPageEditor pageKey={key} />;
}
