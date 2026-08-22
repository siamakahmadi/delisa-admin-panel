"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EntityPicker } from "./entity-picker";
import { IconPicker } from "./icon-picker";
import { MenuImageField } from "./menu-image-field";
import { DateTimeField } from "@/components/page-builder/fields/datetime-field";
import { fetchCategoryChildren } from "@/lib/menu-builder/api";

const TYPE_OPTIONS = [
  { value: "custom", label: "لینک دلخواه" },
  { value: "category", label: "دسته‌بندی" },
  { value: "brand", label: "برند" },
  { value: "product", label: "محصول" },
  { value: "tag", label: "برچسب" },
  { value: "type", label: "نوع محصول" },
  { value: "page", label: "صفحه" },
  { value: "heading", label: "سرتیتر (غیرقابل کلیک)" },
];

const REF_TYPES = ["category", "brand", "product", "tag", "type", "page"];

const MENU_STYLE_OPTIONS = [
  { value: "simple", label: "بدون زیرمنو" },
  { value: "dropdown", label: "کشویی (لیست ساده)" },
  { value: "mega", label: "مگامنو (چند ستونه)" },
];

const DISPLAY_STYLE_OPTIONS = [
  { value: "link", label: "لینک عادی" },
  { value: "heading", label: "سرتیتر ستون" },
  { value: "divider", label: "خط جداکننده" },
  { value: "featured", label: "کارت تصویری ویژه" },
];

function toggleVisibleOn(item, key, checked, patch) {
  const current = new Set(item.visibleOn || ["desktop", "mobile"]);
  if (checked) current.add(key);
  else current.delete(key);
  patch({ visibleOn: Array.from(current) });
}

