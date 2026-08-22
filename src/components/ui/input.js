import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-faint)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Label = forwardRef(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("mb-1.5 block text-xs font-medium text-[var(--text-muted)]", className)} {...props} />
));
Label.displayName = "Label";

export const FieldError = ({ children }) =>
  children ? <p className="mt-1 text-xs text-[var(--danger)]">{children}</p> : null;
