"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchFaqSectionSettings, saveFaqSectionSettings } from "@/lib/homepage/api";
import { SectionEnableToggle } from "@/components/homepage/section-enable-toggle";

export function FaqSectionManager() {
  return (
    <div>
      <SectionEnableToggle
        queryKey={["faq-section-settings"]}
        fetchFn={fetchFaqSectionSettings}
        saveFn={saveFaqSectionSettings}
        label="نمایش سکشن سوالات متداول در صفحه اصلی"
      />
      <Card>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]">
            سوالات این پیش‌نمایش از صفحه «سوالات متداول» می‌آیند — به‌طور پیش‌فرض چند سوال اول منتشرشده
            نمایش داده می‌شوند. اگر خواستید سوالات خاصی را دستی انتخاب کنید، از گزینه‌ی «فقط این سوال در
            پیش‌نمایش صفحه اصلی نشان داده شود» روی هر سوال استفاده کنید.
          </p>
          <Link href="/content/faq">
            <Button variant="outline">
              مدیریت سوالات متداول
              <ArrowLeft size={16} />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
