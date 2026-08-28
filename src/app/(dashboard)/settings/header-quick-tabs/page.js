"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, ImagePlus, X, ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

const EMPTY_ITEM = {
  enabled: true,
  icon: "",
  label: "",
  href: "",
  badgeColor: "#c62a4d",
  textColor: "#ffffff",
};

const DEFAULTS = { enabled: false, items: [] };

async function uploadSiteImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "header-quick-tabs");
  const res = await apiClient.post("/api/admin/uploads/image", fd);
  return res.data;
}

export default function HeaderQuickTabsSettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["header-quick-tabs-settings"],
    queryFn: async () => (await apiClient.get("/api/admin/settings/header-quick-tabs")).data,
  });

  return (
    <div>
      <PageHeader
        title="تب‌های دسترسی سریع هدر"
        subtitle="ردیف تب‌های آیکونی بین بنر بالای هدر و خودِ هدر، فقط در موبایل (مثل محصولات، مجله). با اسکرول صفحه آیکون‌ها با انیمیشن جمع می‌شوند و فقط متن می‌ماند. تبی که با صفحه فعلی مطابقت داشته باشد (بر اساس لینکش) به‌صورت خودکار با رنگ انتخاب‌شده هایلایت می‌شود."
      />

      {isLoading ? (
        <Skeleton className="h-96 w-full max-w-3xl" />
      ) : (
        <SettingsForm
          initial={{
            ...DEFAULTS,
            ...(data?.headerQuickTabs || {}),
            items: data?.headerQuickTabs?.items?.length ? data.headerQuickTabs.items : DEFAULTS.items,
          }}
        />
      )}
    </div>
  );
}

function SettingsForm({ initial }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(initial);
  const patch = (fields) => setSettings((s) => ({ ...s, ...fields }));

  const saveMutation = useMutation({
    mutationFn: () => apiClient.put("/api/admin/settings/header-quick-tabs", { headerQuickTabs: settings }),
    onSuccess: () => {
      toast.success("تنظیمات ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["header-quick-tabs-settings"] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  function updateItem(index, patchFields) {
    setSettings((s) => ({
      ...s,
      items: s.items.map((it, i) => (i === index ? { ...it, ...patchFields } : it)),
    }));
  }

  function removeItem(index) {
    setSettings((s) => ({ ...s, items: s.items.filter((_, i) => i !== index) }));
  }

  function addItem() {
    setSettings((s) => ({ ...s, items: [...s.items, { ...EMPTY_ITEM }] }));
  }

  function moveItem(index, dir) {
    setSettings((s) => {
      const target = index + dir;
      if (target < 0 || target >= s.items.length) return s;
      const items = [...s.items];
      [items[index], items[target]] = [items[target], items[index]];
      return { ...s, items };
    });
  }

  return (
    <Card className="max-w-3xl">
      <CardContent className="space-y-5">
        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
            className="h-4 w-4 accent-[var(--brand-600)]"
          />
          نمایش این ردیف در هدر موبایل
        </label>

        <div className="space-y-3">
          {settings.items.map((item, index) => (
            <div key={index} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
              <div className="mb-3 flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <input
                    type="checkbox"
                    checked={item.enabled !== false}
                    onChange={(e) => updateItem(index, { enabled: e.target.checked })}
                    className="h-3.5 w-3.5 accent-[var(--brand-600)]"
                  />
                  فعال
                </label>
                <span className="flex-1" />
                <Button size="sm" variant="ghost" onClick={() => moveItem(index, -1)} disabled={index === 0}>
                  <ArrowUp size={13} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => moveItem(index, 1)} disabled={index === settings.items.length - 1}>
                  <ArrowDown size={13} />
                </Button>
                <Button size="sm" variant="danger" onClick={() => removeItem(index)}>
                  <Trash2 size={13} />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[80px_1fr]">
                <div>
                  <Label>آیکون</Label>
                  <IconField value={item.icon} onChange={(v) => updateItem(index, { icon: v })} />
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label>متن</Label>
                      <Input value={item.label} onChange={(e) => updateItem(index, { label: e.target.value })} placeholder="مثلاً: محصولات" />
                    </div>
                    <div>
                      <Label>لینک</Label>
                      <Input dir="ltr" value={item.href} onChange={(e) => updateItem(index, { href: e.target.value })} placeholder="/products" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label>رنگ پس‌زمینه (وقتی انتخاب شده)</Label>
                      <ColorInput value={item.badgeColor} onChange={(v) => updateItem(index, { badgeColor: v })} />
                    </div>
                    <div>
                      <Label>رنگ متن (وقتی انتخاب شده)</Label>
                      <ColorInput value={item.textColor} onChange={(v) => updateItem(index, { textColor: v })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] py-2 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--brand-500)] hover:text-[var(--brand-600)]"
          >
            <Plus size={13} />
            افزودن تب
          </button>
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

function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#f3f3f5"}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 shrink-0 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]"
      />
      <Input dir="ltr" value={value || ""} placeholder="#f3f3f5" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function IconField({ value, onChange }) {
  const inputRef = useRef(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadSiteImage(file);
      if (!res?.url) throw new Error("سرور آدرس تصویر را برنگرداند");
      onChange(res.url);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative h-16 w-16 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-contain" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-[var(--radius-sm)] bg-black/60 text-white"
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--brand-500)] hover:text-[var(--brand-500)]"
        >
          <ImagePlus size={16} />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
