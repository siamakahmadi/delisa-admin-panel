import apiClient from "@/lib/apiClient";

// ---- section toggle ----
export const fetchLoyaltySettings = () => apiClient.get("/api/admin/settings/loyalty").then((r) => r.data?.loyalty);
export const saveLoyaltySettings = (enabled) =>
  apiClient.put("/api/admin/settings/loyalty", { enabled }).then((r) => r.data?.loyalty);

// ---- overview ----
export const fetchLoyaltyOverview = () => apiClient.get("/api/admin/loyalty/overview").then((r) => r.data);

// ---- rules ----
export const fetchLoyaltyRules = () => apiClient.get("/api/admin/loyalty/rules").then((r) => r.data?.rules ?? []);
export const updateLoyaltyRule = (key, payload) =>
  apiClient.put(`/api/admin/loyalty/rules/${key}`, payload).then((r) => r.data);

// ---- redemption options ----
export const fetchRedemptionOptions = () =>
  apiClient.get("/api/admin/loyalty/redemption-options").then((r) => r.data?.options ?? []);
export const createRedemptionOption = (payload) =>
  apiClient.post("/api/admin/loyalty/redemption-options", payload).then((r) => r.data);
export const updateRedemptionOption = (id, payload) =>
  apiClient.put(`/api/admin/loyalty/redemption-options/${id}`, payload).then((r) => r.data);
export const deleteRedemptionOption = (id) =>
  apiClient.delete(`/api/admin/loyalty/redemption-options/${id}`).then((r) => r.data);

// ---- tiers ----
export const fetchLoyaltyTiers = () => apiClient.get("/api/admin/loyalty/tiers").then((r) => r.data?.tiers ?? []);
export const createLoyaltyTier = (payload) => apiClient.post("/api/admin/loyalty/tiers", payload).then((r) => r.data);
export const updateLoyaltyTier = (id, payload) =>
  apiClient.put(`/api/admin/loyalty/tiers/${id}`, payload).then((r) => r.data);
export const deleteLoyaltyTier = (id) => apiClient.delete(`/api/admin/loyalty/tiers/${id}`).then((r) => r.data);

// ---- members ----
export const fetchLoyaltyMembers = (q = "", page = 1) =>
  apiClient.get(`/api/admin/loyalty/members?q=${encodeURIComponent(q)}&page=${page}`).then((r) => r.data);
export const fetchLoyaltyMemberDetail = (customerId) =>
  apiClient.get(`/api/admin/loyalty/members/${customerId}`).then((r) => r.data);
export const adjustLoyaltyMemberPoints = (customerId, payload) =>
  apiClient.post(`/api/admin/loyalty/members/${customerId}/adjust`, payload).then((r) => r.data);

// ---- transactions ----
export const fetchLoyaltyTransactions = (page = 1, filters = {}) => {
  const params = new URLSearchParams({ page: String(page), ...filters });
  return apiClient.get(`/api/admin/loyalty/transactions?${params.toString()}`).then((r) => r.data);
};
