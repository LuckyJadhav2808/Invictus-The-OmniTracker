"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SunMedium,
  CheckSquare,
  Kanban,
  Wallet,
  Plus,
} from "lucide-react";
import { useRef, useState, useEffect, Suspense } from "react";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { ActionSheet } from "@/components/mobile/ActionSheet";

function BottomNavContent() {
  const pathname = usePathname();
  const { setActiveTracker } = useUIStore();
  const lastNavClickRef = useRef<number>(0);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  // Global listener for action sheet trigger
  useEffect(() => {
    const handleOpenSheet = () => {
      soundFX.playPop();
      soundFX.vibrate(20);
      setIsActionSheetOpen(true);
    };
    window.addEventListener("invictus:open-action-sheet", handleOpenSheet);
    return () => window.removeEventListener("invictus:open-action-sheet", handleOpenSheet);
  }, []);

  const leftNavItems = [
    {
      href: "/today",
      icon: SunMedium,
      label: "Today",
      value: "today",
    },
    {
      href: "/goals",
      icon: CheckSquare,
      label: "Habits",
      value: "life",
    },
  ];

  const rightNavItems = [
    {
      href: "/tasks",
      icon: Kanban,
      label: "Tasks",
      value: "tasks",
    },
    {
      href: "/money",
      icon: Wallet,
      label: "Money",
      value: "money",
    },
  ];

  const isLinkActive = (href: string) => {
    const targetPath = href.split("?")[0];
    if (targetPath === "/today" && pathname === "/today") return true;
    if (targetPath !== "/today" && pathname.startsWith(targetPath)) return true;
    return false;
  };

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
  };

  const handleNavClick = (e: React.MouseEvent, item: any, isActive: boolean) => {
    const now = Date.now();
    if (isActive) {
      const scrollContainer = document.getElementById("main-scroll-container");
      const isScrolled =
        (scrollContainer && scrollContainer.scrollTop > 10) ||
        (typeof window !== "undefined" && window.scrollY > 10);

      if (isScrolled) {
        e.preventDefault();
        if (scrollContainer && scrollContainer.scrollTop > 0) {
          scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
        }
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
          document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
        }
        soundFX.playPop();
        triggerHaptic();
        return;
      }
      if (now - lastNavClickRef.current < 250) {
        e.preventDefault();
        return;
      }
    }
    lastNavClickRef.current = now;
    soundFX.playPop();
    triggerHaptic();
    if (item.value && item.value !== "today") {
      setActiveTracker(item.value as any);
    }
  };

  return (
    <>
      <nav
        aria-label="Mobile Primary Navigation"
        className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[95%] max-w-[430px] h-[60px] bg-[#161514]/94 dark:bg-[#1C1A18]/96 backdrop-blur-2xl border-2 border-[#161514] dark:border-[#38332E] rounded-3xl px-2 flex items-center justify-between shadow-[0px_4px_20px_rgba(0,0,0,0.3)] z-40 lg:hidden transition-all duration-200"
      >
        {/* Left Nav Tabs: Today, Habits */}
        <div className="flex items-center flex-1 justify-around">
          {leftNavItems.map((item) => {
            const isActive = isLinkActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={(e) => handleNavClick(e, item, isActive)}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-1.5 rounded-xl cursor-pointer transition-all duration-150 active:scale-95 select-none relative min-w-[52px]",
                  isActive
                    ? "bg-[#CEF431] text-[#161514] font-black shadow-[1px_1px_0px_0px_#161514]"
                    : "text-white/70 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 stroke-[2.2]",
                    isActive ? "text-[#161514]" : "text-white/75"
                  )}
                />
                <span className="text-[10px] font-heading tracking-tight mt-0.5 leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Center-Docked Notch FAB (Belanje/Routinr Benchmark) */}
        <div className="relative -top-3 px-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              soundFX.vibrate(25);
              setIsActionSheetOpen(true);
            }}
            aria-label="Open Quick Action Sheet"
            className="size-11 sm:size-12 rounded-2xl bg-[#CEF431] text-[#161514] border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
          >
            <Plus className="size-6 stroke-[3]" />
          </button>
        </div>

        {/* Right Nav Tabs: Study, Tasks, Money */}
        <div className="flex items-center flex-1 justify-around">
          {rightNavItems.map((item) => {
            const isActive = isLinkActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={(e) => handleNavClick(e, item, isActive)}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-1.5 rounded-xl cursor-pointer transition-all duration-150 active:scale-95 select-none relative min-w-[50px]",
                  isActive
                    ? "bg-[#CEF431] text-[#161514] font-black shadow-[1px_1px_0px_0px_#161514]"
                    : "text-white/70 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 stroke-[2.2]",
                    isActive ? "text-[#161514]" : "text-white/75"
                  )}
                />
                <span className="text-[10px] font-heading tracking-tight mt-0.5 leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Global Context-Aware Action Sheet */}
      <ActionSheet
        open={isActionSheetOpen}
        onOpenChange={setIsActionSheetOpen}
      />
    </>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavContent />
    </Suspense>
  );
}
