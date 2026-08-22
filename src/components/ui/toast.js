"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

const VARIANTS = {
  success: { icon: CheckCircle2, className: "border-l-4" },
  error: { icon: XCircle, className: "border-l-4" },
  info: { icon: Info, className: "border-l-4" },
};

const VARIANT_COLOR = {
  success: "var(--success)",
  error: "var(--danger)",
  info: "var(--info)",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((variant, title, description) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, variant, title, description, open: true }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const api = {
    success: (title, description) => push("success", title, description),
    error: (title, description) => push("error", title, description),
    info: (title, description) => push("info", title, description),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toasts.map((t) => {
        const { icon: Icon } = VARIANTS[t.variant] ?? VARIANTS.info;
        return (
          <ToastPrimitive.Root
            key={t.id}
            open={t.open}
            onOpenChange={(open) => !open && remove(t.id)}
            className={cn(
              "flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--surface)] p-4 shadow-[var(--shadow-lg)] border data-[state=open]:animate-toast-in data-[state=closed]:animate-toast-out"
            )}
            style={{ borderInlineStartColor: VARIANT_COLOR[t.variant], borderInlineStartWidth: 4 }}
          >
            <Icon size={20} style={{ color: VARIANT_COLOR[t.variant] }} className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <ToastPrimitive.Title className="text-sm font-semibold text-[var(--text)]">
                {t.title}
              </ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close className="text-[var(--text-faint)] hover:text-[var(--text)]">
              <X size={16} />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed bottom-4 left-4 z-[100] flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none" />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
