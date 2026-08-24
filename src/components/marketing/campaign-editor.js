"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Save, Plus, Pencil, Trash2, ImageOff, ImagePlus, ArrowUp, ArrowDown, LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ProductMultiPicker } from "@/components/marketing/product-multi-picker";
import { CAMPAIGN_SLOTS } from "@/lib/marketing/campaignSlots";
import {
  fetchCampaign,
  updateCampaign,
  createCampaignItemJson,
  updateCampaignItem,
  updateCampaignItemMultipart,
  deleteCampaignItem,
  reorderCampaignItems,
} from "@/lib/marketing/campaigns-api";

const STATUS_OPTIONS = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "active", label: "فعال" },
  { value: "archived", label: "بایگانی" },
];

export function CampaignEditor({ campaignId }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => fetchCampaign(campaignId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });

  const [meta, setMeta] = useState(null);
  const activeMeta = meta || (campaign ? { title: campaign.title, slug: campaign.slug, status: campaign.status } : null);

  const [productIds, setProductIds] = useState(null);
  const activeProductIds = productIds ?? (campaign?.productIds || []).map(String);

  const [editingItem, setEditingItem] = useState(null); // item object, or {} for new
  const [deleteTarget, setDeleteTarget] = useState(null);

  const saveMetaMutation = useMutation({
    mutationFn: () => updateCampaign(campaignId, activeMeta),
    onSuccess: () => {
      toast.success("ذخیره شد");
      invalidate();
    },
    onError: () => toast.error("ذخیره ناموفق بود"),
  });

  const saveProductsMutation = useMutation({
    mutationFn: () => updateCampaign(campaignId, { productIds: activeProductIds }),
    onSuccess: () => {
      toast.success("محصولات کمپین ذخیره شد");
      invalidate();
    },
    onError: () => toast.error("ذخیره ناموفق بود"),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => deleteCampaignItem(id),
    onSuccess: () => {
      toast.success("آیتم حذف شد");
      invalidate();
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const reorderMutation = useMutation({
    mutationFn: (updates) => reorderCampaignItems(updates),
    onSuccess: () => invalidate(),
  });

  const items = (campaign?.items || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  const moveItem = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    reorderMutation.mutate([
      { id: a._id, order: b.order ?? target },
      { id: b._id, order: a.order ?? index },
    ]);
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!campaign) return <p className="py-10 text-center text-sm text-[var(--text-faint)]">کمپین یافت نشد</p>;

  return (
    <div>
      <PageHeader
        title={campaign.title}
        subtitle={campaign.slug}
        actions={
          <Button variant="outline" onClick={() => router.push("/marketing/campaigns")}>
            <ArrowRight size={16} />
            بازگشت
          </Button>
        }
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>اطلاعات کمپین</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>عنوان</Label>
              <Input value={activeMeta.title} onChange={(e) => setMeta({ ...activeMeta, title: e.target.value })} />
            </div>
            <div>
              <Label>اسلاگ</Label>
              <Input dir="ltr" value={activeMeta.slug} onChange={(e) => setMeta({ ...activeMeta, slug: e.target.value })} />
            </div>
            <div>
              <Label>وضعیت</Label>
              <Select value={activeMeta.status} onChange={(e) => setMeta({ ...activeMeta, status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button loading={saveMetaMutation.isPending} onClick={() => saveMetaMutation.mutate()}>
              <Save size={16} />
              ذخیره
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>محصولات کمپین</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            محصولاتی که این کمپین شامل آن‌هاست — می‌توانید آیتم‌های اسلایدر پایین را روی همین لیست تنظیم کنید، یا برای تخفیف از «کمپین» به‌عنوان هدف استفاده کنید.
          </p>
          <ProductMultiPicker
            value={activeProductIds}
            onChange={(ids) => setProductIds(ids)}
            selectedProducts={campaign.productIds || []}
          />
          <div className="flex justify-end">
            <Button loading={saveProductsMutation.isPending} onClick={() => saveProductsMutation.mutate()}>
              <Save size={16} />
              ذخیره محصولات
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            آیتم‌های نمایشی
            <Button size="sm" onClick={() => setEditingItem({})}>
              <Plus size={15} />
              افزودن آیتم
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!items.length ? (
            <p className="py-8 text-center text-sm text-[var(--text-faint)]">آیتمی اضافه نشده</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {items.map((item, i) => (
                <li key={item._id} className="flex items-center gap-3 py-3">
                  <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
                    {item.type === "banner" ? (
                      item.settings?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.settings.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageOff size={16} className="text-[var(--text-faint)]" />
                      )
                    ) : (
                      <LayoutGrid size={16} className="text-[var(--text-faint)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text)]">
                      {item.type === "banner" ? "بنر تصویری" : "اسلایدر محصول"}
                    </p>
                    <p className="text-xs text-[var(--text-faint)]">
                      {CAMPAIGN_SLOTS.find((s) => s.value === item.slot)?.label || item.slot}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => moveItem(i, -1)}>
                      <ArrowUp size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={i === items.length - 1} onClick={() => moveItem(i, 1)}>
                      <ArrowDown size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item)}>
                      <Trash2 size={14} className="text-[var(--danger)]" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {editingItem && (
        <CampaignItemForm
          campaignId={campaignId}
          campaignProductIds={activeProductIds}
          item={editingItem._id ? editingItem : null}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
            invalidate();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف آیتم"
        description="این آیتم برای همیشه حذف می‌شود. آیا مطمئن هستید؟"
        loading={deleteItemMutation.isPending}
        onConfirm={() => deleteItemMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}

function CampaignItemForm({ campaignId, campaignProductIds, item, onClose, onSaved }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const isEdit = !!item;

  const [type, setType] = useState(item?.type || "banner");
  const [slot, setSlot] = useState(item?.slot || CAMPAIGN_SLOTS[0].value);
  const [preview, setPreview] = useState(item?.settings?.image || "");
  const [link, setLink] = useState(item?.settings?.link || "");
  const [alt, setAlt] = useState(item?.settings?.alt || "");
  const [fullWidth, setFullWidth] = useState(item?.settings?.fullWidth || false);
  const [sliderTitle, setSliderTitle] = useState(item?.settings?.title || "");
  const [limit, setLimit] = useState(item?.settings?.limit ?? 8);
  const [useCampaignProducts, setUseCampaignProducts] = useState(
    item ? item.settings?.filter?.by === "product" && !item.settings?.manualProductIds : true
  );
  const [manualProductIds, setManualProductIds] = useState(
    item?.settings?.filter?.by === "product" ? (item.settings.filter.value || []).map(String) : []
  );
  const [saving, setSaving] = useState(false);

  const onFilePicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  const buildSettings = () => {
    if (type === "banner") {
      return { image: item?.settings?.image || "", link, alt, fullWidth };
    }
    const productValue = useCampaignProducts ? campaignProductIds : manualProductIds;
    return {
      title: sliderTitle,
      limit: Number(limit) || 8,
      filter: { by: "product", value: productValue },
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = buildSettings();
      const file = fileRef.current?.files?.[0];

      let savedId = item?._id;
      if (!isEdit) {
        const created = await createCampaignItemJson({ campaignId, type, slot, order: 0, settings });
        savedId = created._id;
      } else {
        await updateCampaignItem(item._id, { type, slot, settings });
      }

      if (type === "banner" && file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("payload", JSON.stringify({ type, slot, settings }));
        await updateCampaignItemMultipart(savedId, fd);
      }

      toast.success(isEdit ? "آیتم بروزرسانی شد" : "آیتم اضافه شد");
      onSaved();
    } catch (e) {
      toast.error(e?.response?.data?.error || "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{isEdit ? "ویرایش آیتم" : "آیتم جدید"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>نوع</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)} disabled={isEdit}>
              <option value="banner">بنر تصویری</option>
              <option value="product-slider">اسلایدر محصول</option>
            </Select>
          </div>
          <div>
            <Label>محل نمایش (اسلات)</Label>
            <Select value={slot} onChange={(e) => setSlot(e.target.value)}>
              {CAMPAIGN_SLOTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>
        </div>

        {type === "banner" ? (
          <>
            <div>
              <Label>تصویر بنر</Label>
              {preview ? (
                <div className="relative h-28 w-full max-w-sm overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/60 to-transparent p-2">
                    <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>تعویض</Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-24 w-full max-w-sm flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--brand-500)] hover:text-[var(--brand-500)]"
                >
                  <ImagePlus size={18} />
                  <span className="text-xs">انتخاب تصویر</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>لینک مقصد</Label>
                <Input dir="ltr" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/landing/sale یا https://..." />
              </div>
              <div>
                <Label>متن جایگزین (Alt)</Label>
                <Input value={alt} onChange={(e) => setAlt(e.target.value)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--text)]">
              <input type="checkbox" checked={fullWidth} onChange={(e) => setFullWidth(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
              تمام‌عرض نمایش داده شود
            </label>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>عنوان اسلایدر (اختیاری)</Label>
                <Input value={sliderTitle} onChange={(e) => setSliderTitle(e.target.value)} />
              </div>
              <div>
                <Label>تعداد نمایش</Label>
                <Input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--text)]">
              <input type="checkbox" checked={useCampaignProducts} onChange={(e) => setUseCampaignProducts(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
              استفاده از «محصولات کمپین» (لیست بالا)
            </label>
            {!useCampaignProducts && (
              <div>
                <Label>انتخاب دستی محصولات این اسلایدر</Label>
                <ProductMultiPicker value={manualProductIds} onChange={setManualProductIds} />
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>انصراف</Button>
          <Button loading={saving} onClick={handleSave}>
            <Save size={16} />
            {isEdit ? "ذخیره تغییرات" : "افزودن"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
