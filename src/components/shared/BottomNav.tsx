"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SunMedium,
  CheckSquare,
  GraduationCap,
  Kanban,
  Wallet,
} from "lucide-react";
import { useRef, Suspense } from "react";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

function BottomNavContent() {
  const pathname = usePathname();
  const { setActiveTracker } = useUIStore();
  const lastNavClickRef = useRef<number>(0);

  const navItems = [
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
    {
      href: "/study",
      icon: GraduationCap,
      label: "Study",
      value: "study",
    },
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

  return (
    <nav
      aria-label="Mobile Primary Navigation"
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[94%] max-w-[420px] h-[58px] bg-[#161514]/92 dark:bg-[#1C1A18]/95 backdrop-blur-2xl border border-white/10 dark:border-white/15 rounded-2xl px-1.5 flex items-center justify-between shadow-2xl z-40 lg:hidden transition-all duration-200 transform translate-y-0 opacity-100 will-change-transform"
    >
      {navItems.map((item) => {
        const isActive = isLinkActive(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onClick={(e) => {
              const now = Date.now();
              if (isActive) {
                // If re-tapping active tab: smooth scroll viewport and container to top
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
            }}
            className={cn(
              "flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl cursor-pointer flex-1 mx-0.5 transition-all duration-150 active:scale-95 select-none relative",
              isActive
                ? "bg-white/15 dark:bg-white/10 text-white shadow-xs font-bold"
                : "bg-transparent text-white/60 hover:text-white/90"
            )}
          >
            <Icon
              className={cn(
                "size-4 stroke-[2]",
                isActive ? "text-white" : "text-white/70"
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium tracking-tight mt-0.5 leading-none",
                isActive ? "text-white font-bold" : "text-white/70"
              )}
            >
              {item.label}
            </span>
            {isActive && (
              <span className="absolute bottom-0.5 size-1 rounded-full bg-[#CEF431]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavContent />
    </Suspense>
  );
}
