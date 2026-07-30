"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { Suspense } from "react";
import {
  Home,
  Calendar,
  BookOpen,
  Wallet,
  Settings,
  User,
  PieChart,
  CheckSquare,
  Trophy,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { InvictusLogo } from "@/components/shared/InvictusLogo";

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const { user } = useAuth();
  const { activeTracker } = useUIStore();

  const getNavItems = () => {
    let items = [];
    switch (activeTracker) {
      case "study":
        items = [
          { href: "/today", icon: Home, label: "Today" },
          { href: "/study", icon: BookOpen, label: "Syllabus" },
          { href: "/study?tab=tests", icon: Trophy, label: "Mock Tests" },
          { href: "/study?tab=analytics", icon: PieChart, label: "Study Analytics" },
          { href: "/settings", icon: Settings, label: "Settings" },
        ];
        break;
      case "money":
        items = [
          { href: "/today", icon: Home, label: "Today" },
          { href: "/money", icon: Wallet, label: "Ledger" },
          { href: "/money?tab=budgets", icon: TrendingUp, label: "Budgets" },
          { href: "/money?tab=analytics", icon: PieChart, label: "Money Analytics" },
          { href: "/settings", icon: Settings, label: "Settings" },
        ];
        break;
      default:
        items = [
          { href: "/today", icon: Home, label: "Today" },
          { href: "/goals", icon: CheckSquare, label: "Habits List" },
          { href: "/goals?tab=calendar", icon: Calendar, label: "Heatmap" },
          { href: "/goals?tab=analytics", icon: PieChart, label: "Goals Analytics" },
          { href: "/settings", icon: Settings, label: "Settings" },
        ];
    }

    if (user?.email?.toLowerCase() === "luckymanojjadhav@gmail.com" || user?.role === "admin") {
      items.push({ href: "/admin", icon: ShieldCheck, label: "Admin Panel" });
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
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-border/70 h-screen sticky top-0 p-6 justify-between select-none shadow-xs">
      <div className="space-y-8">
        {/* Logo */}
        <div className="px-1">
          <InvictusLogo size="md" variant="full" href="/today" />
        </div>

        {/* Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = isLinkActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer select-none",
                  isActive
                    ? "bg-amber-500 text-navy-900 shadow-sm font-black scale-[1.02]"
                    : "text-navy-900/70 hover:text-navy-950 hover:bg-amber-100/60 hover:scale-[1.01]"
                )}
              >
                <Icon className="h-4 w-4 stroke-[2.5]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile footer */}
      <Link
        href="/profile"
        className={cn(
          "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 select-none",
          pathname.startsWith("/profile")
            ? "border-amber-500 bg-amber-500/10 text-navy-900 font-black shadow-xs"
            : "border-border/60 text-navy-900 hover:bg-amber-100/50 hover:border-amber-300"
        )}
      >
        <div className="h-9 w-9 rounded-full bg-amber-400/30 text-navy-900 flex items-center justify-center font-black text-sm">
          {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black truncate leading-tight">
            {user?.displayName || "User"}
          </p>
          <p className="text-[10px] text-navy-600 truncate font-semibold">{user?.email}</p>
        </div>
      </Link>
    </aside>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={null}>
      <SidebarContent />
    </Suspense>
  );
}
