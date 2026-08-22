"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AttributesEditor({ attributes, onChange, disabled }) {
  const updateName = (i, name) => {
    const next = [...attributes];
    next[i] = { ...next[i], name };
    onChange(next);
  };

  const updateValue = (ai, vi, field, val) => {
    const next = [...attributes];
    const values = [...next[ai].values];
    values[vi] = { ...values[vi], [field]: val };
    next[ai] = { ...next[ai], values };
    onChange(next);
  };

  const addValue = (ai) => {
    const next = [...attributes];
    next[ai] = { ...next[ai], values: [...next[ai].values, { title: "", value: "" }] };
    onChange(next);
  };

  const removeValue = (ai, vi) => {
    const next = [...attributes];
    next[ai] = { ...next[ai], values: next[ai].values.filter((_, i) => i !== vi) };
    onChange(next);
  };

  const addAttribute = () => onChange([...attributes, { name: "", values: [{ title: "", value: "" }] }]);
  const removeAttribute = (i) => onChange(attributes.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {attributes.map((attr, ai) => (
        <div key={ai} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
          <div className="mb-2 flex items-center gap-2">
            <Input
              value={attr.name}
              onChange={(e) => updateName(ai, e.target.value)}
              placeholder="عنوان ویژگی - مثال: رنگ"
              disabled={disabled}
              className="flex-1"
            />
            <Button variant="ghost" size="icon" onClick={() => removeAttribute(ai)} disabled={disabled}>
              <Trash2 size={15} className="text-[var(--danger)]" />
            </Button>
          </div>
          <div className="space-y-2 ps-2">
            {attr.values.map((val, vi) => (
              <div key={vi} className="flex items-center gap-2">
                <Input
                  value={val.title}
                  onChange={(e) => updateValue(ai, vi, "title", e.target.value)}
                  placeholder="عنوان مقدار - مثال: قرمز"
                  disabled={disabled}
                  className="flex-1"
                />
                <Input
                  value={val.value}
                  onChange={(e) => updateValue(ai, vi, "value", e.target.value)}
                  placeholder="مقدار - مثال: red"
                  disabled={disabled}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => removeValue(ai, vi)} disabled={disabled}>
                  <Trash2 size={13} className="text-[var(--text-faint)]" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addValue(ai)} disabled={disabled}>
              <Plus size={13} />
              افزودن مقدار
            </Button>
          </div>
        </div>
      ))}
      <Button variant="secondary" onClick={addAttribute} disabled={disabled} className="w-full">
        <Plus size={15} />
        افزودن ویژگی ساختارمند
      </Button>
    </div>
  );
}
