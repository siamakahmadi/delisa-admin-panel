import apiClient from "@/lib/apiClient";

// ---- comments ----
export const fetchComments = (params) =>
  apiClient.get("/api/admin/comments", { params }).then((r) => r.data);

export const setCommentStatus = (productId, commentId, action) =>
  apiClient.patch(`/api/admin/comments/${productId}/${commentId}`, { action }).then((r) => r.data);

export const deleteComment = (productId, commentId) =>
  apiClient.patch(`/api/admin/comments/${productId}/${commentId}`, { action: "delete" }).then((r) => r.data);

export const bulkApproveComments = (items) =>
  apiClient.post("/api/admin/comments/bulk-approve", { items }).then((r) => r.data);

// ---- tickets ----
export const fetchTickets = () => apiClient.get("/api/admin/tickets").then((r) => r.data?.tickets || []);

export const fetchTicketById = (ticketId) =>
  apiClient.get(`/api/admin/tickets/${ticketId}`).then((r) => r.data?.ticket);

export const fetchTicketMessages = (ticketId) =>
  apiClient.get(`/api/admin/tickets/${ticketId}/messages`).then((r) => r.data?.messages || []);

export const fetchTicketSender = (ticketId) =>
  apiClient.get(`/api/admin/tickets/${ticketId}/sender`).then((r) => r.data?.sender);

export const sendTicketReply = (ticketId, message) =>
  apiClient.post(`/api/admin/tickets/${ticketId}/messages`, { message }).then((r) => r.data?.newMessage);

export const acceptTicket = (ticketId) =>
  apiClient.patch(`/api/admin/tickets/${ticketId}/accept`).then((r) => r.data?.ticket);

export const rejectTicket = (ticketId) =>
  apiClient.patch(`/api/admin/tickets/${ticketId}/reject`).then((r) => r.data?.ticket);

export const transferTicket = (ticketId, newStaffId) =>
  apiClient.patch(`/api/admin/tickets/${ticketId}/transfer`, { newStaffId }).then((r) => r.data?.ticket);

export const updateTicketStatus = (ticketId, status) =>
  apiClient.patch(`/api/admin/tickets/${ticketId}/status`, { status }).then((r) => r.data?.ticket);

export const archiveTicket = (ticketId) =>
  apiClient.patch(`/api/admin/tickets/${ticketId}/manage`, { action: "archive" }).then((r) => r.data);

export const deleteTicket = (ticketId) =>
  apiClient.patch(`/api/admin/tickets/${ticketId}/manage`, { action: "delete" }).then((r) => r.data);

export const sendAdminAnnouncement = (payload) =>
  apiClient.post("/api/admin/tickets/announce", payload).then((r) => r.data);

export const fetchSupportStaff = () =>
  apiClient.get("/api/auth/staff-list").then((r) => (r.data?.users || []).filter((u) => u.role === "support" && u.isActive !== false));

// ---- live chat settings (on/off + schedule for the customer-site widget) ----
export const fetchChatSettings = () =>
  apiClient.get("/api/admin/support/chat-settings").then((r) => r.data?.settings);

export const updateChatSettings = (payload) =>
  apiClient.put("/api/admin/support/chat-settings", payload).then((r) => r.data?.settings);
