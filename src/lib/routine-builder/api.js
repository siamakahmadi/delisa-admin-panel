import apiClient from "@/lib/apiClient";

// روشن/خاموش کردن کل فیچر روتین‌ساز + متن‌های معرفی — همون الگوی
// beauty-profile/api.js.
export const fetchRoutineBuilderSettings = () =>
  apiClient.get("/api/admin/routine-builder/settings").then((r) => r.data?.routineBuilder);
export const saveRoutineBuilderSettings = (routineBuilder) =>
  apiClient.put("/api/admin/routine-builder/settings", { routineBuilder }).then((r) => r.data?.routineBuilder);
