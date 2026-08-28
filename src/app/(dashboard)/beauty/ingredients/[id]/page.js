"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import IngredientForm from "@/components/beauty/IngredientForm";
import { ingredientsApi } from "@/lib/beauty/api";

export default function EditIngredientPage({ params }) {
  const { id } = use(params);
  const { data: editing, isLoading } = useQuery({
    queryKey: ["ingredients", id],
    queryFn: () => ingredientsApi.get(id),
  });

  return (
    <div>
      <PageHeader title="ویرایش ترکیب" subtitle={editing?.name || ""} />
      {isLoading ? <Skeleton className="h-96 w-full" /> : <IngredientForm editing={editing} />}
    </div>
  );
}
