"use client";

import { useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { SortableList } from "../sortable-list";
import { SortableItem } from "../sortable-item";
import { FieldRenderer } from "../field-renderer";
import { buildDefaultPropsFromFields } from "@/lib/page-builder/field-utils";
import { uuidv4 } from "@/lib/page-builder/normalize";

export function RepeaterField({ fields, value, onChange, itemLabel }) {
  const items = Array.isArray(value) ? value : [];
  const missingIds = items.some((it) => !it || !it._rid);

  // Backfill a stable `_rid` once for items loaded fresh from the backend, so
  // keys stay stable across renders and inputs don't lose focus while typing.
  useEffect(() => {
    if (missingIds) onChange(items.map((it) => (it && it._rid ? it : { ...it, _rid: uuidv4() })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingIds]);

  const itemsWithIds = items.map((it, i) => (it && it._rid ? it : { ...it, _rid: `_pending_${i}` }));
  const itemIds = itemsWithIds.map((it) => it._rid);

  const addItem = () => onChange([...itemsWithIds, { _rid: uuidv4(), ...buildDefaultPropsFromFields(fields || []) }]);
  const removeItem = (rid) => onChange(itemsWithIds.filter((it) => it._rid !== rid));
  const updateItem = (rid, patch) => onChange(itemsWithIds.map((it) => (it._rid === rid ? { ...it, ...patch } : it)));
  const handleReorder = (orderedIds) => {
    const byId = new Map(itemsWithIds.map((it) => [it._rid, it]));
    onChange(orderedIds.map((id) => byId.get(id)).filter(Boolean));
  };

  return (
    <div className="space-y-2">
      <SortableList items={itemIds} onReorder={handleReorder}>
        {itemsWithIds.map((item, idx) => (
          <SortableItem key={item._rid} id={item._rid}>
            {({ dragHandleProps }) => (
              <div className="mb-2 rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <button type="button" {...dragHandleProps} className="cursor-grab text-[var(--text-faint)] active:cursor-grabbing">
                    <GripVertical size={14} />
                  </button>
                  <span className="flex-1 text-xs font-medium text-[var(--text-muted)]">
                    {itemLabel || "آیتم"} {(idx + 1).toLocaleString("fa-IR")}
                  </span>
                  <button type="button" onClick={() => removeItem(item._rid)} className="text-[var(--text-faint)] hover:text-[var(--danger)]">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="space-y-3">
                  {(fields || []).map((f) => (
                    <FieldRenderer key={f.key} field={f} value={item[f.key]} onChange={(v) => updateItem(item._rid, { [f.key]: v })} />
                  ))}
                </div>
              </div>
            )}
          </SortableItem>
        ))}
      </SortableList>

      <button
        type="button"
        onClick={addItem}
        className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] py-2 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--brand-500)] hover:text-[var(--brand-600)]"
      >
        <Plus size={13} />
        افزودن {itemLabel || "آیتم"}
      </button>
    </div>
  );
}
