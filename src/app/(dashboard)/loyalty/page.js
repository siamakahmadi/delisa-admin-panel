"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { LoyaltyOverviewTab } from "@/components/loyalty/overview-tab";
import { LoyaltyRulesTab } from "@/components/loyalty/rules-tab";
import { LoyaltyRedemptionOptionsTab } from "@/components/loyalty/redemption-options-tab";
import { LoyaltyTiersTab } from "@/components/loyalty/tiers-tab";
import { LoyaltyMembersTab } from "@/components/loyalty/members-tab";
import { LoyaltyTransactionsTab } from "@/components/loyalty/transactions-tab";

export default function LoyaltyPage() {
  return (
    <div>
      <PageHeader title="باشگاه مشتریان" subtitle="امتیازدهی، سطوح، گزینه‌های تبدیل امتیاز، اعضا و تاریخچه تراکنش‌ها را مدیریت کنید" />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="rules">قوانین امتیازدهی</TabsTrigger>
          <TabsTrigger value="redemption">تبدیل امتیاز</TabsTrigger>
          <TabsTrigger value="tiers">سطوح باشگاه</TabsTrigger>
          <TabsTrigger value="members">اعضا</TabsTrigger>
          <TabsTrigger value="transactions">تراکنش‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <LoyaltyOverviewTab />
        </TabsContent>
        <TabsContent value="rules">
          <LoyaltyRulesTab />
        </TabsContent>
        <TabsContent value="redemption">
          <LoyaltyRedemptionOptionsTab />
        </TabsContent>
        <TabsContent value="tiers">
          <LoyaltyTiersTab />
        </TabsContent>
        <TabsContent value="members">
          <LoyaltyMembersTab />
        </TabsContent>
        <TabsContent value="transactions">
          <LoyaltyTransactionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
