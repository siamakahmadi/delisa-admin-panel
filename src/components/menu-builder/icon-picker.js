"use client";

import { useRef, useState } from "react";
import { Minus, Smile, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MENU_ICON_KEYS, ResolvedIcon, isUploadedIcon } from "@/lib/menu-builder/icons";
import { uploadMenuImage } from "@/lib/menu-builder/api";

export function IconPicker({ value, onChange }) {
  const [customOpen, setCustomOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const isEmojiValue = value && !MENU_ICON_KEYS.includes(value) && !isUploadedIcon(value);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadMenuImage(file);
      if (!res?.url) throw new Error("سرور آدرس تصویر را برنگرداند");
      onChange(res.url);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "خطا در آپلود آیکون");
    } finally {
      setUploading(false);
    }
  }

  const btnClass = (active) =>
    cn(
      "flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border text-[var(--text-muted)] hover:bg-[var(--surface-muted)]",
      active ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]" : "border-[var(--border)]"
    );

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className={btnClass(!value)} onClick={() => onChange("")} title="بدون آیکون">
          <Minus size={15} />
        </button>
        {MENU_ICON_KEYS.map((key) => (
          <button key={key} type="button" className={btnClass(value === key)} onClick={() => onChange(key)} title={key}>
            <ResolvedIcon icon={key} size={16} />
          </button>
        ))}
        <button type="button" className={btnClass(isEmojiValue)} onClick={() => setCustomOpen((v) => !v)} title="ایموجی دلخواه">
          <Smile size={16} />
        </button>
        <button type="button" className={btnClass(isUploadedIcon(value))} onClick={() => fileRef.current?.click()} title="آپلود آیکون اختصاصی" disabled={uploading}>
          {isUploadedIcon(value) ? <ResolvedIcon icon={value} size={16} /> : uploading ? "…" : <Upload size={15} />}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) handleFile(f);
        }}
      />
      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}

      {(customOpen || isEmojiValue) && (
        <Input className="mt-1.5" placeholder="یک ایموجی وارد کنید، مثلاً 🔥" value={isEmojiValue ? value : ""} maxLength={4} onChange={(e) => onChange(e.target.value)} />
      )}
      {isUploadedIcon(value) && (
        <button type="button" onClick={() => onChange("")} className="mt-1.5 text-xs text-[var(--text-faint)] hover:text-[var(--danger)]">
          حذف آیکون آپلودشده
        </button>
      )}
    </div>
  );
}
