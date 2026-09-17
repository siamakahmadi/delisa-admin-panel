"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { SlidersManager } from "@/components/homepage/sliders-manager";
import { BrandsManager } from "@/components/homepage/brands-manager";
import { HomeIntroForm } from "@/components/homepage/home-intro-form";
import { StoriesManager } from "@/components/homepage/stories-manager";
import { FaqSectionManager } from "@/components/homepage/faq-section-manager";

export default function HomepageLayoutPage() {
  return (
    <div>
      <PageHeader title="چیدمان صفحه اصلی" subtitle="اسلایدرها، استوری‌ها، برندهای همکار و متن معرفی صفحه اصلی سایت را مدیریت کنید" />

      <Tabs defaultValue="sliders">
        <TabsList>
          <TabsTrigger value="sliders">اسلایدرها</TabsTrigger>
          <TabsTrigger value="stories">استوری‌ها</TabsTrigger>
          <TabsTrigger value="brands">برندها</TabsTrigger>
          <TabsTrigger value="intro">معرفی دلیسا</TabsTrigger>
          <TabsTrigger value="faq">سوالات متداول</TabsTrigger>
        </TabsList>

        <TabsContent value="sliders">
          <SlidersManager />
        </TabsContent>
        <TabsContent value="stories">
          <StoriesManager />
        </TabsContent>
        <TabsContent value="brands">
          <BrandsManager />
        </TabsContent>
        <TabsContent value="intro">
          <HomeIntroForm />
        </TabsContent>
        <TabsContent value="faq">
          <FaqSectionManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
