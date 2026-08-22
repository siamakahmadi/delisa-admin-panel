"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SaveTemplateModal({ open, onOpenChange, onSave, saving, error }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>ذخیره به‌عنوان بخش قابل‌استفاده مجدد</DialogTitle>
        <DialogDescription>این بخش در کتابخانه‌ی قالب‌ها ذخیره می‌شود و بعداً در هر صفحه‌ای قابل درج است.</DialogDescription>
        {open && <TemplateForm onSave={onSave} saving={saving} error={error} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function TemplateForm({ onSave, saving, error, onClose }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSave({ name: name.trim(), description: description.trim() });
      }}
    >
      <div>
        <Label>نام</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
      </div>
      <div>
        <Label>توضیحات (اختیاری)</Label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
        />
      </div>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          انصراف
        </Button>
        <Button type="submit" disabled={!name.trim()} loading={saving}>
          ذخیره
        </Button>
      </div>
    </form>
  );
}
