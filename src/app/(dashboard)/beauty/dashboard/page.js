"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Droplets, Sparkles, FlaskConical, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { skinTypesApi, skinConcernsApi, ingredientsApi } from "@/lib/beauty/api";

function countByStatus(items) {
  const published = items.filter((i) => i.status === "published").length;
  return { total: items.length, published, draft: items.length - published };
}

function EntityCard({ icon: Icon, title, items, isLoading, href, router }) {
  const stats = countByStatus(items || []);
  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-[var(--shadow-md)]" onClick={() => router.push(href)}>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-50)] text-[var(--brand-600)]">
            <Icon size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text)]">{title}</p>
            {isLoading ? (
              <Skeleton className="mt-1.5 h-4 w-24" />
            ) : (
              <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                {stats.total} مورد — {stats.published} منتشرشده، {stats.draft} پیش‌نویس
              </p>
            )}
          </div>
        </div>
        <ArrowLeft size={16} className="text-[var(--text-faint)]" />
      </CardContent>
    </Card>
  );
}

export default function BeautyDashboardPage() {
  const router = useRouter();
  const skinTypesQ = useQuery({ queryKey: ["skin-types"], queryFn: skinTypesApi.list });
  const skinConcernsQ = useQuery({ queryKey: ["skin-concerns"], queryFn: skinConcernsApi.list });
  const ingredientsQ = useQuery({ queryKey: ["ingredients"], queryFn: ingredientsApi.list });

  return (
    <div>
      <PageHeader title="Beauty Knowledge Hub" subtitle="مرکز محتوای زیبایی — انواع پوست، دغدغه‌های پوستی و ترکیبات" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <EntityCard icon={Droplets} title="انواع پوست" items={skinTypesQ.data} isLoading={skinTypesQ.isLoading} href="/beauty/skin-types" router={router} />
        <EntityCard icon={Sparkles} title="دغدغه‌های پوستی" items={skinConcernsQ.data} isLoading={skinConcernsQ.isLoading} href="/beauty/skin-concerns" router={router} />
        <EntityCard icon={FlaskConical} title="ترکیبات" items={ingredientsQ.data} isLoading={ingredientsQ.isLoading} href="/beauty/ingredients" router={router} />
      </div>
    </div>
  );
}
