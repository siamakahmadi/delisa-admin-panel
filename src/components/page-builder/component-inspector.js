"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageBuilderStore } from "@/lib/page-builder/store";
import { debouncedSaveComponent } from "@/lib/page-builder/autosave";
import { FieldRenderer } from "./field-renderer";
import { VisibilityEditor } from "./visibility-editor";
import { getPath, setPath, FIELD_GROUP_LABELS, FIELD_GROUP_ORDER } from "@/lib/page-builder/field-utils";

function groupFields(fields) {
  const groups = {};
  for (const f of fields || []) {
    const g = f.group || "content";
    if (!groups[g]) groups[g] = [];
    groups[g].push(f);
  }
  return FIELD_GROUP_ORDER.filter((g) => groups[g]).map((g) => [g, groups[g]]);
}

export function ComponentInspector({ page, section, component, typeDef, invalidFieldKeys = [] }) {
  const selectComponent = usePageBuilderStore((s) => s.selectComponent);
  const commitHistory = usePageBuilderStore((s) => s.commitHistory);
  const updateComponentLocally = usePageBuilderStore((s) => s.updateComponentLocally);

  const groups = useMemo(() => groupFields(typeDef?.fields), [typeDef]);
  const [collapsed, setCollapsed] = useState({});

  if (!component) return null;

  function commitProps(nextProps) {
    updateComponentLocally(section.id, component.id, { props: nextProps });
    if (page?.id) debouncedSaveComponent(page.id, section.id, component.id, { props: nextProps });
  }

  const handleFieldChange = (field, value) => commitProps(setPath(component.props || {}, field.key, value));

  const handleVisibilityChange = ({ isVisible, visibility }) => {
    updateComponentLocally(section.id, component.id, { isVisible, visibility });
    if (page?.id) debouncedSaveComponent(page.id, section.id, component.id, { isVisible, visibility });
    commitHistory();
  };

  return (
    <div onBlur={commitHistory}>
      <div className="flex items-center justify-between p-3">
        <h4 className="text-sm font-semibold text-[var(--text)]">{typeDef?.label || component.type}</h4>
        <button onClick={() => selectComponent(null)} className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)]">
          <ArrowRight size={13} />
          بازگشت
        </button>
      </div>
      {typeDef?.description && <p className="px-3 pb-2 text-xs text-[var(--text-faint)]">{typeDef.description}</p>}

      {!typeDef && <p className="px-3 text-xs text-[var(--text-faint)]">نوع «{component.type}» در رجیستری یافت نشد؛ امکان ویرایش فیلدها وجود ندارد.</p>}

      {groups.map(([groupKey, fields]) => {
        const isCollapsed = collapsed[groupKey];
        return (
          <div key={groupKey} className="border-b border-[var(--border)] last:border-0">
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [groupKey]: !c[groupKey] }))}
              className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-semibold text-[var(--text)]"
            >
              {FIELD_GROUP_LABELS[groupKey] || groupKey}
              <ChevronDown size={14} className={cn("text-[var(--text-faint)] transition-transform", isCollapsed && "-rotate-90")} />
            </button>
            {!isCollapsed && (
              <div className="space-y-3 px-3 pb-3">
                {fields.map((f) => (
                  <div key={f.key}>
                    <FieldRenderer field={f} value={getPath(component.props || {}, f.key)} onChange={(v) => handleFieldChange(f, v)} />
                    {invalidFieldKeys.includes(f.key) && <p className="mt-1 text-xs text-[var(--danger)]">این فیلد الزامی است.</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div>
        <button
          onClick={() => setCollapsed((c) => ({ ...c, visibility: !c.visibility }))}
          className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-semibold text-[var(--text)]"
        >
          نمایش
          <ChevronDown size={14} className={cn("text-[var(--text-faint)] transition-transform", collapsed.visibility && "-rotate-90")} />
        </button>
        {!collapsed.visibility && (
          <div className="px-3 pb-3">
            <VisibilityEditor isVisible={component.isVisible} visibility={component.visibility} onChange={handleVisibilityChange} showOrder />
          </div>
        )}
      </div>
    </div>
  );
}
