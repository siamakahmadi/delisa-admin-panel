"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { PickerField } from "@/components/page-builder/fields/picker-field";
import {
  fetchBeautyProfileQuestions,
  createBeautyProfileQuestion,
  updateBeautyProfileQuestion,
  deleteBeautyProfileQuestion,
} from "@/lib/beauty-profile/api";

const INPUT_TYPES = [
  { value: "single", label: "تک‌انتخابی" },
  { value: "multi", label: "چندانتخابی" },
  { value: "text", label: "متنی آزاد" },
  { value: "productPicker", label: "انتخاب محصول" },
  { value: "brandPicker", label: "انتخاب برند" },
  { value: "scale", label: "طیفی (Scale)" },
];

const OPTIONS_INPUT_TYPES = ["single", "multi", "scale"];

function slugsOf(tagArray) {
  return (tagArray || []).map((t) => (typeof t === "string" ? t : t?.slug)).filter(Boolean);
}

export default function BeautyProfileQuestionsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["beauty-profile-questions"], queryFn: fetchBeautyProfileQuestions });
  const questions = data ?? [];
  const active = editing || creating;

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing ? updateBeautyProfileQuestion(editing._id, payload) : createBeautyProfileQuestion(payload),
    onSuccess: () => {
      toast.success(editing ? "سؤال بروزرسانی شد" : "سؤال ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["beauty-profile-questions"] });
      setEditing(null);
      setCreating(false);
    },
    onError: (err) => toast.error(err?.response?.data?.error || "ذخیره ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBeautyProfileQuestion(id),
    onSuccess: () => {
      toast.success("حذف شد");
      queryClient.invalidateQueries({ queryKey: ["beauty-profile-questions"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = [
    { key: "stepGroup", header: "مرحله", render: (row) => <Badge variant="neutral" size="sm">{row.stepGroup}</Badge> },
    { key: "title", header: "عنوان سؤال", render: (row) => <span className="font-medium">{row.title}</span> },
    { key: "key", header: "key", render: (row) => <span dir="ltr" className="text-xs text-[var(--text-faint)]">{row.key}</span> },
    { key: "inputType", header: "نوع پاسخ", render: (row) => INPUT_TYPES.find((t) => t.value === row.inputType)?.label || row.inputType },
    { key: "order", header: "ترتیب", render: (row) => row.order ?? 0 },
    {
      key: "isActive",
      header: "وضعیت",
      render: (row) =>
        row.isActive ? (
          <Badge variant="success" size="sm" dot>فعال</Badge>
        ) : (
          <Badge variant="neutral" size="sm" dot>غیرفعال</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setCreating(false); setEditing(row); }}>
            <Pencil size={15} />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
            <Trash2 size={15} className="text-[var(--danger)]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="سوالات Beauty Profile"
        subtitle="سوالات ویزارد Beauty Profile را تعریف، ویرایش، فعال/غیرفعال یا حذف کن — هر گزینه می‌تواند به تگ‌های محصول/بلاگ وصل شود تا موتور پیشنهاد از آن استفاده کند."
      />

      {!active ? (
        <>
          <div className="mb-4 flex justify-end">
            <Button onClick={() => { setEditing(null); setCreating(true); }}>
              <Plus size={16} />
              افزودن سؤال
            </Button>
          </div>
          <DataTable
            columns={columns}
            data={questions}
            isLoading={isLoading}
            emptyMessage="سؤالی یافت نشد — از دکمه‌ی بالا شروع کن یا اسکریپت seed اولیه را اجرا کن."
            onRowClick={(row) => { setCreating(false); setEditing(row); }}
          />
        </>
      ) : (
        <QuestionForm
          key={editing?._id ?? "new"}
          editing={editing}
          isPending={saveMutation.isPending}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSubmit={(payload) => saveMutation.mutate(payload)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف سؤال"
        description="این سؤال برای همیشه حذف می‌شود و از پاسخ‌های قبلی مشتریان هم دیگر در فرم ویرایش قابل مشاهده نخواهد بود. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}

function emptyOption() {
  return {
    value: "",
    label: "",
    weight: 1,
    isPrimaryConcernCandidate: true,
    matchReasonText: "",
    productTagSlugs: [],
    blogTagSlugs: [],
    blogCategorySlugs: [],
  };
}

function QuestionForm({ editing, isPending, onCancel, onSubmit }) {
  const toast = useToast();
  const [key, setKey] = useState(editing?.key || "");
  const [stepGroup, setStepGroup] = useState(editing?.stepGroup || "");
  const [order, setOrder] = useState(editing?.order ?? 0);
  const [title, setTitle] = useState(editing?.title || "");
  const [helpText, setHelpText] = useState(editing?.helpText || "");
  const [inputType, setInputType] = useState(editing?.inputType || "single");
  const [maxSelect, setMaxSelect] = useState(editing?.maxSelect ?? 0);
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [appliesToProducts, setAppliesToProducts] = useState(!editing?.appliesTo || editing.appliesTo.includes("products"));
  const [appliesToBlog, setAppliesToBlog] = useState(!editing?.appliesTo || editing.appliesTo.includes("blog"));
  const [showIfKey, setShowIfKey] = useState(editing?.showIf?.questionKey || "");
  const [showIfValue, setShowIfValue] = useState(editing?.showIf?.includesValue || "");
  const [options, setOptions] = useState(
    (editing?.options || []).map((opt) => ({
      value: opt.value,
      label: opt.label,
      weight: opt.weight ?? 1,
      isPrimaryConcernCandidate: opt.isPrimaryConcernCandidate ?? true,
      matchReasonText: opt.matchReasonText || "",
      productTagSlugs: slugsOf(opt.productTagIds),
      blogTagSlugs: slugsOf(opt.blogTagIds),
      blogCategorySlugs: slugsOf(opt.blogCategoryIds),
    }))
  );

  const showsOptions = OPTIONS_INPUT_TYPES.includes(inputType);

  const patchOption = (index, fields) =>
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, ...fields } : o)));
  const removeOption = (index) => setOptions((prev) => prev.filter((_, i) => i !== index));
  const addOption = () => setOptions((prev) => [...prev, emptyOption()]);

  const handleSubmit = () => {
    if (!editing && !key.trim()) return toast.error("key الزامی است (مثلاً skinType)");
    if (!stepGroup.trim()) return toast.error("مرحله (stepGroup) الزامی است");
    if (!title.trim()) return toast.error("عنوان سؤال الزامی است");
    if (showsOptions && options.some((o) => !o.value.trim() || !o.label.trim())) {
      return toast.error("همه‌ی گزینه‌ها باید value و label داشته باشند");
    }

    const appliesTo = [];
    if (appliesToProducts) appliesTo.push("products");
    if (appliesToBlog) appliesTo.push("blog");

    onSubmit({
      ...(editing ? {} : { key: key.trim() }),
      stepGroup: stepGroup.trim(),
      order: Number(order) || 0,
      title: title.trim(),
      helpText: helpText.trim(),
      inputType,
      maxSelect: Number(maxSelect) || 0,
      isActive,
      appliesTo: appliesTo.length ? appliesTo : ["products", "blog"],
      showIf: showIfKey.trim() ? { questionKey: showIfKey.trim(), includesValue: showIfValue.trim() } : null,
      options: showsOptions ? options : [],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? "ویرایش سؤال" : "سؤال جدید"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>key (پایدار، انگلیسی)</Label>
            <Input dir="ltr" value={key} onChange={(e) => setKey(e.target.value)} disabled={!!editing} placeholder="مثلاً skinType" />
          </div>
          <div>
            <Label>مرحله (stepGroup)</Label>
            <Input dir="ltr" value={stepGroup} onChange={(e) => setStepGroup(e.target.value)} placeholder="مثلاً skinType" />
          </div>
        </div>

        <div>
          <Label>عنوان سؤال</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: نوع پوستت رو می‌دونی؟" />
        </div>

        <div>
          <Label>توضیح کمکی (اختیاری)</Label>
          <Input value={helpText} onChange={(e) => setHelpText(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>نوع پاسخ</Label>
            <Select value={inputType} onChange={(e) => setInputType(e.target.value)}>
              {INPUT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>
          {inputType === "multi" && (
            <div>
              <Label>حداکثر انتخاب (۰ = نامحدود)</Label>
              <Input type="number" value={maxSelect} onChange={(e) => setMaxSelect(e.target.value)} />
            </div>
          )}
          <div>
            <Label>ترتیب نمایش در این مرحله</Label>
            <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>نمایش شرطی (اختیاری)</Label>
            <div className="flex gap-2">
              <Input dir="ltr" value={showIfKey} onChange={(e) => setShowIfKey(e.target.value)} placeholder="key سؤال دیگر" />
              <Input dir="ltr" value={showIfValue} onChange={(e) => setShowIfValue(e.target.value)} placeholder="مقدار لازم" />
            </div>
            <p className="mt-1 text-xs text-[var(--text-faint)]">فقط وقتی نمایش داده می‌شود که پاسخ سؤال بالا شامل این مقدار باشد. خالی = همیشه نمایش.</p>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 text-sm text-[var(--text)]">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
              فعال (در ویزارد مشتری نمایش داده شود)
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                <input type="checkbox" checked={appliesToProducts} onChange={(e) => setAppliesToProducts(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
                در پیشنهاد محصول اثر دارد
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                <input type="checkbox" checked={appliesToBlog} onChange={(e) => setAppliesToBlog(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
                در پیشنهاد بلاگ اثر دارد
              </label>
            </div>
          </div>
        </div>

        {showsOptions && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>گزینه‌ها</Label>
              <Button variant="outline" size="sm" onClick={addOption}>
                <Plus size={14} />
                افزودن گزینه
              </Button>
            </div>
            <div className="space-y-3">
              {options.map((opt, index) => (
                <div key={index} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                  <div className="mb-2 flex items-start gap-2">
                    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
                      <Input dir="ltr" placeholder="value (مثلاً oily)" value={opt.value} onChange={(e) => patchOption(index, { value: e.target.value })} />
                      <Input placeholder="label (مثلاً چرب)" value={opt.label} onChange={(e) => patchOption(index, { label: e.target.value })} />
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="وزن"
                        value={opt.weight}
                        onChange={(e) => patchOption(index, { weight: Number(e.target.value) })}
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeOption(index)}>
                      <X size={15} className="text-[var(--danger)]" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div>
                      <Label className="text-xs">تگ‌های محصول</Label>
                      <PickerField kind="tag" value={opt.productTagSlugs} onChange={(v) => patchOption(index, { productTagSlugs: v })} />
                    </div>
                    <div>
                      <Label className="text-xs">تگ‌های بلاگ</Label>
                      <PickerField kind="blogTag" value={opt.blogTagSlugs} onChange={(v) => patchOption(index, { blogTagSlugs: v })} />
                    </div>
                    <div>
                      <Label className="text-xs">دسته‌بندی‌های بلاگ</Label>
                      <PickerField kind="blogCategory" value={opt.blogCategorySlugs} onChange={(v) => patchOption(index, { blogCategorySlugs: v })} />
                    </div>
                  </div>

                  <div className="mt-2">
                    <Label className="text-xs">متن «چرا این محصول برای من؟» (اختیاری)</Label>
                    <Input
                      value={opt.matchReasonText}
                      onChange={(e) => patchOption(index, { matchReasonText: e.target.value })}
                      placeholder="مثلاً: مناسب پوست مختلط — خالی = از label بالا استفاده می‌شود"
                    />
                  </div>

                  {opt.weight < 0 && (
                    <p className="mt-1.5 text-xs text-[var(--warning,#b45309)]">
                      وزن منفی یعنی این گزینه محصول‌های دارای این تگ را در پیشنهادها پایین‌تر می‌برد (مثلاً «ترکیب ناخواسته»).
                    </p>
                  )}
                </div>
              ))}
              {!options.length && (
                <p className="text-sm text-[var(--text-faint)]">هنوز گزینه‌ای اضافه نشده.</p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>انصراف</Button>
          <Button loading={isPending} onClick={handleSubmit}>
            <Save size={16} />
            {editing ? "ذخیره تغییرات" : "ایجاد"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
