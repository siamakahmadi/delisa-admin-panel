import apiClient from "@/lib/apiClient";

export const fetchFinancialOverview = (params) =>
  apiClient.get("/api/admin/financial/overview", { params }).then((r) => r.data);

// customer transactions — payment-focused view over the existing orders endpoint
export const fetchTransactions = (params) =>
  apiClient.get("/api/admin/orders", { params }).then((r) => r.data);

// vendor settlements
export const fetchWithdrawals = (params) =>
  apiClient.get("/api/admin/withdrawals", { params }).then((r) => r.data);
export const approveWithdrawal = (id, payload) =>
  apiClient.post(`/api/admin/withdrawals/${id}/approve`, payload).then((r) => r.data);
export const rejectWithdrawal = (id, payload) =>
  apiClient.post(`/api/admin/withdrawals/${id}/reject`, payload).then((r) => r.data);

export const fetchVendorsWallets = (params) =>
  apiClient.get("/api/admin/vendors", { params }).then((r) => r.data);
export const creditVendor = (id, payload) =>
  apiClient.post(`/api/admin/vendors/${id}/credit`, payload).then((r) => r.data);
export const payoutVendor = (id, payload) =>
  apiClient.post(`/api/admin/vendors/${id}/payout`, payload).then((r) => r.data);
export const batchPayoutVendors = (payload) =>
  apiClient.post("/api/admin/vendors/batch-payout", payload).then((r) => r.data);

// staff financial
export const fetchAllStaffPayments = () =>
  apiClient.get("/api/auth/payments").then((r) => r.data?.payments ?? []);
export const fetchStaffDetail = (id) => apiClient.get(`/api/auth/staff/${id}`).then((r) => r.data);
export const addStaffPayment = (id, payload) =>
  apiClient.post(`/api/auth/staff/${id}/payment`, payload).then((r) => r.data);
export const updateStaffPayment = (id, paymentId, payload) =>
  apiClient.put(`/api/auth/staff/${id}/payment/${paymentId}`, payload).then((r) => r.data);
export const deleteStaffPayment = (id, paymentId) =>
  apiClient.delete(`/api/auth/staff/${id}/payment`, { data: { paymentId } }).then((r) => r.data);
