"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { idbQueryPersister, INVICTUS_QUERY_CACHE_BUSTER } from "@/lib/offline/idb-persister";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { initReminderScheduler } from "@/lib/utils/reminder-scheduler";
import { registerServiceWorker } from "@/lib/utils/notifications";
import { syncEngine } from "@/lib/offline/sync-manager";
import { OfflineStatusBanner } from "@/components/shared/OfflineStatusBanner";

import { useRouter } from "next/navigation";
import { initNativeNotificationBridge, isNativeApp } from "@/lib/native/native-notifications";
import {
  hydrateQueryCacheFromIndexedDB,
  attachQueryCachePersister,
} from "@/lib/offline/query-cache-persister";

// Suppress React 19 false-positive script warning during development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag while rendering React component")) {
      return;
    }
    originalError(...args);
  };
}

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
    // 1. Instant 0ms Cache Hydration from native IndexedDB
    hydrateQueryCacheFromIndexedDB(queryClient).catch(() => {});
    const detachPersister = attachQueryCachePersister(queryClient);

    // 2. Self-healing purge for stale service worker caches (e.g. invictus-static-v1.8.0)
    if (typeof window !== "undefined" && "caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key.startsWith("invictus-static") && key !== "invictus-static-v1.8.3") {
            caches.delete(key).catch(() => {});
          }
        });
      }).catch(() => {});
    }

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
    syncEngine.registerQueryInvalidator((types) => {
      if (types && types.length > 0) {
        for (const type of types) {
          if (type === "money") {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            queryClient.invalidateQueries({ queryKey: ["budgetPreferences"] });
          } else if (type === "goals") {
            queryClient.invalidateQueries({ queryKey: ["habits"] });
            queryClient.invalidateQueries({ queryKey: ["habitLogs"] });
            queryClient.invalidateQueries({ queryKey: ["streaks"] });
            queryClient.invalidateQueries({ queryKey: ["streakFreeze"] });
          } else if (type === "study") {
            queryClient.invalidateQueries({ queryKey: ["studySessions"] });
            queryClient.invalidateQueries({ queryKey: ["subjects"] });
            queryClient.invalidateQueries({ queryKey: ["allTopics"] });
          } else if (type === "gym") {
            queryClient.invalidateQueries({ queryKey: ["gym"] });
            queryClient.invalidateQueries({ queryKey: ["workouts"] });
          } else {
            queryClient.invalidateQueries({ queryKey: [type] });
          }
        }
      } else {
        queryClient.invalidateQueries();
      }
    });

    return () => {
      detachPersister();
    };
  }, [queryClient, router]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: idbQueryPersister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours offline durability
        buster: INVICTUS_QUERY_CACHE_BUSTER,
      }}
    >
      <AuthProvider>
        <OfflineStatusBanner />
        {children}
        <Toaster
          position="top-center"
          expand={false}
          visibleToasts={3}
          gap={8}
          offset={16}
          mobileOffset={{ top: 76, bottom: 84, left: 16, right: 16 }}
          richColors
          closeButton
          duration={3500}
          theme="system"
          toastOptions={{
            style: {
              borderRadius: "1rem",
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
            },
            classNames: {
              toast: "font-bold text-sm bg-white dark:bg-[#161514] text-[#161514] dark:text-[#FAF8F5] border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] rounded-2xl",
              title: "font-heading font-black text-xs uppercase tracking-tight text-[#161514] dark:text-[#FAF8F5]",
              description: "text-xs font-bold text-[#6B6B6B] dark:text-[#FAF8F5]/70",
              actionButton: "bg-[#161514] dark:bg-[#CEF431] text-white dark:text-[#161514] font-black text-xs border border-[#161514] dark:border-[#CEF431] rounded-xl shadow-xs",
              cancelButton: "bg-white dark:bg-[#252220] text-[#161514] dark:text-[#FAF8F5] font-black border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl shadow-xs",
              closeButton: "!border-1.5 !border-[#161514] dark:!border-[#383531] !bg-white dark:!bg-[#252220] !text-[#161514] dark:!text-[#FAF8F5] !shadow-[1px_1px_0px_0px_#161514] dark:!shadow-[1px_1px_0px_0px_#000000] hover:!bg-[#FAF8F5] dark:hover:!bg-[#2e2a28]",
            },
          }}
        />
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
