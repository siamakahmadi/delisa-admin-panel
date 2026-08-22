"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TagInput({ value = [], onChange, placeholder, disabled, className }) {
  const [text, setText] = useState("");

  const parseList = (str) =>
    String(str)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const addTags = (raw) => {
    const parts = parseList(raw);
    if (!parts.length) return;
    const next = [...value];
    parts.forEach((part) => {
      if (!next.some((item) => item.toLowerCase() === part.toLowerCase())) next.push(part);
    });
    onChange(next);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTags(text);
      return;
    }
    if (e.key === "Backspace" && !text) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-1.5 focus-within:border-[var(--brand-500)] focus-within:ring-2 focus-within:ring-[var(--brand-100)]",
        className
      )}
    >
      {value.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-50)] px-2.5 py-1 text-xs font-medium text-[var(--brand-700)]"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            disabled={disabled}
            className="text-[var(--brand-500)] hover:text-[var(--brand-700)]"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTags(text)}
        onPaste={(e) => {
          e.preventDefault();
          addTags(e.clipboardData.getData("text") || "");
        }}
        placeholder={value.length ? "" : placeholder}
        disabled={disabled}
        className="min-w-[80px] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-[var(--text-faint)]"
      />
    </div>
  );
}
