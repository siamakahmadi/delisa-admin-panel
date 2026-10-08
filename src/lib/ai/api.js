import apiClient from "@/lib/apiClient";

export const fetchAiSettings = () =>
  apiClient.get("/api/admin/ai/settings").then((r) => r.data);

export const updateAiSettings = (payload) =>
  apiClient.put("/api/admin/ai/settings", payload).then((r) => r.data);

export const fetchAiAnalyticsOverview = (params) =>
  apiClient.get("/api/admin/ai/analytics/overview", { params }).then((r) => r.data);

export const fetchAiConversations = (params) =>
  apiClient.get("/api/admin/ai/conversations", { params }).then((r) => r.data);

export const fetchAiConversation = (id) =>
  apiClient.get(`/api/admin/ai/conversations/${id}`).then((r) => r.data);

// ---- اتصال‌های هوش مصنوعی (Gemini / OpenAI / Liara / سفارشی) ----
export const fetchAiConnections = () =>
  apiClient.get("/api/admin/ai/connections").then((r) => r.data);

export const createAiConnection = (payload) =>
  apiClient.post("/api/admin/ai/connections", payload).then((r) => r.data);

export const updateAiConnection = (id, payload) =>
  apiClient.put(`/api/admin/ai/connections/${id}`, payload).then((r) => r.data);

export const deleteAiConnection = (id) =>
  apiClient.delete(`/api/admin/ai/connections/${id}`).then((r) => r.data);

export const fetchAiConnectionModels = (id) =>
  apiClient.post(`/api/admin/ai/connections/${id}/fetch-models`).then((r) => r.data);

export const testAiConnection = (id, model) =>
  apiClient.post(`/api/admin/ai/connections/${id}/test`, { model }).then((r) => r.data);

// ---- نویسنده‌ی هوشمند (قالب‌های محتوایی) ----
export const fetchAiAssistTemplates = () =>
  apiClient.get("/api/admin/ai/assist/templates").then((r) => r.data);

export const runAiAssist = (payload) =>
  apiClient.post("/api/admin/ai/assist", payload, { timeout: 120000 }).then((r) => r.data);
