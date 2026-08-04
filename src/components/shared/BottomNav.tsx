"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Calendar, User, CheckSquare, BookOpen, Trophy, Wallet, TrendingUp, ShieldCheck } from "lucide-react";
import { Suspense } from "react";
import { useUIStore } from "@/store/ui-store";
import { useAuth } from "@/components/shared/AuthProvider";
import { cn } from "@/lib/utils";

function BottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const { activeTracker } = useUIStore();
  const { user } = useAuth();

  const getNavItems = () => {
    let items = [];
    switch (activeTracker) {
      case "tasks":
        items = [
          { href: "/today", icon: Home, label: "Today" },
          { href: "/tasks", icon: CheckSquare, label: "Tasks" },
          { href: "/tasks?tab=kanban", icon: TrendingUp, label: "Kanban" },
          { href: "/profile", icon: User, label: "Profile" },
        ];
        break;
      case "study":
        items = [
          { href: "/today", icon: Home, label: "Today" },
          { href: "/study", icon: BookOpen, label: "Syllabus" },
          { href: "/study?tab=tests", icon: Trophy, label: "Mock Tests" },
          { href: "/profile", icon: User, label: "Profile" },
        ];
        break;
      case "money":
        items = [
          { href: "/today", icon: Home, label: "Today" },
          { href: "/money", icon: Wallet, label: "Ledger" },
          { href: "/money?tab=budgets", icon: TrendingUp, label: "Budgets" },
          { href: "/profile", icon: User, label: "Profile" },
        ];
        break;
      default:
        items = [
          { href: "/today", icon: Home, label: "Today" },
          { href: "/goals", icon: CheckSquare, label: "Habits" },
          { href: "/goals?tab=calendar", icon: Calendar, label: "Heatmap" },
          { href: "/profile", icon: User, label: "Profile" },
        ];
    }

    if (user?.email?.toLowerCase() === "luckymanojjadhav@gmail.com" || user?.role === "admin") {
      items.push({ href: "/admin", icon: ShieldCheck, label: "Admin" });
    }

    return items;
  };

  const navItems = getNavItems();

  const isLinkActive = (href: string) => {
    const [targetPath, targetQuery] = href.split("?");
    if (pathname !== targetPath) return false;
    if (!targetQuery) {
      return !currentTab || currentTab === "list";
    }
    const targetTab = new URLSearchParams(targetQuery).get("tab");
    return currentTab === targetTab;
  };

  return (
    <nav className="fixed bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 w-[92%] max-w-[380px] h-14 sm:h-15 bg-[#CEF431] border-2 border-[#161514] rounded-full px-3 flex items-center justify-around shadow-[3.5px_3.5px_0px_0px_rgba(22,21,20,1)] z-50 lg:hidden transition-all duration-300">
      {navItems.map((item) => {
        const isActive = isLinkActive(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-center transition-all duration-200 h-10 w-10 sm:h-11 sm:w-11 rounded-full border-2 border-transparent",
              isActive
                ? "bg-[#161514] text-white border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] scale-105"
                : "text-[#161514] hover:bg-white/60 hover:border-[#161514]"
            )}
          >
            <Icon className="h-5 w-5 stroke-[2.5]" />
            <span className="sr-only">{item.label}</span>
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
