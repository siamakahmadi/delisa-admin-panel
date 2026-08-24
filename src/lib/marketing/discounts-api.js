import apiClient from "@/lib/apiClient";

export const fetchDiscounts = (params) =>
  apiClient.get("/api/admin/discounts", { params }).then((r) => r.data);
export const fetchDiscount = (id) =>
  apiClient.get(`/api/admin/discounts/${id}`).then((r) => r.data?.discount);
export const createDiscount = (payload) =>
  apiClient.post("/api/admin/discounts", payload).then((r) => r.data?.discount);
export const updateDiscount = (id, payload) =>
  apiClient.put(`/api/admin/discounts/${id}`, payload).then((r) => r.data?.discount);
export const deleteDiscount = (id) => apiClient.delete(`/api/admin/discounts/${id}`).then((r) => r.data);
export const applyDiscountNow = (id) => apiClient.post(`/api/admin/discounts/${id}/apply`).then((r) => r.data);
export const revertDiscountNow = (id) => apiClient.post(`/api/admin/discounts/${id}/revert`).then((r) => r.data);
export const fetchDiscountUsageReport = (params) =>
  apiClient.get("/api/admin/discounts/usage-report", { params }).then((r) => r.data);
