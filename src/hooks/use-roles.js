"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRoles } from "@/lib/staff/api";

// نقش‌های موجود (برای انتخاب نقش همکار). اگر دریافت نشد، فقط نقش‌های سیستمی نمایش داده می‌شود.
const FALLBACK = [
  { key: "admin", name: "مدیر کل" },
  { key: "support", name: "پشتیبان" },
  { key: "product_manager", name: "مدیر محصول" },
  { key: "blogger", name: "بلاگر" },
  { key: "delivery", name: "پیک" },
  { key: "vendor", name: "فروشنده" },
];

export function useRoles() {
  const q = useQuery({ queryKey: ["roles"], queryFn: fetchRoles, staleTime: 30_000 });
  const roles = q.data?.roles?.length ? q.data.roles : FALLBACK;
  const nameOf = (key) => roles.find((r) => r.key === key)?.name || key;
  return { roles, modules: q.data?.modules ?? [], nameOf, isLoading: q.isLoading };
}
