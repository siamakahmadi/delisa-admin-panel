"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowRight,
  Plus,
  Search,
  X,
  GripVertical,
  CalendarClock,
  CheckSquare,
  MessageSquare,
  MoreHorizontal,
  Users,
  Tag,
  Archive,
  Trash2,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";
import { Avatar, AvatarStack } from "@/components/tasks/avatar";
import { CardDialog } from "@/components/tasks/card-dialog";
import {
  fetchBoard,
  fetchTaskMembers,
  updateBoard,
  deleteBoard,
  createList,
  updateList,
  deleteList,
  reorderLists,
  createCard,
  moveCard,
  PRIORITIES,
  BOARD_COLORS,
  dueState,
} from "@/lib/tasks/api";
import { formatJalali } from "@/lib/jalali";
import { getUser } from "@/lib/auth";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

const listDragId = (id) => `list:${id}`;
const isListDrag = (id) => String(id).startsWith("list:");
const stripList = (id) => String(id).slice(5);

/* ───────────── کارت ───────────── */

function CardFace({ card, labels, onOpen, dragging }) {
  const st = dueState(card.dueDate, card.completedAt);
  const cardLabels = (card.labelIds || []).map((id) => labels.find((l) => l._id === id)).filter(Boolean);
  const pr = PRIORITIES.find((p) => p.value === card.priority);
  return (
    <div
      onClick={onOpen}
      className={cn(
        "cursor-pointer rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-start shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]",
        dragging && "rotate-1 shadow-[var(--shadow-lg)]",
        card.completedAt && "opacity-70"
      )}
    >
      {cardLabels.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {cardLabels.map((l) => (
            <span key={l._id} title={l.name} className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: l.color }}>
              {l.name || " "}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start gap-1.5">
        {card.completedAt && <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--success)]" />}
        <p className={cn("text-[13px] font-medium leading-6 text-[var(--text)]", card.completedAt && "line-through")}>{card.title}</p>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[var(--text-faint)]">
        {pr && card.priority !== "none" && (
          <span className="flex items-center gap-1" title={`اولویت: ${pr.label}`}>
            <span className="h-2 w-2 rounded-full" style={{ background: pr.color }} />
            {pr.label}
          </span>
        )}
        {card.dueDate && (
          <span
            className={cn(
              "flex items-center gap-1 rounded px-1.5 py-0.5",
              st === "overdue" && "bg-[var(--danger-bg)] text-[var(--danger)]",
              st === "soon" && "bg-[var(--warning-bg)] text-[var(--warning)]",
              st === "done" && "bg-[var(--success-bg)] text-[var(--success)]"
            )}
          >
            <CalendarClock size={11} />
            {formatJalali(String(card.dueDate).slice(0, 10))}
          </span>
        )}
        {card.checklistTotal > 0 && (
          <span className={cn("flex items-center gap-1", card.checklistDone === card.checklistTotal && "text-[var(--success)]")}>
            <CheckSquare size={11} />
            {card.checklistDone.toLocaleString("fa-IR")}/{card.checklistTotal.toLocaleString("fa-IR")}
          </span>
        )}
        {card.commentsCount > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare size={11} />
            {card.commentsCount.toLocaleString("fa-IR")}
          </span>
        )}
        {card.assignees?.length > 0 && (
          <span className="ms-auto">
            <AvatarStack users={card.assignees} max={3} size={22} />
          </span>
        )}
      </div>
    </div>
  );
}

function SortableCard({ card, labels, onOpen, readOnly }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card._id,
    data: { type: "card", listId: card.list },
    disabled: readOnly,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}
      {...attributes}
      {...listeners}
    >
      <CardFace card={card} labels={labels} onOpen={() => onOpen(card._id)} />
    </div>
  );
}

/* ───────────── لیست ───────────── */

