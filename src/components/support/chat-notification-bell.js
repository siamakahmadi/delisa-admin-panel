"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { fetchLiveChats } from "@/lib/support/api";
import { ticketSenderName } from "@/lib/support/constants";
import { getLiveChatSocket } from "@/lib/support/liveChatSocket";

// zustand/persist (همون الگوی uiStore) به‌جای useEffect+setState دستی —
// «می‌خوام این مرورگر اعلان بده یا نه» یک ترجیح شخصیه، نه تنظیمات سراسری
// فروشگاه، برای همین سمت کلاینت و مخصوص همین مرورگر ذخیره می‌شه.
const useChatNotifyStore = create(
  persist((set) => ({ enabled: true, setEnabled: (v) => set({ enabled: v }) }), {
    name: "delisa-admin-chat-notify-enabled",
  })
);

// یک «دینگ» دو-نتی کوتاه با Web Audio — بدون نیاز به فایل صوتی جداگانه.
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.11;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
    setTimeout(() => ctx.close(), 700);
  } catch {
    // بی‌صدا نادیده گرفته می‌شود — نبود صدا نباید باعث خطا در کنسول شود
  }
}

/**
 * زنگوله‌ی اعلان چت زنده در هدر پنل — همیشه سوار است (نه فقط توی صفحه‌ی
 * چت‌ها)، پس با سوکت مشترک هر پیام جدید مشتری/مهمان را در هر صفحه‌ای از
 * ادمین که باشیم می‌گیرد: صدا پخش می‌کند، اگر اجازه‌ی مرورگر گرفته شده
 * باشد Notification نشون می‌ده، و تعداد چت‌های خوانده‌نشده رو به‌صورت
 * بج نشون می‌ده. کاملاً قابل خاموش/روشن‌شدن (localStorage، مخصوص همین
 * مرورگر — چون «می‌خوام این مرورگر اعلان بده یا نه» یک ترجیح شخصیه، نه
 * تنظیمات سراسری فروشگاه).
 */
export function ChatNotificationBell() {
  const [open, setOpen] = useState(false);
  const enabled = useChatNotifyStore((s) => s.enabled);
  const setEnabled = useChatNotifyStore((s) => s.setEnabled);
  const ref = useRef(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: chats = [] } = useQuery({
    queryKey: ["admin-live-chats"],
    queryFn: fetchLiveChats,
    refetchInterval: 20000,
  });

  const unreadChats = chats.filter((t) => Number(t.unreadByStaff || 0) > 0);
  const unreadCount = unreadChats.reduce((sum, t) => sum + Number(t.unreadByStaff || 0), 0);

  const notify = useCallback((ticket, messageText) => {
    if (!useChatNotifyStore.getState().enabled) return;
    playChime();
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      const n = new Notification("پیام جدید پشتیبانی — دلیسا", {
        body: `${ticketSenderName(ticket) || "مشتری"}: ${messageText || "پیام جدید دریافت شد"}`,
        icon: "/favicon.ico",
        tag: `delisa-chat-${ticket?._id || "new"}`,
      });
      n.onclick = () => {
        window.focus();
        router.push("/support/live-chat");
      };
    } catch {
      // برخی مرورگرها بدون تعامل کاربر throw می‌کنن — بی‌خطر نادیده می‌گیریم
    }
  }, [router]);

  useEffect(() => {
    const socket = getLiveChatSocket();
    if (!socket) return;

    const onMessage = ({ ticketId, message } = {}) => {
      queryClient.invalidateQueries({ queryKey: ["admin-live-chats"] });
      if (message?.senderModel === "StaffUser") return; // پاسخ خودمون رو به خودمون اعلان نده
      const ticket = chats.find((c) => c._id === ticketId) || { _id: ticketId };
      notify(ticket, message?.message);
    };
    const onNewChat = (ticket) => {
      queryClient.invalidateQueries({ queryKey: ["admin-live-chats"] });
      notify(ticket, "یک گفتگوی جدید شروع شد");
    };

    socket.on("support:message", onMessage);
    socket.on("support:new_chat", onNewChat);
    return () => {
      socket.off("support:message", onMessage);
      socket.off("support:new_chat", onNewChat);
    };
  }, [chats, notify, queryClient]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleEnabled = async () => {
    const next = !enabled;
    if (next && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        // اجازه رد شد — همچنان صدا پخش می‌شه، فقط Notification مرورگر نه
      }
    }
    setEnabled(next);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-label="اعلان‌های چت پشتیبانی"
        className={cn(
          "relative flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border px-2.5 text-xs font-semibold transition-colors hover:bg-[var(--surface-muted)]",
          open ? "border-[var(--brand-300)] bg-[var(--surface-muted)]" : "border-[var(--border)]"
        )}
      >
        {enabled ? <Bell size={15} className="text-[var(--text-muted)]" /> : <BellOff size={15} className="text-[var(--text-faint)]" />}
        {unreadCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1.5 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "۹۹+" : unreadCount.toLocaleString("fa-IR")}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] animate-toast-in">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] p-3">
            <p className="text-sm font-bold text-[var(--text)]">چت‌های خوانده‌نشده</p>
            <button
              type="button"
              onClick={toggleEnabled}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                enabled ? "bg-[var(--brand-50)] text-[var(--brand-700)]" : "bg-[var(--surface-muted)] text-[var(--text-faint)]"
              )}
            >
              {enabled ? <Bell size={12} /> : <BellOff size={12} />}
              اعلان {enabled ? "روشن" : "خاموش"}
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {unreadChats.length === 0 ? (
              <p className="p-4 text-center text-xs text-[var(--text-muted)]">پیام خوانده‌نشده‌ای نیست 🎉</p>
            ) : (
              unreadChats.map((t) => (
                <Link
                  key={t._id}
                  href="/support/live-chat"
                  onClick={() => setOpen(false)}
                  className="flex items-start justify-between gap-2 rounded-[var(--radius-md)] p-2.5 transition-colors hover:bg-[var(--surface-muted)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-[var(--text)]">{ticketSenderName(t)}</span>
                    <span className="block truncate text-[11px] text-[var(--text-faint)]">{t.lastMessageText || "بدون پیام"}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-600)] px-1.5 text-[10px] font-bold text-white">
                      {Number(t.unreadByStaff).toLocaleString("fa-IR")}
                    </span>
                    <span className="text-[10px] text-[var(--text-faint)]">{formatRelativeTime(t.lastMessageAt || t.updatedAt)}</span>
                  </span>
                </Link>
              ))
            )}
          </div>

          <Link
            href="/support/live-chat"
            onClick={() => setOpen(false)}
            className="block border-t border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-center text-xs font-semibold text-[var(--brand-700)] hover:bg-[var(--brand-50)]"
          >
            رفتن به چت‌های زنده
          </Link>
        </div>
      )}
    </div>
  );
}
