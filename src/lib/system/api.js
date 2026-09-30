import apiClient from "@/lib/apiClient";

// وضعیت سیستم — کلاینت API (بک‌اند: routes/admin/systemHealth.js)
export const fetchSystemHealth = () => apiClient.get("/api/admin/system/health").then((r) => r.data);
export const fetchAppLogs = (params) => apiClient.get("/api/admin/system/logs/app", { params }).then((r) => r.data?.logs ?? []);
export const clearAppLogs = () => apiClient.delete("/api/admin/system/logs/app").then((r) => r.data);
export const fetchLiaraLogs = (sinceSeconds) => apiClient.get("/api/admin/system/logs/liara", { params: { sinceSeconds } }).then((r) => r.data);
export const fetchJobs = () => apiClient.get("/api/admin/system/jobs").then((r) => r.data?.jobs ?? []);
export const setJobEnabled = (name, enabled) =>
  apiClient.patch("/api/admin/system/jobs", { name, enabled }).then((r) => r.data);
export const fetchJobLogs = (name) =>
  apiClient.get("/api/admin/system/jobs/logs", { params: { name, limit: 40 } }).then((r) => r.data?.logs ?? []);
