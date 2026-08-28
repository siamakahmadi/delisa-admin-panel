"use client";

import { PageHeader } from "@/components/layout/page-header";
import SkinConcernForm from "@/components/beauty/SkinConcernForm";

export default function NewSkinConcernPage() {
  return (
    <div>
      <PageHeader title="دغدغه پوستی جدید" subtitle="ساخت یک صفحه جدید دغدغه پوستی" />
      <SkinConcernForm />
    </div>
  );
}
