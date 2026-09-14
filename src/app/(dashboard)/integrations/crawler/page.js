"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SourcesTab } from "@/components/crawler/sources-tab";
import { ScrapedQueueTab } from "@/components/crawler/scraped-queue-tab";

export default function CrawlerPage() {
  return (
    <div>
      <PageHeader
        title="کراولر محصولات"
        subtitle="سایت‌ها و دسته‌بندی‌هایی که باید کراول شوند را تعریف کنید؛ محصولات خام جمع‌شده را Claude از طریق MCP بازنویسی و به دلیسا اضافه می‌کند"
      />

      <Tabs defaultValue="sources">
        <TabsList>
          <TabsTrigger value="sources">منابع و دسته‌بندی‌ها</TabsTrigger>
          <TabsTrigger value="queue">صف محصولات خام</TabsTrigger>
        </TabsList>
        <TabsContent value="sources">
          <SourcesTab />
        </TabsContent>
        <TabsContent value="queue">
          <ScrapedQueueTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
