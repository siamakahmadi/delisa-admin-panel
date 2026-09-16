import apiClient from "@/lib/apiClient";

/* ---------------- component registry ---------------- */
export const fetchComponentTypes = () => apiClient.get("/api/cms/component-types").then((r) => r.data?.types || []);

/* ---------------- assets / pickers ---------------- */
export function uploadAsset(file, context) {
  const fd = new FormData();
  fd.append("file", file);
  // "banner"/"slider": tells the backend's sharp optimizer to use the
  // high-quality (100) preset instead of the generic-asset default (82) —
  // full-bleed hero/banner images show every compression artefact at that
  // size, unlike thumbnails and icons uploaded through this same endpoint.
  if (context) fd.append("context", context);
  return apiClient.post("/api/cms/assets", fd).then((r) => r.data);
}

function unwrapList(res, keys) {
  if (Array.isArray(res)) return res;
  for (const k of keys) if (Array.isArray(res?.[k])) return res[k];
  return [];
}

export const fetchCmsProducts = (params = {}) =>
  apiClient.get("/api/cms/products", { params }).then((r) => unwrapList(r.data, ["products", "items"]));
export const fetchCmsCategories = () => apiClient.get("/api/cms/categories").then((r) => unwrapList(r.data, ["categories", "items"]));
export const fetchCmsBrands = () => apiClient.get("/api/cms/brands").then((r) => unwrapList(r.data, ["brands", "items"]));
export const fetchCmsTags = () => apiClient.get("/api/cms/tags").then((r) => unwrapList(r.data, ["tags", "items"]));
export const fetchCmsBlogTags = () => apiClient.get("/api/cms/blog-tags").then((r) => unwrapList(r.data, ["tags", "items"]));
export const fetchCmsBlogCategories = () => apiClient.get("/api/cms/blog-categories").then((r) => unwrapList(r.data, ["categories", "items"]));

// Beauty Knowledge Hub entities — از endpointهای ادمین (نه عمومی) استفاده
// می‌کنند تا موجودیت‌های هنوز منتشرنشده هم در PickerField قابل انتخاب
// باشند (apiClient توکن ادمین را خودکار می‌فرستد).
export const fetchCmsSkinTypes = () => apiClient.get("/api/admin/beauty/skin-types").then((r) => unwrapList(r.data, ["items"]));
export const fetchCmsSkinConcerns = () => apiClient.get("/api/admin/beauty/skin-concerns").then((r) => unwrapList(r.data, ["items"]));
export const fetchCmsIngredients = () => apiClient.get("/api/admin/beauty/ingredients").then((r) => unwrapList(r.data, ["items"]));

/* ---------------- pages ---------------- */
export const fetchPages = (params = {}) => apiClient.get("/api/cms/pages", { params }).then((r) => r.data);
export const fetchPageAdmin = (id) => apiClient.get(`/api/cms/pages/admin/${encodeURIComponent(id)}`).then((r) => r.data);
export const createPage = (payload) => apiClient.post("/api/cms/pages", payload).then((r) => r.data);
export const updatePage = (id, patch) => apiClient.put(`/api/cms/pages/${encodeURIComponent(id)}`, patch).then((r) => r.data);
export const publishPage = (id) => apiClient.post(`/api/cms/pages/${encodeURIComponent(id)}/publish`).then((r) => r.data);
export const unpublishPage = (id) => apiClient.post(`/api/cms/pages/${encodeURIComponent(id)}/unpublish`).then((r) => r.data);
export const deletePage = (id) => apiClient.delete(`/api/cms/pages/${encodeURIComponent(id)}`).then((r) => r.data);
export const createPreviewToken = (id, expiresInSeconds) =>
  apiClient.post(`/api/cms/pages/${encodeURIComponent(id)}/preview-token`, expiresInSeconds ? { expiresInSeconds } : {}).then((r) => r.data);
export const fetchRevisions = (id) => apiClient.get(`/api/cms/pages/${encodeURIComponent(id)}/revisions`).then((r) => r.data?.revisions || []);
export const restoreRevision = (pageId, revisionId) =>
  apiClient
    .post(`/api/cms/pages/${encodeURIComponent(pageId)}/revisions/${encodeURIComponent(revisionId)}/restore`)
    .then((r) => r.data);

/* ---------------- sections ---------------- */
export const reorderSections = (pageId, orders) =>
  apiClient.post(`/api/cms/pages/${encodeURIComponent(pageId)}/sections/reorder`, { orders }).then((r) => r.data);
export const addSection = (pageId, section) =>
  apiClient.post(`/api/cms/pages/${encodeURIComponent(pageId)}/sections`, section).then((r) => r.data);
export const updateSection = (pageId, sectionId, patch) =>
  apiClient
    .put(`/api/cms/pages/${encodeURIComponent(pageId)}/sections/${encodeURIComponent(sectionId)}`, patch)
    .then((r) => r.data);
export const deleteSection = (pageId, sectionId) =>
  apiClient.delete(`/api/cms/pages/${encodeURIComponent(pageId)}/sections/${encodeURIComponent(sectionId)}`).then((r) => r.data);
export const duplicateSection = (pageId, sectionId) =>
  apiClient
    .post(`/api/cms/pages/${encodeURIComponent(pageId)}/sections/${encodeURIComponent(sectionId)}/duplicate`)
    .then((r) => r.data);

/* ---------------- components ("slots") ---------------- */
export const addComponent = (pageId, sectionId, comp) =>
  apiClient
    .post(`/api/cms/pages/${encodeURIComponent(pageId)}/sections/${encodeURIComponent(sectionId)}/slots`, comp)
    .then((r) => r.data);
export const updateComponent = (pageId, sectionId, compId, patch) =>
  apiClient
    .put(`/api/cms/pages/${encodeURIComponent(pageId)}/sections/${encodeURIComponent(sectionId)}/slots/${encodeURIComponent(compId)}`, patch)
    .then((r) => r.data);
export const deleteComponent = (pageId, sectionId, compId) =>
  apiClient
    .delete(`/api/cms/pages/${encodeURIComponent(pageId)}/sections/${encodeURIComponent(sectionId)}/slots/${encodeURIComponent(compId)}`)
    .then((r) => r.data);

/* ---------------- reusable section templates ---------------- */
export const fetchSectionTemplates = () => apiClient.get("/api/cms/section-templates").then((r) => r.data?.templates || []);
export const createSectionTemplate = (payload) => apiClient.post("/api/cms/section-templates", payload).then((r) => r.data);
export const instantiateSectionTemplate = (id) =>
  apiClient.post(`/api/cms/section-templates/${encodeURIComponent(id)}/instantiate`).then((r) => r.data);
