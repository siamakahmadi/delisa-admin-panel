"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCheck, MessageCircle, Search, Send } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import {
  fetchLiveChats,
  fetchTicketMessages,
  markTicketRead,
  sendTicketReply,
  updateTicketStatus,
} from "@/lib/support/api";
import {
  chatNeedsReply,
  isGuestChat,
  ticketSenderName,
  ticketSenderPhone,
} from "@/lib/support/constants";
import { getLiveChatSocket } from "@/lib/support/liveChatSocket";
import { ChatMessageBody } from "@/components/support/chat-message-body";
import { ChatProductPicker } from "@/components/support/chat-product-picker";

const FILTERS = [
  { id: "all", label: "همه" },
  { id: "unread", label: "خوانده‌نشده" },
  { id: "waiting", label: "منتظر پاسخ" },
  { id: "replied", label: "پاسخ‌داده‌شده" },
  { id: "open", label: "باز" },
  { id: "closed", label: "بسته" },
  { id: "guest", label: "مهمان" },
  { id: "customer", label: "مشتری" },
];

function matchesFilter(ticket, filter) {
  const unread = Number(ticket.unreadByStaff || 0) > 0;
  const waiting = chatNeedsReply(ticket) && ticket.status !== "closed";
  if (filter === "unread") return unread;
  if (filter === "waiting") return waiting;
  if (filter === "replied") return ticket.lastMessageSenderModel === "StaffUser";
  if (filter === "open") return ticket.status !== "closed";
  if (filter === "closed") return ticket.status === "closed";
  if (filter === "guest") return isGuestChat(ticket);
  if (filter === "customer") return ticket.createdByModel === "Customer";
  return true;
}

function ConversationListItem({ ticket, active, onClick }) {
  const unread = Number(ticket.unreadByStaff || 0);
  const waiting = chatNeedsReply(ticket) && ticket.status !== "closed";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full gap-3 rounded-2xl px-3 py-2.5 text-right transition ${
        active ? "bg-[var(--brand-50)]" : unread ? "bg-[var(--surface)] hover:bg-[var(--surface-muted)]" : "hover:bg-[var(--surface-muted)]"
      }`}
    >
      <div
        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
          unread ? "bg-[var(--brand-600)]" : waiting ? "bg-[var(--warning)]" : "bg-transparent"
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-sm ${unread ? "font-semibold text-[var(--text)]" : "font-medium text-[var(--text)]"}`}>
            {ticketSenderName(ticket)}
          </span>
          <span className="shrink-0 text-[10px] text-[var(--text-faint)]">
            {formatRelativeTime(ticket.lastMessageAt || ticket.updatedAt)}
          </span>
        </div>
        <p className={`mt-0.5 truncate text-xs ${unread ? "text-[var(--text)]" : "text-[var(--text-faint)]"}`}>
          {ticket.lastMessageSenderModel === "StaffUser" ? "شما: " : ""}
          {ticket.lastMessageText || "بدون پیام"}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          {unread > 0 && (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--brand-600)] px-1.5 text-[10px] font-medium text-white">
              {unread > 9 ? "۹+" : unread.toLocaleString("fa-IR")}
            </span>
          )}
          {waiting && unread === 0 && (
            <Badge size="sm" variant="warning">
              منتظر پاسخ
            </Badge>
          )}
          {ticket.lastMessageSenderModel === "StaffUser" && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--text-faint)]">
              <CheckCheck size={12} /> ارسال شده
            </span>
          )}
          {isGuestChat(ticket) ? (
            <Badge size="sm" variant="neutral">
              مهمان
            </Badge>
          ) : (
            <Badge size="sm" variant="brand">
              مشتری
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message }) {
  const isStaff = message.senderModel === "StaffUser";
  const isCard = message.kind === "product" || message.kind === "link";

  return (
    <div className={`flex ${isStaff ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] ${
          isCard
            ? ""
            : `rounded-2xl px-4 py-2.5 text-sm ${
                isStaff ? "bg-[var(--brand-600)] text-white" : "bg-[var(--surface-muted)] text-[var(--text)]"
              }`
        }`}
      >
        <ChatMessageBody message={message} />
        <div className={`mt-1.5 flex items-center gap-1 text-[10px] ${isStaff && !isCard ? "text-white/70" : "text-[var(--text-faint)]"}`}>
          {formatDateTime(message.createdAt)}
          {isStaff && <Check size={10} />}
        </div>
      </div>
    </div>
  );
}

