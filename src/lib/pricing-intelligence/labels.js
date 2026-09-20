export const STATUS_LABELS = {
  PENDING: { label: "در انتظار", variant: "neutral" },
  RECOMMENDED: { label: "پیشنهاد شده", variant: "info" },
  APPROVED: { label: "تأیید شده", variant: "success" },
  APPLIED: { label: "اعمال شده", variant: "success" },
  REJECTED: { label: "رد شده", variant: "danger" },
  NEEDS_REVIEW: { label: "نیاز به بررسی", variant: "warning" },
  BLOCKED: { label: "مسدود", variant: "neutral" },
};

export const STRATEGY_LABELS = {
  STANDARD: "استاندارد",
  COMPETITIVE: "رقابتی",
  PROFIT_MAXIMIZER: "حداکثر سود",
  TRAFFIC_PRODUCT: "جذب ترافیک",
  CLEARANCE: "تخلیه موجودی",
  PREMIUM: "پرمیوم",
  MANUAL: "دستی",
};

export const MODE_LABELS = {
  MANUAL: "فقط دستی",
  RECOMMEND: "فقط پیشنهاد",
  AUTO: "اعمال خودکار (محدود)",
};

export function formatPercent(ratio) {
  if (ratio == null || Number.isNaN(Number(ratio))) return "—";
  const n = Math.abs(Number(ratio)) <= 1 && Number(ratio) !== 0 ? Number(ratio) * 100 : Number(ratio);
  return `${n.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪`;
}

export function formatSignedToman(value) {
  const n = Number(value || 0);
  const abs = Math.abs(n).toLocaleString("fa-IR");
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${Math.abs(n).toLocaleString("fa-IR")}`;
  return abs;
}
