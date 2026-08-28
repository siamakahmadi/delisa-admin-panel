"use client";

import { PageHeader } from "@/components/layout/page-header";
import IngredientForm from "@/components/beauty/IngredientForm";

export default function NewIngredientPage() {
  return (
    <div>
      <PageHeader title="ترکیب جدید" subtitle="ساخت یک صفحه جدید ترکیب" />
      <IngredientForm />
    </div>
  );
}
