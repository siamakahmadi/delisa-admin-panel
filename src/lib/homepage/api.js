import apiClient from "@/lib/apiClient";

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  return data?.sliders || data?.brands || data?.items || [];
}

// ---- sliders ----
export const fetchSliders = () => apiClient.get("/api/admin/sliders").then((r) => normalizeList(r.data));
export const createSlider = (formData) => apiClient.post("/api/admin/sliders", formData).then((r) => r.data);
export const updateSlider = (id, formData) => apiClient.put(`/api/admin/sliders/${id}`, formData).then((r) => r.data);
export const deleteSlider = (id) => apiClient.delete(`/api/admin/sliders/${id}`).then((r) => r.data);

// ---- homepage brands (BrandSection — distinct from catalog brands) ----
export const fetchHomeBrands = () => apiClient.get("/api/admin/brands").then((r) => normalizeList(r.data));
export const createHomeBrand = (formData) => apiClient.post("/api/admin/brands", formData).then((r) => r.data);
export const updateHomeBrand = (id, formData) => apiClient.put(`/api/admin/brands/${id}`, formData).then((r) => r.data);
export const deleteHomeBrand = (id) => apiClient.delete(`/api/admin/brands/${id}`).then((r) => r.data);

// ---- home intro (about-Delisa section) ----
export const fetchHomeIntro = () => apiClient.get("/api/admin/settings/home-intro").then((r) => r.data?.homeIntro);
export const saveHomeIntro = (homeIntro) =>
  apiClient.put("/api/admin/settings/home-intro", { homeIntro }).then((r) => r.data?.homeIntro);
