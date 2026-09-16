import apiClient from "@/lib/apiClient";

// وضعیت سیستم — کلاینت API (بک‌اند: routes/admin/systemHealth.js)
export const fetchSystemHealth = () => apiClient.get("/api/admin/system/health").then((r) => r.data);
export const fetchAppLogs = (params) => apiClient.get("/api/admin/system/logs/app", { params }).then((r) => r.data?.logs ?? []);
export const clearAppLogs = () => apiClient.delete("/api/admin/system/logs/app").then((r) => r.data);
export const fetchLiaraLogs = (sinceSeconds) => apiClient.get("/api/admin/system/logs/liara", { params: { sinceSeconds } }).then((r) => r.data);
