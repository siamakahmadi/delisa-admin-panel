"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SectionEnableToggle } from "@/components/homepage/section-enable-toggle";
import { fetchMcpSettings, saveMcpSettings } from "@/lib/mcp/api";

export default function McpIntegrationPage() {
  return (
    <div>
      <PageHeader
        title="اتصال Claude (MCP)"
        subtitle="اجازه می‌دهد دستیار هوش مصنوعی از طریق یک کلید سرویس مجزا مستقیماً روی دلیسا محصول اضافه کند"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>فعال‌سازی اتصال</CardTitle>
        </CardHeader>
        <CardContent>
          <SectionEnableToggle
            queryKey={["mcp-settings"]}
            fetchFn={fetchMcpSettings}
            saveFn={saveMcpSettings}
            label="فعال بودن اتصال MCP برای افزودن محصول"
          />
          <p className="text-xs leading-6 text-[var(--text-faint)]">
            وقتی خاموش است، حتی با کلید سرویس معتبر هم درخواست افزودن محصول رد می‌شود. کلید سرویس
            (API key) از طریق متغیر محیطی <code dir="ltr">MCP_SERVICE_API_KEY</code> روی سرور بک‌اند
            تنظیم می‌شود، نه از این صفحه — این سوییچ فقط یک کلید سالم داده‌شده را هم قطع/وصل می‌کند.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
