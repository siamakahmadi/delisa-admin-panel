"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import SkinConcernForm from "@/components/beauty/SkinConcernForm";
import { skinConcernsApi } from "@/lib/beauty/api";

export default function EditSkinConcernPage({ params }) {
  const { id } = use(params);
  const { data: editing, isLoading } = useQuery({
    queryKey: ["skin-concerns", id],
    queryFn: () => skinConcernsApi.get(id),
  });

  return (
    <div>
      <PageHeader title="ویرایش دغدغه پوستی" subtitle={editing?.title || ""} />
      {isLoading ? <Skeleton className="h-96 w-full" /> : <SkinConcernForm editing={editing} />}
    </div>
  );
}
