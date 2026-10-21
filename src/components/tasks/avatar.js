import { cn } from "@/lib/utils";
import { initials } from "@/lib/tasks/api";

const PALETTE = ["#7c5cff", "#ce3263", "#0ea5e9", "#10b981", "#f59e0b", "#14b8a6", "#ef4444", "#64748b"];

function colorFor(id) {
  const s = String(id || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({ user, size = 24, className, ring = true }) {
  return (
    <span
      title={user?.name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
        ring && "ring-2 ring-[var(--surface)]",
        className
      )}
      style={{ width: size, height: size, background: colorFor(user?._id || user?.name), fontSize: Math.max(9, size * 0.38) }}
    >
      {initials(user?.name)}
    </span>
  );
}

export function AvatarStack({ users = [], max = 4, size = 24 }) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <span className="inline-flex items-center -space-x-1.5 space-x-reverse">
      {shown.map((u) => (
        <Avatar key={u._id} user={u} size={size} />
      ))}
      {rest > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-[var(--surface-muted)] text-[10px] font-semibold text-[var(--text-muted)] ring-2 ring-[var(--surface)]"
          style={{ width: size, height: size }}
        >
          +{rest.toLocaleString("fa-IR")}
        </span>
      )}
    </span>
  );
}
