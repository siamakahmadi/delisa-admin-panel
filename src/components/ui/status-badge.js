import { Badge } from "./badge";

export function StatusBadge({ status, labels, variants, size = "sm" }) {
  return (
    <Badge variant={variants[status] || "neutral"} size={size} dot>
      {labels[status] || status || "-"}
    </Badge>
  );
}
