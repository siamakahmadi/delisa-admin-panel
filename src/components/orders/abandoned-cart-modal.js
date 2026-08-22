"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, MessageSquare, ImageOff, User, Phone } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatDateTime, formatToman } from "@/lib/utils";

export function AbandonedCartModal({ cart, open, onOpenChange }) {
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [showMessageBox, setShowMessageBox] = useState(false);

  const messageMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/admin/customers/${cart.customer?._id}/message`, { message }),
    onSuccess: () => {
      toast.success("پیام ارسال شد");
      setMessage("");
      setShowMessageBox(false);
    },
    onError: () => toast.error("ارسال پیام ناموفق بود"),
  });

  if (!cart) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>سبد رها‌شده</DialogTitle>
        <DialogDescription>جزئیات کامل سبد خرید رها‌شده</DialogDescription>

        <div className="mt-4 space-y-4">
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
              <User size={14} />
              {cart.customer?.name || "بدون نام"}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]" dir="ltr">
              <Phone size={12} />
              {cart.customer?.phone || "-"}
            </div>
            <p className="mt-1.5 text-[11px] text-[var(--text-faint)]">
              آخرین بروزرسانی سبد: {formatDateTime(cart.updatedAt)}
            </p>
          </div>

          <div className="space-y-2">
            {(cart.items ?? []).map((item, i) => {
              const title = item.snapshotTitle || item.product?.productName || "محصول";
              const price = item.snapshotPrice ?? item.product?.finalPrice ?? 0;
              const image = item.product?.productImages?.[0]?.url;
              return (
                <div key={i} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-2.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff size={16} className="text-[var(--text-faint)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text)]">{title}</p>
                    <p className="text-xs text-[var(--text-faint)]">تعداد: {item.quantity?.toLocaleString("fa-IR")}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{formatToman(price * (item.quantity || 1))}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-sm font-bold">
            <span>جمع سبد</span>
            <span className="text-[var(--brand-600)]">{formatToman(cart.finalPrice || cart.totalPrice)}</span>
          </div>

          {showMessageBox ? (
            <div className="space-y-2 rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3">
              <p className="text-[11px] text-[var(--text-faint)]">
                این پیام به‌صورت تیکت پشتیبانی برای مشتری ارسال می‌شود. اتصال به پنل پیامکی و قالب یادآوری سبد خرید
                به‌زودی اضافه می‌شود.
              </p>
              <div className="flex gap-2">
                <Input placeholder="متن پیام..." value={message} onChange={(e) => setMessage(e.target.value)} />
                <Button
                  size="icon"
                  disabled={!message.trim()}
                  loading={messageMutation.isPending}
                  onClick={() => messageMutation.mutate()}
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setShowMessageBox(true)}>
              <MessageSquare size={16} />
              ارسال پیام یادآوری
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
