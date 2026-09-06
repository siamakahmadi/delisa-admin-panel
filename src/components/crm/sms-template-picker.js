"use client";

import { Select } from "@/components/ui/select";

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

// A select that lists SMS templates matching `purpose` first (falls back to
// showing every template if none match yet) — choosing one fills the
// message's smsBodyId/smsVars from the catalog instead of free typing.
export function SmsTemplateField({ purpose, templates, smsBodyId, onSelect }) {
  const all = templates ?? [];
  const matching = all.filter((t) => t.purpose === purpose);
  const options = matching.length ? matching : all;

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--warning-bg)] p-3">
      <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">قالب پیامک</label>
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
          </option>
        ))}
      </Select>
      {!options.length && (
        <p className="mt-1.5 text-xs text-[var(--warning)]">
          هنوز قالبی ثبت نشده — از تب «قالب‌های پیامک» یکی اضافه کنید.
        </p>
      )}
      {!matching.length && all.length > 0 && (
        <p className="mt-1.5 text-xs text-[var(--text-faint)]">
          قالبی مخصوص این بخش ثبت نشده؛ فعلاً از بین همه‌ی قالب‌ها انتخاب کنید.
        </p>
      )}
    </div>
  );
}
