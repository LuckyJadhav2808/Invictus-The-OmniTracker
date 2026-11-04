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
  ArrowLeft,
} from "lucide-react";
import { InvictusLogo } from "@/components/shared/InvictusLogo";
import { useAuth } from "@/components/shared/AuthProvider";
import { getGlobalAnnouncement, type GlobalAnnouncement } from "@/lib/custom-auth";
import { ReminderManagerModal } from "@/components/shared/ReminderManagerModal";
import { CloudSyncDrawer } from "@/components/shared/CloudSyncDrawer";
import { useOfflineSync } from "@/lib/offline/sync-manager";
import { soundFX } from "@/components/shared/SoundFX";
import { format } from "date-fns";
import Link from "next/link";
import { getSubrouteInfo } from "@/lib/page-flow/page-flow-resolver";
import { DynamicIslandDock } from "@/components/shared/DynamicIslandDock";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
export { getSubrouteInfo };

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

  const subrouteInfo = getSubrouteInfo(pathname);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-[#161514]/85 backdrop-blur-md border-b border-[#E8E5DF] dark:border-[#2A2724] select-none transition-colors">
      {/* Optional Announcement Banner */}
      {announcement && announcement.message && !dismissedAnn && (
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] px-4 py-2 text-xs font-medium border-b border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1 min-w-0">
            <Megaphone className="size-4 shrink-0 stroke-[1.75] text-[#8C8882] dark:text-[#A8A29E]" />
            <span className="truncate">{announcement.message}</span>
          </div>
          <button
            onClick={() => setDismissedAnn(true)}
            className="p-1 hover:bg-[#E8E5DF] dark:hover:bg-[#252321] rounded-md transition-colors text-[#161514] dark:text-[#FAF8F5]"
            aria-label="Dismiss announcement"
          >
            <X className="size-3.5 stroke-[1.75]" />
          </button>
        </div>
      )}

      {/* Main Header Container */}
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Brand / Contextual Back Button & Space Breadcrumb */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {subrouteInfo ? (
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push(subrouteInfo.parentHref);
                }
              }}
              className="h-8 px-2 sm:px-2.5 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#1C1A18] hover:bg-[#F1EFEA] dark:hover:bg-[#252321] flex items-center gap-1.5 text-xs font-medium text-[#161514] dark:text-[#FAF8F5] cursor-pointer transition-colors shrink-0 shadow-xs"
              aria-label={`Back to ${subrouteInfo.parentLabel}`}
              title={`Back to ${subrouteInfo.parentLabel}`}
            >
              <ArrowLeft className="size-4 stroke-[1.75]" />
              <span className="hidden sm:inline">{subrouteInfo.parentLabel}</span>
              <span className="sm:hidden text-[11px]">Back</span>
            </button>
          ) : pathname === "/today" ? (
            <div className="shrink-0">
              <InvictusLogo size="sm" variant="icon-only" href="/today" />
            </div>
          ) : (
            <div className="size-8 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] bg-[#F1EFEA] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center shrink-0 shadow-xs transition-colors">
              <Icon className="size-4 stroke-[1.75]" />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="font-heading font-bold text-sm lg:text-[15px] leading-tight text-[#161514] dark:text-[#FAF8F5] tracking-tight truncate">
              {space.title}
            </h1>
            <p className="hidden sm:block text-[11px] font-medium text-[#8C8882] dark:text-[#A8A29E] leading-tight mt-0.5 truncate">
              {space.subtitle}
            </p>
          </div>
        </div>

        {/* Center: Desktop Dynamic Island Live Activity Dock (Zero Collision) */}
        <div className="hidden lg:flex flex-1 justify-center items-center px-4 min-w-0">
          <DynamicIslandDock variant="header" />
        </div>

        {/* Right: Actions, Date, Sync & User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Date Indicator (Tablet & Desktop) */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1EFEA] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] text-xs font-mono font-medium text-[#161514] dark:text-[#FAF8F5] transition-colors">
            <Calendar className="size-3.5 stroke-[1.75] text-[#8C8882] dark:text-[#A8A29E]" />
            <span>{todayFormatted}</span>
          </div>

          {/* Cloud Sync Telemetry Trigger Badge */}
          <button
            type="button"
            onClick={() => setIsSyncDrawerOpen(true)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono font-medium border shadow-xs transition-colors cursor-pointer",
              !isOnline
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                : isSyncing
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                : pendingCount > 0
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                : "bg-[#F1EFEA] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-white dark:hover:bg-[#1C1A18]"
            )}
            title="Inspect Cloud Data Sync & Database Latency"
          >
            {!isOnline ? (
              <>
                <WifiOff className="size-3 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="hidden sm:inline">Offline {pendingCount > 0 ? `(${pendingCount})` : ""}</span>
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw className="size-3 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Syncing...</span>
              </>
            ) : pendingCount > 0 ? (
              <>
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="hidden sm:inline">{pendingCount} Queued</span>
              </>
            ) : (
              <>
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="hidden sm:inline">Synced</span>
              </>
            )}
          </button>

          {/* Reminder Manager Bell */}
          <button
            onClick={() => setIsReminderModalOpen(true)}
            aria-label="Manage Reminders"
            className="size-8 rounded-lg bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#F1EFEA] dark:hover:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            title="Manage Reminders & Push Alerts"
          >
            <Bell className="size-3.5 stroke-[1.75]" />
          </button>

          {/* Neobrutalist Theme Toggle (Light / Dark) */}
          <ThemeToggle />

          {/* User Profile Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              aria-label="User Menu"
              aria-expanded={isProfileMenuOpen}
              className="flex items-center gap-1.5 p-1 pl-1.5 sm:px-2 py-1 bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-lg hover:bg-[#F1EFEA] dark:hover:bg-[#252321] transition-colors shadow-xs cursor-pointer text-[#161514] dark:text-[#FAF8F5]"
            >
              <div className="size-6 rounded-md bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] flex items-center justify-center font-bold text-xs shrink-0">
                {user?.displayName ? (
                  user.displayName.charAt(0).toUpperCase()
                ) : (
                  <User className="size-3 stroke-[2]" />
                )}
              </div>
              <span className="hidden sm:inline-block text-xs font-medium max-w-[90px] truncate text-[#161514] dark:text-[#FAF8F5]">
                {user?.displayName || "Account"}
              </span>
              <ChevronDown className="size-3 stroke-[2] text-[#8C8882] dark:text-[#A8A29E]" />
            </button>

            {/* Dropdown Menu Modal */}
            {isProfileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] shadow-xl rounded-xl py-1 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-2 border-b border-[#E8E5DF] dark:border-[#2A2724]">
                    <p className="text-xs font-medium text-[#161514] dark:text-[#FAF8F5] truncate">
                      {user?.displayName || "Invictus User"}
                    </p>
                    <p className="text-[10px] text-[#8C8882] dark:text-[#A8A29E] truncate font-mono">
                      {user?.email || "Local Guest"}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-[#161514] dark:text-[#FAF8F5] hover:bg-[#F1EFEA] dark:hover:bg-[#252321] transition-colors"
                    >
                      <User className="size-3.5 stroke-[1.75] text-[#8C8882] dark:text-[#A8A29E]" />
                      <span>Profile & Activity</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-[#161514] dark:text-[#FAF8F5] hover:bg-[#F1EFEA] dark:hover:bg-[#252321] transition-colors"
                    >
                      <Settings className="size-3.5 stroke-[1.75] text-[#8C8882] dark:text-[#A8A29E]" />
                      <span>Settings & Backups</span>
                    </Link>

                    <Link
                      href="/analytics"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-[#161514] dark:text-[#FAF8F5] hover:bg-[#F1EFEA] dark:hover:bg-[#252321] transition-colors"
                    >
                      <BarChart2 className="size-3.5 stroke-[1.75] text-[#8C8882] dark:text-[#A8A29E]" />
                      <span>Analytics Hub</span>
                    </Link>

                    {(user?.role === "admin" ||
                      user?.email?.toLowerCase() === "luckymanojjadhav@gmail.com") && (
                      <Link
                        href="/admin"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                      >
                        <ShieldCheck className="size-3.5 stroke-[1.75]" />
                        <span>Admin Console</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-[#E8E5DF] dark:border-[#2A2724]">
                    <button
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        await signOut();
                        router.push("/login");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="size-3.5 stroke-[1.75]" />
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
