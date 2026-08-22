"use client";

import { useMemo } from "react";
import { ArrowUp, ArrowDown, Copy, Bookmark, Trash2, GripVertical, Boxes, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageBuilderStore } from "@/lib/page-builder/store";
import { buildTypeDefIndex } from "@/lib/page-builder/field-utils";
import { SortableList } from "./sortable-list";
import { SortableItem } from "./sortable-item";
import { ComponentPreview } from "./component-preview";
import { Button } from "@/components/ui/button";

function sectionOuterStyle(sec) {
  return {
    backgroundColor: sec.layout?.backgroundColor || undefined,
    backgroundImage: sec.layout?.backgroundImage ? `url(${sec.layout.backgroundImage})` : undefined,
    backgroundSize: sec.layout?.backgroundImage ? "cover" : undefined,
  };
}

// Applied to the wrapper that directly contains the reorderable component
// list — the same wrapper the real customer-site <Section> puts its layout
// styles on. Previously these were applied one level up, alongside the
// section's header/action bar, so display:flex/flexDirection etc. only ever
// rearranged "header bar" vs "component list" as two flex items and never
// reached the components themselves — the canvas looked identical no matter
// what layout the admin picked. See also the matching horizontal/grid drag
// strategy wiring in SortableList.
function componentsAreaStyle(sec) {
  const display = sec.layout?.display === "grid" ? "grid" : sec.layout?.display === "flex" ? "flex" : "block";
  return {
    padding: sec.layout?.padding || "0",
    display,
    gridTemplateColumns: sec.layout?.gridTemplateColumns || "1fr",
    gap: sec.layout?.gap || (sec.layout?.rowGap || sec.layout?.columnGap ? `${sec.layout.rowGap} ${sec.layout.columnGap}` : "12px"),
    flexDirection: sec.layout?.flexDirection || "row",
    flexWrap: display === "flex" ? "wrap" : undefined,
    alignItems: sec.layout?.alignItems || undefined,
    justifyContent: sec.layout?.justifyContent || undefined,
  };
}

function sortStrategyFor(sec) {
  if (sec.layout?.display === "grid") return "grid";
  if (sec.layout?.display === "flex" && sec.layout?.flexDirection === "column") return "vertical";
  if (sec.layout?.display === "flex") return "horizontal";
  return "vertical";
}

