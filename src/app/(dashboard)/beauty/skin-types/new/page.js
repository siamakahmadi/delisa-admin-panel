"use client";

import { PageHeader } from "@/components/layout/page-header";
import SkinTypeForm from "@/components/beauty/SkinTypeForm";

export default function NewSkinTypePage() {
  return (
    <div>
      <PageHeader title="نوع پوست جدید" subtitle="ساخت یک صفحه جدید نوع پوست" />
      <SkinTypeForm />
    </div>
  );
}
