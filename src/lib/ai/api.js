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
