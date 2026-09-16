"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { fetchTickets, fetchTicketMessages, sendTicketReply } from "@/lib/support/api";
import { LIVE_CHAT_TOPIC, ticketSenderName } from "@/lib/support/constants";
import { getLiveChatSocket } from "@/lib/support/liveChatSocket";

function ConversationListItem({ ticket, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col gap-1 rounded-[var(--radius-md)] border px-3 py-2.5 text-right transition ${
        active ? "border-[var(--brand-500)] bg-[var(--brand-50)]" : "border-transparent hover:bg-[var(--surface-muted)]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-[var(--text)]">{ticketSenderName(ticket)}</span>
        <span className="shrink-0 text-[10px] text-[var(--text-faint)]">{formatDateTime(ticket.updatedAt || ticket.createdAt)}</span>
      </div>
      <span className="truncate text-xs text-[var(--text-faint)]">{ticket.status === "closed" ? "بسته‌شده" : "باز"}</span>
    </button>
  );
}

function MessageBubble({ message }) {
  const isStaff = message.senderModel === "StaffUser";
  return (
    <div className={`flex ${isStaff ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[75%] rounded-[var(--radius-lg)] px-4 py-2.5 text-sm ${isStaff ? "bg-[var(--brand-600)] text-white" : "bg-[var(--surface-muted)] text-[var(--text)]"}`}>
        <p className="whitespace-pre-wrap break-words">{message.message}</p>
        <div className={`mt-1.5 text-[10px] ${isStaff ? "text-white/70" : "text-[var(--text-faint)]"}`}>{formatDateTime(message.createdAt)}</div>
      </div>
    </div>
  );
}

export default function LiveChatInboxPage() {
  const queryClient = useQueryClient();
  const [selectedIdOverride, setSelectedIdOverride] = useState(null);
  const [reply, setReply] = useState("");
  // Holds the ticketId currently typing (or null) rather than a plain
  // boolean, so switching conversations can't show a stale indicator left
  // over from the previous chat without needing an extra reset-on-change effect.
  const [typingTicketId, setTypingTicketId] = useState(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const bodyRef = useRef(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: fetchTickets,
  });

  const chats = useMemo(
    () =>
      tickets
        .filter((t) => t.topic === LIVE_CHAT_TOPIC)
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)),
    [tickets]
  );

  // No selection yet? default to the most recent chat — derived at render
  // time instead of synced via an effect, so opening the page never needs an
  // extra render just to pick the first conversation.
  const selectedId = selectedIdOverride || chats[0]?._id || null;
  const setSelectedId = setSelectedIdOverride;

  const selectedTicket = chats.find((t) => t._id === selectedId) || null;

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["admin-ticket-messages", selectedId],
    queryFn: () => fetchTicketMessages(selectedId),
    enabled: Boolean(selectedId),
  });

  // Real-time: any new/updated chat refreshes the inbox list.
  useEffect(() => {
    const socket = getLiveChatSocket();
    if (!socket) return;
    const refetchList = () => queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    socket.on("support:new_chat", refetchList);
    socket.on("support:ticket_update", refetchList);
    socket.on("support:message", refetchList);
    return () => {
      socket.off("support:new_chat", refetchList);
      socket.off("support:ticket_update", refetchList);
      socket.off("support:message", refetchList);
    };
  }, [queryClient]);

  // Real-time: join the open conversation's room for instant messages + typing.
  useEffect(() => {
    const socket = getLiveChatSocket();
    if (!socket || !selectedId) return;

    socket.emit("chat:join", selectedId);

    const onMessage = (message) => {
      setTypingTicketId((id) => (id === selectedId ? null : id));
      queryClient.setQueryData(["admin-ticket-messages", selectedId], (prev = []) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };
    const onTyping = (payload) => {
      if (payload?.from === "staff") return;
      setTypingTicketId(selectedId);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(
        () => setTypingTicketId((id) => (id === selectedId ? null : id)),
        3000
      );
    };

    socket.on("chat:message", onMessage);
    socket.on("chat:typing", onTyping);

    return () => {
      socket.emit("chat:leave", selectedId);
      socket.off("chat:message", onMessage);
      socket.off("chat:typing", onTyping);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [selectedId, queryClient]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typingTicketId]);

  const replyMutation = useMutation({
    mutationFn: () => sendTicketReply(selectedId, reply),
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["admin-ticket-messages", selectedId] });
    },
  });

  const handleReplyChange = (value) => {
    setReply(value);
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return; // throttle
    lastTypingSentRef.current = now;
    getLiveChatSocket()?.emit("chat:typing", { ticketId: selectedId, from: "staff" });
  };

  return (
    <div>
      <PageHeader title="چت‌های زنده" subtitle="گفتگوهای ویجت سایت مشتری (مهمان و مشتری لاگین‌کرده) — جدا از تیکت‌ها، به‌صورت زنده" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]" style={{ height: "calc(100vh - 220px)", minHeight: 480 }}>
        <Card className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : chats.length === 0 ? (
              <p className="p-4 text-center text-sm text-[var(--text-faint)]">هنوز چتی از ویجت ثبت نشده</p>
            ) : (
              <div className="flex flex-col gap-1">
                {chats.map((t) => (
                  <ConversationListItem key={t._id} ticket={t} active={t._id === selectedId} onClick={() => setSelectedId(t._id)} />
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          {!selectedTicket ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-[var(--text-faint)]">
              <MessageCircle size={18} /> یک گفتگو را انتخاب کنید
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{ticketSenderName(selectedTicket)}</p>
                  <p className="text-xs text-[var(--text-faint)]">{selectedTicket.status === "closed" ? "بسته‌شده" : "باز"}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4" ref={bodyRef}>
                <div className="flex flex-col gap-3">
                  {loadingMessages ? (
                    <Skeleton className="h-40 w-full" />
                  ) : messages.length === 0 ? (
                    <p className="py-10 text-center text-sm text-[var(--text-faint)]">هنوز پیامی ثبت نشده است</p>
                  ) : (
                    messages.map((m) => <MessageBubble key={m._id} message={m} />)
                  )}

                  {typingTicketId === selectedId && (
                    <div className="flex justify-end">
                      <div className="rounded-[var(--radius-lg)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-faint)]">در حال تایپ...</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-end gap-2 border-t border-[var(--border)] p-3">
                <textarea
                  className="min-h-[46px] flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
                  placeholder="پاسخ خود را بنویسید..."
                  value={reply}
                  onChange={(e) => handleReplyChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && reply.trim()) {
                      e.preventDefault();
                      replyMutation.mutate();
                    }
                  }}
                />
                <Button loading={replyMutation.isPending} disabled={!reply.trim()} onClick={() => replyMutation.mutate()}>
                  <Send size={15} />
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
