"use client";

import { TaxonomyManager } from "@/components/blog/taxonomy-manager";
import { fetchTags, createTag, updateTag, deleteTag } from "@/lib/blog/api";

export default function BlogTagsPage() {
  return (
    <TaxonomyManager
      title="تگ‌های بلاگ"
      subtitle="مدیریت تگ‌های پست‌های بلاگ"
      itemLabel="تگ"
      listKey="blog-tags"
      fetchList={fetchTags}
      createItem={createTag}
      updateItem={updateTag}
      deleteItem={deleteTag}
    />
  );
}
