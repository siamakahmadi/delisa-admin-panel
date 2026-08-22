import apiClient from "@/lib/apiClient";

export const fetchAnalyticsOverview = (params) =>
  apiClient.get("/api/admin/analytics/overview", { params }).then((r) => r.data);

export const fetchTopPages = (params) =>
  apiClient.get("/api/admin/analytics/top-pages", { params }).then((r) => r.data);

export const fetchAnalyticsSessions = (params) =>
  apiClient.get("/api/admin/analytics/sessions", { params }).then((r) => r.data);

export const fetchSessionDetail = (sessionId) =>
  apiClient.get(`/api/admin/analytics/sessions/${sessionId}`).then((r) => r.data);

export function formatDurationMs(ms) {
  if (!ms || ms < 1000) return "کمتر از ۱ ثانیه";
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec} ثانیه`;
  return `${min} دقیقه و ${sec} ثانیه`;
}
