"use client";

import { PageHeader } from "@/components/layout/page-header";
import RoutineForm from "@/components/beauty/RoutineForm";

export default function NewRoutinePage() {
  return (
    <div>
      <PageHeader title="قالب روتین جدید" subtitle="ساخت یک قالب روتین تازه" />
      <RoutineForm />
    </div>
  );
}
