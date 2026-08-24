import apiClient from "@/lib/apiClient";

export const fetchStaffList = () => apiClient.get("/api/auth/staff-list").then((r) => r.data?.users ?? []);
export const fetchStaffDetail = (id) => apiClient.get(`/api/auth/staff/${id}`).then((r) => r.data);
export const createStaff = (payload) => apiClient.post("/api/auth/add-staff", payload).then((r) => r.data);
export const updateStaffInfo = (id, payload) => apiClient.put(`/api/auth/staff/${id}`, payload).then((r) => r.data?.staff);
export const disableStaff = (id) => apiClient.put(`/api/auth/staff/${id}/disable`).then((r) => r.data);
export const reactivateStaff = (id) => apiClient.put(`/api/auth/staff/${id}/reactivate`).then((r) => r.data);
export const deleteStaff = (id) => apiClient.delete(`/api/auth/staff/${id}`).then((r) => r.data);

export const ROLE_LABELS = {
  admin: "ادمین",
  support: "پشتیبانی",
  product_manager: "مدیریت محصولات",
  delivery: "دلیوری",
  blogger: "نویسنده",
  vendor: "فروشنده",
};
