// Fixed registry of the customer-site locations a campaign banner/slider can
// be placed in. Each `value` must have a matching <CampaignBlock slot="..."/>
// wired into delisa-customer (see delisa-customer/src/lib/campaignSlots.js).
export const CAMPAIGN_SLOTS = [
  { value: "home-top", label: "بالای صفحه اصلی" },
  { value: "home-mid", label: "وسط صفحه اصلی" },
  { value: "home-bottom", label: "پایین صفحه اصلی" },
  { value: "category-top", label: "بالای صفحه دسته‌بندی" },
  { value: "product-sidebar", label: "سایدبار صفحه محصول" },
  { value: "product-bottom", label: "پایین صفحه محصول" },
  { value: "blog-top", label: "بالای صفحه بلاگ" },
  { value: "blog-mid", label: "وسط صفحه بلاگ (سایدبار)" },
];
