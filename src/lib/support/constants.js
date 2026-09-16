export const TICKET_STATUS_LABELS = {
  open: "باز",
  in_progress: "در حال بررسی",
  waiting: "در انتظار پاسخ",
  closed: "بسته‌شده",
};

export const TICKET_STATUS_VARIANTS = {
  open: "warning",
  in_progress: "info",
  waiting: "brand",
  closed: "success",
};

export const TICKET_PRIORITY_LABELS = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
};

export const TICKET_PRIORITY_VARIANTS = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export const TICKET_TYPE_LABELS = {
  customer: "مشتری",
  vendor: "فروشنده",
  staff: "داخلی",
};

export const LIVE_CHAT_TOPIC = "چت زنده";

export const CHAT_DAY_LABELS = {
  sat: "شنبه",
  sun: "یکشنبه",
  mon: "دوشنبه",
  tue: "سه‌شنبه",
  wed: "چهارشنبه",
  thu: "پنجشنبه",
  fri: "جمعه",
};

export const CHAT_DAY_ORDER = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];

export const COMMENT_STATUS_LABELS = {
  pending: "در انتظار تایید",
  approved: "تایید شده",
};

export const COMMENT_STATUS_VARIANTS = {
  pending: "warning",
  approved: "success",
};

export function ticketSenderName(ticket) {
  const sender = ticket?.createdBy;
  if (!sender || typeof sender !== "object") return "نامشخص";
  return sender.name || sender.storeInfo?.storeName || sender.phone || sender.contactPhone || "نامشخص";
}

export function ticketSenderPhone(ticket) {
  const sender = ticket?.createdBy;
  if (!sender || typeof sender !== "object") return "";
  return sender.phone || sender.contactPhone || "";
}
