import apiClient from "@/lib/apiClient";

export const fetchTorobSettings = () =>
  apiClient.get("/api/admin/settings/torob-order-tracking").then((r) => r.data?.torobOrderTracking);

export const saveTorobSettings = (enabled) =>
  apiClient.put("/api/admin/settings/torob-order-tracking", { enabled }).then((r) => r.data?.torobOrderTracking);
