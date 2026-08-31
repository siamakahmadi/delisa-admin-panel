import apiClient from "@/lib/apiClient";

function normalizeList(data, key) {
  if (Array.isArray(data)) return data;
  return data?.[key] || data?.items || [];
}

// ---- authors ----
export const fetchFeedAuthors = () => apiClient.get("/api/admin/feed/authors").then((r) => normalizeList(r.data, "authors"));
export const createFeedAuthor = (formData) => apiClient.post("/api/admin/feed/authors", formData).then((r) => r.data);
export const updateFeedAuthor = (id, formData) => apiClient.put(`/api/admin/feed/authors/${id}`, formData).then((r) => r.data);
export const deleteFeedAuthor = (id) => apiClient.delete(`/api/admin/feed/authors/${id}`).then((r) => r.data);

// ---- posts ----
export const fetchFeedPosts = () => apiClient.get("/api/admin/feed/posts").then((r) => normalizeList(r.data, "posts"));
export const createFeedPost = (formData) => apiClient.post("/api/admin/feed/posts", formData).then((r) => r.data);
export const updateFeedPost = (id, formData) => apiClient.put(`/api/admin/feed/posts/${id}`, formData).then((r) => r.data);
export const deleteFeedPost = (id) => apiClient.delete(`/api/admin/feed/posts/${id}`).then((r) => r.data);

// ---- comments (moderation: list + delete only) ----
export const fetchFeedComments = (page = 1) =>
  apiClient.get(`/api/admin/feed/comments?page=${page}`).then((r) => r.data);
export const deleteFeedComment = (id) => apiClient.delete(`/api/admin/feed/comments/${id}`).then((r) => r.data);

// ---- section on/off switch ----
export const fetchFeedSettings = () => apiClient.get("/api/admin/settings/feed").then((r) => r.data?.feed);
export const saveFeedSettings = (enabled) =>
  apiClient.put("/api/admin/settings/feed", { enabled }).then((r) => r.data?.feed);
