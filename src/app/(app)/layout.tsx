"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { Sidebar } from "@/components/shared/Sidebar";
import { BottomNav } from "@/components/shared/BottomNav";
import { SpaceHeader } from "@/components/shared/SpaceHeader";
import { QuickActionModal } from "@/components/shared/QuickActionModal";
import { OmniWidgetSync } from "@/components/shared/OmniWidgetSync";
import { AutoUpdateBanner } from "@/components/shared/AutoUpdateBanner";
import { APP_VERSION_CONFIG } from "@/config/version";
import { InvictusLoadingScreen } from "@/components/shared/InvictusLoadingScreen";
import { SpaceCockpitSkeleton } from "@/components/shared/NeobrutalistSkeleton";
import { getCustomSession } from "@/lib/custom-auth";
import { safeModeWatchdog } from "@/lib/runtime/safe-mode-watchdog";
import { SafeModeScreen } from "@/components/shared/SafeModeScreen";
import { migrationEngine } from "@/lib/offline/migration-engine";
import { NativeBackHandler } from "@/components/shared/NativeBackHandler";
import { DynamicIslandDock } from "@/components/shared/DynamicIslandDock";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [safeModeActive, setSafeModeActive] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsub = safeModeWatchdog.subscribe((status) => {
      setSafeModeActive(status.isSafeMode);
    });

    // Mark boot as healthy once layout is mounted cleanly
    const healthyTimer = setTimeout(() => {
      safeModeWatchdog.markBootAsHealthy();
    }, 1500);

    // Run safe client storage migration in background
    migrationEngine.runMigrations().catch(() => {});

    const isGuest = localStorage.getItem("invictus_guest_mode") === "true";
    const session = getCustomSession();
    if (session || isGuest) {
      setChecking(false);
    }

    return () => {
      clearTimeout(healthyTimer);
      unsub();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    setChecking(false);
  }, [user, loading, router]);

  // Scroll Restoration: Reset custom viewport scroll to top on route change
  useEffect(() => {
    const scrollContainer = document.getElementById("main-scroll-container");
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, [pathname]);

  if (!mounted || loading || checking) {
    return <InvictusLoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF8F5] dark:bg-[#161514] text-[#161514] dark:text-[#FAF8F5] transition-colors">
      {/* Native Android & Mobile Backstack Manager */}
      <NativeBackHandler />

      {/* Mobile Floating Dynamic Island Dock (Thumb-Zone above Bottom Nav) */}
      <DynamicIslandDock variant="mobile" />

      {/* Desktop Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <main
        id="main-scroll-container"
        className="flex-1 pb-36 lg:pb-0 min-h-screen relative overflow-y-auto flex flex-col"
      >
        {/* Proactive Auto-Update Notification Banner */}
        <AutoUpdateBanner />

        {/* Clean Production Top Bar */}
        <SpaceHeader />

        {/* Dynamic Route Content */}
        <div className="flex-1 w-full max-w-6xl mx-auto">
          <Suspense fallback={<SpaceCockpitSkeleton />}>
            {children}
          </Suspense>
        </div>

        {/* Minimalist Production Status Footer */}
        <footer className="mt-auto border-t border-[#E8E5DF] dark:border-[#2A2724] py-3.5 px-6 lg:pr-64 text-center sm:flex sm:items-center sm:justify-between max-w-6xl mx-auto w-full text-[#8C8882] dark:text-[#A8A29E] text-[11px] font-medium gap-4 select-none transition-colors">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-heading font-bold text-[#161514] dark:text-[#FAF8F5]">Invictus OS</span>
            <span>•</span>
            <span className="bg-[#F1EFEA] dark:bg-[#252321] px-2 py-0.5 rounded text-[10px] font-mono font-medium text-[#8C8882] dark:text-[#A8A29E] border border-[#E8E5DF] dark:border-[#2A2724]">
              v{APP_VERSION_CONFIG.version} Production
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("invictus:open-quick-actions"));
                }
              }}
              className="bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5 shadow-xs hover:bg-[#F1EFEA] dark:hover:bg-[#252321] transition-colors cursor-pointer"
              title="Open Command Palette (⌘K)"
            >
              <kbd className="font-mono bg-[#F1EFEA] dark:bg-[#252321] px-1 rounded border border-[#E8E5DF] dark:border-[#2A2724] text-[10px] text-[#8C8882] dark:text-[#A8A29E]">⌘ K</kbd>
              <span>Quick Actions</span>
            </button>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>All systems healthy</span>
            </span>
          </div>
        </footer>
      </main>

      {/* Global Modals & Background Synchronization */}
      <Suspense fallback={null}>
        <QuickActionModal />
        <OmniWidgetSync />
      </Suspense>

      {/* Mobile 5-Tab Persistent Navigation */}
      <BottomNav />

      {/* Bootloader Safe-Mode Circuit Breaker Recovery Dialog */}
      {safeModeActive && (
        <SafeModeScreen onDismiss={() => setSafeModeActive(false)} />
      )}
    </div>
  );
}
