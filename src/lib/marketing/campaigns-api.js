import apiClient from "@/lib/apiClient";

export const fetchCampaigns = () => apiClient.get("/api/admin/campaigns").then((r) => r.data);
export const fetchCampaign = (id) => apiClient.get(`/api/admin/campaigns/${id}`).then((r) => r.data);
export const createCampaign = (payload) => apiClient.post("/api/admin/campaigns", payload).then((r) => r.data);
export const updateCampaign = (id, payload) => apiClient.patch(`/api/admin/campaigns/${id}`, payload).then((r) => r.data);
export const deleteCampaign = (id) => apiClient.delete(`/api/admin/campaigns/${id}`).then((r) => r.data);

// campaign items (banner / product-slider)
export const createCampaignItem = (formData) =>
  apiClient.post("/api/admin/campaign-items", formData).then((r) => r.data);
export const createCampaignItemJson = (payload) =>
  apiClient.post("/api/admin/campaign-items/json", payload).then((r) => r.data);
export const updateCampaignItem = (id, payload) =>
  apiClient.patch(`/api/admin/campaign-items/${id}`, payload).then((r) => r.data);
export const updateCampaignItemMultipart = (id, formData) =>
  apiClient.patch(`/api/admin/campaign-items/${id}/multipart`, formData).then((r) => r.data);
export const deleteCampaignItem = (id) => apiClient.delete(`/api/admin/campaign-items/${id}`).then((r) => r.data);
export const reorderCampaignItems = (updates) =>
  apiClient.patch("/api/admin/campaign-items/reorder", updates).then((r) => r.data);
