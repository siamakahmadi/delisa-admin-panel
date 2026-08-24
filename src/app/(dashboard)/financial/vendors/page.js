"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, CalendarRange, X, Check, Ban, Wallet as WalletIcon, Minus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  fetchWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  fetchVendorsWallets,
  creditVendor,
  payoutVendor,
} from "@/lib/financial/api";
import { formatToman, formatDateTime } from "@/lib/utils";

const WITHDRAWAL_STATUS_LABELS = { pending: "در انتظار", processing: "درحال پردازش", approved: "تأیید شده", rejected: "رد شده", paid: "پرداخت شده" };
const WITHDRAWAL_STATUS_VARIANT = { pending: "warning", processing: "info", approved: "success", rejected: "danger", paid: "success" };

function vendorLabel(v) {
  if (!v) return "—";
  return v.storeInfo?.storeName || [v.firstName, v.lastName].filter(Boolean).join(" ") || v.contactPhone || "—";
}

export default function VendorsSettlementPage() {
  return (
    <div>
      <PageHeader title="تسویه فروشندگان" subtitle="درخواست‌های برداشت و کیف پول فروشندگان" />
      <Tabs defaultValue="withdrawals">
        <TabsList>
          <TabsTrigger value="withdrawals">درخواست‌های برداشت</TabsTrigger>
          <TabsTrigger value="vendors">فروشندگان</TabsTrigger>
        </TabsList>
        <TabsContent value="withdrawals">
          <WithdrawalsTab />
        </TabsContent>
        <TabsContent value="vendors">
          <VendorsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WithdrawalsTab() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("");
  const [vendor, setVendor] = useState("");
  const debouncedVendor = useDebouncedValue(vendor);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [actionTarget, setActionTarget] = useState(null); // { req, type: "approve"|"reject" }
  const [paidAmount, setPaidAmount] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [note, setNote] = useState("");

  const params = {
    status: status || undefined,
    vendor: debouncedVendor || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 25,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["withdrawals", params],
    queryFn: () => fetchWithdrawals(params),
  });

  const requests = data?.requests ?? [];
  const meta = data?.meta ?? { totalPages: 1 };

  const closeAction = () => {
    setActionTarget(null);
    setPaidAmount("");
    setTrackingId("");
    setNote("");
  };

  const actionMutation = useMutation({
    mutationFn: () => {
      if (actionTarget.type === "approve") {
        return approveWithdrawal(actionTarget.req._id, { paidAmount: paidAmount || undefined, trackingId, note });
      }
      return rejectWithdrawal(actionTarget.req._id, { reason: note });
    },
    onSuccess: () => {
      toast.success(actionTarget.type === "approve" ? "برداشت تأیید و پرداخت شد" : "درخواست رد شد");
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      closeAction();
    },
    onError: (e) => toast.error(e?.response?.data?.message || "عملیات ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      { key: "vendor", header: "فروشنده", render: (row) => vendorLabel(row.vendor) },
      { key: "amount", header: "مبلغ درخواستی", render: (row) => formatToman(row.amount) },
      {
        key: "status",
        header: "وضعیت",
        render: (row) => (
          <Badge variant={WITHDRAWAL_STATUS_VARIANT[row.status] || "neutral"} size="sm" dot>
            {WITHDRAWAL_STATUS_LABELS[row.status] || row.status}
          </Badge>
        ),
      },
      { key: "createdAt", header: "تاریخ درخواست", render: (row) => formatDateTime(row.createdAt) },
      {
        key: "actions",
        header: "",
        render: (row) =>
          row.status === "pending" ? (
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setPaidAmount(String(row.amount)); setActionTarget({ req: row, type: "approve" }); }}>
                <Check size={14} />
                تأیید
              </Button>
              <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); setActionTarget({ req: row, type: "reject" }); }}>
                <Ban size={14} />
                رد
              </Button>
            </div>
          ) : null,
      },
    ],
    []
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-40">
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">همه وضعیت‌ها</option>
            <option value="pending">در انتظار</option>
            <option value="approved">تأیید شده</option>
            <option value="rejected">رد شده</option>
            <option value="paid">پرداخت شده</option>
          </Select>
        </div>
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <Input placeholder="جستجوی فروشنده..." className="pr-9" value={vendor} onChange={(e) => { setVendor(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarRange size={15} className="shrink-0 text-[var(--text-faint)]" />
          <div className="w-36">
            <JalaliDatePicker value={from} onChange={(v) => { setFrom(v); setPage(1); }} placeholder="از تاریخ" />
          </div>
          <span className="text-xs text-[var(--text-faint)]">تا</span>
          <div className="w-36">
            <JalaliDatePicker value={to} onChange={(v) => { setTo(v); setPage(1); }} placeholder="تا تاریخ" />
          </div>
          {(from || to) && (
            <button onClick={() => { setFrom(""); setTo(""); setPage(1); }} className="text-[var(--text-faint)] hover:text-[var(--danger)]">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={requests}
        isLoading={isLoading}
        emptyMessage="درخواستی یافت نشد"
        pagination={{ page, pageCount: meta.totalPages || 1, onPageChange: setPage }}
      />

      <Dialog open={!!actionTarget} onOpenChange={(open) => !open && closeAction()}>
        <DialogContent>
          <DialogTitle>{actionTarget?.type === "approve" ? "تأیید و پرداخت برداشت" : "رد درخواست برداشت"}</DialogTitle>
          <DialogDescription>
            فروشنده: {vendorLabel(actionTarget?.req?.vendor)} — مبلغ درخواستی: {formatToman(actionTarget?.req?.amount)}
          </DialogDescription>

          <div className="mt-4 space-y-3">
            {actionTarget?.type === "approve" && (
              <>
                <div>
                  <Label>مبلغ پرداخت‌شده</Label>
                  <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
                </div>
                <div>
                  <Label>کد پیگیری</Label>
                  <Input dir="ltr" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} />
                </div>
              </>
            )}
            <div>
              <Label>{actionTarget?.type === "approve" ? "یادداشت (اختیاری)" : "دلیل رد"}</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeAction}>انصراف</Button>
              <Button variant={actionTarget?.type === "reject" ? "danger" : "primary"} loading={actionMutation.isPending} onClick={() => actionMutation.mutate()}>
                تأیید
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VendorsTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [actionTarget, setActionTarget] = useState(null); // { vendor, type: "credit"|"payout" }
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["vendors-wallets", debouncedSearch],
    queryFn: () => fetchVendorsWallets({ search: debouncedSearch || undefined }),
  });

  const vendors = data?.vendors ?? [];

  const closeAction = () => {
    setActionTarget(null);
    setAmount("");
    setNote("");
  };

  const actionMutation = useMutation({
    mutationFn: () => {
      const payload = { amount: Number(amount), note };
      return actionTarget.type === "credit" ? creditVendor(actionTarget.vendor._id, payload) : payoutVendor(actionTarget.vendor._id, payload);
    },
    onSuccess: () => {
      toast.success(actionTarget.type === "credit" ? "کیف پول شارژ شد" : "برداشت از کیف پول ثبت شد");
      queryClient.invalidateQueries({ queryKey: ["vendors-wallets"] });
      closeAction();
    },
    onError: (e) => toast.error(e?.response?.data?.message || "عملیات ناموفق بود"),
  });

  const columns = useMemo(
    () => [
      { key: "name", header: "فروشنده", render: (row) => vendorLabel(row) },
      { key: "contactPhone", header: "شماره تماس", render: (row) => <span dir="ltr">{row.contactPhone}</span> },
      { key: "walletBalance", header: "موجودی کیف پول", render: (row) => formatToman(row.walletBalance) },
      { key: "reservedBalance", header: "بلوکه‌شده (درخواست برداشت)", render: (row) => formatToman(row.reservedBalance) },
      {
        key: "actions",
        header: "",
        render: (row) => (
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setActionTarget({ vendor: row, type: "credit" }); }}>
              <WalletIcon size={14} />
              شارژ
            </Button>
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setActionTarget({ vendor: row, type: "payout" }); }}>
              <Minus size={14} />
              کسر/پرداخت
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <div className="mb-4 relative w-full max-w-xs">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
        <Input placeholder="جستجوی فروشنده..." className="pr-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable columns={columns} data={vendors} isLoading={isLoading} emptyMessage="فروشنده‌ای یافت نشد" />

      <Dialog open={!!actionTarget} onOpenChange={(open) => !open && closeAction()}>
        <DialogContent>
          <DialogTitle>{actionTarget?.type === "credit" ? "شارژ دستی کیف پول" : "کسر/پرداخت دستی از کیف پول"}</DialogTitle>
          <DialogDescription>فروشنده: {vendorLabel(actionTarget?.vendor)} — موجودی فعلی: {formatToman(actionTarget?.vendor?.walletBalance)}</DialogDescription>

          <div className="mt-4 space-y-3">
            <div>
              <Label>مبلغ</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>یادداشت</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeAction}>انصراف</Button>
              <Button loading={actionMutation.isPending} onClick={() => actionMutation.mutate()}>ثبت</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
