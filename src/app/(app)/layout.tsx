"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { Sidebar } from "@/components/shared/Sidebar";
import { BottomNav } from "@/components/shared/BottomNav";
import { SpaceHeader } from "@/components/shared/SpaceHeader";
import { NeobrutalistCalculator } from "@/components/shared/NeobrutalistCalculator";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

import { Suspense } from "react";
import { QuickActionModal } from "@/components/shared/QuickActionModal";
import { OmniWidgetSync } from "@/components/shared/OmniWidgetSync";
import { AutoUpdateBanner } from "@/components/shared/AutoUpdateBanner";
import { APP_VERSION_CONFIG } from "@/config/version";
import { InvictusLoadingScreen } from "@/components/shared/InvictusLoadingScreen";
import { getCustomSession } from "@/lib/custom-auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(() => {
    if (typeof window === "undefined") return true;
    const isGuest = localStorage.getItem("invictus_guest_mode") === "true";
    const onboardedLocal = localStorage.getItem("invictus_onboarded") === "true";
    const session = getCustomSession();
    if (session && (session.onboarded || onboardedLocal || isGuest)) {
      return false;
    }
    return true;
  });
  const { activeTracker, setActiveTracker } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);

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

  if (loading || checking) {
    return <InvictusLoadingScreen />;
  }

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col lg:flex-row bg-cream-bg text-navy-900 transition-colors duration-300",
        (activeTracker === "life" || pathname.startsWith("/goals")) && "theme-life",
        (activeTracker === "study" || pathname.startsWith("/study")) && "theme-study",
        (activeTracker === "money" || pathname.startsWith("/money")) && "theme-money"
      )}
    >
      <Sidebar />
      <main id="main-scroll-container" className="flex-1 pb-24 lg:pb-0 min-h-screen relative overflow-y-auto flex flex-col">
        {/* Proactive Auto-Update Notification Banner */}
        <AutoUpdateBanner />

        {/* Top Header Bar with Switcher */}
        <SpaceHeader />

        {/* Content container */}
        <div className="flex-1">
          {children}
        </div>

        {/* Production Footer */}
        <footer className="mt-auto border-t border-border/50 py-6 px-6 text-center sm:flex sm:items-center sm:justify-between max-w-6xl mx-auto w-full text-navy-600/70 text-[11px] font-semibold gap-4">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-extrabold text-navy-900">Invictus OS</span>
            <span>•</span>
            <span className="bg-white/60 px-2 py-0.5 rounded-full border border-border/40 text-[10px]">v{APP_VERSION_CONFIG.version} Production</span>
          </div>

          <div className="flex items-center justify-center gap-3 mt-2 sm:mt-0">
            <span className="bg-white/80 border px-2.5 py-1 rounded-full text-[10px] font-bold text-navy-900 flex items-center gap-1 shadow-2xs">
              <kbd className="font-mono bg-cream-bg px-1 rounded border">⌘ K</kbd> Quick Actions
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </span>
          </div>
        </footer>
      </main>
      <NeobrutalistCalculator />
      <Suspense fallback={null}>
        <QuickActionModal />
        <OmniWidgetSync />
      </Suspense>
      <BottomNav />
    </div>
  );
}
