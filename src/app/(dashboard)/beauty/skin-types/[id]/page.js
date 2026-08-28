"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import SkinTypeForm from "@/components/beauty/SkinTypeForm";
import { skinTypesApi } from "@/lib/beauty/api";

export default function EditSkinTypePage({ params }) {
  const { id } = use(params);
  const { data: editing, isLoading } = useQuery({
    queryKey: ["skin-types", id],
    queryFn: () => skinTypesApi.get(id),
  });

  return (
    <div>
      <PageHeader title="ویرایش نوع پوست" subtitle={editing?.name || ""} />
      {isLoading ? <Skeleton className="h-96 w-full" /> : <SkinTypeForm editing={editing} />}
    </div>
  );
}
