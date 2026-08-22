"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Plus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildTree,
  flattenTree,
  removeChildrenOf,
  getProjection,
  arrayMove,
  treeToStorageItems,
  idOf,
  getMaxDepth,
  INDENTATION_WIDTH,
  MAX_UI_DEPTH,
} from "@/lib/tree-dnd";

function toFlatShape(categories) {
  return categories.map((c) => ({ ...c, parentId: c.parent?._id ?? c.parent ?? null }));
}

function Row({ node, childCount, indentPx, isOverlay, isSelected, isCollapsed, dragHandleProps, onToggleCollapse, onSelect, onAddChild }) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-[var(--radius-sm)] py-1.5 pe-2",
        isSelected && "bg-[var(--brand-50)]",
        node.isActive === false && "opacity-50",
        isOverlay ? "rounded-[var(--radius-md)] bg-[var(--surface)] shadow-[var(--shadow-lg)]" : "hover:bg-[var(--surface-muted)]"
      )}
      style={{ paddingInlineStart: indentPx }}
    >
      <button type="button" className="shrink-0 cursor-grab text-[var(--text-faint)] active:cursor-grabbing" {...(dragHandleProps || {})}>
        <GripVertical size={13} />
      </button>

      {childCount ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.(node._id);
          }}
          className="shrink-0 text-[var(--text-faint)]"
        >
          <ChevronDown size={13} className={cn("transition-transform", isCollapsed && "-rotate-90")} />
        </button>
      ) : (
        <span className="w-[13px] shrink-0" />
      )}

      <button
        type="button"
        onClick={() => !isOverlay && onSelect?.(node._id)}
        className={cn("flex-1 truncate text-start text-sm", isSelected ? "font-semibold text-[var(--brand-700)]" : "text-[var(--text)]")}
      >
        {node.name}
        {childCount ? <span className="ms-1.5 text-[10px] text-[var(--text-faint)]">({childCount})</span> : null}
      </button>

      {!isOverlay && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddChild?.(node._id);
          }}
          className="shrink-0 text-[var(--text-faint)] opacity-0 hover:text-[var(--brand-600)] group-hover:opacity-100"
          title="افزودن زیردسته"
        >
          <Plus size={13} />
        </button>
      )}
    </div>
  );
}

function SortableRow({ node, depth, childCount, ...rest }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: node._id });
  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <Row node={node} depth={depth} childCount={childCount} indentPx={depth * INDENTATION_WIDTH} dragHandleProps={{ ref: setActivatorNodeRef, ...attributes, ...listeners }} {...rest} />
    </div>
  );
}

export function CategoryTreePanel({ categories, selectedId, onSelect, onAddChild, onAddRoot, onReorder }) {
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [offsetX, setOffsetX] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const flatShape = useMemo(() => toFlatShape(categories), [categories]);
  const fullFlattened = useMemo(() => flattenTree(buildTree(flatShape)), [flatShape]);
  const visibleFlattened = useMemo(() => removeChildrenOf(fullFlattened, collapsedIds), [fullFlattened, collapsedIds]);

  const projected = activeId && overId ? getProjection(visibleFlattened, activeId, overId, offsetX, { rtl: true, maxDepth: MAX_UI_DEPTH }) : null;
  const activeItem = activeId ? fullFlattened.find((i) => idOf(i._id) === activeId) : null;

  function childCountFor(id) {
    return fullFlattened.filter((i) => idOf(i.parentId) === idOf(id)).length;
  }

  function handleDragEnd({ active, over }) {
    const finalProjected = projected;
    setActiveId(null);
    setOverId(null);
    setOffsetX(0);
    if (!over || !finalProjected) return;
    if (idOf(active.id) === idOf(over.id) && finalProjected.parentId === idOf(activeItem?.parentId)) return;

    const cloned = fullFlattened.map((i) => ({ ...i }));
    const activeIndex = cloned.findIndex((i) => idOf(i._id) === idOf(active.id));
    const overIndex = cloned.findIndex((i) => idOf(i._id) === idOf(over.id));
    if (activeIndex < 0 || overIndex < 0) return;

    cloned[activeIndex] = { ...cloned[activeIndex], parentId: finalProjected.parentId };
    const reordered = arrayMove(cloned, activeIndex, overIndex);
    const newTree = buildTree(reordered);
    const newFlatCheck = flattenTree(newTree);
    if (getMaxDepth(newFlatCheck) > MAX_UI_DEPTH) return;

    onReorder(treeToStorageItems(newTree));
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-[var(--text-muted)]">درخت دسته‌بندی‌ها</span>
        <button type="button" onClick={onAddRoot} className="flex items-center gap-1 text-xs font-medium text-[var(--brand-600)]">
          <Plus size={13} />
          دسته اصلی
        </button>
      </div>

      {!fullFlattened.length ? (
        <p className="py-6 text-center text-xs text-[var(--text-faint)]">دسته‌بندی‌ای ثبت نشده است.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => {
            setActiveId(idOf(active.id));
            setOverId(idOf(active.id));
            setOffsetX(0);
          }}
          onDragMove={({ delta, over }) => {
            setOffsetX(delta.x || 0);
            if (over) setOverId(idOf(over.id));
          }}
          onDragOver={({ over }) => setOverId(over ? idOf(over.id) : null)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveId(null);
            setOverId(null);
            setOffsetX(0);
          }}
        >
          <SortableContext items={visibleFlattened.map((i) => idOf(i._id))} strategy={verticalListSortingStrategy}>
            <div className="max-h-[520px] overflow-y-auto" dir="rtl">
              {visibleFlattened.map((node) => {
                const isOverRow = overId === idOf(node._id) && activeId && activeId !== idOf(node._id);
                return (
                  <div key={node._id}>
                    {isOverRow && projected && (
                      <div
                        className="my-0.5 h-0.5 rounded-full bg-[var(--brand-500)]"
                        style={{ marginInlineStart: projected.depth * INDENTATION_WIDTH }}
                      />
                    )}
                    <SortableRow
                      node={node}
                      depth={activeId === idOf(node._id) && projected ? projected.depth : node.depth}
                      childCount={childCountFor(node._id)}
                      isCollapsed={collapsedIds.has(idOf(node._id))}
                      isSelected={selectedId === idOf(node._id)}
                      onToggleCollapse={(id) =>
                        setCollapsedIds((prev) => {
                          const next = new Set(prev);
                          next.has(id) ? next.delete(id) : next.add(id);
                          return next;
                        })
                      }
                      onSelect={onSelect}
                      onAddChild={onAddChild}
                    />
                  </div>
                );
              })}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeItem ? <Row node={activeItem} childCount={childCountFor(activeItem._id)} indentPx={0} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
