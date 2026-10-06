"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SunMedium,
  CheckSquare,
  GraduationCap,
  Kanban,
  Wallet,
  BarChart2,
  Settings,
  User,
  ShieldCheck,
  Bell,
  Sparkles,
  Wifi,
  WifiOff,
  LogOut,
  ChevronDown,
  Megaphone,
  X,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { InvictusLogo } from "@/components/shared/InvictusLogo";
import { useAuth } from "@/components/shared/AuthProvider";
import { getGlobalAnnouncement, type GlobalAnnouncement } from "@/lib/custom-auth";
import { ReminderManagerModal } from "@/components/shared/ReminderManagerModal";
import { CloudSyncDrawer } from "@/components/shared/CloudSyncDrawer";
import { useOfflineSync } from "@/lib/offline/sync-manager";
import { format } from "date-fns";
import Link from "next/link";

export function SpaceHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
  const [dismissedAnn, setDismissedAnn] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);
  const { isOnline, isSyncing, pendingCount } = useOfflineSync();

  useEffect(() => {

    const fetchAnnouncement = async () => {
      try {
        const res = await fetch("/api/admin/announcement");
        if (res.ok) {
          const data = await res.json();
          if (data && data.message) {
            setAnnouncement(data);
            return;
          }
        }
        setAnnouncement(getGlobalAnnouncement());
      } catch {
        setAnnouncement(getGlobalAnnouncement());
      }
    };
    fetchAnnouncement();
  }, []);

  const getSpaceInfo = () => {
    if (pathname === "/today") {
      return {
        title: "Today",
        subtitle: "Daily Action Cockpit",
        icon: SunMedium,
        accentColor: "bg-[#CEF431] text-[#161514]",
      };
    }
    if (pathname.startsWith("/goals")) {
      return {
        title: "Habits & Health",
        subtitle: "Routines, Streaks & Wellness",
        icon: CheckSquare,
        accentColor: "bg-[#03D26F] text-[#161514]",
      };
    }
    if (pathname.startsWith("/study")) {
      return {
        title: "Study & Exams",
        subtitle: "Syllabus, Sessions & Mock Tests",
        icon: GraduationCap,
        accentColor: "bg-[#C084FC] text-[#161514]",
      };
    }
    if (pathname.startsWith("/tasks")) {
      return {
        title: "Tasks & Projects",
        subtitle: "Kanban, Priorities & Subtasks",
        icon: Kanban,
        accentColor: "bg-[#F59E0B] text-[#161514]",
      };
    }
    if (pathname.startsWith("/money")) {
      return {
        title: "Money & Ledger",
        subtitle: "Cash Flow, Budgets & Vault",
        icon: Wallet,
        accentColor: "bg-[#03D26F] text-[#161514]",
      };
    }
    if (pathname.startsWith("/analytics")) {
      return {
        title: "Analytics Hub",
        subtitle: "Cross-Module Insights & Performance",
        icon: BarChart2,
        accentColor: "bg-white text-[#161514]",
      };
    }
    if (pathname.startsWith("/settings")) {
      return {
        title: "Settings",
        subtitle: "Preferences, Backup & Configuration",
        icon: Settings,
        accentColor: "bg-white text-[#161514]",
      };
    }
    if (pathname.startsWith("/profile")) {
      return {
        title: "Profile",
        subtitle: "Account Details & Activity Matrix",
        icon: User,
        accentColor: "bg-white text-[#161514]",
      };
    }
    if (pathname.startsWith("/admin")) {
      return {
        title: "Admin Panel",
        subtitle: "System Management & Health",
        icon: ShieldCheck,
        accentColor: "bg-amber-300 text-[#161514]",
      };
    }
    return {
      title: "Invictus",
      subtitle: "OmniTracker",
      icon: Sparkles,
      accentColor: "bg-[#CEF431] text-[#161514]",
    };
  };

  const space = getSpaceInfo();
  const Icon = space.icon;
  const todayFormatted = format(new Date(), "EEE, d MMM");

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FBF9F5]/90 backdrop-blur-md border-b-2 border-[#161514] select-none">
      {/* Optional Announcement Banner */}
      {announcement && announcement.message && !dismissedAnn && (
        <div className="bg-[#CEF431] text-[#161514] px-4 py-2 text-xs font-bold border-b-2 border-[#161514] flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1 min-w-0">
            <Megaphone className="size-4 shrink-0 stroke-[2.5]" />
            <span className="truncate">{announcement.message}</span>
          </div>
          <button
            onClick={() => setDismissedAnn(true)}
            className="p-1 hover:bg-[#161514]/10 rounded-md transition-colors"
            aria-label="Dismiss announcement"
          >
            <X className="size-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Main Header Container */}
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Brand or Desktop Breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <InvictusLogo size="sm" variant="icon-only" href="/today" />
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "size-8 rounded-lg border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center justify-center shrink-0",
                space.accentColor
              )}
            >
              <Icon className="size-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-heading font-black text-sm lg:text-base leading-none text-[#161514] tracking-tight">
                {space.title}
              </h1>
              <p className="hidden sm:block text-[11px] font-semibold text-[#161514]/65 leading-tight mt-0.5">
                {space.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions, Date, Sync & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Date Indicator (Tablet & Desktop) */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] text-xs font-heading font-extrabold text-[#161514]">
            <Calendar className="size-3.5 stroke-[2.5]" />
            <span>{todayFormatted}</span>
          </div>

          {/* Cloud Sync Telemetry Trigger Badge */}
          <button
            type="button"
            onClick={() => setIsSyncDrawerOpen(true)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer",
              !isOnline
                ? "bg-rose-100 text-rose-950"
                : isSyncing
                ? "bg-amber-100 text-amber-950"
                : pendingCount > 0
                ? "bg-amber-200 text-amber-950"
                : "bg-emerald-100 text-emerald-950"
            )}
            title="Inspect Cloud Data Sync & Database Latency"
          >
            {!isOnline ? (
              <>
                <WifiOff className="size-3 text-rose-600 shrink-0" />
                <span className="hidden sm:inline">Offline {pendingCount > 0 ? `(${pendingCount})` : ""}</span>
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw className="size-3 animate-spin text-amber-600 shrink-0" />
                <span className="hidden sm:inline">Syncing...</span>
              </>
            ) : pendingCount > 0 ? (
              <>
                <span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="hidden sm:inline">{pendingCount} Queued</span>
              </>
            ) : (
              <>
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="hidden sm:inline">Synced</span>
              </>
            )}
          </button>

          {/* Reminder Manager Bell */}
          <button
            onClick={() => setIsReminderModalOpen(true)}
            aria-label="Manage Reminders"
            className="size-9 rounded-lg bg-white border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center hover:bg-[#F1EFEA] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            <Bell className="size-4 stroke-[2.2] text-[#161514]" />
          </button>

          {/* User Profile Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              aria-label="User Menu"
              aria-expanded={isProfileMenuOpen}
              className="flex items-center gap-2 p-1 pl-1.5 sm:px-2 py-1 bg-white border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] rounded-xl hover:bg-[#F1EFEA] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <div className="size-7 rounded-lg bg-[#161514] text-white flex items-center justify-center font-black text-xs shrink-0">
                {user?.displayName ? (
                  user.displayName.charAt(0).toUpperCase()
                ) : (
                  <User className="size-3.5 stroke-[2.5]" />
                )}
              </div>
              <span className="hidden sm:inline-block font-heading font-extrabold text-xs max-w-[90px] truncate text-[#161514]">
                {user?.displayName || "Account"}
              </span>
              <ChevronDown className="size-3.5 stroke-[2.5] text-[#161514]/70" />
            </button>

            {/* Dropdown Menu Modal */}
            {isProfileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] rounded-xl py-2 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-2 border-b border-[#161514]/15">
                    <p className="font-heading font-extrabold text-xs text-[#161514] truncate">
                      {user?.displayName || "Invictus User"}
                    </p>
                    <p className="text-[10px] text-[#161514]/60 truncate font-mono">
                      {user?.email || "Local Guest"}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#161514] hover:bg-[#F1EFEA] transition-colors"
                    >
                      <User className="size-4 stroke-[2]" />
                      <span>Profile & Activity</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#161514] hover:bg-[#F1EFEA] transition-colors"
                    >
                      <Settings className="size-4 stroke-[2]" />
                      <span>Settings & Backups</span>
                    </Link>

                    <Link
                      href="/analytics"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#161514] hover:bg-[#F1EFEA] transition-colors"
                    >
                      <BarChart2 className="size-4 stroke-[2]" />
                      <span>Analytics Hub</span>
                    </Link>

                    {(user?.role === "admin" ||
                      user?.email?.toLowerCase() === "luckymanojjadhav@gmail.com") && (
                      <Link
                        href="/admin"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                      >
                        <ShieldCheck className="size-4 stroke-[2.2]" />
                        <span>Admin Console</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-[#161514]/15">
                    <button
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        await signOut();
                        router.push("/login");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="size-4 stroke-[2]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reminder Manager Modal */}
      {isReminderModalOpen && (
        <ReminderManagerModal
          open={isReminderModalOpen}
          onOpenChange={setIsReminderModalOpen}
        />
      )}

      {/* Cloud Sync Telemetry Drawer */}
      <CloudSyncDrawer
        open={isSyncDrawerOpen}
        onOpenChange={setIsSyncDrawerOpen}
      />
    </header>
  );
}
