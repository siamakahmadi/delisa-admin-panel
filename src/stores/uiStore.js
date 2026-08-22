"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUiStore = create(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: "system",

      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          if (theme === "system") {
            document.documentElement.removeAttribute("data-theme");
          } else {
            document.documentElement.setAttribute("data-theme", theme);
          }
        }
      },

      toggleTheme: () => {
        const current = get().theme;
        const isDark =
          current === "dark" ||
          (current === "system" &&
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
        get().setTheme(isDark ? "light" : "dark");
      },
    }),
    { name: "admin-ui" }
  )
);

export default useUiStore;
