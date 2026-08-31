"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Search, Plus, Minus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { fetchLoyaltyMembers, fetchLoyaltyMemberDetail, adjustLoyaltyMemberPoints } from "@/lib/loyalty/api";

const TYPE_LABELS = { earn: "کسب امتیاز", redeem: "مصرف امتیاز", adjust: "تنظیم دستی", reward: "پاداش سطح" };

export function LoyaltyMembersTab() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["loyalty-members", q, page], queryFn: () => fetchLoyaltyMembers(q, page) });
  const members = data?.members ?? [];

  if (selectedCustomerId) {
    return <MemberDetail customerId={selectedCustomerId} onBack={() => setSelectedCustomerId(null)} />;
  }

  const columns = [
    { key: "name", header: "مشتری", render: (row) => row.name || row.phone || "—" },
    { key: "phone", header: "موبایل", render: (row) => <span dir="ltr">{row.phone || "—"}</span> },
    { key: "tierKey", header: "سطح", render: (row) => (row.tierKey ? <Badge size="sm" variant="neutral">{row.tierKey}</Badge> : "—") },
    { key: "pointsBalance", header: "موجودی امتیاز", render: (row) => <strong>{row.pointsBalance.toLocaleString("fa-IR")}</strong> },
    { key: "lifetimePoints", header: "کل کسب‌شده", render: (row) => row.lifetimePoints.toLocaleString("fa-IR") },
  ];

  return (
    <div>
      <p className="mb-3 text-sm text-[var(--text-muted)]">همه‌ی مشتریان سایت اینجا نمایش داده می‌شوند — عضویت در باشگاه اختیاری نیست، کسی که هنوز امتیازی کسب نکرده با موجودی ۰ دیده می‌شود.</p>
      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
        <Input className="pr-8" placeholder="جستجو با نام یا موبایل..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </div>
      <DataTable
        columns={columns}
        data={members}
        isLoading={isLoading}
        emptyMessage="عضوی یافت نشد"
        onRowClick={(row) => setSelectedCustomerId(row._id)}
      />
    </div>
  );
}

function MemberDetail({ customerId, onBack }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["loyalty-member-detail", customerId],
    queryFn: () => fetchLoyaltyMemberDetail(customerId),
  });

  const mutation = useMutation({
    mutationFn: (payload) => adjustLoyaltyMemberPoints(customerId, payload),
    onSuccess: () => {
      toast.success("امتیاز تنظیم شد");
      queryClient.invalidateQueries({ queryKey: ["loyalty-member-detail", customerId] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-members"] });
      setAdjustPoints("");
      setAdjustNote("");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ثبت ناموفق بود"),
  });

  const submitAdjust = (sign) => {
    const n = Number(adjustPoints);
    if (!n || n <= 0) {
      toast.error("مقدار امتیاز را وارد کنید");
      return;
    }
    if (!adjustNote.trim()) {
      toast.error("توضیح تغییر الزامی است");
      return;
    }
    mutation.mutate({ points: sign * n, description: adjustNote.trim() });
  };

  if (isLoading) return <p className="py-6 text-center text-sm text-[var(--text-faint)]">در حال بارگذاری...</p>;

  const { customer, account, transactions } = data || {};

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" onClick={onBack}>
        <ArrowRight size={15} />
        بازگشت به لیست اعضا
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{customer?.name || customer?.phone}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="موبایل" value={customer?.phone} dir="ltr" />
            <Stat label="موجودی امتیاز" value={(account?.pointsBalance ?? 0).toLocaleString("fa-IR")} />
            <Stat label="کل کسب‌شده" value={(account?.lifetimePoints ?? 0).toLocaleString("fa-IR")} />
            <Stat label="سطح فعلی" value={account?.tierKey || "—"} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تنظیم دستی امتیاز</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>مقدار امتیاز</Label>
              <Input type="number" min={1} value={adjustPoints} onChange={(e) => setAdjustPoints(e.target.value)} />
            </div>
            <div>
              <Label>توضیح (برای تاریخچه، الزامی)</Label>
              <Input value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} placeholder="مثلاً: جبران مشکل ارسال سفارش" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => submitAdjust(1)} loading={mutation.isPending}>
              <Plus size={14} />
              افزودن امتیاز
            </Button>
            <Button variant="danger" onClick={() => submitAdjust(-1)} loading={mutation.isPending}>
              <Minus size={14} />
              کسر امتیاز
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تاریخچه تراکنش‌ها</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!transactions?.length ? (
            <p className="text-sm text-[var(--text-faint)]">تراکنشی ثبت نشده است.</p>
          ) : (
            transactions.map((t) => (
              <div key={t._id} className="flex items-center justify-between border-b border-[var(--border)] py-2 text-sm last:border-0">
                <div>
                  <span className="block font-medium text-[var(--text)]">{t.description}</span>
                  <span className="text-xs text-[var(--text-faint)]">
                    {TYPE_LABELS[t.type]} · {new Date(t.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                </div>
                <span className={`font-bold ${t.points >= 0 ? "text-[var(--success-600)]" : "text-[var(--danger)]"}`}>
                  {t.points >= 0 ? "+" : ""}
                  {t.points.toLocaleString("fa-IR")}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, dir }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-bold text-[var(--text)]" dir={dir}>{value ?? "—"}</p>
    </div>
  );
}
