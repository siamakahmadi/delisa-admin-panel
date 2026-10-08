import apiClient from "@/lib/apiClient";

const BASE = "/api/admin/payment-gateways";

export const fetchGateways = () => apiClient.get(BASE).then((r) => r.data);
export const setGatewayEnabled = (id, enabled) =>
  apiClient.put(`${BASE}/${id}`, { enabled }).then((r) => r.data.gateway);