export function Canvas({ onAddSection, onReorderSections, onReorderComponents, onDuplicateSection, onDeleteSection, onSaveAsTemplate, registry, invalidComponentIds = [] }) {
  const page = usePageBuilderStore((s) => s.page);
  const selectSection = usePageBuilderStore((s) => s.selectSection);
  const selectComponent = usePageBuilderStore((s) => s.selectComponent);
  const selectedSectionId = usePageBuilderStore((s) => s.ui.selectedSectionId);
  const selectedComponentId = usePageBuilderStore((s) => s.ui.selectedComponentId);
  const moveSection = usePageBuilderStore((s) => s.moveSection);

  const typeDefByType = useMemo(() => buildTypeDefIndex(registry), [registry]);

  const sections = (page?.sections || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sectionIds = sections.map((s) => s.id);

  function moveWithKeyboard(sectionId, dir) {
    const i = sectionIds.indexOf(sectionId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sectionIds.length) return;
    const next = [...sectionIds];
    [next[i], next[j]] = [next[j], next[i]];
    moveSection(sectionId, dir);
    onReorderSections(next);
  }

  if (!sections.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-500)] to-[var(--accent-cyan)] text-white">
            <Boxes size={26} />
          </div>
          <h3 className="text-sm font-bold text-[var(--text)]">هنوز بخشی اضافه نشده</h3>
          <p className="max-w-xs text-xs text-[var(--text-muted)]">از پنل کناری یک بخش انتخاب کنید یا از دکمه زیر شروع کنید.</p>
          <Button onClick={onAddSection}>
            <Plus size={15} />
            افزودن سکشن جدید
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        <SortableList items={sectionIds} onReorder={onReorderSections}>
          {sections.map((sec) => {
            const componentIds = (sec.components || []).map((c) => c.id);
            return (
              <SortableItem key={sec.id} id={sec.id}>
                {({ dragHandleProps }) => (
                  <div
                    onClick={() => selectSection(sec.id)}
                    style={sectionOuterStyle(sec)}
                    className={cn(
                      "mb-4 cursor-pointer rounded-[var(--radius-lg)] border-2 border-transparent bg-[var(--surface)] transition-colors",
                      sec.id === selectedSectionId ? "border-[var(--brand-500)]" : "border-[var(--border)] hover:border-[var(--brand-300)]",
                      sec.isVisible === false && "opacity-50"
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2 rounded-t-[var(--radius-md)] bg-[var(--surface-muted)] px-2 py-1.5" {...dragHandleProps}>
                      <GripVertical size={13} className="cursor-grab text-[var(--text-faint)] active:cursor-grabbing" />
                      <span className="flex-1 truncate text-xs font-medium text-[var(--text)]">
                        {sec.title || "سکشن"}
                        {sec.isVisible === false && <span className="ms-1.5 text-[10px] text-[var(--text-faint)]">پنهان</span>}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <IconBtn title="بالا" onClick={(e) => { e.stopPropagation(); moveWithKeyboard(sec.id, -1); }}><ArrowUp size={13} /></IconBtn>
                        <IconBtn title="پایین" onClick={(e) => { e.stopPropagation(); moveWithKeyboard(sec.id, 1); }}><ArrowDown size={13} /></IconBtn>
                        <IconBtn title="تکثیر" onClick={(e) => { e.stopPropagation(); onDuplicateSection(sec.id); }}><Copy size={13} /></IconBtn>
                        <IconBtn title="ذخیره به‌عنوان بخش قابل‌استفاده مجدد" onClick={(e) => { e.stopPropagation(); onSaveAsTemplate(sec); }}><Bookmark size={13} /></IconBtn>
                        <IconBtn title="حذف" danger onClick={(e) => { e.stopPropagation(); onDeleteSection(sec.id); }}><Trash2 size={13} /></IconBtn>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()} className="px-3 pb-3">
                      {componentIds.length ? (
                        <div style={componentsAreaStyle(sec)}>
                          <SortableList
                            items={componentIds}
                            onReorder={(orderedIds) => onReorderComponents(sec.id, orderedIds)}
                            strategy={sortStrategyFor(sec)}
                          >
                          {(sec.components || []).map((comp) => {
                            const def = typeDefByType.get(comp.type);
                            const isSelected = comp.id === selectedComponentId && sec.id === selectedSectionId;
                            const isInvalid = invalidComponentIds.includes(comp.id);
                            const isLaidOut = sec.layout?.display === "flex" || sec.layout?.display === "grid";
                            return (
                              <SortableItem key={comp.id} id={comp.id}>
                                {({ dragHandleProps: compDragProps }) => (
                                  <div
                                    onClick={() => {
                                      selectSection(sec.id);
                                      selectComponent(comp.id);
                                    }}
                                    style={isLaidOut && sec.layout?.display === "flex" ? { flex: "1 1 200px", minWidth: 0 } : undefined}
                                    className={cn(
                                      "rounded-[var(--radius-md)] border p-2",
                                      !isLaidOut && "mb-2 last:mb-0",
                                      isSelected ? "border-[var(--brand-500)] ring-1 ring-[var(--brand-100)]" : "border-[var(--border)]",
                                      comp.isVisible === false && "opacity-50",
                                      isInvalid && "border-[var(--danger)]"
                                    )}
                                  >
                                    <div className="mb-1.5 flex items-center gap-1.5">
                                      <button type="button" {...compDragProps} onClick={(e) => e.stopPropagation()} className="cursor-grab text-[var(--text-faint)] active:cursor-grabbing">
                                        <GripVertical size={12} />
                                      </button>
                                      <span className="text-[11px] font-medium text-[var(--text-muted)]">{def?.label || comp.type}</span>
                                      {comp.isVisible === false && <span className="text-[10px] text-[var(--text-faint)]">پنهان</span>}
                                      {isInvalid && <span className="text-[10px] text-[var(--danger)]">ناقص</span>}
                                    </div>
                                    <ComponentPreview type={comp.type} typeDef={def} props={comp.props} />
                                  </div>
                                )}
                              </SortableItem>
                            );
                          })}
                          </SortableList>
                        </div>
                      ) : (
                        <p className="rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] p-3 text-center text-[11px] text-[var(--text-faint)]">
                          هنوز کامپوننتی اضافه نشده — از سایدبار انتخاب کنید
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </SortableItem>
            );
          })}
        </SortableList>

        <button
          onClick={onAddSection}
          className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] py-3 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--brand-500)] hover:text-[var(--brand-600)]"
        >
          <Plus size={14} />
          افزودن سکشن جدید
        </button>
      </div>
    </div>
  );
}

function IconBtn({ children, title, danger, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn("rounded-[var(--radius-sm)] p-1 text-[var(--text-faint)] hover:bg-[var(--surface)]", danger && "hover:text-[var(--danger)]")}
    >
      {children}
    </button>
  );
}
