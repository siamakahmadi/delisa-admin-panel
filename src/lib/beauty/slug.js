// اسلاگ‌های Beauty Hub برخلاف بقیه‌ی سایت (که اسلاگ فارسی محصولات را
// می‌پذیرند) عمداً باید انگلیسی و تمیز برای سئو باشند (مثل oily-skin،
// acne، niacinamide) — بک‌اند هم دقیقاً همین قانون را چک می‌کند
// (controllers/admin/beauty/genericEntityController.js). slugify عمومی
// سایت حروف فارسی را چون Unicode Letter هستند نگه می‌دارد، پس این نسخه‌ی
// جداگانه فقط حروف/عدد انگلیسی را می‌پذیرد و بقیه را حذف می‌کند.
const BEAUTY_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function asciiSlugify(text) {
  return String(text ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidBeautySlug(slug) {
  return BEAUTY_SLUG_REGEX.test(String(slug || ""));
}
