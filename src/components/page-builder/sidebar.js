"use client";

import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageBuilderStore } from "@/lib/page-builder/store";
import { buildTypeDefIndex } from "@/lib/page-builder/field-utils";
import { Palette } from "./palette";
import { SectionInspector } from "./section-inspector";
import { ComponentInspector } from "./component-inspector";

export function Sidebar({ page, registry, templates, loadingTemplates, onAddSection, onDeleteSection, onAddComponent, onDeleteComponent, onInsertFromPalette, onInsertTemplate, invalidFieldKeysByComponent }) {
  const selectedSectionId = usePageBuilderStore((s) => s.ui.selectedSectionId);
  const selectedCompId = usePageBuilderStore((s) => s.ui.selectedComponentId);
  const selectSection = usePageBuilderStore((s) => s.selectSection);
  const moveSection = usePageBuilderStore((s) => s.moveSection);

  const [tab, setTab] = useState("palette");
  const [prevSelectedSectionId, setPrevSelectedSectionId] = useState(selectedSectionId);
  if (selectedSectionId !== prevSelectedSectionId) {
    setPrevSelectedSectionId(selectedSectionId);
    if (selectedSectionId) setTab("inspector");
  }

  const section = (page?.sections || []).find((x) => x.id === selectedSectionId) || null;
  const component = section?.components?.find((c) => c.id === selectedCompId) || null;
  const typeDefByType = useMemo(() => buildTypeDefIndex(registry), [registry]);

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-s border-[var(--border)] bg-[var(--surface)]">
      <div className="flex border-b border-[var(--border)]">
        {[
          ["palette", "افزودن"],
          ["inspector", "تنظیمات"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold transition-colors",
              tab === key ? "border-b-2 border-[var(--brand-500)] text-[var(--brand-600)]" : "text-[var(--text-muted)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "palette" ? (
        <Palette registry={registry} onInsert={onInsertFromPalette} templates={templates} onInsertTemplate={onInsertTemplate} loadingTemplates={loadingTemplates} />
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2.5 text-xs">
            <span className="font-semibold text-[var(--text)]">سکشن‌ها ({(page?.sections?.length || 0).toLocaleString("fa-IR")})</span>
            <button onClick={onAddSection} className="text-[var(--brand-600)]">
              + افزودن
            </button>
          </div>

          <div className="max-h-48 space-y-1 overflow-y-auto px-2">
            {(page?.sections || [])
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((s) => (
                <div
                  key={s.id}
                  onClick={() => selectSection(s.id)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5",
                    s.id === selectedSectionId ? "bg-[var(--brand-50)]" : "hover:bg-[var(--surface-muted)]"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-[var(--text)]">{s.title || "سکشن"}</p>
                    <p className="text-[10px] text-[var(--text-faint)]">{(s.components?.length || 0).toLocaleString("fa-IR")} کامپوننت</p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(s.id, -1);
                      }}
                      className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--surface)]"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(s.id, 1);
                      }}
                      className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--surface)]"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSection(s.id);
                      }}
                      className="rounded p-1 text-[var(--text-faint)] hover:text-[var(--danger)]"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            {!(page?.sections || []).length && <p className="px-1 py-2 text-xs text-[var(--text-faint)]">هنوز سکشنی ندارید</p>}
          </div>

          <div className="flex-1 border-t border-[var(--border)]">
            {selectedSectionId && !selectedCompId ? (
              <SectionInspector key={section?.id} page={page} section={section} registry={registry} onDeleteComponent={onDeleteComponent} onAddComponent={(type) => onAddComponent(section.id, type)} />
            ) : selectedSectionId && selectedCompId ? (
              <ComponentInspector
                key={component?.id}
                page={page}
                section={section}
                component={component}
                typeDef={typeDefByType.get(component?.type)}
                invalidFieldKeys={invalidFieldKeysByComponent?.[component?.id] || []}
              />
            ) : (
              <p className="p-4 text-center text-xs text-[var(--text-faint)]">یک سکشن را انتخاب کنید تا تنظیمات آن را ببینید</p>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
