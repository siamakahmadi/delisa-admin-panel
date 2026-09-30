"use client";

import { PageHeader } from "@/components/layout/page-header";
import { JobsPanel } from "@/components/system/jobs-panel";

export default function SystemJobsPage() {
  return (
    <div>
      <PageHeader
        title="جاب‌های سرور"
        subtitle="روشن و خاموش کردن جاب‌های پس‌زمینه، و دیدن لاگ هر اجرا"
      />
      <JobsPanel />
    </div>
  );
}
