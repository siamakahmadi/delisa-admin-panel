import apiClient from "@/lib/apiClient";

export const fetchSalesAnalytics = (params) =>
  apiClient.get("/api/admin/orders/analytics", { params }).then((r) => r.data);
