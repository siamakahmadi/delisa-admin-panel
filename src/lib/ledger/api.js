import apiClient from "@/lib/apiClient";

const base = "/api/admin/ledger";

export const fetchLedgerOverview = () => apiClient.get(`${base}/overview`).then((r) => r.data);
export const fetchLedgerProducts = (params) =>
  apiClient.get(`${base}/products`, { params }).then((r) => r.data);

export const fetchLedgerSuppliers = (params) =>
  apiClient.get(`${base}/suppliers`, { params }).then((r) => r.data);
export const fetchSupplierStatement = (id) =>
  apiClient.get(`${base}/suppliers/${id}/statement`).then((r) => r.data);
export const createLedgerSupplier = (payload) =>
  apiClient.post(`${base}/suppliers`, payload).then((r) => r.data);
export const updateLedgerSupplier = (id, payload) =>
  apiClient.put(`${base}/suppliers/${id}`, payload).then((r) => r.data);
export const deleteLedgerSupplier = (id) =>
  apiClient.delete(`${base}/suppliers/${id}`).then((r) => r.data);

export const fetchLedgerPurchases = (params) =>
  apiClient.get(`${base}/purchases`, { params }).then((r) => r.data);
export const fetchLedgerPurchase = (id) =>
  apiClient.get(`${base}/purchases/${id}`).then((r) => r.data);
export const createLedgerPurchase = (payload) =>
  apiClient.post(`${base}/purchases`, payload).then((r) => r.data);
export const updateLedgerPurchase = (id, payload) =>
  apiClient.put(`${base}/purchases/${id}`, payload).then((r) => r.data);
export const deleteLedgerPurchase = (id) =>
  apiClient.delete(`${base}/purchases/${id}`).then((r) => r.data);

export const fetchLedgerPayments = (params) =>
  apiClient.get(`${base}/payments`, { params }).then((r) => r.data);
export const createLedgerPayment = (payload) =>
  apiClient.post(`${base}/payments`, payload).then((r) => r.data);
export const deleteLedgerPayment = (id) =>
  apiClient.delete(`${base}/payments/${id}`).then((r) => r.data);
