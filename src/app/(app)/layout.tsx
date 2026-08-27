"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const { activeTracker, setActiveTracker } = useUIStore();
  const [isAssembling, setIsAssembling] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsAssembling(true);
    const timer = setTimeout(() => setIsAssembling(false), 650);
    return () => clearTimeout(timer);
  }, [activeTracker]);

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 mx-auto rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
          <p
            className="text-navy-600 font-semibold text-sm"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Loading Invictus…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col lg:flex-row bg-cream-bg text-navy-900 transition-colors duration-500",
        activeTracker === "life" && "theme-life",
        activeTracker === "study" && "theme-study",
        activeTracker === "money" && "theme-money"
      )}
    >
      <Sidebar />
      <main className="flex-1 pb-24 lg:pb-0 min-h-screen relative overflow-y-auto flex flex-col">
        {/* Top Header Bar with Switcher */}
        <SpaceHeader />

        {/* Content with playful springy parallax-like assemble animation */}
        <div className={cn("flex-1", isAssembling && "animate-playful-assemble")}>
          {children}
        </div>

        {/* Production Footer */}
        <footer className="mt-auto border-t border-border/50 py-6 px-6 text-center sm:flex sm:items-center sm:justify-between max-w-6xl mx-auto w-full text-navy-600/70 text-[11px] font-semibold gap-4">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-extrabold text-navy-900">Invictus OS</span>
            <span>•</span>
            <span className="bg-white/60 px-2 py-0.5 rounded-full border border-border/40 text-[10px]">v1.2.0 Production</span>
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
      </Suspense>
      <BottomNav />
    </div>
  );
}
