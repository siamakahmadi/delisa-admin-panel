"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, CheckCircle2, Circle, Archive, X, CalendarClock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/tasks/avatar";
import { fetchCard, updateCard, deleteCard, addComment, deleteComment, PRIORITIES, dueState } from "@/lib/tasks/api";
import { formatJalali } from "@/lib/jalali";
import { getUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

function formatWhen(iso) {
  const d = new Date(iso);
  const date = formatJalali(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  const time = d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

function Section({ title, children, action }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[var(--text-muted)]">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  );
}

function CardEditor({ card, board, boardId, readOnly, onClose }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const me = getUser();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [newItem, setNewItem] = useState("");
  const [comment, setComment] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const sync = (updated) => {
    queryClient.setQueryData(["task-card", card._id], updated);
    queryClient.invalidateQueries({ queryKey: ["task-board", boardId] });
    queryClient.invalidateQueries({ queryKey: ["task-my-cards"] });
  };
  const apiError = (e) => toast.error(e?.response?.data?.message || "ذخیره ناموفق بود");

  const save = useMutation({ mutationFn: (payload) => updateCard(card._id, payload), onSuccess: sync, onError: apiError });
  const commentMutation = useMutation({
    mutationFn: () => addComment(card._id, comment.trim()),
    onSuccess: (c) => {
      setComment("");
      sync(c);
    },
    onError: apiError,
  });
  const delComment = useMutation({ mutationFn: (id) => deleteComment(card._id, id), onSuccess: sync, onError: apiError });
  const removeMutation = useMutation({
    mutationFn: () => deleteCard(card._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-board", boardId] });
      queryClient.invalidateQueries({ queryKey: ["task-my-cards"] });
      onClose();
    },
    onError: apiError,
  });

  const people = [board.owner, ...(board.members || [])].filter(Boolean);
  const assigneeIds = (card.assignees || []).map((a) => a._id);
  const toggleAssignee = (id) =>
    save.mutate({ assignees: assigneeIds.includes(id) ? assigneeIds.filter((a) => a !== id) : [...assigneeIds, id] });
  const toggleLabel = (id) =>
    save.mutate({ labelIds: (card.labelIds || []).includes(id) ? card.labelIds.filter((l) => l !== id) : [...(card.labelIds || []), id] });

  const checklist = card.checklist || [];
  const doneCount = checklist.filter((i) => i.done).length;
  const pct = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;
  const st = dueState(card.dueDate, card.completedAt);

  const commitTitle = () => {
    const t = title.trim();
    if (!t) return setTitle(card.title);
    if (t !== card.title) save.mutate({ title: t });
  };
  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    setNewItem("");
    save.mutate({ checklist: [...checklist, { text, done: false }] });
  };

  return (
    <>
      <div className="flex items-start gap-3 pe-8">
        <button
          type="button"
          disabled={readOnly}
          onClick={() => save.mutate({ completed: !card.completedAt })}
          className={cn("mt-1 shrink-0", card.completedAt ? "text-[var(--success)]" : "text-[var(--text-faint)] hover:text-[var(--success)]")}
          aria-label="تغییر وضعیت انجام"
          title={card.completedAt ? "علامت‌گذاری به‌عنوان انجام‌نشده" : "علامت‌گذاری به‌عنوان انجام‌شده"}
        >
          {card.completedAt ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>
        <div className="min-w-0 flex-1">
          <DialogTitle className="sr-only">{card.title}</DialogTitle>
          <input
            value={title}
            disabled={readOnly}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="w-full rounded-[var(--radius-sm)] border border-transparent bg-transparent px-1.5 py-1 text-lg font-bold text-[var(--text)] outline-none hover:border-[var(--border)] focus:border-[var(--brand-500)]"
          />
          <p className="px-1.5 text-[11px] text-[var(--text-faint)]">
            ساخته‌شده توسط {card.createdBy?.name || "—"} · {formatWhen(card.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-[1fr_220px]">
        <div className="space-y-5">
          <Section title="توضیحات">
            <textarea
              rows={4}
              value={description}
              disabled={readOnly}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== (card.description || "") && save.mutate({ description })}
              placeholder="جزئیات کار، لینک‌ها، نکته‌ها..."
              className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm leading-7 outline-none focus:border-[var(--brand-500)]"
            />
          </Section>

          <Section
            title={`چک‌لیست${checklist.length ? ` (${doneCount.toLocaleString("fa-IR")}/${checklist.length.toLocaleString("fa-IR")})` : ""}`}
          >
            {checklist.length > 0 && (
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div className="h-full rounded-full bg-[var(--success)] transition-all" style={{ width: `${pct}%` }} />
              </div>
            )}
            <ul className="space-y-1">
              {checklist.map((item) => (
                <li key={item._id} className="group flex items-center gap-2 rounded-[var(--radius-sm)] px-1 py-1 hover:bg-[var(--surface-muted)]">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={item.done}
                    onChange={() => save.mutate({ checklist: checklist.map((i) => (i._id === item._id ? { ...i, done: !i.done } : i)) })}
                    className="h-4 w-4 accent-[var(--brand-600)]"
                  />
                  <span className={cn("flex-1 text-sm", item.done && "text-[var(--text-faint)] line-through")}>{item.text}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => save.mutate({ checklist: checklist.filter((i) => i._id !== item._id) })}
                      className="text-[var(--text-faint)] opacity-0 hover:text-[var(--danger)] group-hover:opacity-100"
                      aria-label="حذف"
                    >
                      <X size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {!readOnly && (
              <div className="flex gap-2">
                <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder="مورد جدید..." className="h-9 text-xs" />
                <Button size="sm" variant="outline" disabled={!newItem.trim()} onClick={addItem}>
                  <Plus size={14} />
                  افزودن
                </Button>
              </div>
            )}
          </Section>

          <Section title={`نظرات (${(card.comments || []).length.toLocaleString("fa-IR")})`}>
            {!readOnly && (
              <div className="flex gap-2">
                <Avatar user={me} size={28} ring={false} />
                <div className="flex-1 space-y-1.5">
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="نظر یا گزارش پیشرفت بنویسید..."
                    className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2 text-sm outline-none focus:border-[var(--brand-500)]"
                  />
                  <Button size="sm" loading={commentMutation.isPending} disabled={!comment.trim()} onClick={() => commentMutation.mutate()}>
                    <Send size={13} />
                    ارسال
                  </Button>
                </div>
              </div>
            )}
            <ul className="space-y-3">
              {[...(card.comments || [])].reverse().map((c) => (
                <li key={c._id} className="flex gap-2">
                  <Avatar user={c.author} size={28} ring={false} />
                  <div className="min-w-0 flex-1 rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-3 py-2">
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-faint)]">
                      <span className="font-semibold text-[var(--text)]">{c.author?.name}</span>
                      <span>{formatWhen(c.createdAt)}</span>
                      {(c.author?._id === me?._id || me?.role === "admin") && (
                        <button type="button" onClick={() => delComment.mutate(c._id)} className="ms-auto hover:text-[var(--danger)]" aria-label="حذف نظر">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm leading-7 text-[var(--text)]">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <aside className="space-y-5">
          <Section title="مسئول‌ها">
            <div className="flex flex-wrap gap-1.5">
              {people.map((p) => {
                const on = assigneeIds.includes(p._id);
                return (
                  <button
                    key={p._id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => toggleAssignee(p._id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-1.5 py-1 text-xs transition-colors",
                      on ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                    )}
                  >
                    <Avatar user={p} size={18} ring={false} />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="برچسب‌ها">
            <div className="flex flex-wrap gap-1.5">
              {board.labels.map((l) => {
                const on = (card.labelIds || []).includes(l._id);
                return (
                  <button
                    key={l._id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => toggleLabel(l._id)}
                    className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity", on ? "opacity-100 ring-2 ring-offset-1 ring-[var(--text)]" : "opacity-45 hover:opacity-80")}
                    style={{ background: l.color }}
                  >
                    {l.name || "بدون نام"}
                  </button>
                );
              })}
              {!board.labels.length && <span className="text-xs text-[var(--text-faint)]">برچسبی تعریف نشده</span>}
            </div>
          </Section>

          <Section title="مهلت انجام">
            <JalaliDatePicker
              value={card.dueDate ? String(card.dueDate).slice(0, 10) : ""}
              disabled={readOnly}
              onChange={(iso) => save.mutate({ dueDate: iso || null })}
              placeholder="انتخاب تاریخ"
            />
            {card.dueDate && (
              <div className="flex items-center justify-between text-[11px]">
                <span
                  className={cn(
                    "flex items-center gap-1",
                    st === "overdue" && "text-[var(--danger)]",
                    st === "soon" && "text-[var(--warning)]",
                    st === "done" && "text-[var(--success)]"
                  )}
                >
                  <CalendarClock size={12} />
                  {st === "overdue" ? "عقب‌افتاده" : st === "soon" ? "کمتر از ۲ روز مانده" : st === "done" ? "انجام‌شده" : "در موعد"}
                </span>
                {!readOnly && (
                  <button type="button" onClick={() => save.mutate({ dueDate: null })} className="text-[var(--text-faint)] hover:text-[var(--danger)]">
                    حذف مهلت
                  </button>
                )}
              </div>
            )}
          </Section>

          <Section title="اولویت">
            <Select value={card.priority} disabled={readOnly} onChange={(e) => save.mutate({ priority: e.target.value })}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Section>

          {!readOnly && (
            <div className="space-y-2 border-t border-[var(--border)] pt-4">
              <Button variant="outline" className="w-full" onClick={() => save.mutate({ archived: true }, { onSuccess: onClose })}>
                <Archive size={15} />
                بایگانی کارت
              </Button>
              {confirmDelete ? (
                <div className="flex gap-2">
                  <Button variant="danger" size="sm" className="flex-1" loading={removeMutation.isPending} onClick={() => removeMutation.mutate()}>
                    بله، حذف شود
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                    خیر
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" className="w-full text-[var(--danger)]" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={15} />
                  حذف کارت
                </Button>
              )}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

export function CardDialog({ cardId, boardId, board, readOnly, onClose }) {
  const { data: card, isLoading, isError } = useQuery({
    queryKey: ["task-card", cardId],
    queryFn: () => fetchCard(cardId),
    retry: false,
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            <DialogTitle className="sr-only">در حال بارگذاری کارت</DialogTitle>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : isError || !card ? (
          <div className="py-8 text-center">
            <DialogTitle>کارت پیدا نشد</DialogTitle>
            <p className="mt-2 text-sm text-[var(--text-muted)]">ممکن است حذف یا بایگانی شده باشد.</p>
          </div>
        ) : (
          <CardEditor key={card._id} card={card} board={board} boardId={boardId} readOnly={readOnly} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}
