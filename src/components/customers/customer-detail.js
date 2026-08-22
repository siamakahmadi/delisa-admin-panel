"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Trash2, MessageSquare, Send } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatDateTime, formatToman } from "@/lib/utils";
import { CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_VARIANT, ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT } from "@/lib/constants";

export function CustomerDetail({ id }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => (await apiClient.get(`/api/admin/customers/${id}`)).data,
  });

  const statusMutation = useMutation({
    mutationFn: (status) => apiClient.patch(`/api/admin/customers/${id}/status`, { status }),
    onSuccess: () => {
      toast.success("وضعیت مشتری بروزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
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
    },
    onError: () => toast.error("ارسال پیام ناموفق بود"),
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
              <span className="text-[var(--text-muted)]">وضعیت</span>
              <StatusBadge status={profile.status} labels={CUSTOMER_STATUS_LABELS} variants={CUSTOMER_STATUS_VARIANT} />
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
            <Tabs defaultValue="orders" className="p-5">
              <TabsList>
                <TabsTrigger value="orders">سفارشات ({orders.length.toLocaleString("fa-IR")})</TabsTrigger>
                <TabsTrigger value="tickets">تیکت‌ها ({tickets.length.toLocaleString("fa-IR")})</TabsTrigger>
              </TabsList>

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