function AddCard({ listId, boardId }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const mutation = useMutation({
    mutationFn: () => createCard(listId, title.trim()),
    onSuccess: () => {
      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["task-board", boardId] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ساخت کارت ناموفق بود"),
  });
  const submit = () => title.trim() && !mutation.isPending && mutation.mutate();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
      >
        <Plus size={14} />
        افزودن کارت
      </button>
    );
  }
  return (
    <div className="space-y-1.5">
      <textarea
        autoFocus
        rows={2}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="عنوان کارت... (Enter برای افزودن)"
        className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2 text-sm outline-none focus:border-[var(--brand-500)]"
      />
      <div className="flex items-center gap-1.5">
        <Button size="sm" loading={mutation.isPending} disabled={!title.trim()} onClick={submit}>
          افزودن
        </Button>
        <button type="button" onClick={() => setOpen(false)} className="rounded p-1.5 text-[var(--text-faint)] hover:text-[var(--text)]">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function ListColumn({ list, cards, labels, boardId, onOpenCard, readOnly }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: listDragId(list._id),
    data: { type: "list" },
    disabled: readOnly,
  });
  const { setNodeRef: setDropRef } = useDroppable({ id: list._id, data: { type: "list-drop", listId: list._id } });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["task-board", boardId] });
  const apiError = (e) => toast.error(e?.response?.data?.message || "عملیات ناموفق بود");
  const renameMutation = useMutation({ mutationFn: (t) => updateList(list._id, { title: t }), onSuccess: invalidate, onError: apiError });
  const doneMutation = useMutation({ mutationFn: () => updateList(list._id, { isDone: !list.isDone }), onSuccess: invalidate, onError: apiError });
  const deleteMutation = useMutation({
    mutationFn: () => deleteList(list._id),
    onSuccess: () => {
      setConfirmDelete(false);
      invalidate();
    },
    onError: apiError,
  });

  const commitRename = () => {
    setEditing(false);
    const t = title.trim();
    if (t && t !== list.title) renameMutation.mutate(t);
    else setTitle(list.title);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex max-h-full w-[286px] shrink-0 flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)]"
    >
      <div className="flex items-center gap-1 px-2.5 pb-1 pt-2.5">
        {!readOnly && (
          <button type="button" {...attributes} {...listeners} className="cursor-grab touch-none rounded p-0.5 text-[var(--text-faint)] hover:text-[var(--text)]" aria-label="جابه‌جایی لیست">
            <GripVertical size={15} />
          </button>
        )}
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setTitle(list.title);
                setEditing(false);
              }
            }}
            className="min-w-0 flex-1 rounded border border-[var(--brand-500)] bg-[var(--surface)] px-1.5 py-0.5 text-sm font-semibold outline-none"
          />
        ) : (
          <h3
            onDoubleClick={() => !readOnly && setEditing(true)}
            className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-bold text-[var(--text)]"
            title={readOnly ? undefined : "برای تغییر نام دوبار کلیک کنید"}
          >
            <span className="truncate">{list.title}</span>
            {list.isDone && <CheckCircle2 size={13} className="shrink-0 text-[var(--success)]" />}
          </h3>
        )}
        <span className="rounded-full bg-[var(--surface)] px-1.5 text-[11px] text-[var(--text-faint)]">{cards.length.toLocaleString("fa-IR")}</span>
        {!readOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--surface)] hover:text-[var(--text)]" aria-label="گزینه‌های لیست">
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => setEditing(true)}>تغییر نام</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => doneMutation.mutate()}>{list.isDone ? "این لیست «انجام‌شده» نباشد" : "این لیست «انجام‌شده» باشد"}</DropdownMenuItem>
              <DropdownMenuItem danger onSelect={() => setConfirmDelete(true)}>
                <Trash2 size={14} />
                حذف لیست و کارت‌هایش
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div ref={setDropRef} className="min-h-[40px] flex-1 space-y-2 overflow-y-auto px-2 pb-1 pt-1">
        <SortableContext items={cards.map((c) => c._id)} strategy={verticalListSortingStrategy}>
          {cards.map((c) => (
            <SortableCard key={c._id} card={c} labels={labels} onOpen={onOpenCard} readOnly={readOnly} />
          ))}
        </SortableContext>
      </div>

      {!readOnly && (
        <div className="px-2 pb-2">
          <AddCard listId={list._id} boardId={boardId} />
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="حذف لیست"
        description={`لیست «${list.title}» با همه‌ی ${cards.length.toLocaleString("fa-IR")} کارتش حذف می‌شود و برگشت‌پذیر نیست.`}
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}

function AddList({ boardId }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const mutation = useMutation({
    mutationFn: () => createList(boardId, title.trim()),
    onSuccess: () => {
      setTitle("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["task-board", boardId] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ساخت لیست ناموفق بود"),
  });
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-[286px] shrink-0 items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] px-3 text-sm text-[var(--text-muted)] hover:border-[var(--brand-500)] hover:text-[var(--brand-600)]"
      >
        <Plus size={16} />
        افزودن لیست
      </button>
    );
  }
  return (
    <div className="w-[286px] shrink-0 space-y-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-2.5">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim()) mutation.mutate();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="عنوان لیست..."
      />
      <div className="flex items-center gap-1.5">
        <Button size="sm" loading={mutation.isPending} disabled={!title.trim()} onClick={() => mutation.mutate()}>
          افزودن لیست
        </Button>
        <button type="button" onClick={() => setOpen(false)} className="rounded p-1.5 text-[var(--text-faint)] hover:text-[var(--text)]">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/* ───────────── تنظیمات بورد: اعضا و برچسب‌ها ───────────── */

