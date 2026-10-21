"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, KanbanSquare, AlertCircle, CalendarClock, Archive, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { AvatarStack, Avatar } from "@/components/tasks/avatar";
import { fetchBoards, fetchMyCards, fetchTaskMembers, createBoard, BOARD_COLORS, dueState } from "@/lib/tasks/api";
import { formatJalali } from "@/lib/jalali";
import { usePermissions } from "@/hooks/use-permissions";
import { getUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

function NewBoardDialog({ open, onOpenChange }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", color: BOARD_COLORS[0], members: [] });
  const { data: members = [] } = useQuery({ queryKey: ["task-members"], queryFn: fetchTaskMembers, enabled: open });

  const mutation = useMutation({
    mutationFn: () => createBoard(form),
    onSuccess: (board) => {
      toast.success("بورد ساخته شد");
      queryClient.invalidateQueries({ queryKey: ["task-boards"] });
      onOpenChange(false);
      setForm({ title: "", description: "", color: BOARD_COLORS[0], members: [] });
      router.push(`/tasks/${board._id}`);
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ساخت بورد ناموفق بود"),
  });

  const toggleMember = (id) =>
    setForm((f) => ({ ...f, members: f.members.includes(id) ? f.members.filter((m) => m !== id) : [...f.members, id] }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>بورد جدید</DialogTitle>
        <div className="mt-4 space-y-3">
          <div>
            <Label>عنوان بورد</Label>
            <Input autoFocus value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="مثلاً: محتوای هفتگی بلاگ" />
          </div>
          <div>
            <Label>توضیح (اختیاری)</Label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <Label>رنگ</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {BOARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={cn("h-7 w-7 rounded-full border-2", form.color === c ? "border-[var(--text)]" : "border-transparent")}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>اعضای بورد</Label>
            <p className="mb-1.5 text-[11px] text-[var(--text-faint)]">خودتان مالک بورد هستید؛ فقط مالک، اعضا و مدیر کل بورد را می‌بینند.</p>
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
              {members.filter((m) => m._id !== getUser()?._id).map((m) => {
                const on = form.members.includes(m._id);
                return (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => toggleMember(m._id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors",
                      on ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                    )}
                  >
                    <Avatar user={m} size={18} ring={false} />
                    {m.name}
                  </button>
                );
              })}
              {!members.length && <span className="text-xs text-[var(--text-faint)]">همکاری برای انتخاب نیست</span>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
            <Button loading={mutation.isPending} disabled={!form.title.trim()} onClick={() => mutation.mutate()}>
              ساخت بورد
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BoardCard({ board }) {
  const { total, done, overdue } = board.stats;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const people = [board.owner, ...(board.members || [])].filter(Boolean);
  return (
    <Link
      href={`/tasks/${board._id}`}
      className="group block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
    >
      <div className="h-2" style={{ background: board.color }} />
      <div className="space-y-3 p-4">
        <div>
          <h3 className="truncate text-sm font-bold text-[var(--text)]">{board.title}</h3>
          <p className="mt-0.5 line-clamp-1 min-h-[1.25rem] text-xs text-[var(--text-muted)]">{board.description}</p>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--text-faint)]">
            <span>
              {done.toLocaleString("fa-IR")} از {total.toLocaleString("fa-IR")} انجام‌شده
            </span>
            <span>{pct.toLocaleString("fa-IR")}٪</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: board.color }} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <AvatarStack users={people} max={4} size={26} />
          {overdue > 0 && (
            <Badge variant="danger" size="sm">
              <AlertCircle size={11} />
              {overdue.toLocaleString("fa-IR")} عقب‌افتاده
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

function MyCards() {
  const { data: cards = [], isLoading } = useQuery({ queryKey: ["task-my-cards"], queryFn: fetchMyCards });
  if (isLoading || !cards.length) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
        <CheckCircle2 size={16} className="text-[var(--brand-600)]" />
        تسک‌های من
        <span className="text-xs font-normal text-[var(--text-faint)]">({cards.length.toLocaleString("fa-IR")})</span>
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {cards.slice(0, 9).map((c) => {
          const st = dueState(c.dueDate, c.completedAt);
          return (
            <Link
              key={c._id}
              href={`/tasks/${c.board?._id}?card=${c._id}`}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 transition-colors hover:border-[var(--brand-500)]"
            >
              <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: c.board?.color || "#7c5cff" }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[var(--text)]">{c.title}</span>
                <span className="block truncate text-[11px] text-[var(--text-faint)]">
                  {c.board?.title} · {c.list?.title}
                </span>
              </span>
              {c.dueDate && (
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px]",
                    st === "overdue" && "bg-[var(--danger-bg)] text-[var(--danger)]",
                    st === "soon" && "bg-[var(--warning-bg)] text-[var(--warning)]",
                    st === "ok" && "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                  )}
                >
                  <CalendarClock size={11} />
                  {formatJalali(String(c.dueDate).slice(0, 10))}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function BoardsOverview() {
  const { can } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [archived, setArchived] = useState(false);
  const { data: boards = [], isLoading } = useQuery({ queryKey: ["task-boards", archived], queryFn: () => fetchBoards(archived) });
  const canEdit = can("tasks", "edit");

  return (
    <div>
      <PageHeader
        title="مدیریت تسک‌ها"
        subtitle="بورد بسازید، کارها را در لیست‌ها بچینید و بین همکاران تقسیم کنید"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setArchived((v) => !v)}>
              <Archive size={16} />
              {archived ? "بوردهای فعال" : "بایگانی"}
            </Button>
            {canEdit && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                بورد جدید
              </Button>
            )}
          </div>
        }
      />

      {!archived && <MyCards />}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : boards.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {boards.map((b) => (
            <BoardCard key={b._id} board={b} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)]">
            <KanbanSquare size={26} />
          </div>
          <p className="text-sm font-semibold text-[var(--text)]">{archived ? "بورد بایگانی‌شده‌ای نیست" : "هنوز بوردی ندارید"}</p>
          {!archived && canEdit && <Button onClick={() => setCreateOpen(true)}>اولین بورد را بسازید</Button>}
        </div>
      )}

      <NewBoardDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
