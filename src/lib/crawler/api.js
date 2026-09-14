import apiClient from "@/lib/apiClient";

// Sources
export const fetchCrawlSources = () => apiClient.get("/api/admin/crawler/sources").then((r) => r.data);
export const fetchCrawlSource = (id) => apiClient.get(`/api/admin/crawler/sources/${id}`).then((r) => r.data);
export const createCrawlSource = (payload) =>
  apiClient.post("/api/admin/crawler/sources", payload).then((r) => r.data);
export const updateCrawlSource = (id, payload) =>
  apiClient.put(`/api/admin/crawler/sources/${id}`, payload).then((r) => r.data);
export const deleteCrawlSource = (id) =>
  apiClient.delete(`/api/admin/crawler/sources/${id}`).then((r) => r.data);
export const runCrawlSource = (id, categoryId) =>
  apiClient.post(`/api/admin/crawler/sources/${id}/run`, categoryId ? { categoryId } : {}).then((r) => r.data);
export const previewSelector = (payload) =>
  apiClient.post("/api/admin/crawler/sources/preview-selector", payload).then((r) => r.data);

// Scraped queue
export const fetchScrapedProducts = (params) =>
  apiClient.get("/api/admin/crawler/scraped-products", { params }).then((r) => r.data);
export const fetchScrapedProduct = (id) =>
  apiClient.get(`/api/admin/crawler/scraped-products/${id}`).then((r) => r.data);
export const updateScrapedProductStatus = (id, payload) =>
  apiClient.patch(`/api/admin/crawler/scraped-products/${id}/status`, payload).then((r) => r.data);
export const deleteScrapedProduct = (id) =>
  apiClient.delete(`/api/admin/crawler/scraped-products/${id}`).then((r) => r.data);
export const fetchScrapedProductStats = () =>
  apiClient.get("/api/admin/crawler/scraped-products/stats").then((r) => r.data);
