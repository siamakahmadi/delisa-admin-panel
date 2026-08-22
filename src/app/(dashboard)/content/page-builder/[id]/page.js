import { PageBuilderEditor } from "@/components/page-builder/editor";

export default async function PageBuilderEditorPage({ params }) {
  const { id } = await params;
  return <PageBuilderEditor pageId={id} />;
}
