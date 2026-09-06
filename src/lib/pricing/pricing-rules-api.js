import apiClient from "@/lib/apiClient";

export const fetchPricingRules = (params) =>
  apiClient.get("/api/admin/pricing-rules", { params }).then((r) => r.data);
export const fetchPricingRule = (id) =>
  apiClient.get(`/api/admin/pricing-rules/${id}`).then((r) => r.data?.rule);
export const createPricingRule = (payload) =>
  apiClient.post("/api/admin/pricing-rules", payload).then((r) => r.data?.rule);
export const updatePricingRule = (id, payload) =>
  apiClient.put(`/api/admin/pricing-rules/${id}`, payload).then((r) => r.data?.rule);
export const deletePricingRule = (id) =>
  apiClient.delete(`/api/admin/pricing-rules/${id}`).then((r) => r.data);
export const applyPricingRuleNow = (id) =>
  apiClient.post(`/api/admin/pricing-rules/${id}/apply`).then((r) => r.data);
export const revertPricingRuleNow = (id) =>
  apiClient.post(`/api/admin/pricing-rules/${id}/revert`).then((r) => r.data);
export const fetchPricingRuleHistory = (id, params) =>
  apiClient
    .get(`/api/admin/pricing-rules/${id}/history`, { params })
    .then((r) => r.data);
// draft: preview a not-yet-saved rule; id: preview a saved rule
export const previewPricingRule = ({ id, draft } = {}) =>
  (id
    ? apiClient.post(`/api/admin/pricing-rules/${id}/preview`)
    : apiClient.post("/api/admin/pricing-rules/preview", draft)
  ).then((r) => r.data);
