import apiClient from "@/lib/apiClient";

export const fetchProductsAnalytics = (params) =>
  apiClient.get("/api/admin/products/analytics", { params }).then((r) => r.data);
