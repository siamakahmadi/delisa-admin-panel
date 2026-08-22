"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

const DEFAULTS = {
  showFaq: true,
  showRelatedEntities: true,
  showRelatedArticles: true,
  relatedEntitiesLimit: 6,
  relatedArticlesLimit: 4,
};

function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3">
      <div>
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-[var(--text-faint)]">{hint}</p>}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
    </div>
  );
}

export default function TaxonomySeoSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["taxonomy-seo-settings"],
    queryFn: async () => (await apiClient.get("/api/admin/settings/taxonomy-seo")).data,
  });

  return (
    <div>
      <PageHeader
        title="تنظیمات سئوی صفحات دسته/برند/برچسب"
        subtitle="این سوییچ‌ها سراسری هستند و روی همه صفحات فرود سئو اعمال می‌شوند؛ هر مورد می‌تواند در ویرایشگر خودش این تنظیم را override کند."
      />

      {isLoading ? <Skeleton className="h-80 w-full" /> : <SettingsForm initial={{ ...DEFAULTS, ...(data?.taxonomyPages || {}) }} />}
    </div>
  );
}

function SettingsForm({ initial }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(initial);

  const saveMutation = useMutation({
    mutationFn: () => apiClient.put("/api/admin/settings/taxonomy-seo", { taxonomyPages: settings }),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["taxonomy-seo-settings"] });
    },
    onError: () => toast.error("ذخیره ناموفق بود"),
  });

  return (
    <Card>
      <CardContent className="space-y-3">
        <ToggleRow
          label="نمایش سوالات متداول (FAQ)"
          checked={settings.showFaq}
          onChange={(v) => setSettings((s) => ({ ...s, showFaq: v }))}
        />
        <ToggleRow
          label="نمایش موارد مرتبط"
          hint="دسته‌بندی / برند / برچسب / نوع محصول"
          checked={settings.showRelatedEntities}
          onChange={(v) => setSettings((s) => ({ ...s, showRelatedEntities: v }))}
        />
        <ToggleRow
          label="نمایش مقالات مرتبط"
          checked={settings.showRelatedArticles}
          onChange={(v) => setSettings((s) => ({ ...s, showRelatedArticles: v }))}
        />

        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">حداکثر تعداد موارد مرتبط</label>
            <Input
              type="number"
              min={1}
              max={24}
              value={settings.relatedEntitiesLimit}
              onChange={(e) => setSettings((s) => ({ ...s, relatedEntitiesLimit: Number(e.target.value) || 1 }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">حداکثر تعداد مقالات مرتبط</label>
            <Input
              type="number"
              min={1}
              max={12}
              value={settings.relatedArticlesLimit}
              onChange={(e) => setSettings((s) => ({ ...s, relatedArticlesLimit: Number(e.target.value) || 1 }))}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save size={16} />
            ذخیره تنظیمات
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
