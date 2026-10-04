"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Ban, ShieldCheck } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchCommunityProfiles, updateCommunityProfile } from "@/lib/community/api";
import { Pager, formatDateTime } from "./shared";

export function CommunityProfilesManager() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [banTarget, setBanTarget] = useState(null);

  const params = { page, ...(q ? { q } : {}), ...(filter === "banned" ? { banned: "true" } : {}), ...(filter === "verified" ? { verified: "true" } : {}) };
  const { data, isLoading } = useQuery({ queryKey: ["community-profiles", params], queryFn: () => fetchCommunityProfiles(params) });

  const mutation = useMutation({
    mutationFn: ({ id, body }) => updateCommunityProfile(id, body),
    onSuccess: () => {
      toast.success("ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["community-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["community-stats"] });
      setBanTarget(null);
    },
    onError: () => toast.error("عملیات ناموفق بود"),
  });

  const columns = [
    {
      key: "user",
      header: "کاربر",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {row.avatar ? <img src={row.avatar} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="h-9 w-9 rounded-full bg-[var(--surface-muted)]" />}
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-sm font-medium text-[var(--text)]">
              {row.displayName}
              {row.isVerified && <BadgeCheck size={14} className="text-[var(--info)]" />}
            </p>
            <p dir="ltr" className="text-start text-xs text-[var(--text-faint)]">@{row.username}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "موبایل", render: (row) => <span dir="ltr">{row.phone || "—"}</span> },
    { key: "posts", header: "پست", render: (row) => row.posts.toLocaleString("fa-IR") },
    { key: "followers", header: "دنبال‌کننده", render: (row) => row.followers.toLocaleString("fa-IR") },
    { key: "createdAt", header: "عضویت", render: (row) => formatDateTime(row.createdAt) },
    {
      key: "state",
      header: "وضعیت",
      render: (row) => (row.isBanned ? <Badge variant="danger" size="sm" dot>مسدود</Badge> : <Badge variant="success" size="sm" dot>فعال</Badge>),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" title={row.isVerified ? "حذف نشان تایید" : "نشان تایید (رسمی)"} onClick={() => mutation.mutate({ id: row.id, body: { isVerified: !row.isVerified } })}>
            <BadgeCheck size={15} className={row.isVerified ? "text-[var(--info)]" : "text-[var(--text-faint)]"} />
          </Button>
          {row.isBanned ? (
            <Button variant="ghost" size="icon" title="رفع مسدودی" onClick={() => mutation.mutate({ id: row.id, body: { isBanned: false } })}>
              <ShieldCheck size={15} className="text-[var(--success)]" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" title="مسدودکردن" onClick={() => setBanTarget(row)}>
              <Ban size={15} className="text-[var(--danger)]" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="نام یا نام کاربری…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <Select className="w-40" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="">همه</option>
          <option value="banned">مسدودها</option>
          <option value="verified">تاییدشده‌ها</option>
        </Select>
      </div>

      <DataTable columns={columns} data={data?.profiles ?? []} isLoading={isLoading} emptyMessage="کاربری یافت نشد" />
      <Pager page={page} pages={data?.pages} onChange={setPage} />

      <ConfirmDialog
        open={!!banTarget}
        onOpenChange={(open) => !open && setBanTarget(null)}
        title="مسدودکردن کاربر"
        description={`@${banTarget?.username || ""} دیگر نمی‌تواند در کامیونیتی فعالیت کند و پست‌هایش برای دیگران دیده نمی‌شود. بعداً قابل برگشت است.`}
        confirmLabel="مسدود شود"
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate({ id: banTarget.id, body: { isBanned: true, bannedReason: "نقض قوانین کامیونیتی" } })}
      />
    </div>
  );
}
