// نقشه‌ی مسیرهای پنل به ماژول‌های دسترسی (هم‌نام با back_end/src/config/permissions.js).
// بزرگ‌ترین پیشوندِ منطبق برنده است؛ مسیر بدون ماژول (مثل داشبورد) برای همه‌ی همکاران باز است.

const ROUTE_MODULES = [
  ["/orders", "orders"],
  ["/products", "products"],
  ["/pricing-intelligence", "products"],
  ["/vendors", "vendors"],
  ["/customers", "customers"],
  ["/crm", "customers"],
  ["/loyalty", "customers"],
  ["/support", "support"],
  ["/analytics", "analytics"],
  ["/financial", "financial"],
  ["/accounting", "financial"],
  ["/marketing", "marketing"],
  ["/seo", "seo"],
  ["/settings/taxonomy-seo", "seo"],
  ["/content/blog", "blog"],
  ["/content", "content"],
  ["/feed", "community"],
  ["/community", "community"],
  ["/beauty-profile", "beauty"],
  ["/beauty", "beauty"],
  ["/routine-builder", "beauty"],
  ["/ai", "ai"],
  ["/agents", "agents"],
  ["/integrations", "integrations"],
  ["/settings", "settings"],
  ["/system-health", "system"],
  ["/system", "system"],
  ["/staff", "staff"],
  ["/tasks", "tasks"],
].sort((a, b) => b[0].length - a[0].length);

export function moduleForRoute(pathname) {
  const p = String(pathname || "/").split("?")[0].replace(/\/+$/, "") || "/";
  for (const [prefix, module] of ROUTE_MODULES) {
    if (p === prefix || p.startsWith(`${prefix}/`)) return module;
  }
  return null;
}

export const LEVEL_LABELS = { none: "بدون دسترسی", view: "مشاهده", edit: "ویرایش" };
