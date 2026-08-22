import apiClient from "@/lib/apiClient";

export const fetchProductsWithReviewFlag = (params) =>
  apiClient.get("/api/admin/products", { params }).then((r) => r.data);

export const fetchReviewByProductId = (productId) =>
  apiClient.get(`/api/admin/editorial-reviews/by-product/${productId}`).then((r) => r.data?.data || null);

export const upsertReviewByProductId = (productId, payload) =>
  apiClient.put(`/api/admin/editorial-reviews/by-product/${productId}`, payload).then((r) => r.data?.data);

export const deleteReview = (reviewId) => apiClient.delete(`/api/admin/editorial-reviews/${reviewId}`).then((r) => r.data);
