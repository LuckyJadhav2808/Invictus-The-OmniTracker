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
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[380px] h-16 bg-amber-400 border-2 border-navy-950 rounded-2xl px-3 flex items-center justify-around shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] z-40 lg:hidden transition-colors duration-500">
      {navItems.map((item) => {
        const isActive = isLinkActive(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-center transition-all duration-200 h-11 w-11 rounded-xl border-2 border-transparent",
              isActive
                ? "bg-navy-950 text-white border-navy-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-105"
                : "text-navy-950 hover:bg-white/50 hover:border-navy-950"
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
