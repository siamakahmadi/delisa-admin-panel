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
import { ChevronDown, GripVertical, Plus, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResolvedIcon } from "@/lib/menu-builder/icons";
import { buildTree, flattenTree, removeChildrenOf, getProjection, arrayMove, treeToStorageItems, idOf, getMaxDepth, countDescendants, INDENTATION_WIDTH, MAX_UI_DEPTH } from "@/lib/tree-dnd";

const TYPE_LABELS = { custom: "لینک دلخواه", category: "دسته‌بندی", brand: "برند", product: "محصول", tag: "برچسب", type: "نوع محصول", page: "صفحه", heading: "سرتیتر" };

// tree-dnd.js's shared algorithm is keyed on `parentId`; menu items are
// natively stored with `parentItemId`. Rename at the boundary only.
function toParentIdShape(items) {
  return items.map(({ parentItemId, ...rest }) => ({ ...rest, parentId: parentItemId ?? null }));
}
function toParentItemIdShape(items) {
  return items.map(({ parentId, ...rest }) => ({ ...rest, parentItemId: parentId ?? null }));
}

export function itemDisplayTitle(item) {
  if (item.title?.trim()) return item.title;
  if (item.resolvedTitle?.trim()) return item.resolvedTitle;
  if (item.type === "custom") return item.url || "لینک بدون عنوان";
  if (item.type === "heading") return "سرتیتر بدون متن";
  return item.refId ? "در حال بارگذاری…" : "بدون عنوان — یک مورد انتخاب کنید";
}

function TreeRow({ item, childCount, indentPx, dragHandleProps, isOverlay, isSelected, isCollapsed, onToggleCollapse, onSelect, onToggleEnabled, onAddChild, onDuplicate, onDelete }) {
  const needsRef = ["category", "brand", "product", "tag", "type", "page"].includes(item.type) && !item.refId;

  return (
    <div
      onClick={() => !isOverlay && onSelect?.(item._id)}
      style={{ paddingInlineStart: indentPx }}
      className={cn(
        "group flex items-center gap-1.5 rounded-[var(--radius-sm)] py-1.5 pe-2",
        isSelected && "bg-[var(--brand-50)]",
        item.enabled === false && "opacity-50",
        needsRef && "ring-1 ring-inset ring-[var(--danger)]",
        isOverlay ? "rounded-[var(--radius-md)] bg-[var(--surface)] shadow-[var(--shadow-lg)]" : "hover:bg-[var(--surface-muted)]"
      )}
    >
      <button type="button" className="shrink-0 cursor-grab text-[var(--text-faint)] active:cursor-grabbing" {...(dragHandleProps || {})}>
        <GripVertical size={13} />
      </button>

      {childCount ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.(item._id);
          }}
          className="shrink-0 text-[var(--text-faint)]"
        >
          <ChevronDown size={13} className={cn("transition-transform", isCollapsed && "-rotate-90")} />
        </button>
      ) : (
        <span className="w-[13px] shrink-0" />
      )}

      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt="" className="h-5 w-5 shrink-0 rounded-[3px] object-cover" />
      ) : item.icon ? (
        <span className="shrink-0 text-[var(--text-muted)]">
          <ResolvedIcon icon={item.icon} size={15} />
        </span>
      ) : null}

      <span className="min-w-0 flex-1 truncate text-sm text-[var(--text)]">{itemDisplayTitle(item)}</span>

      <span className="shrink-0 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] text-[var(--text-faint)]">{TYPE_LABELS[item.type] || item.type}</span>

      {item.badge?.text ? (
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] text-white" style={{ background: item.badge.color || "var(--brand-500)" }}>
          {item.badge.text}
        </span>
      ) : null}

      {item.menuStyle && item.menuStyle !== "simple" && childCount > 0 ? (
        <span className="shrink-0 rounded-full bg-[var(--info-bg)] px-2 py-0.5 text-[10px] text-[var(--info)]">{item.menuStyle === "mega" ? "مگامنو" : "کشویی"}</span>
      ) : null}

      {!isOverlay && (
        <span className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            title="افزودن زیرمجموعه"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild?.(item._id);
            }}
            className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--surface)] hover:text-[var(--brand-600)]"
          >
            <Plus size={13} />
          </button>
          <button
            type="button"
            title="تکثیر"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.(item._id);
            }}
            className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--surface)]"
          >
            <Copy size={12} />
          </button>
          <button
            type="button"
            title="حذف"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(item._id);
            }}
            className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--surface)] hover:text-[var(--danger)]"
          >
            <X size={13} />
          </button>
        </span>
      )}
    </div>
  );
}

function SortableRow({ item, depth, childCount, ...rest }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item._id });
  const style = { transform: transform ? CSS.Translate.toString(transform) : undefined, transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style}>
      <TreeRow item={item} childCount={childCount} indentPx={depth * INDENTATION_WIDTH} dragHandleProps={{ ref: setActivatorNodeRef, ...attributes, ...listeners }} {...rest} />
    </div>
  );
}

export function MenuTree({ items, selectedId, onSelect, onChange, onToggleEnabled, onAddChild, onDuplicate, onDelete, onDepthExceeded }) {
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [offsetX, setOffsetX] = useState(0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const flatShape = useMemo(() => toParentIdShape(items), [items]);
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
    if (getMaxDepth(flattenTree(newTree)) > MAX_UI_DEPTH) {
      onDepthExceeded?.();
      return;
    }
    onChange(toParentItemIdShape(treeToStorageItems(newTree)));
  }

  if (!items.length) {
    return <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-6 text-center text-xs text-[var(--text-faint)]">هنوز موردی در این منو نیست. از پنل سمت راست یک لینک اضافه کنید یا از پیشنهادها استفاده کنید.</p>;
  }

  return (
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
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-2" dir="rtl">
          {visibleFlattened.map((item) => {
            const isOverRow = overId === idOf(item._id) && activeId && activeId !== idOf(item._id);
            return (
              <div key={item._id}>
                {isOverRow && projected && <div className="my-0.5 h-0.5 rounded-full bg-[var(--brand-500)]" style={{ marginInlineStart: projected.depth * INDENTATION_WIDTH }} />}
                <SortableRow
                  item={item}
                  depth={activeId === idOf(item._id) && projected ? projected.depth : item.depth}
                  childCount={childCountFor(item._id)}
                  isCollapsed={collapsedIds.has(idOf(item._id))}
                  isSelected={selectedId === idOf(item._id)}
                  onToggleCollapse={(id) =>
                    setCollapsedIds((prev) => {
                      const next = new Set(prev);
                      next.has(id) ? next.delete(id) : next.add(id);
                      return next;
                    })
                  }
                  onSelect={onSelect}
                  onToggleEnabled={onToggleEnabled}
                  onAddChild={onAddChild}
                  onDuplicate={onDuplicate}
                  onDelete={(id) => onDelete?.(id, countDescendants(fullFlattened, id))}
                />
              </div>
            );
          })}
        </div>
      </SortableContext>

      <DragOverlay>{activeItem ? <TreeRow item={activeItem} childCount={childCountFor(activeItem._id)} indentPx={0} isOverlay /> : null}</DragOverlay>
    </DndContext>
  );
}
