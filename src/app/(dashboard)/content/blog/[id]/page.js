import { PostEditor } from "@/components/blog/post-editor";

export default async function EditPostPage({ params }) {
  const { id } = await params;
  return <PostEditor mode="edit" postId={id} />;
}
