import apiClient from "@/lib/apiClient";

// ---- settings (روشن/خاموش کردن کل فیچر + متن‌های مودال) ----
export const fetchBeautyProfileSettings = () =>
  apiClient.get("/api/admin/beauty-profile/settings").then((r) => r.data?.beautyProfile);
export const saveBeautyProfileSettings = (beautyProfile) =>
  apiClient.put("/api/admin/beauty-profile/settings", { beautyProfile }).then((r) => r.data?.beautyProfile);

// ---- questions (سوالات Quiz) ----
export const fetchBeautyProfileQuestions = () =>
  apiClient.get("/api/admin/beauty-profile/questions").then((r) => r.data?.questions || []);
export const createBeautyProfileQuestion = (payload) =>
  apiClient.post("/api/admin/beauty-profile/questions", payload).then((r) => r.data?.question);
export const updateBeautyProfileQuestion = (id, payload) =>
  apiClient.put(`/api/admin/beauty-profile/questions/${id}`, payload).then((r) => r.data?.question);
export const deleteBeautyProfileQuestion = (id) =>
  apiClient.delete(`/api/admin/beauty-profile/questions/${id}`);
export const reorderBeautyProfileQuestions = (orderedIds) =>
  apiClient.post("/api/admin/beauty-profile/questions/reorder", { orderedIds });

// ---- responses (پاسخ‌های مشتریان) ----
export const fetchBeautyProfileResponses = (params = {}) =>
  apiClient.get("/api/admin/beauty-profile/responses", { params }).then((r) => r.data);
export const fetchBeautyProfileResponseDetail = (customerId) =>
  apiClient.get(`/api/admin/beauty-profile/responses/${customerId}`).then((r) => r.data?.profile);
