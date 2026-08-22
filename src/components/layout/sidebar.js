"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import navConfig from "@/lib/navConfig";
import useUiStore from "@/stores/uiStore";

function isActive(pathname, href, exact) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function groupHasActive(pathname, group) {
  return group.items.some((item) => isActive(pathname, item.href, item.exact));
}

export function Sidebar({ mobileOpen, onCloseMobile }) {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const [overrides, setOverrides] = useState(() => new Map());

  const isGroupOpen = (entry) =>
    overrides.has(entry.id) ? overrides.get(entry.id) : groupHasActive(pathname, entry);

  const toggleGroup = (entry) => {
    setOverrides((prev) => new Map(prev).set(entry.id, !isGroupOpen(entry)));
  };

  const content = (
    <div
      className="flex h-full flex-col text-[var(--sidebar-text)]"
      style={{ background: "var(--sidebar-bg)" }}
    >
      <div className={cn("flex items-center gap-2.5 px-5 py-5", collapsed && "justify-center px-0")}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-500)] to-[var(--accent-pink)] text-white">
          <Sparkles size={18} />
        </div>
        {!collapsed && <span className="text-sm font-bold text-white">پنل دلیسا</span>}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-none px-3 pb-4">
        <ul className="space-y-1">
          {navConfig.map((entry) => {
            if (entry.type === "link") {
              const active = isActive(pathname, entry.href, entry.exact);
              const Icon = entry.icon;
              return (
                <li key={entry.id}>
                  <Link
                    href={entry.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-gradient-to-l from-[var(--brand-600)] to-[var(--brand-500)] text-white shadow-[var(--shadow-sm)]"
                        : "hover:bg-[var(--sidebar-bg-hover)] hover:text-white"
                    )}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && <span>{entry.label}</span>}
                  </Link>
                </li>
              );
            }

            const Icon = entry.icon;
            const open = isGroupOpen(entry) && !collapsed;
            const active = groupHasActive(pathname, entry);

            return (
              <li key={entry.id}>
                <button
                  onClick={() => (collapsed ? toggleSidebar() : toggleGroup(entry))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "text-white" : "hover:bg-[var(--sidebar-bg-hover)] hover:text-white"
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-start">{entry.label}</span>
                      <ChevronDown
                        size={14}
                        className={cn("transition-transform", open && "rotate-180")}
                      />
                    </>
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden pr-3"
                    >
                      {entry.items.map((item) => {
                        const itemActive = isActive(pathname, item.href, item.exact);
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={onCloseMobile}
                              className={cn(
                                "mt-0.5 flex items-center gap-2 rounded-[var(--radius-sm)] py-2 pr-6 text-[13px] transition-colors",
                                itemActive
                                  ? "font-semibold text-white"
                                  : "text-[var(--sidebar-text)] hover:text-white"
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  itemActive ? "bg-[var(--accent-pink)]" : "bg-[var(--sidebar-text)] opacity-40"
                                )}
                              />
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        onClick={toggleSidebar}
        className="mx-3 mb-4 flex items-center justify-center gap-2 rounded-[var(--radius-md)] py-2.5 text-xs text-[var(--sidebar-text)] hover:bg-[var(--sidebar-bg-hover)] hover:text-white"
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        {!collapsed && "جمع کردن منو"}
      </button>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 transition-all duration-200 md:block",
          collapsed ? "w-[76px]" : "w-[264px]"
        )}
      >
        {content}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
            />
            <motion.aside
              initial={{ x: 280 }}
              animate={{ x: 0 }}
              exit={{ x: 280 }}
              transition={{ type: "tween", duration: 0.22 }}
              className="fixed inset-y-0 right-0 z-50 w-[264px] md:hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
