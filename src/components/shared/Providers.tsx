"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { initReminderScheduler } from "@/lib/utils/reminder-scheduler";
import { registerServiceWorker } from "@/lib/utils/notifications";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    initReminderScheduler();
    registerServiceWorker().catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-center"
          expand
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: "1.25rem",
              fontFamily: "var(--font-sans)",
              border: "2.5px solid #161514",
              boxShadow: "4px 4px 0px 0px rgba(22,21,20,1)",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
