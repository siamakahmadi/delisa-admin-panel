import apiClient from "@/lib/apiClient";

// SkinType/SkinConcern/Ingredient (و بعداً Routine) به شکل کاملاً یکسانی
// CRUD می‌شوند سمت بک‌اند (routes/admin/beauty/createEntityRouter.js) —
// همین‌جا هم یک فکتوری، سه بار کد تکراری ننویسیم.
function createEntityApi(basePath) {
  return {
    list: () => apiClient.get(basePath).then((r) => r.data?.items || []),
    get: (id) => apiClient.get(`${basePath}/${id}`).then((r) => r.data?.item),
    create: (payload) => apiClient.post(basePath, payload).then((r) => r.data?.item),
    update: (id, payload) => apiClient.put(`${basePath}/${id}`, payload).then((r) => r.data?.item),
    remove: (id) => apiClient.delete(`${basePath}/${id}`),
  };
}

export const skinTypesApi = createEntityApi("/api/admin/beauty/skin-types");
export const skinConcernsApi = createEntityApi("/api/admin/beauty/skin-concerns");
export const ingredientsApi = createEntityApi("/api/admin/beauty/ingredients");
export const routinesApi = createEntityApi("/api/admin/beauty/routines");

export function uploadBeautyImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "beauty");
  return apiClient.post("/api/admin/uploads/image", fd).then((r) => r.data);
}
