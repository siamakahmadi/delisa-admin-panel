"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Pencil, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchInfoPages } from "@/lib/info-pages/api";

const CUSTOMER_SITE_URL = (process.env.NEXT_PUBLIC_CUSTOMER_SITE_URL || "https://delisa.shop").replace(/\/+$/, "");

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fa-IR");
}

export default function InfoPagesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["info-pages"], queryFn: fetchInfoPages });
  const pages = data ?? [];

  const columns = [
    { key: "label", header: "صفحه", render: (row) => <span className="font-medium">{row.label}</span> },
    { key: "path", header: "آدرس", render: (row) => <span dir="ltr" className="text-xs text-[var(--text-muted)]">{row.path}</span> },
    {
      key: "hasContent",
      header: "محتوا",
      render: (row) =>
        row.hasContent ? (
          row.isPublished ? (
            <Badge variant="success" size="sm" dot>از پنل</Badge>
          ) : (
            <Badge variant="warning" size="sm" dot>پیش‌نویس (متن پیش‌فرض نمایش داده می‌شود)</Badge>
          )
        ) : (
          <span className="text-xs text-[var(--text-faint)]">متن پیش‌فرض سایت</span>
        ),
    },
    { key: "updatedAt", header: "آخرین ویرایش", render: (row) => formatDate(row.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <a href={`${CUSTOMER_SITE_URL}${row.path}`} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" title="مشاهده در سایت">
              <ExternalLink size={14} />
            </Button>
          </a>
          <Link href={`/content/info-pages/${row.key}`}>
            <Button variant="outline" size="sm">
              <Pencil size={14} />
              ویرایش
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="صفحات اطلاعات فروشگاه"
        subtitle="متن صفحات درباره ما، سوالات متداول، حریم خصوصی و شرایط بازگشت کالا را با همان ویرایشگر بلاگ بنویسید و به صفحات دیگر لینک بدهید. تا وقتی متنی ذخیره نکرده‌اید، سایت متن پیش‌فرض خودش را نشان می‌دهد."
      />
      <DataTable columns={columns} data={pages} isLoading={isLoading} rowKey={(row) => row.key} emptyMessage="صفحه‌ای یافت نشد" />
    </div>
  );
}
