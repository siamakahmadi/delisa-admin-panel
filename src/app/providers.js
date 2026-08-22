"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Toast from "@radix-ui/react-toast";
import { ToastProvider } from "@/components/ui/toast";
import useUiStore from "@/stores/uiStore";

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    if (theme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toast.Provider swipeDirection="right" duration={4000}>
        <ToastProvider>{children}</ToastProvider>
      </Toast.Provider>
    </QueryClientProvider>
  );
}
