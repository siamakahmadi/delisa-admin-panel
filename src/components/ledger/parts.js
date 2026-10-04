"use client";

import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS, balanceInfo } from "@/lib/ledger/format";
import { formatToman, formatNumber } from "@/lib/utils";

export function PaymentStatusBadge({ status, overdue }) {
  const s = PAYMENT_STATUS[status] || PAYMENT_STATUS.unpaid;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant={s.variant} size="sm" dot>{s.label}</Badge>
      {overdue && <Badge variant="danger" size="sm">سررسید گذشته</Badge>}
    </span>
  );
}

export function Balance({ value, className = "" }) {
  const b = balanceInfo(value);
  if (!b.amount) return <span className="text-[var(--text-muted)]">تسویه</span>;
  return (
    <span className={`tabular-nums ${b.tone} ${className}`}>
      {formatToman(b.amount)} <span className="text-[11px] opacity-80">({b.label})</span>
    </span>
  );
}

export function Qty({ value }) {
  return <span className="tabular-nums">{formatNumber(value)}</span>;
}

// small helper line under a page title explaining what the page is for
export function PageHint({ children }) {
  return (
    <p className="mb-4 rounded-[var(--radius-md)] bg-[var(--info-bg)] px-4 py-3 text-sm leading-6 text-[var(--info)]">
      {children}
    </p>
  );
}

export function SectionTabs({ items, active, onChange }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-1">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onChange(it.id)}
          className={`whitespace-nowrap rounded-[var(--radius-sm)] px-3.5 py-1.5 text-sm font-medium transition-colors ${
            active === it.id
              ? "bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-sm)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          {it.label}
          {it.count != null && <span className="mr-1.5 text-xs text-[var(--text-faint)]">{formatNumber(it.count)}</span>}
        </button>
      ))}
    </div>
  );
}
