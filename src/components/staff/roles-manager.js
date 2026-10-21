"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, Save, ShieldCheck, Trash2, Lock, Users, Eye, Pencil, Ban } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useRoles } from "@/hooks/use-roles";
import { usePermissions } from "@/hooks/use-permissions";
import { createRole, updateRole, deleteRole } from "@/lib/staff/api";
import { cn } from "@/lib/utils";

const COLORS = ["#ce3263", "#7c5cff", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#64748b", "#14b8a6"];

const LEVEL_OPTIONS = [
  { value: "none", label: "ندارد", icon: Ban, active: "bg-[var(--surface-muted)] text-[var(--text-muted)]" },
  { value: "view", label: "مشاهده", icon: Eye, active: "bg-[var(--info-bg)] text-[var(--info)]" },
  { value: "edit", label: "ویرایش", icon: Pencil, active: "bg-[var(--success-bg)] text-[var(--success)]" },
];

function LevelSwitch({ value, onChange, disabled }) {
  return (
    <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--border)] p-0.5">
      {LEVEL_OPTIONS.map((o) => {
        const Icon = o.icon;
        const on = (value || "none") === o.value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center gap-1 rounded-[calc(var(--radius-md)-2px)] px-2.5 py-1 text-xs font-medium transition-colors",
              on ? o.active : "text-[var(--text-faint)] hover:text-[var(--text)]",
              disabled && "cursor-not-allowed opacity-70"
            )}
          >
            <Icon size={12} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}


function RoleEditor({ role, modules, isAdmin, onDeleted }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(() => ({
    name: role.name,
    description: role.description || "",
    color: role.color || "#7c5cff",
    panelAccess: role.panelAccess !== false,
    permissions: { ...(role.permissions || {}) },
  }));
  const [deleteOpen, setDeleteOpen] = useState(false);

  const selected = role;
  const locked = role.locked || !isAdmin;
  const dirty =
    JSON.stringify(draft) !==
    JSON.stringify({
      name: role.name,
      description: role.description || "",
      color: role.color || "#7c5cff",
      panelAccess: role.panelAccess !== false,
      permissions: { ...(role.permissions || {}) },
    });

  const groups = useMemo(() => {
    const map = new Map();
    for (const m of modules) {
      if (!map.has(m.group)) map.set(m.group, []);
      map.get(m.group).push(m);
    }
    return [...map.entries()];
  }, [modules]);

  const apiError = (e) => toast.error(e?.response?.data?.message || "عملیات ناموفق بود");

  const saveMutation = useMutation({
    mutationFn: () => updateRole(role._id, draft),
    onSuccess: () => {
      toast.success("نقش ذخیره شد");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["rbac-me"] });
    },
    onError: apiError,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRole(role._id),
    onSuccess: () => {
      toast.success("نقش حذف شد");
      setDeleteOpen(false);
      onDeleted();
    },
    onError: (e) => {
      setDeleteOpen(false);
      apiError(e);
    },
  });

  const setLevel = (key, level) =>
    setDraft((d) => {
      const permissions = { ...d.permissions };
      if (level === "none") delete permissions[key];
      else permissions[key] = level;
      return { ...d, permissions };
    });

  const setAll = (level) =>
    setDraft((d) => ({ ...d, permissions: level === "none" ? {} : Object.fromEntries(modules.map((m) => [m.key, level])) }));

  return (
    <>
          {draft && selected && (
            <Card>
              <CardContent className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} style={{ color: draft.color }} />
                    <h2 className="text-base font-bold text-[var(--text)]">{selected.name}</h2>
                    <span className="text-[11px] text-[var(--text-faint)]" dir="ltr">{selected.key}</span>
                  </div>
                  {selected.locked && <Badge variant="brand" size="sm">دسترسی کامل · قابل ویرایش نیست</Badge>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>نام نقش</Label>
                    <Input disabled={locked} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>رنگ</Label>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          disabled={locked}
                          onClick={() => setDraft((d) => ({ ...d, color: c }))}
                          className={cn("h-7 w-7 rounded-full border-2", draft.color === c ? "border-[var(--text)]" : "border-transparent")}
                          style={{ background: c }}
                          aria-label={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <Label>توضیح</Label>
                  <Input disabled={locked} value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="این نقش برای چه کسانی است؟" />
                </div>
                <label className={cn("flex items-center gap-2 text-sm", locked && "opacity-60")}>
                  <input
                    type="checkbox"
                    disabled={locked}
                    checked={draft.panelAccess}
                    onChange={(e) => setDraft((d) => ({ ...d, panelAccess: e.target.checked }))}
                    className="h-4 w-4 accent-[var(--brand-600)]"
                  />
                  <span className="text-[var(--text)]">ورود به پنل مدیریت مجاز است</span>
                  <span className="text-[11px] text-[var(--text-faint)]">(برای فروشنده و پیک که از اپ خودشان وارد می‌شوند خاموش است)</span>
                </label>

                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text)]">دسترسی به بخش‌ها</h3>
                    {!locked && (
                      <div className="flex gap-1.5 text-xs">
                        <Button size="sm" variant="outline" onClick={() => setAll("view")}>همه: مشاهده</Button>
                        <Button size="sm" variant="outline" onClick={() => setAll("edit")}>همه: ویرایش</Button>
                        <Button size="sm" variant="outline" onClick={() => setAll("none")}>پاک کردن</Button>
                      </div>
                    )}
                  </div>
                  <p className="mb-3 text-[11px] leading-6 text-[var(--text-faint)]">
                    «مشاهده» یعنی فقط خواندن؛ «ویرایش» یعنی ساخت، تغییر و حذف هم مجاز است. این سطوح سمت سرور اعمال می‌شوند و فقط مخفی‌کردن منو نیستند.
                  </p>
                  <div className="space-y-4">
                    {groups.map(([group, mods]) => (
                      <div key={group}>
                        <div className="mb-1 text-[11px] font-semibold text-[var(--text-faint)]">{group}</div>
                        <div className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)]">
                          {mods.map((m) => (
                            <div key={m.key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                              <span className="text-sm text-[var(--text)]">{m.label}</span>
                              <LevelSwitch value={selected.locked ? "edit" : draft.permissions[m.key]} disabled={locked} onChange={(lv) => setLevel(m.key, lv)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!selected.locked && isAdmin && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
                    <Button variant="danger" disabled={selected.isSystem} onClick={() => setDeleteOpen(true)}>
                      <Trash2 size={16} />
                      حذف نقش
                    </Button>
                    <Button loading={saveMutation.isPending} disabled={!dirty || !draft.name.trim()} onClick={() => saveMutation.mutate()}>
                      <Save size={16} />
                      ذخیره تغییرات
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف نقش"
        description={`نقش «${selected.name}» حذف شود؟ اگر همکاری این نقش را دارد حذف انجام نمی‌شود.`}
        confirmLabel="حذف"
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </>
  );
}

export function RolesManager() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = usePermissions();
  const { roles, modules, isLoading } = useRoles();

  const [selectedKey, setSelectedKey] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", base: "" });

  // انتخاب پیش‌فرض (قبل از کلیک کاربر): اولین نقش غیر ادمین
  const selected = roles.find((r) => r.key === selectedKey) || roles.find((r) => r.key !== "admin") || roles[0] || null;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["roles"] });
  const apiError = (e) => toast.error(e?.response?.data?.message || "عملیات ناموفق بود");

  const createMutation = useMutation({
    mutationFn: () => {
      const base = roles.find((r) => r.key === newRole.base);
      return createRole({ name: newRole.name.trim(), permissions: base?.permissions || {}, panelAccess: base ? base.panelAccess : true });
    },
    onSuccess: (role) => {
      toast.success("نقش ساخته شد؛ حالا دسترسی‌هایش را تنظیم کنید");
      setCreateOpen(false);
      setNewRole({ name: "", base: "" });
      setSelectedKey(role.key);
      refresh();
    },
    onError: apiError,
  });

  return (
    <div>
      <PageHeader
        title="نقش‌ها و دسترسی‌ها"
        subtitle="برای هر نقش مشخص کنید کدام بخش‌های پنل را ببیند یا ویرایش کند"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/staff")}>
              <ArrowRight size={16} />
              همکاران
            </Button>
            {isAdmin && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                نقش جدید
              </Button>
            )}
          </div>
        }
      />

      {!isAdmin && (
        <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--info-bg)] px-3 py-2 text-xs text-[var(--info)]">
          فقط مدیر کل می‌تواند نقش بسازد یا دسترسی‌ها را تغییر دهد؛ شما فقط می‌توانید آن‌ها را ببینید.
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {roles.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setSelectedKey(r.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-start transition-colors",
                  r.key === selected?.key
                    ? "border-[var(--brand-500)] bg-[var(--surface-muted)] shadow-[var(--shadow-sm)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong,var(--border))]"
                )}
              >
                <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: r.color }} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text)]">
                    <span className="truncate">{r.name}</span>
                    {r.locked && <Lock size={12} className="shrink-0 text-[var(--text-faint)]" />}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--text-faint)]">
                    <Users size={11} />
                    {(r.staffCount ?? 0).toLocaleString("fa-IR")} همکار
                    {r.isSystem && <Badge size="sm" variant="neutral">سیستمی</Badge>}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {selected && (
            <RoleEditor
              key={`${selected._id}|${selected.name}|${selected.description}|${selected.color}|${selected.panelAccess}|${JSON.stringify(selected.permissions)}`}
              role={selected}
              modules={modules}
              isAdmin={isAdmin}
              onDeleted={() => {
                setSelectedKey(null);
                queryClient.invalidateQueries({ queryKey: ["roles"] });
              }}
            />
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogTitle>نقش جدید</DialogTitle>
          <div className="mt-4 space-y-3">
            <div>
              <Label>نام نقش</Label>
              <Input value={newRole.name} onChange={(e) => setNewRole((n) => ({ ...n, name: e.target.value }))} placeholder="مثلاً: اپراتور انبار" />
            </div>
            <div>
              <Label>شروع از دسترسی‌های (اختیاری)</Label>
              <Select value={newRole.base} onChange={(e) => setNewRole((n) => ({ ...n, base: e.target.value }))}>
                <option value="">نقش خالی (بدون دسترسی)</option>
                {roles.map((r) => (
                  <option key={r.key} value={r.key}>{r.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>انصراف</Button>
              <Button loading={createMutation.isPending} disabled={!newRole.name.trim()} onClick={() => createMutation.mutate()}>
                ساخت نقش
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
