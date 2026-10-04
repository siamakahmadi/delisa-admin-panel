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

export const JOB_TYPE_LABELS = {
  "refresh-competitors": "به‌روزرسانی قیمت رقبا",
  analyze: "تحلیل و پیشنهاد قیمت",
  "generate-recommendations": "ساخت پیشنهاد قیمت",
  "apply-automatic": "اعمال خودکار پیشنهادها",
  auto: "اعمال خودکار",
  "search-competitors": "جستجوی رقبا",
};

export const JOB_SCOPE_LABELS = {
  all: "همه محصولات",
  category: "یک دسته",
  product: "یک محصول",
  due: "موارد سررسیده",
  "auto-enabled": "محصولات خودکار",
};

export const JOB_STATUS_LABELS = {
  queued: { label: "در صف", variant: "neutral" },
  running: { label: "در حال اجرا", variant: "info" },
  done: { label: "انجام شد", variant: "success" },
  failed: { label: "ناموفق", variant: "danger" },
};

export const AUDIT_ACTION_LABELS = {
  add_competitor: "ثبت قیمت رقیب",
  apply_price: "اعمال قیمت روی محصول",
  approve_recommendation: "تأیید پیشنهاد",
  reject_recommendation: "رد پیشنهاد",
  bulk_approve: "تأیید گروهی",
  bulk_purchase_cost: "ثبت گروهی قیمت خرید",
  bulk_strategy: "تغییر گروهی استراتژی",
  enqueue_job: "شروع جاب پس‌زمینه",
  ingest_competitor_urls: "افزودن لینک رقبا",
  refresh_competitors: "به‌روزرسانی قیمت رقبا",
  save_pricing_workbook: "ذخیره جدول مقایسه بازار",
  search_competitors: "جستجوی رقبا",
  update_product_config: "تنظیمات محصول",
  update_settings: "تغییر تنظیمات موتور",
  upsert_competitor_source: "ثبت منبع رقیب",
  upsert_scope: "تنظیم دسته/برند",
  ledger_sync_purchase_cost: "قیمت خرید از فاکتور (حساب و کتاب)",
};
