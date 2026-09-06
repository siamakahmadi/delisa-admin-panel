"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Trash2,
  MessageSquare,
  Send,
  Plus,
  X,
  ShoppingBag,
  Ticket as TicketIcon,
  Gem,
  Bell,
  Zap,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatDateTime, formatToman, formatNumber } from "@/lib/utils";
import { CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_VARIANT, ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT } from "@/lib/constants";
import { fetchCustomerTags } from "@/lib/crm/api";

const LIFECYCLE_LABELS = { new: "جدید", active: "فعال", vip: "VIP", at_risk: "در خطر", inactive: "غیرفعال" };
const LIFECYCLE_VARIANT = { new: "info", active: "success", vip: "brand", at_risk: "warning", inactive: "neutral" };

const TIMELINE_ICONS = { order: ShoppingBag, ticket: TicketIcon, loyalty: Gem, notification: Bell, automation: Zap };
const TIMELINE_LABELS = {
  order: (d) => `سفارش ${d.orderCode || ""} — ${formatToman(d.finalPrice)}`,
  ticket: (d) => `تیکت: ${d.title}`,
  loyalty: (d) => `امتیاز وفاداری: ${d.points > 0 ? "+" : ""}${d.points} (${d.sourceKey})`,
  notification: (d) => `پیام ارسالی: ${d.title || d.notifType}`,
  automation: (d) => `اتوماسیون اجرا شد: ${d.ruleName}`,
};

