import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const GRADIENTS = {
  violet: "from-[var(--brand-500)] to-[var(--brand-700)]",
  blue: "from-[var(--accent-blue)] to-[var(--accent-cyan)]",
  amber: "from-[var(--accent-amber)] to-[#f97316]",
  pink: "from-[var(--accent-pink)] to-[var(--brand-500)]",
  teal: "from-[var(--accent-teal)] to-[var(--accent-cyan)]",
};

export function StatCard({ icon: Icon, label, value, color = "violet", isLoading }) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
      <div
        className={cn(
          "mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br text-white",
          GRADIENTS[color]
        )}
      >
        <Icon size={20} />
      </div>
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-2 h-7 w-24" />
      ) : (
        <p className="mt-1 text-2xl font-bold text-[var(--text)]">{value}</p>
      )}
      <div
        className={cn(
          "pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 blur-xl",
          GRADIENTS[color]
        )}
      />
    </div>
  );
}
