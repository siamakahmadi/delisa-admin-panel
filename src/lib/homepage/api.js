import apiClient from "@/lib/apiClient";

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  return data?.sliders || data?.brands || data?.stories || data?.items || [];
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

// ---- section on/off switches (محتوای خودشون جای دیگه مدیریت می‌شه، این
// فقط تعیین می‌کنه کل سکشن تو صفحه‌ی اصلی رندر بشه یا نه) ----
export const fetchHeroSliderSettings = () =>
  apiClient.get("/api/admin/settings/hero-slider").then((r) => r.data?.heroSlider);
export const saveHeroSliderSettings = (enabled) =>
  apiClient.put("/api/admin/settings/hero-slider", { enabled }).then((r) => r.data?.heroSlider);

export const fetchBrandsSectionSettings = () =>
  apiClient.get("/api/admin/settings/brands-section").then((r) => r.data?.brandsSection);
export const saveBrandsSectionSettings = (enabled) =>
  apiClient.put("/api/admin/settings/brands-section", { enabled }).then((r) => r.data?.brandsSection);

export const fetchFaqSectionSettings = () =>
  apiClient.get("/api/admin/settings/faq-section").then((r) => r.data?.faqSection);
export const saveFaqSectionSettings = (enabled) =>
  apiClient.put("/api/admin/settings/faq-section", { enabled }).then((r) => r.data?.faqSection);

// ---- stories (Instagram-style, row of avatars -> fullscreen viewer) ----
export const fetchStories = () => apiClient.get("/api/admin/stories").then((r) => normalizeList(r.data));
export const createStory = (formData) => apiClient.post("/api/admin/stories", formData).then((r) => r.data);
export const updateStory = (id, formData) => apiClient.put(`/api/admin/stories/${id}`, formData).then((r) => r.data);
export const deleteStory = (id) => apiClient.delete(`/api/admin/stories/${id}`).then((r) => r.data);

export const fetchStoriesSettings = () =>
  apiClient.get("/api/admin/settings/stories").then((r) => r.data?.stories);
export const saveStoriesSettings = (enabled) =>
  apiClient.put("/api/admin/settings/stories", { enabled }).then((r) => r.data?.stories);
