import apiClient from "@/lib/apiClient";
import { defaultWorkbook, loadLocalWorkbook, pickNewerWorkbook, saveLocalWorkbook, workbookHasRows } from "@/lib/pricing-intelligence/workbook";

const base = "/api/admin/pricing-intelligence";

export const fetchPricingDashboard = () => apiClient.get(`${base}/dashboard`).then((r) => r.data);
export const fetchPricingWorkbook = async () => {
  const local = loadLocalWorkbook();
  try {
    const { data } = await apiClient.get(`${base}/workbook`);
    const remote = data?.workbook;
    const merged = pickNewerWorkbook(local, remote);
    saveLocalWorkbook(merged);
    if (workbookHasRows(merged) && !workbookHasRows(remote)) {
      apiClient.put(`${base}/workbook`, { columns: merged.columns, rows: merged.rows }).catch(() => {});
    }
    return { ok: true, workbook: merged };
  } catch {
    return { ok: true, workbook: local || defaultWorkbook() };
  }
};
export const savePricingWorkbook = async (payload) => {
  const stored = saveLocalWorkbook(payload);
  if (!stored) {
    const err = new Error("local_save_failed");
    err.code = "local_save_failed";
    throw err;
  }
  try {
    return await apiClient.put(`${base}/workbook`, payload).then((r) => r.data);
  } catch {
    return { ok: true, workbook: payload, localOnly: true };
  }
};
export const fetchPricingProducts = (params) =>
  apiClient.get(`${base}/products`, { params }).then((r) => r.data);
export const fetchPricingProduct = (id) => apiClient.get(`${base}/products/${id}`).then((r) => r.data);
export const analyzePricingProduct = (id) =>
  apiClient.post(`${base}/products/${id}/analyze`).then((r) => r.data);
export const analyzePricingProducts = (productIds) =>
  apiClient.post(`${base}/analyze`, { productIds }).then((r) => r.data);
export const updateProductPricingConfig = (id, payload) =>
  apiClient.put(`${base}/products/${id}/config`, payload).then((r) => r.data);
export const addCompetitorObservation = (id, payload) =>
  apiClient.post(`${base}/products/${id}/competitors`, payload).then((r) => r.data);
export const ingestCompetitorUrls = (id, payload) =>
  apiClient.post(`${base}/products/${id}/competitor-urls`, payload).then((r) => r.data);
export const deleteCompetitorObservation = (productId, observationId) =>
  apiClient.delete(`${base}/products/${productId}/competitors/${observationId}`).then((r) => r.data);
export const refreshProductCompetitors = (id, payload = {}) =>
  apiClient.post(`${base}/products/${id}/refresh-competitors`, payload).then((r) => r.data);
export const updatePurchaseCosts = (payload) =>
  apiClient.post(`${base}/purchase-costs`, payload).then((r) => r.data);
export const bulkApproveRecommendations = (ids) =>
  apiClient.post(`${base}/bulk-approve`, { ids }).then((r) => r.data);
export const applySafeRecommendations = () => apiClient.post(`${base}/apply-safe`).then((r) => r.data);
export const enqueuePricingJob = (payload) => apiClient.post(`${base}/jobs`, payload).then((r) => r.data);
export const fetchPricingJobs = () => apiClient.get(`${base}/jobs`).then((r) => r.data);
export const fetchPricingAudit = () => apiClient.get(`${base}/audit`).then((r) => r.data);
export const approveRecommendation = (id, payload) =>
  apiClient.post(`${base}/recommendations/${id}/approve`, payload).then((r) => r.data);
export const rejectRecommendation = (id, payload) =>
  apiClient.post(`${base}/recommendations/${id}/reject`, payload).then((r) => r.data);
export const applyRecommendation = (id, payload) =>
  apiClient.post(`${base}/recommendations/${id}/apply`, payload).then((r) => r.data);
export const bulkApplyRecommendations = (ids) =>
  apiClient.post(`${base}/bulk-apply`, { ids }).then((r) => r.data);
export const bulkPricingStrategy = (payload) =>
  apiClient.post(`${base}/bulk-strategy`, payload).then((r) => r.data);
export const simulatePricing = (payload) =>
  apiClient.post(`${base}/simulate`, payload).then((r) => r.data);
export const fetchPricingSettings = () => apiClient.get(`${base}/settings`).then((r) => r.data);
export const updatePricingSettings = (payload) =>
  apiClient.put(`${base}/settings`, payload).then((r) => r.data);
export const upsertPricingScope = (payload) =>
  apiClient.post(`${base}/scopes`, payload).then((r) => r.data);
export const deletePricingScope = (id) => apiClient.delete(`${base}/scopes/${id}`).then((r) => r.data);
export const fetchCompetitorSources = () =>
  apiClient.get(`${base}/competitor-sources`).then((r) => r.data);
export const upsertCompetitorSource = (payload) =>
  apiClient.post(`${base}/competitor-sources`, payload).then((r) => r.data);
export const deleteCompetitorSource = (id) =>
  apiClient.delete(`${base}/competitor-sources/${id}`).then((r) => r.data);
