"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Send, Check, X, ArrowLeftRight, Archive, Trash2, User } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import {
  fetchTicketById,
  fetchTicketMessages,
  fetchTicketSender,
  sendTicketReply,
  acceptTicket,
  rejectTicket,
  transferTicket,
  updateTicketStatus,
  archiveTicket,
  deleteTicket,
  fetchSupportStaff,
} from "@/lib/support/api";
import { getLiveChatSocket } from "@/lib/support/liveChatSocket";
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_VARIANTS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_VARIANTS,
  TICKET_TYPE_LABELS,
} from "@/lib/support/constants";

function MessageBubble({ message }) {
  const isStaff = message.senderModel === "StaffUser";
  const senderLabel = message.sender?.name || message.sender?.storeInfo?.storeName || message.sender?.phone || (isStaff ? "پشتیبانی" : "کاربر");

  return (
    <div className={`flex ${isStaff ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[75%] rounded-[var(--radius-lg)] px-4 py-2.5 text-sm ${isStaff ? "bg-[var(--brand-600)] text-white" : "bg-[var(--surface-muted)] text-[var(--text)]"}`}>
        <p className="whitespace-pre-wrap break-words">{message.message}</p>
        <div className={`mt-1.5 flex items-center gap-2 text-[10px] ${isStaff ? "text-white/70" : "text-[var(--text-faint)]"}`}>
          <span>{senderLabel}</span>
          <span>·</span>
          <span>{formatDateTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

export default function TicketDetailPage({ params }) {
  const { id: ticketId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  const [transferStaffId, setTransferStaffId] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: ticket, isLoading: loadingTicket } = useQuery({
    queryKey: ["admin-ticket", ticketId],
    queryFn: () => fetchTicketById(ticketId),
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["admin-ticket-messages", ticketId],
    queryFn: () => fetchTicketMessages(ticketId),
  });

  const { data: sender } = useQuery({
    queryKey: ["admin-ticket-sender", ticketId],
    queryFn: () => fetchTicketSender(ticketId),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["support-staff"],
    queryFn: fetchSupportStaff,
  });

  // Real-time: join this ticket's room and push incoming messages straight
  // into the query cache — no polling, no manual refresh needed.
  useEffect(() => {
    const socket = getLiveChatSocket();
    if (!socket || !ticketId) return;

    socket.emit("chat:join", ticketId);

    const onMessage = (message) => {
      queryClient.setQueryData(["admin-ticket-messages", ticketId], (prev = []) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };
    const onTicketUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ticket", ticketId] });
    };

    socket.on("chat:message", onMessage);
    socket.on("chat:ticket_update", onTicketUpdate);

    return () => {
      socket.emit("chat:leave", ticketId);
      socket.off("chat:message", onMessage);
      socket.off("chat:ticket_update", onTicketUpdate);
    };
  }, [ticketId, queryClient]);

  const invalidateTicket = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-ticket", ticketId] });
    queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
  };

  const replyMutation = useMutation({
    mutationFn: () => sendTicketReply(ticketId, reply),
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["admin-ticket-messages", ticketId] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "ارسال پیام ناموفق بود"),
  });

  const acceptMutation = useMutation({
    mutationFn: () => acceptTicket(ticketId),
    onSuccess: () => {
      toast.success("تیکت قبول شد");
      invalidateTicket();
    },
    onError: () => toast.error("خطا در قبول تیکت"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectTicket(ticketId),
    onSuccess: () => {
      toast.success("تیکت بسته شد");
      invalidateTicket();
    },
    onError: () => toast.error("خطا در رد تیکت"),
  });

  const transferMutation = useMutation({
    mutationFn: () => transferTicket(ticketId, transferStaffId),
    onSuccess: () => {
      toast.success("تیکت منتقل شد");
      setTransferStaffId("");
      invalidateTicket();
    },
    onError: () => toast.error("خطا در انتقال تیکت"),
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateTicketStatus(ticketId, status),
    onSuccess: () => {
      toast.success("وضعیت به‌روزرسانی شد");
      invalidateTicket();
    },
    onError: () => toast.error("خطا در تغییر وضعیت"),
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveTicket(ticketId),
    onSuccess: () => {
      toast.success("تیکت آرشیو شد");
      invalidateTicket();
    },
    onError: () => toast.error("خطا در آرشیو تیکت"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTicket(ticketId),
    onSuccess: () => {
      toast.success("تیکت حذف شد");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      router.push("/support/tickets");
    },
    onError: () => toast.error("خطا در حذف تیکت"),
  });

  const senderLabel = useMemo(() => {
    if (!sender) return "-";
    return sender.name || sender.storeInfo?.storeName || sender.contactPhone || sender.phone || "-";
  }, [sender]);
  const senderPhone = sender?.phone || sender?.contactPhone || "";

  if (loadingTicket) {
    return (
      <div>
        <PageHeader title="در حال بارگذاری..." />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div>
        <PageHeader
          title="تیکت پیدا نشد"
          actions={
            <Button variant="ghost" onClick={() => router.push("/support/tickets")}>
              <ArrowRight size={16} />
              بازگشت
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={ticket.title}
        subtitle={`تیکت #${ticket._id.slice(-6)}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={ticket.status} labels={TICKET_STATUS_LABELS} variants={TICKET_STATUS_VARIANTS} />
            <Button variant="ghost" onClick={() => router.push("/support/tickets")}>
              <ArrowRight size={16} />
              بازگشت
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="space-y-3 p-4">
              {ticket.description && <p className="text-sm text-[var(--text-muted)]">{ticket.description}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex max-h-[480px] flex-col gap-3 overflow-y-auto">
                {loadingMessages ? (
                  <Skeleton className="h-40 w-full" />
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-[var(--text-faint)]">هنوز پیامی ثبت نشده است</p>
                ) : (
                  messages.map((m) => <MessageBubble key={m._id} message={m} />)
                )}
              </div>

              <div className="flex items-end gap-2 border-t border-[var(--border)] pt-3">
                <textarea
                  className="min-h-[52px] flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
                  placeholder="پاسخ خود را بنویسید..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && reply.trim()) {
                      e.preventDefault();
                      replyMutation.mutate();
                    }
                  }}
                />
                <Button loading={replyMutation.isPending} disabled={!reply.trim()} onClick={() => replyMutation.mutate()}>
                  <Send size={15} />
                  ارسال
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <h3 className="text-sm font-semibold text-[var(--text)]">اطلاعات تیکت</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-faint)]">اهمیت</span>
                  <StatusBadge status={ticket.priority} labels={TICKET_PRIORITY_LABELS} variants={TICKET_PRIORITY_VARIANTS} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-faint)]">نوع</span>
                  <span>{TICKET_TYPE_LABELS[ticket.type] || ticket.type}</span>
                </div>
                {ticket.topic && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-faint)]">دسته‌بندی</span>
                    <span>{ticket.topic}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-faint)]">تاریخ ثبت</span>
                  <span className="text-xs">{formatDateTime(ticket.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-faint)]">پشتیبان</span>
                  <span className="text-xs">{ticket.assignedTo?.name || "تخصیص‌نیافته"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <User size={15} />
                فرستنده
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-[var(--text)]">{senderLabel}</p>
                {senderPhone && (
                  <p className="text-xs text-[var(--text-faint)]" dir="ltr">
                    {senderPhone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <h3 className="text-sm font-semibold text-[var(--text)]">عملیات</h3>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="secondary"
                  loading={acceptMutation.isPending}
                  disabled={ticket.status === "closed"}
                  onClick={() => acceptMutation.mutate()}
                >
                  <Check size={14} />
                  قبول تیکت
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  loading={rejectMutation.isPending}
                  disabled={ticket.status === "closed"}
                  onClick={() => rejectMutation.mutate()}
                >
                  <X size={14} />
                  بستن
                </Button>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">تغییر وضعیت</label>
                <Select value={ticket.status} onChange={(e) => statusMutation.mutate(e.target.value)}>
                  {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">انتقال به پشتیبان دیگر</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={transferStaffId} onChange={(e) => setTransferStaffId(e.target.value)}>
                      <option value="">انتخاب پشتیبان...</option>
                      {staffList.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    disabled={!transferStaffId}
                    loading={transferMutation.isPending}
                    onClick={() => transferMutation.mutate()}
                  >
                    <ArrowLeftRight size={15} />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 border-t border-[var(--border)] pt-3">
                <Button className="flex-1" variant="outline" loading={archiveMutation.isPending} onClick={() => archiveMutation.mutate()}>
                  <Archive size={14} />
                  آرشیو
                </Button>
                <Button className="flex-1" variant="danger" onClick={() => setDeleteOpen(true)}>
                  <Trash2 size={14} />
                  حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف تیکت"
        description="این تیکت و تمام پیام‌های آن برای همیشه حذف می‌شوند. این عملیات قابل بازگشت نیست."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
