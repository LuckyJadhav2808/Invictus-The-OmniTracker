"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { initReminderScheduler } from "@/lib/utils/reminder-scheduler";
import { registerServiceWorker } from "@/lib/utils/notifications";
import { syncEngine } from "@/lib/offline/sync-manager";
import { OfflineStatusBanner } from "@/components/shared/OfflineStatusBanner";

import { useRouter } from "next/navigation";
import { initNativeNotificationBridge, isNativeApp } from "@/lib/native/native-notifications";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
    if (isNativeApp()) {
      initNativeNotificationBridge(router).catch(() => {});
    }
    syncEngine.registerQueryInvalidator(() => {
      queryClient.invalidateQueries();
    });
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OfflineStatusBanner />
        {children}
        <Toaster
          position="top-center"
          expand
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: "1rem",
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "0.875rem",
              border: "2.5px solid #161514",
              boxShadow: "4px 4px 0px 0px #161514",
              color: "#161514",
            },
            classNames: {
              toast: "font-bold text-sm",
              title: "font-heading font-black",
              description: "text-xs font-bold",
              actionButton: "bg-[#161514] text-white font-black border border-[#161514] rounded-lg",
              cancelButton: "bg-white text-[#161514] font-black border-2 border-[#161514] rounded-lg",
              closeButton: "!border-2 !border-[#161514] !bg-white !text-[#161514] !shadow-[1.5px_1.5px_0px_#161514] hover:!bg-rose-100",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
