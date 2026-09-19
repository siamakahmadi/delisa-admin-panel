"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, ChevronLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/utils";
import { fetchLiveChats } from "@/lib/support/api";
import { chatNeedsReply, isGuestChat, ticketSenderName } from "@/lib/support/constants";

export function ChatActivityWidget() {
  const { data: chats = [], isLoading } = useQuery({
    queryKey: ["admin-live-chats"],
    queryFn: fetchLiveChats,
    refetchInterval: 20000,
  });

  const needsAttention = chats
    .filter((t) => Number(t.unreadByStaff || 0) > 0 || (chatNeedsReply(t) && t.status !== "closed"))
    .slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle size={16} />
          چت و تیکت‌های نیازمند پاسخ
        </CardTitle>
        <Link href="/support/live-chat" className="flex items-center gap-1 text-xs font-medium text-[var(--brand-600)] hover:underline">
          چت‌های زنده
          <ChevronLeft size={13} />
        </Link>
      </CardHeader>
      <CardContent className="divide-y divide-[var(--border)] p-0">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : needsAttention.length === 0 ? (
          <p className="p-6 text-center text-sm text-[var(--text-faint)]">همه‌چیز پاسخ داده شده 🎉</p>
        ) : (
          needsAttention.map((t) => (
            <Link
              key={t._id}
              href="/support/live-chat"
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-muted)]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text)]">{ticketSenderName(t)}</p>
                <p className="mt-0.5 truncate text-xs text-[var(--text-faint)]">{t.lastMessageText || "بدون پیام"}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {Number(t.unreadByStaff || 0) > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-600)] px-1.5 text-[10px] font-bold text-white">
                    {Number(t.unreadByStaff).toLocaleString("fa-IR")}
                  </span>
                )}
                {isGuestChat(t) && (
                  <Badge size="sm" variant="neutral">
                    مهمان
                  </Badge>
                )}
                <span className="text-[10px] text-[var(--text-faint)]">{formatRelativeTime(t.lastMessageAt || t.updatedAt)}</span>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
