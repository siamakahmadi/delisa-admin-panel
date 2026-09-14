"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import RoutineForm from "@/components/beauty/RoutineForm";
import { routinesApi } from "@/lib/beauty/api";

export default function EditRoutinePage({ params }) {
  const { id } = use(params);
  const { data: editing, isLoading } = useQuery({
    queryKey: ["routines", id],
    queryFn: () => routinesApi.get(id),
  });

  return (
    <div>
      <PageHeader title="ویرایش قالب روتین" subtitle={editing?.title || ""} />
      {isLoading ? <Skeleton className="h-96 w-full" /> : <RoutineForm editing={editing} />}
    </div>
  );
}
