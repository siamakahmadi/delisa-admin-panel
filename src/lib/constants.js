export const ORDER_STATUS_LABELS = {
  pending: "در انتظار پرداخت",
  submitted: "ثبت شده",
  paid: "پرداخت شده",
  waiting_vendor: "در انتظار فروشنده",
  collecting: "در حال جمع‌آوری",
  products_collected: "آماده ارسال",
  sending: "در حال ارسال",
  delivered: "تحویل داده شده",
  vendor_assignment_issue: "خطا در تخصیص فروشنده",
  cancelled: "لغو شده",
};

export const ORDER_STATUS_VARIANT = {
  pending: "warning",
  submitted: "info",
  paid: "info",
  waiting_vendor: "warning",
  collecting: "info",
  products_collected: "brand",
  sending: "brand",
  delivered: "success",
  vendor_assignment_issue: "danger",
  cancelled: "danger",
};

export const ORDER_STATUS_OPTIONS = Object.keys(ORDER_STATUS_LABELS);

export const VENDOR_STATUS_LABELS = {
  invited: "دعوت شده",
  pending: "در انتظار بررسی",
  approved: "تأیید شده",
  rejected: "رد شده",
};

export const VENDOR_STATUS_VARIANT = {
  invited: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export const CUSTOMER_STATUS_LABELS = {
  active: "فعال",
  disabled: "غیرفعال",
};

export const CUSTOMER_STATUS_VARIANT = {
  active: "success",
  disabled: "danger",
};
