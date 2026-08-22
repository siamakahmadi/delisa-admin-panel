import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = forwardRef(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "h-10 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 pl-8 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
  </div>
));
Select.displayName = "Select";
