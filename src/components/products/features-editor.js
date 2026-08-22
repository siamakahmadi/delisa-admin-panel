"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function FeaturesEditor({ features, onChange, disabled }) {
  const update = (i, field, val) => {
    const next = [...features];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };
  const remove = (i) => onChange(features.filter((_, idx) => idx !== i));
  const add = () => onChange([...features, { title: "", value: "" }]);

  return (
    <div className="space-y-2">
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={f.title} onChange={(e) => update(i, "title", e.target.value)} placeholder="عنوان" disabled={disabled} className="flex-1" />
          <Input value={f.value} onChange={(e) => update(i, "value", e.target.value)} placeholder="مقدار" disabled={disabled} className="flex-1" />
          <Button variant="ghost" size="icon" onClick={() => remove(i)} disabled={disabled}>
            <Trash2 size={15} className="text-[var(--danger)]" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} disabled={disabled}>
        <Plus size={13} />
        افزودن ویژگی جدید
      </Button>
    </div>
  );
}
