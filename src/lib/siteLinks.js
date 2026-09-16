import { CUSTOMER_SITE_URL } from "@/lib/seo/constants";

// لینک‌ساز به صفحات واقعی سایت مشتری — همیشه با اسلاگ (نه شناسه‌ی دیتابیس)
// تا هم آدرس درست کار کنه هم قابل‌فهم باشه.
export function productSiteUrl(slugOrId) {
  if (!slugOrId) return null;
  return `${CUSTOMER_SITE_URL}/product/${encodeURIComponent(slugOrId)}`;
}

export function categorySiteUrl(slug) {
  if (!slug) return null;
  return `${CUSTOMER_SITE_URL}/${encodeURIComponent(slug)}`;
}

export function brandSiteUrl(slug) {
  if (!slug) return null;
  return `${CUSTOMER_SITE_URL}/brand/${encodeURIComponent(slug)}`;
}
