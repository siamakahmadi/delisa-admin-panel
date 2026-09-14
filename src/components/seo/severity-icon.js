import { CircleAlert, TriangleAlert, Info, CircleCheck, CircleX, EyeOff } from "lucide-react";
import { SEVERITY } from "@/lib/seo/constants";

const ICONS = { error: CircleX, warning: TriangleAlert, notice: Info, passed: CircleCheck, skipped: EyeOff };

export function SeverityIcon({ status, size = 16, className }) {
  const Icon = ICONS[status] || CircleAlert;
  return <Icon size={size} className={className} style={{ color: SEVERITY[status]?.color }} />;
}

/** نقطه‌ی رنگی سبک Yoast (قرمز/نارنجی/سبز) */
export function TrafficDot({ status, className }) {
  return <span className={className} style={{ display: "inline-block", width: 10, height: 10, borderRadius: 999, background: SEVERITY[status]?.color || "var(--text-faint)", flexShrink: 0 }} />;
}
