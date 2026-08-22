"use client";

import { useRouter } from "next/navigation";
import { Menu, Moon, Sun, LogOut, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import useUiStore from "@/stores/uiStore";
import { clearSession, getUser } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar({ onOpenMobile }) {
  const router = useRouter();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const user = typeof window !== "undefined" ? getUser() : null;

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]/80 px-4 backdrop-blur md:px-6">
      <button
        onClick={onOpenMobile}
        className="rounded-[var(--radius-md)] p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] md:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <button
        onClick={toggleTheme}
        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
        aria-label="تغییر پوسته"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-[var(--radius-md)] py-1.5 pl-2 pr-1 hover:bg-[var(--surface-muted)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--accent-pink)] text-white">
              <User size={15} />
            </div>
            <div className="hidden text-start sm:block">
              <div className="text-xs font-semibold text-[var(--text)]">
                {user?.name || "ادمین"}
              </div>
              <div className="text-[11px] text-[var(--text-faint)]">{user?.phone || ""}</div>
            </div>
            <ChevronDown size={14} className="text-[var(--text-faint)]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem danger onSelect={handleLogout}>
            <LogOut size={15} />
            خروج از حساب
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
