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
      activeBg: "bg-[#CEF431] text-[#161514] border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514]",
    },
    {
      href: "/goals",
      label: "Habits & Health",
      icon: CheckSquare,
      value: "life",
      activeBg: "bg-[#03D26F] text-[#161514] border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514]",
    },
    {
      href: "/study",
      label: "Study & Exams",
      icon: GraduationCap,
      value: "study",
      activeBg: "bg-[#C084FC] text-[#161514] border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514]",
    },
    {
      href: "/tasks",
      label: "Tasks & Projects",
      icon: Kanban,
      value: "tasks",
      activeBg: "bg-[#F59E0B] text-[#161514] border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514]",
    },
    {
      href: "/money",
      label: "Money & Ledger",
      icon: Wallet,
      value: "money",
      activeBg: "bg-[#03D26F] text-[#161514] border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514]",
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
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r-2 border-[#161514] h-screen sticky top-0 p-5 justify-between select-none shadow-[3px_0px_0px_0px_#161514] z-20">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="px-1 py-1">
          <InvictusLogo size="md" variant="full" href="/today" />
        </div>

        {/* Primary Navigation Spaces */}
        <div className="space-y-2">
          <span className="font-heading font-black text-[10px] uppercase tracking-wider text-[#161514]/60 px-3 block">
            Core Spaces
          </span>
          <nav className="space-y-1.5">
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
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-heading font-bold transition-all duration-100 cursor-pointer select-none border-2",
                    isActive
                      ? item.activeBg
                      : "text-[#161514]/85 border-transparent hover:text-[#161514] hover:bg-[#F1EFEA] hover:border-[#161514] hover:shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  )}
                >
                  <Icon className="size-4.5 stroke-[2.2]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Secondary Navigation */}
        <div className="space-y-2 pt-2 border-t border-[#161514]/15">
          <span className="font-heading font-black text-[10px] uppercase tracking-wider text-[#161514]/60 px-3 block">
            Tools & System
          </span>
          <nav className="space-y-1.5">
            {secondaryNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-heading font-bold transition-all duration-100 cursor-pointer select-none border-2",
                    isActive
                      ? "bg-white text-[#161514] border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514]"
                      : "text-[#161514]/75 border-transparent hover:text-[#161514] hover:bg-[#F1EFEA] hover:border-[#161514]/40"
                  )}
                >
                  <Icon className="size-4 stroke-[2]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-heading font-bold transition-all duration-100 cursor-pointer select-none border-2",
                  pathname.startsWith("/admin")
                    ? "bg-amber-300 text-[#161514] border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514]"
                    : "text-amber-800 border-transparent hover:bg-amber-50 hover:border-amber-400"
                )}
              >
                <ShieldCheck className="size-4 stroke-[2.2]" />
                <span>Admin Console</span>
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* User profile card & logout */}
      <div className="pt-4 border-t border-[#161514]/15 space-y-2">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 p-2.5 rounded-xl border-2 border-[#161514] transition-all duration-100 select-none shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
            pathname.startsWith("/profile")
              ? "bg-[#CEF431] text-[#161514]"
              : "bg-white text-[#161514] hover:bg-[#F1EFEA]"
          )}
        >
          <div className="size-8 rounded-lg bg-[#161514] text-white flex items-center justify-center font-black text-xs shrink-0 border border-[#161514]">
            {user?.displayName ? (
              user.displayName.charAt(0).toUpperCase()
            ) : (
              <User className="size-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-xs font-bold truncate leading-tight text-[#161514]">
              {user?.displayName || "Invictus User"}
            </p>
            <p className="text-[10px] text-[#161514]/65 truncate font-mono">
              {user?.email || "Local Guest"}
            </p>
          </div>
        </Link>

        <button
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-300 transition-colors cursor-pointer"
        >
          <LogOut className="size-3.5" />
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
