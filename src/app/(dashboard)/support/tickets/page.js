"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ticket as TicketIcon, Inbox, Loader2, CheckCircle2, Send } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDateTime } from "@/lib/utils";
import { fetchTickets, sendAdminAnnouncement } from "@/lib/support/api";
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_VARIANTS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_VARIANTS,
  TICKET_TYPE_LABELS,
  ticketSenderName,
  ticketSenderPhone,
} from "@/lib/support/constants";

const TABS = [
  { value: "all", label: "همه" },
  { value: "open", label: "باز" },
  { value: "in_progress", label: "در حال بررسی" },
  { value: "waiting", label: "در انتظار پاسخ" },
  { value: "closed", label: "بسته‌شده" },
];

function AnnounceDialog({ open, onOpenChange }) {
  const toast = useToast();
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("customer");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      sendAdminAnnouncement({
        phone,
        role: role === "vendor" ? "Vendor" : "Customer",
        type: role,
        message,
        title: "اعلان از طرف ادمین",
      }),
    onSuccess: () => {
      toast.success("پیام ارسال شد");
      setPhone("");
      setMessage("");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e?.response?.data?.message || "خطا در ارسال پیام"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>ارسال پیام به کاربر</DialogTitle>
        <DialogDescription>یک پیام یک‌طرفه (به‌صورت تیکت بسته‌شده) برای مشتری یا فروشنده ارسال می‌شود.</DialogDescription>
        <div className="mt-4 space-y-3">
          <div>
            <Label>شماره تلفن</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxxx" dir="ltr" />
          </div>
          <div>
            <Label>نقش</Label>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="customer">مشتری</option>
              <option value="vendor">فروشنده</option>
            </Select>
          </div>
          <div>
            <Label>پیام</Label>
            <textarea
              className="min-h-[100px] w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            loading={mutation.isPending}
            disabled={!phone.trim() || !message.trim()}
            onClick={() => mutation.mutate()}
          >
            <Send size={15} />
            ارسال پیام
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TicketsListPage() {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [announceOpen, setAnnounceOpen] = useState(false);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: fetchTickets,
  });

  const counts = useMemo(() => {
    const c = { all: tickets.length, open: 0, in_progress: 0, waiting: 0, closed: 0 };
    tickets.forEach((t) => {
      if (c[t.status] !== undefined) c[t.status] += 1;
    });
    return c;
  }, [tickets]);

  const filtered = useMemo(() => {
    let list = tickets;
    if (tab !== "all") list = list.filter((t) => t.status === tab);
    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) => t.title?.toLowerCase().includes(q) || ticketSenderName(t).toLowerCase().includes(q) || ticketSenderPhone(t).includes(q)
      );
    }
    return list;
  }, [tickets, tab, debouncedSearch]);

  const columns = [
    {
      key: "date",
      header: "تاریخ",
      sortable: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      render: (row) => <span className="whitespace-nowrap text-xs text-[var(--text-muted)]">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: "title",
      header: "عنوان",
      render: (row) => (
        <div className="max-w-[260px]">
          <p className="truncate text-sm font-medium text-[var(--text)]">{row.title}</p>
          {row.topic && <p className="truncate text-xs text-[var(--text-faint)]">{row.topic}</p>}
        </div>
      ),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => <StatusBadge status={row.status} labels={TICKET_STATUS_LABELS} variants={TICKET_STATUS_VARIANTS} />,
    },
    {
      key: "priority",
      header: "اهمیت",
      render: (row) => <StatusBadge status={row.priority} labels={TICKET_PRIORITY_LABELS} variants={TICKET_PRIORITY_VARIANTS} />,
    },
    {
      key: "sender",
      header: "ارسال‌کننده",
      render: (row) => (
        <div>
          <p className="text-sm text-[var(--text)]">{ticketSenderName(row)}</p>
          <p className="text-xs text-[var(--text-faint)]" dir="ltr">
            {ticketSenderPhone(row)}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "نوع",
      render: (row) => <span className="text-xs text-[var(--text-muted)]">{TICKET_TYPE_LABELS[row.type] || row.type}</span>,
    },
    {
      key: "assignedTo",
      header: "پشتیبان",
      render: (row) => <span className="text-xs text-[var(--text-muted)]">{row.assignedTo?.name || "—"}</span>,
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => router.push(`/support/tickets/${row._id}`)}>
          مشاهده تیکت
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="تیکت‌های پشتیبانی"
        subtitle="مدیریت تیکت‌های دریافتی از مشتریان و فروشندگان"
        actions={
          <Button variant="secondary" onClick={() => setAnnounceOpen(true)}>
            <Send size={15} />
            ارسال پیام
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={TicketIcon} label="کل تیکت‌ها" value={counts.all.toLocaleString("fa-IR")} color="violet" isLoading={isLoading} />
        <StatCard icon={Inbox} label="باز" value={counts.open.toLocaleString("fa-IR")} color="amber" isLoading={isLoading} />
        <StatCard icon={Loader2} label="در حال بررسی" value={counts.in_progress.toLocaleString("fa-IR")} color="blue" isLoading={isLoading} />
        <StatCard icon={CheckCircle2} label="بسته‌شده" value={counts.closed.toLocaleString("fa-IR")} color="teal" isLoading={isLoading} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                {t.value !== "all" && counts[t.value] > 0 && (
                  <span className="mr-1.5 rounded-full bg-[var(--surface)] px-1.5 text-[10px] text-[var(--text-muted)]">
                    {counts[t.value].toLocaleString("fa-IR")}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Input className="w-64" placeholder="جستجوی عنوان یا ارسال‌کننده..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="تیکتی یافت نشد" onRowClick={(row) => router.push(`/support/tickets/${row._id}`)} />

      <AnnounceDialog open={announceOpen} onOpenChange={setAnnounceOpen} />
    </div>
  );
}
