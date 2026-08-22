"use client";

import { TaxonomyManager } from "@/components/blog/taxonomy-manager";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "@/lib/blog/api";

export default function BlogCategoriesPage() {
  return (
    <TaxonomyManager
      title="دسته‌بندی‌های بلاگ"
      subtitle="مدیریت دسته‌بندی‌های پست‌های بلاگ"
      itemLabel="دسته"
      listKey="blog-categories"
      hasDescription
      fetchList={fetchCategories}
      createItem={createCategory}
      updateItem={updateCategory}
      deleteItem={deleteCategory}
    />
  );
}
