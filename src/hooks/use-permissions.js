"use client";

import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { getUser } from "@/lib/auth";

const PermissionContext = createContext({
  ready: false,
  isAdmin: false,
  role: null,
  permissions: {},
  level: () => "none",
  can: () => false,
});

export function PermissionProvider({ user, children }) {
  const cookieUser = user || getUser();
  const cookieIsAdmin = cookieUser?.role === "admin";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["rbac-me"],
    queryFn: async () => (await apiClient.get("/api/rbac/me")).data,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const value = useMemo(() => {
    const isAdmin = data ? data.isAdmin === true : cookieIsAdmin;
    const permissions = data?.permissions || {};
    const level = (module) => (isAdmin ? "edit" : permissions[module] || "none");
    return {
      // تا جواب سرور نیامده، فقط ادمین (از کوکی) بدون انتظار پنل را می‌بیند
      ready: !!data || isError || cookieIsAdmin,
      isLoading: isLoading && !cookieIsAdmin,
      isAdmin,
      role: data?.role || (cookieUser ? { key: cookieUser.role, name: cookieUser.role } : null),
      panelAccess: data ? data.panelAccess !== false : true,
      permissions,
      level,
      can: (module, need = "view") => {
        if (!module) return true; // مسیر/آیتم بدون ماژول: برای همه باز است
        const l = level(module);
        return need === "edit" ? l === "edit" : l === "edit" || l === "view";
      },
    };
  }, [data, isLoading, isError, cookieIsAdmin, cookieUser]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions() {
  return useContext(PermissionContext);
}
