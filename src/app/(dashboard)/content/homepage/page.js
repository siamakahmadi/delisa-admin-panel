"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { SlidersManager } from "@/components/homepage/sliders-manager";
import { BrandsManager } from "@/components/homepage/brands-manager";
import { HomeIntroForm } from "@/components/homepage/home-intro-form";

export default function HomepageLayoutPage() {
  return (
    <div>
      <PageHeader title="چیدمان صفحه اصلی" subtitle="اسلایدرها، برندهای همکار و متن معرفی صفحه اصلی سایت را مدیریت کنید" />

      <Tabs defaultValue="sliders">
        <TabsList>
          <TabsTrigger value="sliders">اسلایدرها</TabsTrigger>
          <TabsTrigger value="brands">برندها</TabsTrigger>
          <TabsTrigger value="intro">معرفی دلیسا</TabsTrigger>
        </TabsList>

        <TabsContent value="sliders">
          <SlidersManager />
        </TabsContent>
        <TabsContent value="brands">
          <BrandsManager />
        </TabsContent>
        <TabsContent value="intro">
          <HomeIntroForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
