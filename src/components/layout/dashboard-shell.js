"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Eye, ShieldOff } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PermissionProvider, usePermissions } from "@/hooks/use-permissions";
import { moduleForRoute } from "@/lib/rbac";
import { Skeleton } from "@/components/ui/skeleton";

function NoAccess() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--danger-bg)] text-[var(--danger)]">
        <ShieldOff size={26} />
      </div>
      <h1 className="text-lg font-bold text-[var(--text)]">به این بخش دسترسی ندارید</h1>
      <p className="text-sm leading-7 text-[var(--text-muted)]">
        نقش شما اجازه‌ی استفاده از این صفحه را ندارد. اگر فکر می‌کنید اشتباه است، با مدیر کل صحبت کنید تا دسترسی نقش شما را تغییر دهد.
      </p>
    </div>
  );
}

// گارد صفحه‌ها بر اساس ماژولِ مسیر + بنر «فقط مشاهده» برای نقش‌هایی که ویرایش ندارند.
// (سرور هم همین دسترسی‌ها را اعمال می‌کند؛ این فقط تجربه‌ی کاربر است.)
function AccessGuard({ children }) {
  const pathname = usePathname();
  const { can, level, isLoading, ready, isAdmin, panelAccess } = usePermissions();
  const mod = moduleForRoute(pathname);

  // نقش‌هایی که از اپ دیگری وارد می‌شوند (فروشنده/پیک) به هیچ بخشی از پنل راه ندارند
  if (ready && !isAdmin && panelAccess === false) return <NoAccess />;

  if (mod && !ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (mod && !isLoading && !can(mod, "view")) return <NoAccess />;

  return (
    <>
      {mod && level(mod) === "view" && (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--info-bg)] px-3 py-2 text-xs text-[var(--info)]">
          <Eye size={14} />
          دسترسی شما به این بخش «فقط مشاهده» است؛ ذخیره و تغییر از طرف سرور پذیرفته نمی‌شود.
        </div>
      )}
      {children}
    </>
  );
}

export function DashboardShell({ user, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <PermissionProvider user={user}>
      <div className="flex min-h-screen bg-[var(--bg)]">
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        {/* min-w-0 is required here: a flex item's default min-width is "auto",
            meaning it won't shrink below its content's intrinsic width. Without
            it, any wide child anywhere on any page (a table with min-w-[...],
            a chart) pushes this whole column — and with it the entire page —
            wider than the viewport, causing page-level horizontal scroll
            instead of the wide content scrolling within its own container. */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar user={user} onOpenMobile={() => setMobileOpen(true)} />
          <main className="min-w-0 flex-1 p-4 md:p-6">
            <AccessGuard>{children}</AccessGuard>
          </main>
        </div>
      </div>
    </PermissionProvider>
  );
}
