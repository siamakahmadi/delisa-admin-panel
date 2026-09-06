import apiClient from "@/lib/apiClient";

// ---- tags ----
export const fetchCustomerTags = () => apiClient.get("/api/admin/crm/tags").then((r) => r.data ?? []);
export const createCustomerTag = (payload) => apiClient.post("/api/admin/crm/tags", payload).then((r) => r.data);
export const updateCustomerTag = (id, payload) =>
  apiClient.put(`/api/admin/crm/tags/${id}`, payload).then((r) => r.data);
export const deleteCustomerTag = (id) => apiClient.delete(`/api/admin/crm/tags/${id}`).then((r) => r.data);

// ---- segments ----
export const fetchSegments = () => apiClient.get("/api/admin/crm/segments").then((r) => r.data ?? []);
export const fetchSegment = (id) => apiClient.get(`/api/admin/crm/segments/${id}`).then((r) => r.data);
export const createSegment = (payload) => apiClient.post("/api/admin/crm/segments", payload).then((r) => r.data);
export const updateSegment = (id, payload) =>
  apiClient.put(`/api/admin/crm/segments/${id}`, payload).then((r) => r.data);
export const deleteSegment = (id) => apiClient.delete(`/api/admin/crm/segments/${id}`).then((r) => r.data);
export const previewSegmentConditions = (conditions) =>
  apiClient.post("/api/admin/crm/segments/preview", { conditions }).then((r) => r.data);
export const previewSavedSegment = (id) =>
  apiClient.post(`/api/admin/crm/segments/${id}/preview`).then((r) => r.data);

// ---- campaigns ----
export const fetchCampaigns = () => apiClient.get("/api/admin/crm/campaigns").then((r) => r.data ?? []);
export const fetchCampaign = (id) => apiClient.get(`/api/admin/crm/campaigns/${id}`).then((r) => r.data);
export const createCampaign = (payload) => apiClient.post("/api/admin/crm/campaigns", payload).then((r) => r.data);
export const updateCampaign = (id, payload) =>
  apiClient.put(`/api/admin/crm/campaigns/${id}`, payload).then((r) => r.data);
export const deleteCampaign = (id) => apiClient.delete(`/api/admin/crm/campaigns/${id}`).then((r) => r.data);
export const previewCampaignRecipients = (id) =>
  apiClient.get(`/api/admin/crm/campaigns/${id}/preview`).then((r) => r.data);
export const sendCampaign = (id) => apiClient.post(`/api/admin/crm/campaigns/${id}/send`).then((r) => r.data);

// ---- sms templates ----
export const fetchSmsTemplates = (purpose) =>
  apiClient.get("/api/admin/crm/sms-templates", { params: purpose ? { purpose } : undefined }).then((r) => r.data ?? []);
export const createSmsTemplate = (payload) =>
  apiClient.post("/api/admin/crm/sms-templates", payload).then((r) => r.data);
export const updateSmsTemplate = (id, payload) =>
  apiClient.put(`/api/admin/crm/sms-templates/${id}`, payload).then((r) => r.data);
export const deleteSmsTemplate = (id) =>
  apiClient.delete(`/api/admin/crm/sms-templates/${id}`).then((r) => r.data);

// ---- automation ----
export const fetchAutomationRules = () => apiClient.get("/api/admin/crm/automation").then((r) => r.data ?? []);
export const updateAutomationRule = (id, payload) =>
  apiClient.put(`/api/admin/crm/automation/${id}`, payload).then((r) => r.data);
export const fetchAutomationRuns = (id) =>
  apiClient.get(`/api/admin/crm/automation/${id}/runs`).then((r) => r.data ?? []);
