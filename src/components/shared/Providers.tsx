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
      import("@capacitor/splash-screen")
        .then(({ SplashScreen }) => {
          SplashScreen.hide().catch(() => {});
        })
        .catch(() => {});
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
              fontSize: "0.875rem",
            },
            classNames: {
              toast: "font-bold text-sm bg-white dark:bg-[#161514] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724] shadow-md dark:shadow-none rounded-2xl",
              title: "font-heading font-black text-xs uppercase tracking-tight text-[#161514] dark:text-[#FAF8F5]",
              description: "text-xs font-medium text-[#6B6B6B] dark:text-[#FAF8F5]/70",
              actionButton: "bg-[#161514] dark:bg-white text-white dark:text-[#161514] font-black text-xs border border-[#161514] dark:border-white rounded-xl shadow-xs",
              cancelButton: "bg-white dark:bg-[#252220] text-[#161514] dark:text-[#FAF8F5] font-black border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl shadow-xs",
              closeButton: "!border !border-[#E8E5DF] dark:!border-[#2A2724] !bg-white dark:!bg-[#252220] !text-[#161514] dark:!text-[#FAF8F5] !shadow-xs hover:!bg-[#FAF8F5] dark:hover:!bg-[#2e2a28]",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
