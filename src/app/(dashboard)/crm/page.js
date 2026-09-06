"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { SegmentsTab } from "@/components/crm/segments-tab";
import { CampaignsTab } from "@/components/crm/campaigns-tab";
import { AutomationTab } from "@/components/crm/automation-tab";
import { TagsTab } from "@/components/crm/tags-tab";
import { SmsTemplatesTab } from "@/components/crm/sms-templates-tab";

export default function CrmPage() {
  return (
    <div>
      <PageHeader
        title="مدیریت ارتباط با مشتری (CRM)"
        subtitle="سگمنت‌بندی مشتریان، ارسال کمپین پیامی و قوانین اتوماسیون بازاریابی"
      />

      <Tabs defaultValue="segments">
        <TabsList>
          <TabsTrigger value="segments">سگمنت‌ها</TabsTrigger>
          <TabsTrigger value="campaigns">کمپین‌ها</TabsTrigger>
          <TabsTrigger value="automation">اتوماسیون</TabsTrigger>
          <TabsTrigger value="sms-templates">قالب‌های پیامک</TabsTrigger>
          <TabsTrigger value="tags">تگ‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="segments">
          <SegmentsTab />
        </TabsContent>
        <TabsContent value="campaigns">
          <CampaignsTab />
        </TabsContent>
        <TabsContent value="automation">
          <AutomationTab />
        </TabsContent>
        <TabsContent value="sms-templates">
          <SmsTemplatesTab />
        </TabsContent>
        <TabsContent value="tags">
          <TagsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
