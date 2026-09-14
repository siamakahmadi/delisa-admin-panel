"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  createCrawlSource,
  updateCrawlSource,
  previewSelector,
} from "@/lib/crawler/api";

const emptyCategory = () => ({
  name: "",
  url: "",
  linkUrlPattern: "",
  apiUrl: "",
  apiItemsPath: "",
  apiSlugField: "slug",
  productUrlTemplate: "",
});

export function SourceFormDialog({ open, onOpenChange, source }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!source;

  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [categories, setCategories] = useState([emptyCategory()]);
  const [previewState, setPreviewState] = useState({}); // idx -> { loading, count, samples, error }
  const [apiModeOpen, setApiModeOpen] = useState({}); // idx -> bool

  useEffect(() => {
    if (open) {
      setName(source?.name || "");
      setBaseUrl(source?.baseUrl || "");
      const cats = source?.categories?.length
        ? source.categories.map((c) => ({
            name: c.name,
            url: c.url,
            linkUrlPattern: c.linkUrlPattern || "",
            apiUrl: c.apiUrl || "",
            apiItemsPath: c.apiItemsPath || "",
            apiSlugField: c.apiSlugField || "slug",
            productUrlTemplate: c.productUrlTemplate || "",
          }))
        : [emptyCategory()];
      setCategories(cats);
      setApiModeOpen(Object.fromEntries(cats.map((c, i) => [i, !!c.apiUrl])));
      setPreviewState({});
    }
  }, [open, source]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        baseUrl: baseUrl.trim(),
        categories: categories
          .filter((c) => c.name.trim() && c.url.trim())
          .map((c) => ({
            name: c.name.trim(),
            url: c.url.trim(),
            linkUrlPattern: c.linkUrlPattern.trim(),
            apiUrl: c.apiUrl.trim(),
            apiItemsPath: c.apiItemsPath.trim(),
            apiSlugField: c.apiSlugField.trim(),
            productUrlTemplate: c.productUrlTemplate.trim(),
          })),
      };
      return isEdit ? updateCrawlSource(source._id, payload) : createCrawlSource(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "منبع به‌روزرسانی شد" : "منبع اضافه شد");
      queryClient.invalidateQueries({ queryKey: ["crawl-sources"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  const updateCategory = (idx, patch) => {
    setCategories((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const handlePreview = async (idx) => {
    const cat = categories[idx];
    setPreviewState((prev) => ({ ...prev, [idx]: { loading: true } }));
    try {
      let result;
      if (apiModeOpen[idx]) {
        if (!cat.apiUrl || !cat.apiItemsPath || !cat.productUrlTemplate) {
          throw { response: { data: { message: "آدرس API، مسیر آرایه و قالب لینک محصول لازم است" } } };
        }
        result = await previewSelector({
          url: cat.apiUrl,
          selector: cat.apiItemsPath,
          mode: "api",
          slugField: cat.apiSlugField,
          urlTemplate: cat.productUrlTemplate,
        });
      } else {
        if (!cat.url || !cat.linkUrlPattern) {
          throw { response: { data: { message: "برای پیش‌نمایش، آدرس صفحه و الگوی لینک لازم است" } } };
        }
        result = await previewSelector({ url: cat.url, selector: cat.linkUrlPattern, mode: "link" });
      }
      setPreviewState((prev) => ({ ...prev, [idx]: { loading: false, ...result } }));
    } catch (e) {
      setPreviewState((prev) => ({
        ...prev,
        [idx]: { loading: false, error: e?.response?.data?.message || "پیش‌نمایش ناموفق بود" },
      }));
    }
  };

  const toggleApiMode = (idx) => {
    setApiModeOpen((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{isEdit ? "ویرایش منبع" : "منبع جدید"}</DialogTitle>

        <div className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto pl-1">
          <div>
            <Label>نام سایت</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: فروشگاه نمونه" />
          </div>
          <div>
            <Label>آدرس پایه‌ی سایت</Label>
            <Input dir="ltr" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://example.com" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="mb-0">دسته‌بندی‌ها</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCategories((prev) => [...prev, emptyCategory()])}
              >
                <Plus size={14} /> افزودن دسته
              </Button>
            </div>

            <div className="space-y-3">
              {categories.map((cat, idx) => {
                const preview = previewState[idx];
                return (
                  <div key={idx} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={cat.name}
                          onChange={(e) => updateCategory(idx, { name: e.target.value })}
                          placeholder="نام دسته (مثلاً: کرم مرطوب‌کننده)"
                        />
                        <Input
                          dir="ltr"
                          value={cat.url}
                          onChange={(e) => updateCategory(idx, { url: e.target.value })}
                          placeholder="https://example.com/category/moisturizers"
                        />

                        {!apiModeOpen[idx] && (
                          <div className="flex gap-2">
                            <Input
                              dir="ltr"
                              className="font-mono text-xs"
                              value={cat.linkUrlPattern}
                              onChange={(e) => updateCategory(idx, { linkUrlPattern: e.target.value })}
                              placeholder="/product/ (بخشی از آدرس محصولات — اختیاری، خالی یعنی تشخیص خودکار از JSON-LD)"
                            />
                            <Button type="button" variant="outline" size="icon" onClick={() => handlePreview(idx)}>
                              <Eye size={14} />
                            </Button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleApiMode(idx)}
                          className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                        >
                          {apiModeOpen[idx] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          حالت پیشرفته: این سایت لیست محصولات را با جاوااسکریپت لود می‌کند (API)
                        </button>

                        {apiModeOpen[idx] && (
                          <div className="space-y-2 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-2">
                            <p className="text-xs text-[var(--text-faint)]">
                              وقتی صفحه‌ی دسته‌بندی خالی برمی‌گردد (سایت‌های Next.js/React)، آدرس API که خود
                              سایت برای گرفتن لیست محصولات صدا می‌زند را از Network تب مرورگر پیدا کنید.
                            </p>
                            <Input
                              dir="ltr"
                              className="font-mono text-xs"
                              value={cat.apiUrl}
                              onChange={(e) => updateCategory(idx, { apiUrl: e.target.value })}
                              placeholder="https://example.com/api/products?cat_id=9&page_size=60"
                            />
                            <Input
                              dir="ltr"
                              className="font-mono text-xs"
                              value={cat.apiItemsPath}
                              onChange={(e) => updateCategory(idx, { apiItemsPath: e.target.value })}
                              placeholder="مسیر آرایه‌ی محصولات در پاسخ JSON — مثلاً: data.products.items"
                            />
                            <div className="flex gap-2">
                              <Input
                                dir="ltr"
                                className="font-mono text-xs"
                                value={cat.apiSlugField}
                                onChange={(e) => updateCategory(idx, { apiSlugField: e.target.value })}
                                placeholder="نام فیلد slug (پیش‌فرض: slug)"
                              />
                              <Input
                                dir="ltr"
                                className="font-mono text-xs"
                                value={cat.productUrlTemplate}
                                onChange={(e) => updateCategory(idx, { productUrlTemplate: e.target.value })}
                                placeholder="https://example.com/products/{slug}"
                              />
                              <Button type="button" variant="outline" size="icon" onClick={() => handlePreview(idx)}>
                                <Eye size={14} />
                              </Button>
                            </div>
                          </div>
                        )}

                        {preview?.loading && (
                          <p className="text-xs text-[var(--text-faint)]">در حال بررسی…</p>
                        )}
                        {preview?.error && <p className="text-xs text-[var(--danger)]">{preview.error}</p>}
                        {preview && !preview.loading && !preview.error && (
                          <p className="text-xs text-[var(--text-muted)]">
                            {preview.count.toLocaleString("fa-IR")} مورد پیدا شد
                            {preview.samples?.length ? ` — نمونه: ${preview.samples[0]}` : ""}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setCategories((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={categories.length === 1}
                      >
                        <Trash2 size={15} className="text-[var(--danger)]" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!name.trim() || !baseUrl.trim()}
          >
            {isEdit ? "ذخیره تغییرات" : "ایجاد منبع"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
