import apiClient from "@/lib/apiClient";

// ---- footer settings (banner, phone, social links, about-Delisa text) ----
export const fetchFooterSettings = () =>
  apiClient.get("/api/admin/settings/footer").then((r) => r.data?.footer);
export const saveFooterSettings = (footer) =>
  apiClient.put("/api/admin/settings/footer", { footer }).then((r) => r.data?.footer);

export function uploadFooterBannerImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "footer");
  return apiClient.post("/api/admin/uploads/image", fd).then((r) => r.data);
}
