"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { uploadBeautyImage } from "@/lib/beauty/api";

export function ImageField({ value, onChange }) {
  const inputRef = useRef(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadBeautyImage(file);
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
        <div className="relative h-32 w-full max-w-xs overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2">
            <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>تعویض</Button>
            <Button size="sm" variant="danger" onClick={() => onChange("")}><X size={13} /></Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-full max-w-xs flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--brand-500)] hover:text-[var(--brand-500)]"
        >
          <ImagePlus size={18} />
          <span className="text-xs">{uploading ? "در حال آپلود…" : "انتخاب تصویر"}</span>
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
