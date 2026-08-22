import apiClient from "@/lib/apiClient";

// ---- posts ----
export const fetchPosts = (params) => apiClient.get("/api/admin/posts", { params }).then((r) => r.data);
export const fetchPost = (id) => apiClient.get(`/api/admin/posts/${id}`).then((r) => r.data?.post);
export const checkSlug = (slug, excludeId) => apiClient.get("/api/admin/posts/slug-check", { params: { slug, excludeId: excludeId || undefined } }).then((r) => r.data);
export const createPost = (payload) => apiClient.post("/api/admin/posts", payload).then((r) => r.data?.post);
export const updatePost = (id, payload) => apiClient.put(`/api/admin/posts/${id}`, payload).then((r) => r.data?.post);
export const deletePost = (id) => apiClient.delete(`/api/admin/posts/${id}`).then((r) => r.data);
export const publishPost = (id) => apiClient.post(`/api/admin/posts/${id}/publish`).then((r) => r.data?.post);
export const unpublishPost = (id) => apiClient.post(`/api/admin/posts/${id}/unpublish`).then((r) => r.data?.post);
export const fetchRevisions = (id) => apiClient.get(`/api/admin/posts/${id}/revisions`).then((r) => r.data?.revisions || []);
export const restoreRevision = (id, revId) => apiClient.post(`/api/admin/posts/${id}/revisions/${revId}/restore`).then((r) => r.data?.post);

// ---- taxonomy ----
export const fetchCategories = () => apiClient.get("/api/admin/blog/categories").then((r) => r.data?.categories || []);
export const createCategory = (payload) => apiClient.post("/api/admin/blog/categories", payload).then((r) => r.data?.category);
export const updateCategory = (id, payload) => apiClient.put(`/api/admin/blog/categories/${id}`, payload).then((r) => r.data?.category);
export const deleteCategory = (id) => apiClient.delete(`/api/admin/blog/categories/${id}`).then((r) => r.data);

export const fetchTags = () => apiClient.get("/api/admin/blog/tags").then((r) => r.data?.tags || []);
export const createTag = (payload) => apiClient.post("/api/admin/blog/tags", payload).then((r) => r.data?.tag);
export const updateTag = (id, payload) => apiClient.put(`/api/admin/blog/tags/${id}`, payload).then((r) => r.data?.tag);
export const deleteTag = (id) => apiClient.delete(`/api/admin/blog/tags/${id}`).then((r) => r.data);

// ---- author profile ----
export const fetchMyAuthorProfile = () => apiClient.get("/api/admin/blog/me/author-profile").then((r) => r.data?.author);
export const updateMyAuthorProfile = (payload) => apiClient.put("/api/admin/blog/me/author-profile", payload).then((r) => r.data?.author);

// ---- uploads & product embeds ----
export function uploadBlogImage(file, folder = "blog") {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  return apiClient.post("/api/admin/uploads/image", fd).then((r) => r.data);
}
export const resolveProductEmbed = (url) => apiClient.get("/api/blog/embeds/resolve", { params: { url } }).then((r) => r.data?.snapshot);
