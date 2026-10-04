import apiClient from "@/lib/apiClient";

// Settings.community — کامیونیتی اپ (شبکه‌ی اجتماعی مشتری‌ها، شبیه توییتر)
export const fetchCommunitySettings = () => apiClient.get("/api/admin/community/settings").then((r) => r.data?.community);
export const saveCommunitySettings = (patch) => apiClient.put("/api/admin/community/settings", patch).then((r) => r.data?.community);
export const fetchCommunityStats = () => apiClient.get("/api/admin/community/stats").then((r) => r.data);

export const fetchCommunityPosts = (params) => apiClient.get("/api/admin/community/posts", { params }).then((r) => r.data);
export const moderateCommunityPost = (id, body) => apiClient.patch(`/api/admin/community/posts/${id}`, body).then((r) => r.data);

export const fetchCommunityReports = (params) => apiClient.get("/api/admin/community/reports", { params }).then((r) => r.data);
export const resolveCommunityReport = (id, body) => apiClient.post(`/api/admin/community/reports/${id}/resolve`, body).then((r) => r.data);

export const fetchCommunityProfiles = (params) => apiClient.get("/api/admin/community/profiles", { params }).then((r) => r.data);
export const updateCommunityProfile = (id, body) => apiClient.patch(`/api/admin/community/profiles/${id}`, body).then((r) => r.data);
