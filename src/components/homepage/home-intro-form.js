"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useToast } from "@/components/ui/toast";
import { fetchHomeIntro, saveHomeIntro } from "@/lib/homepage/api";

const DEFAULTS = { enabled: true, eyebrow: "", contentHtml: "" };

export function HomeIntroForm() {
  const { data, isLoading } = useQuery({ queryKey: ["home-intro-settings"], queryFn: fetchHomeIntro });

  if (isLoading) return <Skeleton className="h-72 w-full max-w-2xl" />;
  return <HomeIntroFormBody initial={{ ...DEFAULTS, ...(data || {}) }} />;
}

function HomeIntroFormBody({ initial }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initial);
  const patch = (fields) => setForm((f) => ({ ...f, ...fields }));

  const saveMutation = useMutation({
    mutationFn: () => saveHomeIntro(form),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["home-intro-settings"] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--text-muted)]">
          این متن در صفحه اصلی سایت، بین بخش برندها و سوالات متداول نمایش داده می‌شود.
        </p>

        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" checked={form.enabled} onChange={(e) => patch({ enabled: e.target.checked })} className="h-4 w-4 accent-[var(--brand-600)]" />
          نمایش این بخش در صفحه اصلی
        </label>

        <div>
          <Label>عنوان کوچک (Eyebrow)</Label>
          <Input value={form.eyebrow} onChange={(e) => patch({ eyebrow: e.target.value })} placeholder="مثلاً: فروشگاه آنلاین دلیسا" />
        </div>

        <div>
          <Label>متن معرفی</Label>
          <RichTextEditor
            value={form.contentHtml}
            onChange={(v) => patch({ contentHtml: v.html })}
            placeholder="درباره دلیسا بنویسید..."
          />
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
