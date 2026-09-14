import apiClient from "@/lib/apiClient";

// CMS-editable info pages (درباره ما / سوالات متداول / حریم خصوصی / بازگشت کالا)
export const fetchInfoPages = () => apiClient.get("/api/admin/info-pages").then((r) => r.data?.pages ?? []);
export const fetchInfoPage = (key) => apiClient.get(`/api/admin/info-pages/${key}`).then((r) => r.data?.page);
export const updateInfoPage = (key, payload) => apiClient.put(`/api/admin/info-pages/${key}`, payload).then((r) => r.data?.page);
