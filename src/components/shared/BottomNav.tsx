"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Target, User, CheckSquare, BookOpen, Trophy, Wallet, TrendingUp, ShieldCheck } from "lucide-react";
import { useState, useEffect, useRef, Suspense } from "react";
import { useUIStore } from "@/store/ui-store";
import { useAuth } from "@/components/shared/AuthProvider";
import { cn } from "@/lib/utils";

function BottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const { activeTracker, setActiveTracker } = useUIStore();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const lastNavClickRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let debounceTimer: NodeJS.Timeout;
    const checkModalOpen = () => {
      // Only detect explicitly open modal dialogs / sheets, never generic regions or body styles
      const hasOpenModal = !!document.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [aria-modal="true"][data-state="open"]'
      );
      setIsModalOpen(hasOpenModal);
    };

    checkModalOpen();

    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(checkModalOpen, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state", "role", "aria-modal"],
    });

    return () => {
      clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, []);

  interface NavItem {
    href: string;
    icon: any;
    label: string;
    value?: string;
    activeColor: string;
  }

  const getNavItems = (): NavItem[] => {
    const items: NavItem[] = [
      {
        href: "/today",
        icon: Home,
        label: "Today",
        value: "today",
        activeColor: "bg-[#CEF431] text-[#161514] border-[#161514] shadow-[2px_2px_0px_0px_#161514]",
      },
      {
        href: "/goals",
        icon: Target,
        label: "Habits",
        value: "life",
        activeColor: "bg-[#03D26F] text-[#161514] border-[#161514] shadow-[2px_2px_0px_0px_#161514]",
      },
      {
        href: "/study",
        icon: BookOpen,
        label: "Study",
        value: "study",
        activeColor: "bg-[#C084FC] text-[#161514] border-[#161514] shadow-[2px_2px_0px_0px_#161514]",
      },
      {
        href: "/money",
        icon: Wallet,
        label: "Money",
        value: "money",
        activeColor: "bg-[#FBCFE8] text-[#161514] border-[#161514] shadow-[2px_2px_0px_0px_#161514]",
      },
    ];

    if (user?.email?.toLowerCase() === "luckymanojjadhav@gmail.com" || user?.role === "admin") {
      items.push({
        href: "/admin",
        icon: ShieldCheck,
        label: "Admin",
        value: "admin",
        activeColor: "bg-[#FDE68A] text-[#161514] border-[#161514] shadow-[2px_2px_0px_0px_#161514]",
      });
    } else {
      items.push({
        href: "/profile",
        icon: User,
        label: "Profile",
        value: "profile",
        activeColor: "bg-[#FDE68A] text-[#161514] border-[#161514] shadow-[2px_2px_0px_0px_#161514]",
      });
    }

    return items;
  };

  const navItems = getNavItems();

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
      aria-label="Mobile Navigation"
      className={cn(
        "fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[94%] max-w-[420px] h-[64px] bg-[#161514] border-[2.5px] border-[#161514] rounded-2xl px-2 flex items-center justify-between shadow-[4px_4px_0px_0px_#161514] z-40 lg:hidden transition-all duration-300 transform",
        isModalOpen ? "translate-y-28 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      )}
    >
      {navItems.map((item) => {
        const isActive = isLinkActive(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => {
              const now = Date.now();
              // Prevent queuing rapid duplicate route transitions on the active route
              if (now - lastNavClickRef.current < 250 && isActive) {
                e.preventDefault();
                return;
              }
              lastNavClickRef.current = now;
              triggerHaptic();
              if (item.value && item.value !== "today" && item.value !== "admin") {
                setActiveTracker(item.value as any);
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border-2 cursor-pointer flex-1 mx-0.5 transition-all duration-150 active:scale-90 select-none",
              isActive
                ? cn(item.activeColor, "scale-105")
                : "bg-transparent text-white/75 border-transparent hover:text-white hover:bg-white/10"
            )}
          >
            <Icon className={cn("h-4.5 w-4.5 stroke-[2.5]", isActive ? "text-[#161514]" : "text-white/80")} />
            <span
              className={cn(
                "font-heading font-extrabold text-[10px] tracking-tight uppercase mt-0.5 leading-none",
                isActive ? "text-[#161514]" : "text-white/70"
              )}
            >
              {item.label}
            </span>
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
