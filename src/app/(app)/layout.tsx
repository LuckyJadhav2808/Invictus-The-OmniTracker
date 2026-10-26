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
import { getCustomSession } from "@/lib/custom-auth";
import { safeModeWatchdog } from "@/lib/runtime/safe-mode-watchdog";
import { SafeModeScreen } from "@/components/shared/SafeModeScreen";
import { migrationEngine } from "@/lib/offline/migration-engine";
import { NativeBackHandler } from "@/components/shared/NativeBackHandler";
import { DynamicIslandDock } from "@/components/shared/DynamicIslandDock";
import { EvaluatorSandboxBanner } from "@/components/shared/EvaluatorSandboxBanner";

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

    // Run safe client storage migration in background
    migrationEngine.runMigrations().catch(() => {});

    const isGuest = localStorage.getItem("invictus_guest_mode") === "true";
    const onboardedLocal = localStorage.getItem("invictus_onboarded") === "true";
    const session = getCustomSession();
    if (session && (session.onboarded || onboardedLocal || isGuest)) {
      setChecking(false);
    }

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Check onboarding status
    const checkOnboarding = () => {
      if (!user.onboarded) {
        const onboardedLocal = localStorage.getItem("invictus_onboarded") === "true";
        if (!onboardedLocal) {
          router.push("/onboarding");
          return;
        }
      }
      setChecking(false);
    };

    checkOnboarding();
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FBF9F5] text-[#161514]">
      {/* Native Android & Mobile Backstack Manager */}
      <NativeBackHandler />

      {/* Mobile Floating Dynamic Island Dock (Thumb-Zone above Bottom Nav) */}
      <DynamicIslandDock variant="mobile" />

      {/* Desktop Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <main
        id="main-scroll-container"
        className="flex-1 pb-24 lg:pb-0 min-h-screen relative overflow-y-auto flex flex-col"
      >
        {/* Evaluator Sandbox Banner (Active for Guests) */}
        <EvaluatorSandboxBanner />

        {/* Proactive Auto-Update Notification Banner */}
        <AutoUpdateBanner />

        {/* Clean Production Top Bar */}
        <SpaceHeader />

        {/* Dynamic Route Content */}
        <div className="flex-1 w-full max-w-6xl mx-auto">
          <Suspense fallback={<InvictusLoadingScreen message="Loading Space…" />}>
            {children}
          </Suspense>
        </div>

        {/* Minimalist Production Status Footer */}
        <footer className="mt-auto border-t-2 border-[#161514]/15 py-4 px-6 text-center sm:flex sm:items-center sm:justify-between max-w-6xl mx-auto w-full text-[#161514]/60 text-[11px] font-semibold gap-4 select-none">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-heading font-black text-[#161514]">Invictus OS</span>
            <span>•</span>
            <span className="bg-white px-2 py-0.5 rounded-md border border-[#161514]/30 text-[10px] font-mono">
              v{APP_VERSION_CONFIG.version} Production
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <span className="bg-white border-2 border-[#161514] px-2.5 py-1 rounded-lg text-[10px] font-heading font-extrabold text-[#161514] flex items-center gap-1 shadow-[1.5px_1.5px_0px_0px_#161514]">
              <kbd className="font-mono bg-[#F1EFEA] px-1 rounded border border-[#161514]/30">⌘ K</kbd> Quick Actions
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