export function CustomerDetail({ id }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [noteText, setNoteText] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => (await apiClient.get(`/api/admin/customers/${id}`)).data,
  });

  const { data: allTags } = useQuery({ queryKey: ["customer-tags"], queryFn: fetchCustomerTags });
  const { data: staffData } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => (await apiClient.get("/api/auth/staff-list")).data?.users ?? [],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["customer", id] });

  const statusMutation = useMutation({
    mutationFn: (status) => apiClient.patch(`/api/admin/customers/${id}/status`, { status }),
    onSuccess: () => {
      toast.success("وضعیت مشتری بروزرسانی شد");
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/admin/customers/${id}`),
    onSuccess: () => {
      toast.success("مشتری حذف شد");
      router.push("/customers");
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const messageMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/admin/customers/${id}/message`, { message }),
    onSuccess: () => {
      toast.success("پیام ارسال شد");
      setMessage("");
      setMessageOpen(false);
      invalidate();
    },
    onError: () => toast.error("ارسال پیام ناموفق بود"),
  });

  const addNoteMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/admin/customers/${id}/notes`, { text: noteText }),
    onSuccess: () => {
      setNoteText("");
      invalidate();
    },
    onError: () => toast.error("ثبت یادداشت ناموفق بود"),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId) => apiClient.delete(`/api/admin/customers/${id}/notes/${noteId}`),
    onSuccess: invalidate,
  });

  const tagsMutation = useMutation({
    mutationFn: (tagIds) => apiClient.patch(`/api/admin/customers/${id}/tags`, { tagIds }),
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: (staffId) => apiClient.patch(`/api/admin/customers/${id}/assign`, { staffId }),
    onSuccess: () => {
      toast.success("مالک مشتری تغییر کرد");
      invalidate();
    },
  });

  const lifecycleMutation = useMutation({
    mutationFn: (stage) => apiClient.patch(`/api/admin/customers/${id}/lifecycle`, { stage }),
    onSuccess: () => {
      toast.success("مرحله چرخه عمر بروزرسانی شد");
      invalidate();
    },
  });

  const prefsMutation = useMutation({
    mutationFn: (prefs) => apiClient.patch(`/api/admin/customers/${id}/communication-prefs`, prefs),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const profile = data?.profile;
  if (!profile) return <p className="text-sm text-[var(--text-muted)]">مشتری یافت نشد.</p>;

  const orders = data?.orders ?? [];
  const tickets = data?.tickets ?? [];
  const timeline = data?.timeline ?? [];
  const stats = profile.stats || {};
  const currentTagIds = (profile.tags || []).map((t) => t._id);

  const toggleTag = (tagId) => {
    const next = currentTagIds.includes(tagId) ? currentTagIds.filter((t) => t !== tagId) : [...currentTagIds, tagId];
    tagsMutation.mutate(next);
  };

  return (
    <div>
      <PageHeader
        title={profile.name || "مشتری"}
        subtitle={profile.phone}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/customers")}>
              <ArrowRight size={16} />
              بازگشت
            </Button>
            <Button variant="secondary" onClick={() => setMessageOpen(true)}>
              <MessageSquare size={16} />
              ارسال پیام
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} />
              حذف مشتری
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="مجموع خرید" value={formatToman(stats.totalSpent)} />
        <StatCard label="تعداد سفارش موفق" value={formatNumber(stats.totalOrders)} />
        <StatCard label="میانگین سفارش" value={formatToman(stats.avgOrderValue)} />
        <StatCard label="آخرین خرید" value={stats.lastOrderAt ? formatDate(stats.lastOrderAt) : "—"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>اطلاعات مشتری</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="نام" value={profile.name} />
            <Row label="شماره تماس" value={<span dir="ltr">{profile.phone}</span>} />
            <Row label="ایمیل" value={profile.email || "-"} />
            <Row label="تاریخ عضویت" value={formatDate(profile.createdAt)} />
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">وضعیت حساب</span>
              <StatusBadge status={profile.status} labels={CUSTOMER_STATUS_LABELS} variants={CUSTOMER_STATUS_VARIANT} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">مرحله چرخه عمر</span>
              <Select
                className="!h-8 w-32 text-xs"
                value={profile.lifecycleStage}
                onChange={(e) => lifecycleMutation.mutate(e.target.value)}
              >
                {Object.entries(LIFECYCLE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">مالک مشتری</span>
              <Select
                className="!h-8 w-32 text-xs"
                value={profile.assignedTo?._id || ""}
                onChange={(e) => assignMutation.mutate(e.target.value || null)}
              >
                <option value="">— بدون مالک —</option>
                {(staffData ?? []).map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5 border-t border-[var(--border)] pt-3">
              <span className="text-xs text-[var(--text-muted)]">ترجیحات ارتباطی</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--brand-600)]"
                    checked={profile.communicationPrefs?.sms !== false}
                    onChange={(e) => prefsMutation.mutate({ sms: e.target.checked })}
                  />
                  پیامک
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--brand-600)]"
                    checked={profile.communicationPrefs?.push !== false}
                    onChange={(e) => prefsMutation.mutate({ push: e.target.checked })}
                  />
                  پوش نوتیفیکیشن
                </label>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-[var(--border)] pt-3">
              <span className="text-xs text-[var(--text-muted)]">تگ‌ها</span>
              <div className="flex flex-wrap gap-1.5">
                {(allTags ?? []).map((tag) => {
                  const active = currentTagIds.includes(tag._id);
                  return (
                    <button key={tag._id} onClick={() => toggleTag(tag._id)}>
                      <Badge
                        size="sm"
                        style={{
                          background: active ? tag.color : `${tag.color}22`,
                          color: active ? "#fff" : tag.color,
                        }}
                      >
                        {tag.name}
                      </Badge>
                    </button>
                  );
                })}
                {!allTags?.length && <span className="text-xs text-[var(--text-faint)]">تگی تعریف نشده (از /crm)</span>}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate(profile.status === "disabled" ? "active" : "disabled")}
            >
              {profile.status === "disabled" ? "فعال‌سازی مشتری" : "غیرفعال‌سازی مشتری"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <Tabs defaultValue="timeline" className="p-5">
              <TabsList>
                <TabsTrigger value="timeline">تایم‌لاین</TabsTrigger>
                <TabsTrigger value="orders">سفارشات ({formatNumber(orders.length)})</TabsTrigger>
                <TabsTrigger value="tickets">تیکت‌ها ({formatNumber(tickets.length)})</TabsTrigger>
                <TabsTrigger value="notes">یادداشت‌ها ({formatNumber(profile.notes?.length || 0)})</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline">
                {timeline.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[var(--text-faint)]">هنوز رویدادی ثبت نشده است.</p>
                ) : (
                  <div className="space-y-2">
                    {timeline.map((item, idx) => {
                      const Icon = TIMELINE_ICONS[item.type] || Bell;
                      const label = TIMELINE_LABELS[item.type]?.(item.data) || item.type;
                      return (
                        <div key={idx} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                          <Icon size={16} className="mt-0.5 shrink-0 text-[var(--brand-500)]" />
                          <div className="flex-1">
                            <p className="text-sm">{label}</p>
                            <p className="mt-0.5 text-xs text-[var(--text-faint)]">{formatDateTime(item.date)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="orders">
                {orders.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[var(--text-faint)]">سفارشی ثبت نشده است.</p>
                ) : (
                  <div className="space-y-2">
                    {orders.map((o) => (
                      <div
                        key={o._id}
                        onClick={() => router.push(`/orders/${o._id}`)}
                        className="flex cursor-pointer items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] p-3 hover:bg-[var(--surface-muted)]"
                      >
                        <div>
                          <p className="text-sm font-medium">{o.orderCode}</p>
                          <p className="text-xs text-[var(--text-faint)]">{formatDateTime(o.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">{formatToman(o.finalPrice)}</span>
                          <StatusBadge status={o.status} labels={ORDER_STATUS_LABELS} variants={ORDER_STATUS_VARIANT} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tickets">
                {tickets.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[var(--text-faint)]">تیکتی ثبت نشده است.</p>
                ) : (
                  <div className="space-y-2">
                    {tickets.map((t) => (
                      <div key={t._id} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                        <p className="text-sm font-medium">{t.title}</p>
                        <p className="mt-1 text-xs text-[var(--text-faint)]">{formatDateTime(t.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes">
                <div className="mb-3 flex gap-2">
                  <Input
                    placeholder="یادداشت جدید برای این مشتری..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <Button disabled={!noteText.trim()} loading={addNoteMutation.isPending} onClick={() => addNoteMutation.mutate()}>
                    <Plus size={15} />
                  </Button>
                </div>
                {(profile.notes?.length ?? 0) === 0 ? (
                  <p className="py-8 text-center text-sm text-[var(--text-faint)]">یادداشتی ثبت نشده است.</p>
                ) : (
                  <div className="space-y-2">
                    {[...profile.notes].reverse().map((note) => (
                      <div key={note._id} className="flex items-start justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                        <div>
                          <p className="text-sm">{note.text}</p>
                          <p className="mt-1 text-xs text-[var(--text-faint)]">
                            {note.author?.name || "ادمین"} · {formatDateTime(note.createdAt)}
                          </p>
                        </div>
                        <button onClick={() => deleteNoteMutation.mutate(note._id)} className="text-[var(--text-faint)] hover:text-[var(--danger)]">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف مشتری"
        description="این عملیات غیرقابل بازگشت است. مشتری برای همیشه حذف می‌شود."
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />

      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent>
          <DialogTitle>ارسال پیام به مشتری</DialogTitle>
          <DialogDescription>پیام شما به‌صورت تیکت پشتیبانی برای مشتری ارسال می‌شود.</DialogDescription>
          <div className="mt-4 space-y-3">
            <Input placeholder="متن پیام..." value={message} onChange={(e) => setMessage(e.target.value)} />
            <Button
              className="w-full"
              disabled={!message.trim()}
              loading={messageMutation.isPending}
              onClick={() => messageMutation.mutate()}
            >
              <Send size={16} />
              ارسال پیام
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-medium text-[var(--text)]">{value}</span>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="mt-1 text-lg font-bold text-[var(--text)]">{value}</p>
      </CardContent>
    </Card>
  );
}
