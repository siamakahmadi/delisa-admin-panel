import apiClient from "@/lib/apiClient";

export const fetchFaqItems = () => apiClient.get("/api/admin/faq").then((r) => r.data?.items ?? []);
export const createFaqItem = (payload) => apiClient.post("/api/admin/faq", payload).then((r) => r.data);
export const updateFaqItem = (id, payload) => apiClient.put(`/api/admin/faq/${id}`, payload).then((r) => r.data);
export const deleteFaqItem = (id) => apiClient.delete(`/api/admin/faq/${id}`).then((r) => r.data);
