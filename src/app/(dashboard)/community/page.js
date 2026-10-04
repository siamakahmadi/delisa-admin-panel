"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { CommunitySettingsPanel } from "@/components/community/settings-panel";
import { CommunityReportsManager } from "@/components/community/reports-manager";
import { CommunityPostsManager } from "@/components/community/posts-manager";
import { CommunityProfilesManager } from "@/components/community/profiles-manager";

export default function CommunityPage() {
  return (
    <div>
      <PageHeader
        title="کامیونیتی"
        subtitle="شبکه‌ی اجتماعی مشتری‌ها در اپ (شبیه توییتر): پست، سوال، عکس، لینک محصول و مقاله، دنبال‌کردن — اینجا روشن، تنظیم و مدیریت می‌شود"
      />

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">تنظیمات و آمار</TabsTrigger>
          <TabsTrigger value="reports">گزارش‌ها</TabsTrigger>
          <TabsTrigger value="posts">پست‌ها</TabsTrigger>
          <TabsTrigger value="profiles">کاربران</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <CommunitySettingsPanel />
        </TabsContent>
        <TabsContent value="reports">
          <CommunityReportsManager />
        </TabsContent>
        <TabsContent value="posts">
          <CommunityPostsManager />
        </TabsContent>
        <TabsContent value="profiles">
          <CommunityProfilesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