export default function LiveChatInboxPage() {
  const queryClient = useQueryClient();
  const [selectedIdOverride, setSelectedIdOverride] = useState(null);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [typingTicketId, setTypingTicketId] = useState(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const bodyRef = useRef(null);

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ["admin-live-chats"],
    queryFn: fetchLiveChats,
    refetchInterval: 20000,
  });

  const filteredChats = useMemo(() => {
    const q = search.trim();
    return chats.filter((ticket) => {
      if (!matchesFilter(ticket, filter)) return false;
      if (!q) return true;
      const blob = [
        ticketSenderName(ticket),
        ticketSenderPhone(ticket),
        ticket.lastMessageText,
        ticket.title,
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q.toLowerCase());
    });
  }, [chats, filter, search]);

  const selectedId = selectedIdOverride || filteredChats[0]?._id || chats[0]?._id || null;
  const selectedTicket = chats.find((t) => t._id === selectedId) || null;

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["admin-ticket-messages", selectedId],
    queryFn: () => fetchTicketMessages(selectedId),
    enabled: Boolean(selectedId),
  });

  useEffect(() => {
    const socket = getLiveChatSocket();
    if (!socket) return;
    const refetchList = () => queryClient.invalidateQueries({ queryKey: ["admin-live-chats"] });
    socket.on("support:new_chat", refetchList);
    socket.on("support:ticket_update", refetchList);
    socket.on("support:message", refetchList);
    return () => {
      socket.off("support:new_chat", refetchList);
      socket.off("support:ticket_update", refetchList);
      socket.off("support:message", refetchList);
    };
  }, [queryClient]);

  useEffect(() => {
    const socket = getLiveChatSocket();
    if (!socket || !selectedId) return;

    socket.emit("chat:join", selectedId);
    markTicketRead(selectedId).then((ticket) => {
      if (!ticket) return;
      queryClient.setQueryData(["admin-live-chats"], (prev = []) =>
        prev.map((item) => (item._id === ticket._id ? { ...item, ...ticket, unreadByStaff: 0 } : item))
      );
    });

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
    mutationFn: (payload) => sendTicketReply(selectedId, payload),
    onSuccess: (newMessage) => {
      setReply("");
      if (newMessage) {
        queryClient.setQueryData(["admin-ticket-messages", selectedId], (prev = []) => {
          if (prev.some((m) => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-live-chats"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateTicketStatus(selectedId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-live-chats"] }),
  });

  const handleReplyChange = (value) => {
    setReply(value);
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    getLiveChatSocket()?.emit("chat:typing", { ticketId: selectedId, from: "staff" });
  };

  const unreadCount = chats.filter((ticket) => Number(ticket.unreadByStaff || 0) > 0).length;
  const waitingCount = chats.filter((ticket) => chatNeedsReply(ticket) && ticket.status !== "closed").length;

  return (
    <div>
      <PageHeader
        title="چت‌های زنده"
        subtitle={`${unreadCount.toLocaleString("fa-IR")} خوانده‌نشده · ${waitingCount.toLocaleString("fa-IR")} منتظر پاسخ`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]" style={{ height: "calc(100vh - 220px)", minHeight: 480 }}>
        <Card className="flex flex-col overflow-hidden">
          <div className="space-y-2 border-b border-[var(--border)] p-3">
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو نام، شماره یا پیام..." className="pr-9" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`rounded-full px-2.5 py-1 text-[11px] transition ${
                    filter === item.id
                      ? "bg-[var(--brand-600)] text-white"
                      : "bg-[var(--surface-muted)] text-[var(--text-muted)] hover:bg-[var(--border)]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : filteredChats.length === 0 ? (
              <p className="p-4 text-center text-sm text-[var(--text-faint)]">چتی با این فیلتر پیدا نشد</p>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredChats.map((ticket) => (
                  <ConversationListItem
                    key={ticket._id}
                    ticket={ticket}
                    active={ticket._id === selectedId}
                    onClick={() => setSelectedIdOverride(ticket._id)}
                  />
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
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text)]">{ticketSenderName(selectedTicket)}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                    {ticketSenderPhone(selectedTicket) || "بدون شماره"} · {isGuestChat(selectedTicket) ? "مهمان" : "مشتری"} ·{" "}
                    {selectedTicket.status === "closed" ? "بسته‌شده" : "باز"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  loading={statusMutation.isPending}
                  onClick={() =>
                    statusMutation.mutate(selectedTicket.status === "closed" ? "open" : "closed")
                  }
                >
                  {selectedTicket.status === "closed" ? "باز کردن" : "بستن گفتگو"}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto bg-[var(--surface-muted)]/40 p-4" ref={bodyRef}>
                <div className="flex flex-col gap-3">
                  {loadingMessages ? (
                    <Skeleton className="h-40 w-full" />
                  ) : messages.length === 0 ? (
                    <p className="py-10 text-center text-sm text-[var(--text-faint)]">هنوز پیامی ثبت نشده است</p>
                  ) : (
                    messages.map((message) => <MessageBubble key={message._id} message={message} />)
                  )}

                  {typingTicketId === selectedId && (
                    <div className="flex justify-end">
                      <div className="rounded-2xl bg-white px-3 py-2 text-xs text-[var(--text-faint)] shadow-sm">در حال تایپ...</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-end gap-2 border-t border-[var(--border)] p-3">
                <ChatProductPicker
                  disabled={replyMutation.isPending || selectedTicket.status === "closed"}
                  onSelect={(product) => replyMutation.mutate({ kind: "product", productId: product._id })}
                />
                <textarea
                  className="min-h-[46px] flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
                  placeholder="پیام، لینک یا آدرس محصول را بنویسید..."
                  value={reply}
                  onChange={(e) => handleReplyChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && reply.trim()) {
                      e.preventDefault();
                      replyMutation.mutate({ message: reply });
                    }
                  }}
                />
                <Button
                  loading={replyMutation.isPending}
                  disabled={!reply.trim()}
                  onClick={() => replyMutation.mutate({ message: reply })}
                >
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