function MembersDialog({ open, onOpenChange, board, boardId, canManage }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: all = [] } = useQuery({ queryKey: ["task-members"], queryFn: fetchTaskMembers, enabled: open });
  const memberIds = (board.members || []).map((m) => m._id);
  const mutation = useMutation({
    mutationFn: (members) => updateBoard(boardId, { members }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task-board", boardId] }),
    onError: (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود"),
  });
  const toggle = (id) => mutation.mutate(memberIds.includes(id) ? memberIds.filter((m) => m !== id) : [...memberIds, id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>اعضای بورد</DialogTitle>
        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-2.5 py-2 text-sm">
            <Avatar user={board.owner} size={26} ring={false} />
            <span className="flex-1 font-medium text-[var(--text)]">{board.owner?.name}</span>
            <span className="text-[11px] text-[var(--text-faint)]">مالک</span>
          </div>
          {all
            .filter((m) => m._id !== board.owner?._id)
            .map((m) => {
              const on = memberIds.includes(m._id);
              return (
                <button
                  key={m._id}
                  type="button"
                  disabled={!canManage || mutation.isPending}
                  onClick={() => toggle(m._id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-start text-sm transition-colors",
                    on ? "bg-[var(--surface-muted)] ring-1 ring-[var(--brand-500)]" : "hover:bg-[var(--surface-muted)]",
                    !canManage && "cursor-default"
                  )}
                >
                  <Avatar user={m} size={26} ring={false} />
                  <span className="flex-1 text-[var(--text)]">{m.name}</span>
                  {on && <span className="text-[11px] font-medium text-[var(--brand-700)]">عضو</span>}
                </button>
              );
            })}
        </div>
        {!canManage && <p className="mt-3 text-[11px] text-[var(--text-faint)]">فقط مالک بورد یا مدیر کل می‌تواند اعضا را تغییر دهد.</p>}
      </DialogContent>
    </Dialog>
  );
}

function LabelsDialog({ open, onOpenChange, board, boardId }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [labels, setLabels] = useState(() => board.labels.map((l) => ({ ...l })));
  const mutation = useMutation({
    mutationFn: () => updateBoard(boardId, { labels }),
    onSuccess: () => {
      toast.success("برچسب‌ها ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["task-board", boardId] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود"),
  });
  const patch = (i, fields) => setLabels((ls) => ls.map((l, j) => (j === i ? { ...l, ...fields } : l)));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>برچسب‌های بورد</DialogTitle>
        <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto">
          {labels.map((l, i) => (
            <div key={l._id || i} className="flex items-center gap-2">
              <input type="color" value={l.color} onChange={(e) => patch(i, { color: e.target.value })} className="h-9 w-10 cursor-pointer rounded border border-[var(--border)] bg-[var(--surface)]" />
              <Input value={l.name} onChange={(e) => patch(i, { name: e.target.value })} placeholder="نام برچسب" />
              <button type="button" onClick={() => setLabels((ls) => ls.filter((_, j) => j !== i))} className="rounded p-1.5 text-[var(--text-faint)] hover:text-[var(--danger)]" aria-label="حذف">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setLabels((ls) => [...ls, { name: "", color: BOARD_COLORS[ls.length % BOARD_COLORS.length] }])}>
            <Plus size={14} />
            برچسب جدید
          </Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            ذخیره
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────── نمای اصلی بورد ───────────── */

export function BoardView({ boardId }) {
  const router = useRouter();
  const search = useSearchParams();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const me = getUser();

  const [drag, setDrag] = useState(null); // { lists, cards, activeId, activeType } حین کشیدن
  const [openCardId, setOpenCardId] = useState(search.get("card"));
  const [q, setQ] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const dragOrigin = useRef(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["task-board", boardId],
    queryFn: () => fetchBoard(boardId),
    refetchInterval: 20000,
    retry: false,
  });

  const readOnly = !can("tasks", "edit");

  const serverState = useMemo(() => {
    if (!data) return null;
    const byList = {};
    data.lists.forEach((l) => (byList[l._id] = []));
    [...data.cards]
      .sort((a, b) => a.order - b.order)
      .forEach((c) => {
        (byList[c.list] ||= []).push(c);
      });
    return { lists: data.lists, cards: byList };
  }, [data]);

  const view = drag ? { lists: drag.lists, cards: drag.cards } : serverState;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["task-board", boardId] });
  const apiError = (e) => toast.error(e?.response?.data?.message || "عملیات ناموفق بود");

  const moveMutation = useMutation({
    mutationFn: ({ id, listId, index }) => moveCard(id, listId, index),
    onSettled: async () => {
      await invalidate();
      setDrag(null);
    },
    onError: apiError,
  });
  const reorderMutation = useMutation({
    mutationFn: (ids) => reorderLists(boardId, ids),
    onSettled: async () => {
      await invalidate();
      setDrag(null);
    },
    onError: apiError,
  });
  const boardMutation = useMutation({
    mutationFn: (payload) => updateBoard(boardId, payload),
    onSuccess: invalidate,
    onError: apiError,
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteBoard(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-boards"] });
      router.push("/tasks");
    },
    onError: apiError,
  });

  const findContainer = (state, id) => {
    if (state.cards[id]) return id; // خود لیست (droppable)
    return Object.keys(state.cards).find((lid) => state.cards[lid].some((c) => c._id === id));
  };

  const collision = (args) => {
    if (isListDrag(args.active.id)) {
      const lists = args.droppableContainers.filter((c) => isListDrag(c.id));
      return closestCorners({ ...args, droppableContainers: lists });
    }
    const within = pointerWithin(args);
    return within.length ? within : closestCorners(args);
  };

  const onDragStart = ({ active }) => {
    dragOrigin.current = null;
    setDrag({
      lists: serverState.lists,
      cards: Object.fromEntries(Object.entries(serverState.cards).map(([k, v]) => [k, [...v]])),
      activeId: active.id,
      activeType: isListDrag(active.id) ? "list" : "card",
    });
    if (!isListDrag(active.id)) dragOrigin.current = findContainer(serverState, active.id);
  };

  const onDragOver = ({ active, over }) => {
    if (!over || isListDrag(active.id) || !drag) return;
    const overId = isListDrag(over.id) ? stripList(over.id) : over.id;
    setDrag((d) => {
      const from = findContainer(d, active.id);
      const to = findContainer(d, overId);
      if (!from || !to || from === to) return d;
      const fromCards = d.cards[from].filter((c) => c._id !== active.id);
      const moving = d.cards[from].find((c) => c._id === active.id);
      const toCards = [...d.cards[to]];
      const overIndex = toCards.findIndex((c) => c._id === overId);
      const insertAt = overIndex >= 0 ? overIndex : toCards.length;
      toCards.splice(insertAt, 0, { ...moving, list: to });
      return { ...d, cards: { ...d.cards, [from]: fromCards, [to]: toCards } };
    });
  };

  const onDragEnd = ({ active, over }) => {
    if (!drag) return;
    if (isListDrag(active.id)) {
      if (!over || !isListDrag(over.id) || active.id === over.id) return setDrag(null);
      const ids = drag.lists.map((l) => l._id);
      const next = arrayMove(ids, ids.indexOf(stripList(active.id)), ids.indexOf(stripList(over.id)));
      setDrag((d) => ({ ...d, lists: next.map((id) => d.lists.find((l) => l._id === id)) }));
      return reorderMutation.mutate(next);
    }
    if (!over) return setDrag(null);
    const overId = isListDrag(over.id) ? stripList(over.id) : over.id;
    let state = drag;
    const from = findContainer(state, active.id);
    const to = findContainer(state, overId);
    if (!from || !to) return setDrag(null);
    if (from === to) {
      const oldIndex = state.cards[from].findIndex((c) => c._id === active.id);
      const newIndex = state.cards[to].findIndex((c) => c._id === overId);
      if (newIndex >= 0 && oldIndex !== newIndex) {
        state = { ...state, cards: { ...state.cards, [to]: arrayMove(state.cards[to], oldIndex, newIndex) } };
        setDrag(state);
      }
    }
    const index = state.cards[to].findIndex((c) => c._id === active.id);
    const unchanged = dragOrigin.current === to && index === serverState.cards[to].findIndex((c) => c._id === active.id);
    if (unchanged) return setDrag(null);
    moveMutation.mutate({ id: active.id, listId: to, index: Math.max(0, index) });
  };

  const labels = data?.board?.labels || [];
  const filterCard = (c) => {
    if (onlyMine && !(c.assignees || []).some((a) => a._id === me?._id)) return false;
    if (q.trim() && !c.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  };
  const filtering = onlyMine || !!q.trim();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 w-[286px]" />
          ))}
        </div>
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-sm py-20 text-center">
        <p className="text-sm font-semibold text-[var(--text)]">بورد پیدا نشد یا به آن دسترسی ندارید.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/tasks")}>
          بازگشت به بوردها
        </Button>
      </div>
    );
  }

  const { board } = data;
  const activeCard = drag?.activeType === "card" ? Object.values(drag.cards).flat().find((c) => c._id === drag.activeId) : null;
  const people = [board.owner, ...(board.members || [])].filter(Boolean);

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[420px] flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Link href="/tasks" className="rounded-[var(--radius-md)] p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]" aria-label="بازگشت">
          <ArrowRight size={18} />
        </Link>
        <span className="h-6 w-1.5 rounded-full" style={{ background: board.color }} />
        <h1 className="text-lg font-bold text-[var(--text)]">{board.title}</h1>

        <div className="ms-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو در کارت‌ها" className="h-9 w-44 pr-8 text-xs" />
          </div>
          <Button size="sm" variant={onlyMine ? "primary" : "outline"} onClick={() => setOnlyMine((v) => !v)}>
            <Filter size={14} />
            کارت‌های من
          </Button>
          <button type="button" onClick={() => setMembersOpen(true)} className="flex items-center gap-1.5 rounded-[var(--radius-md)] px-1.5 py-1 hover:bg-[var(--surface-muted)]" aria-label="اعضا">
            <AvatarStack users={people} max={4} size={26} />
            <Users size={15} className="text-[var(--text-faint)]" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" aria-label="گزینه‌های بورد">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => setLabelsOpen(true)}>
                <Tag size={14} />
                برچسب‌های بورد
              </DropdownMenuItem>
              {board.canManage && (
                <>
                  <DropdownMenuItem onSelect={() => boardMutation.mutate({ archived: !board.archived })}>
                    <Archive size={14} />
                    {board.archived ? "خروج از بایگانی" : "بایگانی بورد"}
                  </DropdownMenuItem>
                  <DropdownMenuItem danger onSelect={() => setDeleteOpen(true)}>
                    <Trash2 size={14} />
                    حذف بورد
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => setDrag(null)}>
        <div className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto pb-3">
          <SortableContext items={view.lists.map((l) => listDragId(l._id))} strategy={horizontalListSortingStrategy}>
            {view.lists.map((l) => (
              <ListColumn
                key={l._id}
                list={l}
                cards={(view.cards[l._id] || []).filter(filterCard)}
                labels={labels}
                boardId={boardId}
                onOpenCard={setOpenCardId}
                readOnly={readOnly || filtering}
              />
            ))}
          </SortableContext>
          {!readOnly && <AddList boardId={boardId} />}
        </div>
        <DragOverlay>{activeCard ? <CardFace card={activeCard} labels={labels} dragging /> : null}</DragOverlay>
      </DndContext>
      {filtering && <p className="text-[11px] text-[var(--text-faint)]">هنگام جستجو یا فیلتر، جابه‌جایی و افزودن غیرفعال است.</p>}

      {openCardId && <CardDialog cardId={openCardId} boardId={boardId} board={board} readOnly={readOnly} onClose={() => setOpenCardId(null)} />}
      <MembersDialog open={membersOpen} onOpenChange={setMembersOpen} board={board} boardId={boardId} canManage={board.canManage} />
      {labelsOpen && <LabelsDialog open={labelsOpen} onOpenChange={setLabelsOpen} board={board} boardId={boardId} />}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف بورد"
        description={`بورد «${board.title}» با همه‌ی لیست‌ها و کارت‌هایش برای همیشه حذف می‌شود.`}
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
