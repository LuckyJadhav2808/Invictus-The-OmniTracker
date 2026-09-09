"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { Suspense } from "react";
import {
  Home,
  BookOpen,
  Wallet,
  User,
  CheckSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { InvictusLogo } from "@/components/shared/InvictusLogo";

function SidebarContent() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { setActiveTracker } = useUIStore();

  const spaceNavItems = [
    {
      href: "/today",
      label: "Today Overview",
      icon: Home,
      value: "today",
      colorBg: "bg-[#CEF431] text-[#161514] border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]",
    },
    {
      href: "/goals",
      label: "Goals & Life",
      icon: CheckSquare,
      value: "life",
      colorBg: "bg-[#03D26F] text-[#161514] border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]",
    },
    {
      href: "/study",
      label: "Study & Exams",
      icon: BookOpen,
      value: "study",
      colorBg: "bg-[#C084FC] text-[#161514] border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]",
    },
    {
      href: "/money",
      label: "Money & Ledger",
      icon: Wallet,
      value: "money",
      colorBg: "bg-[#FBCFE8] text-[#161514] border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]",
    },
  ];

  if (user?.email?.toLowerCase() === "luckymanojjadhav@gmail.com" || user?.role === "admin") {
    spaceNavItems.push({
      href: "/admin",
      label: "Admin Panel",
      icon: ShieldCheck,
      value: "admin",
      colorBg: "bg-amber-300 text-[#161514] border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]",
    });
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r-[2.5px] border-[#161514] h-screen sticky top-0 p-6 justify-between select-none shadow-[4px_0px_0px_0px_rgba(22,21,20,0.06)]">
      <div className="space-y-8">
        {/* Logo */}
        <div className="px-1">
          <InvictusLogo size="md" variant="full" href="/today" />
        </div>

        {/* Space Architecture Nav */}
        <div className="space-y-3">
          <span className="font-heading font-black text-[11px] uppercase tracking-wider text-[#161514]/70 px-2 block">
            Navigation Spaces
          </span>
          <nav className="space-y-2">
            {spaceNavItems.map((item) => {
              const isActive =
                item.href === "/today"
                  ? pathname === "/today"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (item.value !== "today" && item.value !== "admin") {
                      setActiveTracker(item.value as any);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-heading font-extrabold transition-all duration-150 cursor-pointer select-none border-2",
                    isActive
                      ? item.colorBg
                      : "text-[#161514]/85 border-transparent hover:text-[#161514] hover:bg-[#EAF4F4] hover:border-[#161514] hover:shadow-[2px_2px_0px_0px_#161514] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  )}
                >
                  <Icon className="h-4.5 w-4.5 stroke-[2.5]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User profile footer */}
      <Link
        href="/profile"
        className={cn(
          "flex items-center gap-3 p-3 rounded-2xl border-[2.5px] border-[#161514] transition-all duration-150 select-none shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#161514] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
          pathname.startsWith("/profile")
            ? "bg-[#CEF431] text-[#161514]"
            : "bg-white text-[#161514] hover:bg-[#EAF4F4]"
        )}
      >
        <div className="h-9 w-9 rounded-full bg-[#161514] text-white flex items-center justify-center font-black text-sm shrink-0 border border-[#161514]">
          {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-xs font-extrabold truncate leading-tight">
            {user?.displayName || "User"}
          </p>
          <p className="text-[10px] text-[#161514]/70 truncate font-semibold">{user?.email}</p>
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
