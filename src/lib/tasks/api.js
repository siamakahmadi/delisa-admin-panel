import apiClient from "@/lib/apiClient";

const base = "/api/admin/tasks";
const data = (r) => r.data;

export const fetchTaskMembers = () => apiClient.get(`${base}/members`).then((r) => r.data?.members ?? []);
export const fetchMyCards = () => apiClient.get(`${base}/my-cards`).then((r) => r.data?.cards ?? []);

export const fetchBoards = (archived = false) => apiClient.get(`${base}/boards`, { params: { archived } }).then((r) => r.data?.boards ?? []);
export const createBoard = (payload) => apiClient.post(`${base}/boards`, payload).then((r) => r.data?.board);
export const fetchBoard = (id) => apiClient.get(`${base}/boards/${id}`).then(data);
export const updateBoard = (id, payload) => apiClient.put(`${base}/boards/${id}`, payload).then((r) => r.data?.board);
export const deleteBoard = (id) => apiClient.delete(`${base}/boards/${id}`).then(data);

export const createList = (boardId, title) => apiClient.post(`${base}/boards/${boardId}/lists`, { title }).then((r) => r.data?.list);
export const updateList = (id, payload) => apiClient.put(`${base}/lists/${id}`, payload).then((r) => r.data?.list);
export const deleteList = (id) => apiClient.delete(`${base}/lists/${id}`).then(data);
export const reorderLists = (boardId, ids) => apiClient.post(`${base}/boards/${boardId}/lists/reorder`, { ids }).then(data);

export const createCard = (listId, title) => apiClient.post(`${base}/lists/${listId}/cards`, { title }).then((r) => r.data?.card);
export const fetchCard = (id) => apiClient.get(`${base}/cards/${id}`).then((r) => r.data?.card);
export const updateCard = (id, payload) => apiClient.put(`${base}/cards/${id}`, payload).then((r) => r.data?.card);
export const deleteCard = (id) => apiClient.delete(`${base}/cards/${id}`).then(data);
export const moveCard = (id, listId, index) => apiClient.post(`${base}/cards/${id}/move`, { listId, index }).then(data);
export const addComment = (id, text) => apiClient.post(`${base}/cards/${id}/comments`, { text }).then((r) => r.data?.card);
export const deleteComment = (id, commentId) => apiClient.delete(`${base}/cards/${id}/comments/${commentId}`).then((r) => r.data?.card);

export const PRIORITIES = [
  { value: "none", label: "بدون اولویت", color: "#94a3b8" },
  { value: "low", label: "کم", color: "#10b981" },
  { value: "medium", label: "متوسط", color: "#f59e0b" },
  { value: "high", label: "زیاد", color: "#f97316" },
  { value: "urgent", label: "فوری", color: "#ef4444" },
];

export const BOARD_COLORS = ["#7c5cff", "#ce3263", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#14b8a6", "#64748b"];

export function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/);
  return (parts[0]?.[0] || "?") + (parts[1]?.[0] ? `‌${parts[1][0]}` : "");
}

// وضعیت مهلت: overdue / soon (کمتر از ۴۸ ساعت) / ok
export function dueState(dueDate, completedAt) {
  if (!dueDate) return null;
  if (completedAt) return "done";
  const ms = new Date(dueDate).getTime() - Date.now();
  if (ms < 0) return "overdue";
  if (ms < 48 * 3600 * 1000) return "soon";
  return "ok";
}
