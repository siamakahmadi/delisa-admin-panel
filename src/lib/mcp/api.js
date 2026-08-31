import apiClient from "@/lib/apiClient";

export const fetchMcpSettings = () =>
  apiClient.get("/api/admin/settings/mcp-integration").then((r) => r.data?.mcpIntegration);

export const saveMcpSettings = (enabled) =>
  apiClient.put("/api/admin/settings/mcp-integration", { enabled }).then((r) => r.data?.mcpIntegration);
