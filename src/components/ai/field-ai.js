"use client";

import { useState } from "react";
import { AiAssistDialog, AiSparkButton } from "./ai-assist-dialog";

/**
 * دکمه‌ی هوش مصنوعی کنار یک فیلد متنی ساده (input/textarea).
 *  tasks: قالب‌های مجاز؛ اگر فقط یکی باشد مستقیم باز می‌شود.
 *  source: متن ورودی مدل (پیش‌فرض: خود مقدار فیلد؛ مثلاً برای خلاصه/متا، متن مقاله).
 *  onChange(text): مقدار جدید فیلد.
 */
export function FieldAi({ tasks, value, source, onChange, context, label, allowAppend = false }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AiSparkButton onClick={() => setOpen(true)} label={label} />
      <AiAssistDialog
        open={open}
        onOpenChange={setOpen}
        plain
        allowedTasks={tasks}
        canAppend={allowAppend}
        fullText={source ?? value ?? ""}
        context={context}
        onApply={({ mode, text }) => {
          if (!text) return;
          onChange(mode === "append" && value ? `${value}\n\n${text}` : text);
        }}
      />
    </>
  );
}
