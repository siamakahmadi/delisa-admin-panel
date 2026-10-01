"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SectionEnableToggle } from "@/components/homepage/section-enable-toggle";
import { fetchTorobSettings, saveTorobSettings } from "@/lib/torobApi";

export default function TorobOrderTrackingPage() {
  return (
    <div>
      <PageHeader
        title="ردیابی سفارش ترب"
        subtitle="اجازه می‌دهد ترب سفارش‌های پرداخت‌شده‌ای که از ترب آمده‌اند را برای محاسبه‌ی کارمزد/گزارش دریافت کند"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>فعال‌سازی دسترسی ترب</CardTitle>
        </CardHeader>
        <CardContent>
          <SectionEnableToggle
            queryKey={["torob-order-tracking-settings"]}
            fetchFn={fetchTorobSettings}
            saveFn={saveTorobSettings}
            label="فعال بودن API ردیابی سفارش برای ترب"
          />
          <p className="text-xs leading-6 text-[var(--text-faint)]">
            وقتی خاموش است، endpoint ترب (<code dir="ltr">GET /torob/v1/orders</code>) با خطای ۴۰۳
            پاسخ می‌دهد. فقط سفارش‌هایی گزارش می‌شوند که پرداخت موفق دارند و مشتری با لینک ترب
            (<code dir="ltr">torob_clid</code>) وارد سایت شده باشد.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
