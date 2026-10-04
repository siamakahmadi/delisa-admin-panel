export const PAYMENT_STATUS = {
  unpaid: { label: "پرداخت‌نشده", variant: "danger" },
  partial: { label: "پرداخت ناقص", variant: "warning" },
  paid: { label: "تسویه‌شده", variant: "success" },
};

export const METHOD_LABELS = {
  cash: "نقد",
  card: "کارت به کارت",
  bank_transfer: "انتقال بانکی",
  cheque: "چک",
  other: "سایر",
};

/* balance > 0 → I owe the supplier; < 0 → they hold an advance of mine */
export function balanceInfo(balance) {
  const b = Number(balance || 0);
  if (b > 0) return { label: "بدهکارم", variant: "danger", tone: "text-[var(--danger)]", amount: b };
  if (b < 0) return { label: "پیش‌پرداخت", variant: "success", tone: "text-[var(--success)]", amount: -b };
  return { label: "تسویه", variant: "neutral", tone: "text-[var(--text-muted)]", amount: 0 };
}

// today as YYYY-MM-DD in the browser's local time (not UTC)
export function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toIsoDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
