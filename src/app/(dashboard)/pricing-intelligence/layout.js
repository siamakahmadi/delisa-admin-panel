"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/pricing-intelligence", label: "نمای کلی", exact: true },
  { href: "/pricing-intelligence/market", label: "مقایسه بازار" },
  { href: "/pricing-intelligence/products", label: "جدول محصولات" },
  { href: "/pricing-intelligence/simulate", label: "شبیه‌سازی" },
  { href: "/pricing-intelligence/settings", label: "تنظیمات موتور" },
  { href: "/pricing-intelligence/audit", label: "تاریخچه و جاب‌ها" },
];

export default function PricingIntelligenceLayout({ children }) {
  const pathname = usePathname();
  return (
    <div>
      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-1">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "whitespace-nowrap rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
