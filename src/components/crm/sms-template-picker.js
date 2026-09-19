"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { createSmsTemplate, updateSmsTemplate } from "@/lib/crm/api";

// Shared purpose catalog + a small "pick from registered templates" select,
// reused by both the SMS templates tab and the campaign/automation editors
// so a bodyId is only ever typed once, in one place.
export const SMS_PURPOSES = [
  ["welcome", "خوش‌آمدگویی (اتوماسیون)"],
  ["abandoned_cart", "سبد رهاشده (اتوماسیون)"],
  ["winback_inactive", "بازگرداندن مشتری غیرفعال (اتوماسیون)"],
  ["birthday", "تبریک تولد (اتوماسیون)"],
  ["post_delivery_followup", "پیگیری بعد از تحویل (اتوماسیون)"],
  ["campaign", "کمپین‌های دستی"],
  ["other", "سایر"],
];

export const SMS_PURPOSE_LABELS = Object.fromEntries(SMS_PURPOSES);

// فرم ثبت/ویرایش قالب پیامک — هم از تب «قالب‌های پیامک» و هم به‌صورت
// درون‌خطی از خودِ SmsTemplateField (وقتی هنوز قالبی برای این بخش ثبت
// نشده) استفاده می‌شود تا کاربر مجبور نباشد میان‌کار فرمش را رها کند و
// دنبال تب مدیریت قالب‌ها بگردد.
export function SmsTemplateEditor({ open, onOpenChange, template, defaultPurpose, onSaved }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!template;
  const [name, setName] = useState(template?.name || "");
  const [bodyId, setBodyId] = useState(template?.bodyId || "");
  const [purpose, setPurpose] = useState(template?.purpose || defaultPurpose || SMS_PURPOSES[0][0]);
  const [variables, setVariables] = useState((template?.variables || []).join(","));
  const [description, setDescription] = useState(template?.description || "");
  const [confirmNoVars, setConfirmNoVars] = useState(false);

  const doSave = () => {
    const payload = {
      name,
      bodyId,
      purpose,
      description,
      variables: variables.split(",").map((s) => s.trim()).filter(Boolean),
    };
    saveMutation.mutate(payload);
  };

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEdit ? updateSmsTemplate(template._id, payload) : createSmsTemplate(payload)),
    onSuccess: (saved) => {
      toast.success(isEdit ? "قالب بروزرسانی شد" : "قالب ثبت شد");
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
      onOpenChange(false);
      setConfirmNoVars(false);
      onSaved?.(saved);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  const handleSaveClick = () => {
    const hasVars = variables.split(",").map((s) => s.trim()).filter(Boolean).length > 0;
    if (!hasVars && !confirmNoVars) {
      // اگر روی پنل ملی‌پیامک الگو حتی یک پارامتر متغیر دارد (مثلاً %0% برای نام
      // مشتری) و اینجا خالی بماند، هیچ مقداری برای آن جایگاه ارسال نمی‌شود و
      // مشتری پیامک را با پارامتر خامِ جایگزین‌نشده (مثلاً {0}) دریافت می‌کند —
      // همان باگی که این هشدار برایش اضافه شد.
      setConfirmNoVars(true);
      toast.error("این قالب هیچ متغیری ندارد. اگر متن الگو در ملی‌پیامک پارامتر دارد (مثلاً نام مشتری)، حتماً نام آن را اینجا وارد کنید — وگرنه آن پارامتر برای مشتری به‌صورت خام و جایگزین‌نشده ارسال می‌شود. برای ادامه بدون متغیر، دوباره «ذخیره» را بزنید.");
      return;
    }
    doSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{isEdit ? "ویرایش قالب پیامک" : "ثبت قالب پیامک جدید"}</DialogTitle>
        <DialogDescription>
          شناسه (bodyId) را از پنل ملی‌پیامک، بعد از تایید شدن الگوی متن پیامک، اینجا بچسبانید تا بقیه‌ی بخش‌های سیستم بتوانند آن را انتخاب کنند.
        </DialogDescription>

        <div className="mt-4 space-y-3">
          <div>
            <Label>عنوان قالب (برای خودتان)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً خوش‌آمدگویی مشتری جدید" />
          </div>
          <div>
            <Label>شناسه الگو (bodyId) از پنل ملی‌پیامک</Label>
            <Input value={bodyId} onChange={(e) => setBodyId(e.target.value)} placeholder="مثلاً 123456" dir="ltr" />
          </div>
          <div>
            <Label>این قالب برای کدام بخش است؟</Label>
            <Select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              {SMS_PURPOSES.map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>ترتیب متغیرهای الگو (با کاما — مثلاً name)</Label>
            <Input
              value={variables}
              onChange={(e) => {
                setVariables(e.target.value);
                setConfirmNoVars(false);
              }}
              placeholder="name"
              dir="ltr"
            />
            <p className="mt-1 text-xs text-[var(--text-faint)]">
              همان ترتیبی که موقع تایید الگو در پنل ملی‌پیامک برای %%1%%، %%2%%... تعریف کردید. اگر این فیلد را خالی
              بگذارید ولی متن الگو پارامتر داشته باشد، آن پارامتر برای مشتری به‌صورت خام (جایگزین‌نشده) ارسال می‌شود.
            </p>
          </div>
          <div>
            <Label>یادداشت / متن دقیق الگو (اختیاری)</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
            />
          </div>

          <Button
            className="w-full"
            disabled={!name.trim() || !bodyId.trim()}
            loading={saveMutation.isPending}
            onClick={handleSaveClick}
          >
            {confirmNoVars ? "ذخیره بدون متغیر (تایید)" : "ذخیره"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// A select that lists SMS templates matching `purpose` first (falls back to
// showing every template if none match yet) — choosing one fills the
// message's smsBodyId/smsVars from the catalog instead of free typing.
// وقتی هنوز قالبی ثبت نشده (یا قالب مناسب این بخش وجود ندارد)، دکمه‌ی
// «+ افزودن قالب» همین‌جا فرم ثبت قالب را باز می‌کند — کاربر لازم نیست
// از وسط ساخت کمپین/اتوماسیون بیرون برود و دنبال تب «قالب‌های پیامک»
// بگردد.
export function SmsTemplateField({ purpose, templates, smsBodyId, onSelect }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const all = templates ?? [];
  const matching = all.filter((t) => t.purpose === purpose);
  const options = matching.length ? matching : all;

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--warning-bg)] p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="block text-xs font-medium text-[var(--text-muted)]">قالب پیامک</label>
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--brand-600)] hover:underline"
        >
          <Plus size={12} />
          افزودن قالب
        </button>
      </div>
      <Select
        value={smsBodyId ?? ""}
        onChange={(e) => {
          const tpl = all.find((t) => t.bodyId === e.target.value);
          if (tpl) onSelect(tpl);
        }}
      >
        <option value="">— انتخاب قالب —</option>
        {options.map((t) => (
          <option key={t._id} value={t.bodyId}>
            {t.name}
            {!t.variables?.length ? " (⚠ بدون متغیر)" : ""}
          </option>
        ))}
      </Select>
      {!options.length && (
        <p className="mt-1.5 text-xs text-[var(--warning)]">
          هنوز قالبی ثبت نشده — با دکمه‌ی «افزودن قالب» بالا یکی بسازید، یا از تب «قالب‌های پیامک» مدیریتش کنید.
        </p>
      )}
      {!matching.length && all.length > 0 && (
        <p className="mt-1.5 text-xs text-[var(--text-faint)]">
          قالبی مخصوص این بخش ثبت نشده؛ فعلاً از بین همه‌ی قالب‌ها انتخاب کنید.
        </p>
      )}

      {editorOpen && (
        <SmsTemplateEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          defaultPurpose={purpose}
          onSaved={(saved) => {
            if (saved) onSelect(saved);
          }}
        />
      )}
    </div>
  );
}
