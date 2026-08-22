import apiClient from "@/lib/apiClient";

/* ---------------- menus ---------------- */
export const fetchMenus = () => apiClient.get("/api/admin/menu").then((r) => r.data?.menus || []);
export const fetchMenu = (id) => apiClient.get(`/api/admin/menu/${encodeURIComponent(id)}`).then((r) => r.data?.menu);
export const createMenu = (payload) => apiClient.post("/api/admin/menu", payload).then((r) => r.data?.menu);
export const updateMenu = (id, patch) => apiClient.put(`/api/admin/menu/${encodeURIComponent(id)}`, patch).then((r) => r.data?.menu);
export const duplicateMenu = (id) => apiClient.post(`/api/admin/menu/${encodeURIComponent(id)}/duplicate`).then((r) => r.data?.menu);
export const publishMenu = (id, { force = false } = {}) =>
  apiClient.post(`/api/admin/menu/${encodeURIComponent(id)}/publish`, { force }).then((r) => r.data?.menu);
export const unpublishMenu = (id) => apiClient.post(`/api/admin/menu/${encodeURIComponent(id)}/unpublish`).then((r) => r.data?.menu);
export const deleteMenu = (id) => apiClient.delete(`/api/admin/menu/${encodeURIComponent(id)}`).then((r) => r.data);

/* ---------------- entity pickers ---------------- */
export const searchEntities = (type, q, limit = 20) =>
  apiClient.get(`/api/admin/menu/entities/${encodeURIComponent(type)}`, { params: { q: q || "", limit } }).then((r) => r.data?.results || []);
export const fetchCategoryChildren = (categoryId) =>
  apiClient.get(`/api/admin/menu/entities/category/${encodeURIComponent(categoryId)}/children`).then((r) => r.data?.results || []);
export const fetchSuggestions = () => apiClient.get("/api/admin/menu/suggestions/list").then((r) => r.data?.suggestions || []);

/* ---------------- media ---------------- */
export function uploadMenuImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  return apiClient.post("/api/admin/menu/upload-image", fd).then((r) => r.data);
}
