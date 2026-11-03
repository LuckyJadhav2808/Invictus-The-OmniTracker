"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { Suspense, useRef } from "react";
import {
  SunMedium,
  CheckSquare,
  GraduationCap,
  Kanban,
  Wallet,
  BarChart2,
  Settings,
  ShieldCheck,
  User,
  LogOut,
} from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { InvictusLogo } from "@/components/shared/InvictusLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { setActiveTracker } = useUIStore();
  const lastNavClickRef = useRef<number>(0);

  const primaryNavItems = [
    {
      href: "/today",
      label: "Today Overview",
      icon: SunMedium,
      value: "today",
      accent: "bg-[#03D26F]",
    },
    {
      href: "/goals",
      label: "Habits & Health",
      icon: CheckSquare,
      value: "life",
      accent: "bg-[#03D26F]",
    },
    {
      href: "/study",
      label: "Study & Exams",
      icon: GraduationCap,
      value: "study",
      accent: "bg-[#8B5CF6]",
    },
    {
      href: "/tasks",
      label: "Tasks & Projects",
      icon: Kanban,
      value: "tasks",
      accent: "bg-[#F59E0B]",
    },
    {
      href: "/money",
      label: "Money & Ledger",
      icon: Wallet,
      value: "money",
      accent: "bg-[#03D26F]",
    },
  ];

  const secondaryNavItems = [
    {
      href: "/analytics",
      label: "Analytics Hub",
      icon: BarChart2,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  const isAdmin =
    user?.email?.toLowerCase() === "luckymanojjadhav@gmail.com" ||
    user?.role === "admin";

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#FAF8F5] dark:bg-[#161514] border-r border-[#E8E5DF] dark:border-[#2A2724] h-screen sticky top-0 p-4 justify-between select-none shadow-none z-20 transition-colors">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="px-1.5 py-1">
          <InvictusLogo size="md" variant="full" href="/today" />
        </div>

        {/* Primary Navigation Spaces */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-heading font-black uppercase text-[#A8A29E] dark:text-[#8C8882] px-3 pt-1 block tracking-wider">
            Core Spaces
          </span>
          <nav className="space-y-1">
            {primaryNavItems.map((item) => {
              const isActive =
                item.href === "/today"
                  ? pathname === "/today"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    const now = Date.now();
                    if (now - lastNavClickRef.current < 250 && isActive) {
                      e.preventDefault();
                      return;
                    }
                    lastNavClickRef.current = now;
                    if (item.value !== "today") {
                      setActiveTracker(item.value as any);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none border relative group",
                    isActive
                      ? "bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#2A2724] shadow-xs font-semibold"
                      : "text-[#6B6B6B] dark:text-[#A8A29E] border-transparent hover:text-[#161514] dark:hover:text-[#FAF8F5] hover:bg-[#F1EFEA] dark:hover:bg-[#252321]"
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-1 top-2 bottom-2 w-1 rounded-full",
                        item.accent
                      )}
                    />
                  )}
                  <Icon
                    className={cn(
                      "size-4 stroke-[1.75] transition-colors",
                      isActive
                        ? "text-[#161514] dark:text-[#FAF8F5]"
                        : "text-[#8C8882] dark:text-[#78716C] group-hover:text-[#161514] dark:group-hover:text-[#FAF8F5]"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Secondary Navigation */}
        <div className="space-y-1.5 pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724]">
          <span className="text-[10px] font-heading font-black uppercase text-[#A8A29E] dark:text-[#8C8882] px-3 pt-1 block tracking-wider">
            Tools & System
          </span>
          <nav className="space-y-1">
            {secondaryNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none border",
                    isActive
                      ? "bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#2A2724] shadow-xs font-semibold"
                      : "text-[#6B6B6B] dark:text-[#A8A29E] border-transparent hover:text-[#161514] dark:hover:text-[#FAF8F5] hover:bg-[#F1EFEA] dark:hover:bg-[#252321]"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 stroke-[1.75]",
                      isActive
                        ? "text-[#161514] dark:text-[#FAF8F5]"
                        : "text-[#8C8882] dark:text-[#78716C]"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none border",
                  pathname.startsWith("/admin")
                    ? "bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-900/40 shadow-xs font-semibold"
                    : "text-amber-800 dark:text-amber-400 border-transparent hover:bg-amber-50/70 dark:hover:bg-amber-950/20"
                )}
              >
                <ShieldCheck className="size-4 stroke-[1.75]" />
                <span>Admin Console</span>
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* User profile card & theme controls */}
      <div className="pt-3 border-t border-[#E8E5DF] dark:border-[#2A2724] space-y-2">
        {/* Quick Theme Switch Row */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs">
          <span className="text-[10.5px] font-mono font-bold tracking-wider uppercase text-[#8C8882] dark:text-[#A8A29E]">
            THEME MODE
          </span>
          <ThemeToggle size="sm" />
        </div>

        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-2.5 p-2 rounded-xl border transition-colors select-none",
            pathname.startsWith("/profile")
              ? "bg-white dark:bg-[#1C1A18] border-[#E8E5DF] dark:border-[#2A2724] shadow-xs"
              : "bg-transparent border-transparent hover:bg-white dark:hover:bg-[#1C1A18] hover:border-[#E8E5DF] dark:hover:border-[#2A2724]"
          )}
        >
          <div className="size-7 rounded-lg bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] flex items-center justify-center font-bold text-xs shrink-0">
            {user?.displayName ? (
              user.displayName.charAt(0).toUpperCase()
            ) : (
              <User className="size-3.5 stroke-[1.75]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate leading-tight text-[#161514] dark:text-[#FAF8F5]">
              {user?.displayName || "Invictus User"}
            </p>
            <p className="text-[10px] text-[#8C8882] dark:text-[#A8A29E] truncate font-mono">
              {user?.email || "Local Guest"}
            </p>
          </div>
        </Link>

        <button
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium text-[#8C8882] dark:text-[#A8A29E] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
        >
          <LogOut className="size-3.5 stroke-[1.75]" />
          <span>Sign Out</span>
        </button>
      </div>
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
