"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ترتیب نمایش پیش‌فرض هم همینه — هر آیتم جدیدی که بعداً اضافه بشه به این
// آرایه اضافه می‌شه و خودکار «روشن» شروع می‌کنه مگر کاربر قبلاً خاموشش کرده باشه.
export const DASHBOARD_WIDGETS = [
  { id: "stats", label: "آمار کلی (کاربران، سفارش، فروش، تیکت)" },
  { id: "seo", label: "سلامت سئو" },
  { id: "chart", label: "روند فروش، سود و سفارشات" },
  { id: "orders", label: "سفارشات جدید و وضعیت تحویل" },
  { id: "chat", label: "پیام‌های جدید چت/تیکت" },
  { id: "stock", label: "هشدارهای موجودی و تغییر قیمت" },
  { id: "reviews", label: "نظرات منتظر تایید" },
];

// از zustand/persist استفاده می‌کنیم (همون الگوی uiStore) به‌جای
// useEffect+setState دستی برای خوندن localStorage — هم با قوانین React
// درباره‌ی setState داخل effect سازگارتره، هم rehydrate بعد از mount رو
// خودش هندل می‌کنه بدون میسمچ SSR/hydration.
const useDashboardWidgetsStore = create(
  persist(
    (set, get) => ({
      hidden: {}, // { [widgetId]: true } یعنی خاموش
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      isVisible: (id) => !get().hidden[id],
      setVisible: (id, visible) =>
        set((s) => ({ hidden: { ...s.hidden, [id]: !visible } })),
    }),
    {
      name: "delisa-admin-dashboard-widgets",
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);

export function useDashboardWidgetPrefs() {
  const ready = useDashboardWidgetsStore((s) => s._hasHydrated);
  const hidden = useDashboardWidgetsStore((s) => s.hidden);
  const setVisible = useDashboardWidgetsStore((s) => s.setVisible);

  return {
    ready,
    isVisible: (id) => !hidden[id],
    setVisible,
  };
}
