import apiClient from "@/lib/apiClient";

export const fetchAgents = () => apiClient.get("/api/admin/agents").then((r) => r.data);

export const updateAgentSettings = (key, payload) =>
  apiClient.put(`/api/admin/agents/${key}/settings`, payload).then((r) => r.data);

export const runAgent = (key, params) =>
  apiClient.post(`/api/admin/agents/${key}/run`, { params }).then((r) => r.data);

export const fetchAgentRuns = (params) =>
  apiClient.get("/api/admin/agents/runs", { params }).then((r) => r.data);

export const fetchAgentRun = (id) => apiClient.get(`/api/admin/agents/runs/${id}`).then((r) => r.data);

export const cancelAgentRun = (id) => apiClient.post(`/api/admin/agents/runs/${id}/cancel`).then((r) => r.data);

export const deleteAgentRun = (id) => apiClient.delete(`/api/admin/agents/runs/${id}`).then((r) => r.data);

export const applyAgentRun = (id, itemIndexes) =>
  apiClient.post(`/api/admin/agents/runs/${id}/apply`, { itemIndexes }).then((r) => r.data);

export const revertAgentRun = (id, itemIndex) =>
  apiClient.post(`/api/admin/agents/runs/${id}/revert`, { itemIndex }).then((r) => r.data);
