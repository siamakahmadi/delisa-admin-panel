"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchableSelect({ options = [], value, onChange, placeholder = "انتخاب کنید", disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const onOutside = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none transition-colors",
          open && "border-[var(--brand-500)] ring-2 ring-[var(--brand-100)]",
          disabled && "opacity-50"
        )}
      >
        <span className={selected ? "text-[var(--text)]" : "text-[var(--text-faint)]"}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={14} className={cn("text-[var(--text-faint)] transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-2.5 py-2">
            <Search size={13} className="text-[var(--text-faint)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length ? (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2.5 py-2 text-start text-sm hover:bg-[var(--surface-muted)]",
                    String(o.value) === String(value) && "font-semibold text-[var(--brand-600)]"
                  )}
                >
                  {o.label}
                  {String(o.value) === String(value) && <Check size={14} />}
                </button>
              ))
            ) : (
              <div className="px-2.5 py-3 text-center text-xs text-[var(--text-faint)]">موردی یافت نشد</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
