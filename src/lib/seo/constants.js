// برچسب‌ها و رنگ‌های مشترک مرکز سئو (هم‌نام با بک‌اند services/seo/checks.js)
export const SEVERITY = {
  error: { label: "خطا", badge: "danger", color: "var(--danger)", bg: "var(--danger-bg)" },
  warning: { label: "هشدار", badge: "warning", color: "var(--warning)", bg: "var(--warning-bg)" },
  notice: { label: "پیشنهاد", badge: "info", color: "var(--info)", bg: "var(--info-bg)" },
  passed: { label: "درست", badge: "success", color: "var(--success)", bg: "var(--success-bg)" },
  skipped: { label: "بی‌صدا", badge: "neutral", color: "var(--text-faint)", bg: "var(--surface-muted)" },
};

export const CATEGORY_LABELS = {
  meta: "عنوان و توضیحات متا",
  keyword: "کلمه کلیدی کانونی",
  content: "محتوا و خوانایی",
  links: "لینک‌دهی",
  images: "تصاویر",
  technical: "فنی",
  indexing: "ایندکس‌پذیری",
  structured: "داده ساختاریافته",
  social: "شبکه‌های اجتماعی",
  performance: "سرعت و عملکرد",
  site: "سطح سایت",
};

export const ENTITY_LABELS = {
  static: "صفحات ثابت",
  product: "محصولات",
  category: "دسته‌بندی‌ها",
  brand: "برندها",
  tag: "برچسب‌ها",
  productType: "نوع محصول",
  post: "مقالات بلاگ",
  blogCategory: "دسته‌های بلاگ",
  blogTag: "تگ‌های بلاگ",
  landing: "صفحات فرود",
  infoPage: "صفحات اطلاعات",
  skinType: "انواع پوست",
  skinConcern: "دغدغه‌های پوستی",
  ingredient: "ترکیبات",
  routine: "قالب‌های روتین",
  site: "سایت",
};

export const MODE_LABELS = {
  full: "کامل (محتوا + خزش سایت)",
  quick: "سریع (محتوا + خزش ۴۰ صفحه)",
  content: "فقط محتوا (بدون خزش)",
};

export const PHASE_LABELS = {
  queued: "در صف",
  collecting: "جمع‌آوری صفحات",
  analyzing: "تحلیل محتوا",
  site: "بررسی سطح سایت",
  crawling: "خزش صفحات",
  links: "بررسی لینک‌ها",
  summarizing: "محاسبه نمره",
  done: "پایان",
  failed: "خطا",
  cancelled: "لغو شد",
};

export function scoreColor(score) {
  if (score == null) return "var(--text-faint)";
  if (score >= 90) return "var(--success)";
  if (score >= 75) return "#22c55e";
  if (score >= 60) return "var(--accent-amber)";
  if (score >= 40) return "#f97316";
  return "var(--danger)";
}

export function scoreLabel(score) {
  if (score == null) return "نامشخص";
  if (score >= 90) return "عالی";
  if (score >= 75) return "خوب";
  if (score >= 60) return "قابل قبول";
  if (score >= 40) return "نیاز به بهبود";
  return "ضعیف";
}

export const CUSTOMER_SITE_URL = (process.env.NEXT_PUBLIC_CUSTOMER_SITE_URL || "https://delisa.shop").replace(/\/+$/, "");