/** Right-panel form for editing the selected menu item. Fully local — parent owns persistence. */
export function ItemEditorPanel({ item, parentItem, childCount, onPatch, onImportChildren, onNotify }) {
  const [importing, setImporting] = useState(false);

  if (!item) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">یک مورد را از درخت انتخاب کنید تا بتوانید ویرایشش کنید.</p>
        <p className="text-xs text-[var(--text-faint)]">یا از دکمه «افزودن لینک جدید» یک مورد جدید بسازید.</p>
      </div>
    );
  }

  const isRefType = REF_TYPES.includes(item.type);
  const isMegaChild = parentItem?.menuStyle === "mega";
  const canHaveChildrenStyle = childCount > 0;

  function patch(fields) {
    onPatch(item._id, fields);
  }

  async function handleImportChildren() {
    if (!item.refId) return;
    setImporting(true);
    try {
      const children = await fetchCategoryChildren(item.refId);
      if (!children.length) {
        onNotify?.("این دسته‌بندی زیرمجموعه‌ای ندارد", "error");
        return;
      }
      onImportChildren(item._id, children);
      onNotify?.(`${children.length} زیردسته اضافه شد`, "success");
    } catch (e) {
      onNotify?.(e?.response?.data?.message || e.message || "خطا در دریافت زیردسته‌ها", "error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4 overflow-y-auto p-4">
      <div>
        <Label>نوع مورد</Label>
        <Select value={item.type} onChange={(e) => patch({ type: e.target.value, refId: null, title: "", resolvedTitle: "", resolvedImage: "" })}>
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {isRefType && (
        <div>
          <Label>انتخاب {TYPE_OPTIONS.find((t) => t.value === item.type)?.label}</Label>
          <EntityPicker
            type={item.type}
            value={item.refId ? { refId: item.refId, title: item.title || item.resolvedTitle, image: item.image || item.resolvedImage } : null}
            onChange={(picked) => {
              if (!picked) {
                patch({ refId: null, resolvedTitle: "", resolvedImage: "" });
                return;
              }
              patch({
                refId: picked.refId,
                resolvedTitle: picked.title || "",
                resolvedImage: picked.image || "",
                image: item.image || picked.image || "",
              });
            }}
          />
          {item.type === "category" && item.refId && (
            <Button type="button" size="sm" variant="ghost" className="mt-1.5" onClick={handleImportChildren} disabled={importing}>
              {importing ? "در حال دریافت…" : "+ افزودن زیردسته‌ها به‌عنوان آیتم"}
            </Button>
          )}
        </div>
      )}

      <div>
        <Label>عنوان نمایشی (اختیاری — در صورت خالی بودن از عنوان اصلی استفاده می‌شود)</Label>
        <Input value={item.title || ""} onChange={(e) => patch({ title: e.target.value })} placeholder="مثلاً: پیشنهاد ویژه تابستان" />
      </div>

      {item.type === "custom" && (
        <div>
          <Label>آدرس لینک</Label>
          <Input dir="ltr" value={item.url || ""} onChange={(e) => patch({ url: e.target.value })} placeholder="/landing/sale یا https://..." />
        </div>
      )}

      {isRefType && (
        <details className="rounded-[var(--radius-md)] border border-[var(--border)] p-2.5">
          <summary className="cursor-pointer text-xs font-medium text-[var(--text-muted)]">آدرس سفارشی (جایگزین آدرس پیش‌فرض)</summary>
          <Input
            dir="ltr"
            className="mt-2"
            value={item.url || ""}
            onChange={(e) => patch({ url: e.target.value })}
            placeholder="در صورت خالی بودن، آدرس به‌صورت خودکار ساخته می‌شود"
          />
        </details>
      )}

      {item.type !== "heading" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input type="checkbox" checked={!!item.openInNewTab} onChange={(e) => patch({ openInNewTab: e.target.checked })} className="h-4 w-4 accent-[var(--brand-600)]" />
            باز شدن در تب جدید
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input type="checkbox" checked={item.enabled !== false} onChange={(e) => patch({ enabled: e.target.checked })} className="h-4 w-4 accent-[var(--brand-600)]" />
            فعال
          </label>
        </div>
      )}

      <div>
        <Label>آیکون</Label>
        <IconPicker value={item.icon} onChange={(icon) => patch({ icon })} />
      </div>

      <div>
        <Label>تصویر (برای کارت‌های تصویری مگامنو)</Label>
        <MenuImageField value={item.image} onChange={(image) => patch({ image })} />
      </div>

      <div>
        <Label>توضیح کوتاه (زیرعنوان)</Label>
        <Input value={item.description || ""} onChange={(e) => patch({ description: e.target.value })} placeholder="یک جمله کوتاه زیر عنوان نمایش داده می‌شود" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>متن نشان (Badge)</Label>
          <Input value={item.badge?.text || ""} onChange={(e) => patch({ badge: { ...(item.badge || {}), text: e.target.value } })} placeholder="مثلاً جدید" />
        </div>
        <div>
          <Label>رنگ نشان</Label>
          <Input dir="ltr" value={item.badge?.color || ""} onChange={(e) => patch({ badge: { ...(item.badge || {}), color: e.target.value } })} placeholder="#ce3263" />
        </div>
      </div>

      <div>
        <Label>نحوه نمایش این مورد</Label>
        <Select value={item.displayStyle || "link"} onChange={(e) => patch({ displayStyle: e.target.value })}>
          {DISPLAY_STYLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {isMegaChild && (
        <div>
          <Label>عرض ستون در مگامنو</Label>
          <Select value={item.columnSpan || 1} onChange={(e) => patch({ columnSpan: Number(e.target.value) })}>
            <option value={1}>یک ستون</option>
            <option value={2}>دو ستون</option>
            <option value={3}>سه ستون</option>
          </Select>
        </div>
      )}

      {canHaveChildrenStyle && (
        <div>
          <Label>نحوه نمایش زیرمنوی این مورد ({childCount} زیرمجموعه)</Label>
          <Select value={item.menuStyle || "simple"} onChange={(e) => patch({ menuStyle: e.target.value })}>
            {MENU_STYLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          {item.menuStyle === "mega" && (
            <p className="mt-1.5 flex gap-1.5 rounded-[var(--radius-md)] bg-[var(--info-bg)] p-2.5 text-xs leading-5 text-[var(--info)]">
              <Info size={14} className="mt-0.5 shrink-0" />
              در حالت مگامنو، زیرمجموعه‌های مستقیم این مورد به‌صورت یک لیست ثابت در سمت راست پنل نمایش داده می‌شوند. با نگه‌داشتن ماوس روی هرکدام،
              زیرمجموعه‌های آن به‌صورت چند ستون در سمت چپ باز می‌شود — یعنی برای مگامنوی کامل، دو سطح زیرمجموعه لازم دارید (سطح اول = ردیف‌های راست،
              سطح دوم = سرستون‌های چپ، سطح سوم اختیاری = لینک‌های داخل هر ستون). اگر فقط یک سطح زیرمجموعه بسازید، به‌صورت یک لیست ساده نمایش داده می‌شود.
            </p>
          )}
        </div>
      )}

      <div>
        <Label>نمایش در دستگاه‌ها</Label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input
              type="checkbox"
              checked={(item.visibleOn || ["desktop", "mobile"]).includes("desktop")}
              onChange={(e) => toggleVisibleOn(item, "desktop", e.target.checked, patch)}
              className="h-4 w-4 accent-[var(--brand-600)]"
            />
            دسکتاپ
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input
              type="checkbox"
              checked={(item.visibleOn || ["desktop", "mobile"]).includes("mobile")}
              onChange={(e) => toggleVisibleOn(item, "mobile", e.target.checked, patch)}
              className="h-4 w-4 accent-[var(--brand-600)]"
            />
            موبایل
          </label>
        </div>
      </div>

      <details className="rounded-[var(--radius-md)] border border-[var(--border)] p-2.5">
        <summary className="cursor-pointer text-xs font-medium text-[var(--text-muted)]">زمان‌بندی نمایش (اختیاری)</summary>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <Label>شروع نمایش</Label>
            <DateTimeField value={item.startsAt} onChange={(v) => patch({ startsAt: v || null })} />
          </div>
          <div>
            <Label>پایان نمایش</Label>
            <DateTimeField value={item.endsAt} onChange={(v) => patch({ endsAt: v || null })} />
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--text-faint)]">در صورت تنظیم، این مورد فقط در بازه زمانی مشخص‌شده روی سایت نمایش داده می‌شود.</p>
      </details>
    </div>
  );
}
