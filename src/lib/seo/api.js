import apiClient from "@/lib/apiClient";

// مرکز سئو — کلاینت API (بک‌اند: routes/admin/seo.js)
export const fetchSeoHealth = () => apiClient.get("/api/admin/seo/health").then((r) => r.data);
export const fetchSeoOverview = () => apiClient.get("/api/admin/seo/overview").then((r) => r.data);
export const fetchSeoAudits = (limit = 30) => apiClient.get("/api/admin/seo/audits", { params: { limit } }).then((r) => r.data?.audits ?? []);
export const fetchCurrentAudit = () => apiClient.get("/api/admin/seo/audits/current").then((r) => r.data?.running ?? null);
export const startSeoAudit = (mode = "full") => apiClient.post("/api/admin/seo/audits", { mode }).then((r) => r.data);
export const cancelSeoAudit = () => apiClient.post("/api/admin/seo/audits/cancel").then((r) => r.data);
export const fetchSeoIssues = (params) => apiClient.get("/api/admin/seo/issues", { params }).then((r) => r.data);
export const fetchSeoPages = (params) => apiClient.get("/api/admin/seo/pages", { params }).then((r) => r.data);
export const fetchSeoPage = (id) => apiClient.get(`/api/admin/seo/pages/${id}`).then((r) => r.data?.report);
export const recheckSeoPage = (id) => apiClient.post(`/api/admin/seo/pages/${id}/recheck`).then((r) => r.data?.report);
export const fetchEntityReport = (type, id) => apiClient.get(`/api/admin/seo/entity/${type}/${id}`).then((r) => r.data?.report ?? null);
export const analyzeSeoDraft = (payload) => apiClient.post("/api/admin/seo/analyze", payload).then((r) => r.data);
export const fetchSeoSettings = () => apiClient.get("/api/admin/seo/settings").then((r) => r.data);
export const updateSeoSettings = (payload) => apiClient.put("/api/admin/seo/settings", payload).then((r) => r.data);
export const muteSeoCheck = (id) => apiClient.post(`/api/admin/seo/checks/${id}/mute`).then((r) => r.data);
export const unmuteSeoCheck = (id) => apiClient.post(`/api/admin/seo/checks/${id}/unmute`).then((r) => r.data);
export const fetchSeoChecks = () => apiClient.get("/api/admin/seo/checks").then((r) => r.data);
export const fetchSeoTemplateDefaults = () => apiClient.get("/api/admin/seo/templates/defaults").then((r) => r.data);
export const previewSeoTemplate = (payload) => apiClient.post("/api/admin/seo/templates/preview", payload).then((r) => r.data);
export const suggestSeoWithAi = (payload) => apiClient.post("/api/admin/seo/ai/suggest", payload).then((r) => r.data);
