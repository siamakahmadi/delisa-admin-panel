"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT, ORDER_STATUS_OPTIONS } from "@/lib/constants";

export function StatusQuickSelect({ status, onChange, disabled }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 rounded-full outline-none disabled:opacity-50"
        >
          <Badge variant={ORDER_STATUS_VARIANT[status] || "neutral"} size="sm" dot>
            {ORDER_STATUS_LABELS[status] || status || "-"}
            <ChevronDown size={10} className="opacity-60" />
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
        {ORDER_STATUS_OPTIONS.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => onChange(s)} className={s === status ? "font-semibold" : ""}>
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: `var(--${ORDER_STATUS_VARIANT[s] === "neutral" ? "text-faint" : ORDER_STATUS_VARIANT[s]})` }}
            />
            {ORDER_STATUS_LABELS[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
