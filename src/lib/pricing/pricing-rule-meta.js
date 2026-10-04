export const TARGET_TYPE_LABELS = {
  all: "همه محصولات",
  product: "محصول خاص",
  category: "دسته‌بندی",
  brand: "برند",
  tag: "برچسب",
};

export const STATUS_LABELS = {
  draft: { label: "پیش‌نویس", variant: "neutral" },
  applied: { label: "اعمال شده", variant: "success" },
  reverted: { label: "بازگردانی شده", variant: "warning" },
};

export function summarizeTargets(targets = []) {
  if (!targets.length || targets.some((t) => t.type === "all")) return "همه محصولات";
  return targets
    .map((t) => `${TARGET_TYPE_LABELS[t.type] || t.type} (${t.ids?.length ?? 0})`)
    .join("، ");
}

// client-side mirror of the backend validation, so the admin sees the problem
// before a round trip
export function validateRuleForm(f) {
  const percent = Number(f.percent);
  if (!String(f.name || "").trim()) return "نام قانون را وارد کنید";
  if (!Number.isFinite(percent) || percent <= 0) return "درصد باید بزرگ‌تر از صفر باشد";
  if (f.direction === "decrease" && percent >= 100) return "درصد کاهش باید کمتر از ۱۰۰ باشد";
  const min = f.minFinalPrice === "" ? null : Number(f.minFinalPrice);
  const max = f.maxFinalPrice === "" ? null : Number(f.maxFinalPrice);
  if (min !== null && max !== null && min > max) return "حداقل قیمت نباید از حداکثر بیشتر باشد";
  for (const t of f.targets) {
    if (t.type !== "all" && !t.ids.length) return "برای هر هدف حداقل یک مورد انتخاب کنید";
  }
  return null;
}

// same arithmetic as the server's computeNewPrice, for the live example
export function computePrice(price, f) {
  const percent = Number(f.percent) || 0;
  let next = price * (f.direction === "increase" ? 1 + percent / 100 : 1 - percent / 100);
  const step = Number(f.roundingStep);
  if (step > 0) {
    const fn = { floor: Math.floor, ceil: Math.ceil }[f.roundingMethod] || Math.round;
    next = fn(next / step) * step;
  } else {
    next = Math.round(next);
  }
  if (f.minFinalPrice !== "" && f.minFinalPrice != null) next = Math.max(next, Number(f.minFinalPrice));
  if (f.maxFinalPrice !== "" && f.maxFinalPrice != null) next = Math.min(next, Number(f.maxFinalPrice));
  return Math.max(0, Math.round(next));
}
