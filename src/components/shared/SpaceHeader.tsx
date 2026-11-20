"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SunMedium,
  CheckSquare,
  Kanban,
  Wallet,
  BarChart2,
  Settings,
  User,
  ShieldCheck,
  Bell,
  Sparkles,
  LogOut,
  Megaphone,
  X,
  RefreshCw,
  ArrowLeft,
  MoreVertical,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "@/components/shared/AuthProvider";
import { getGlobalAnnouncement, type GlobalAnnouncement } from "@/lib/custom-auth";
import { ReminderManagerModal } from "@/components/shared/ReminderManagerModal";
import { CloudSyncDrawer } from "@/components/shared/CloudSyncDrawer";
import { useOfflineSync } from "@/lib/offline/sync-manager";
import { soundFX } from "@/components/shared/SoundFX";
import { getSubrouteInfo } from "@/lib/page-flow/page-flow-resolver";
import { DynamicIslandDock, isDynamicIslandAllowed } from "@/components/shared/DynamicIslandDock";
import { StrobiCompanion, type StrobiGear } from "@/components/mascot/StrobiCompanion";
import { useTheme } from "@/lib/hooks/useTheme";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
export { getSubrouteInfo };

export function SpaceHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
  const [dismissedAnn, setDismissedAnn] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(soundFX.isMuted());
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
        shortTitle: "Today",
        subtitle: "Daily Action Cockpit",
        icon: SunMedium,
        accentColor: "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]",
      };
    }
    if (pathname.startsWith("/goals")) {
      return {
        title: "Habits & Health",
        shortTitle: "Habits",
        subtitle: "Routines, Streaks & Wellness",
        icon: CheckSquare,
        accentColor: "bg-[#03D26F] text-[#161514]",
      };
    }
    if (pathname.startsWith("/tasks")) {
      return {
        title: "Tasks & Projects",
        shortTitle: "Tasks",
        subtitle: "Kanban, Priorities & Subtasks",
        icon: Kanban,
        accentColor: "bg-[#F59E0B] text-[#161514]",
      };
    }
    if (pathname.startsWith("/money")) {
      return {
        title: "Money & Ledger",
        shortTitle: "Money",
        subtitle: "Cash Flow, Budgets & Vault",
        icon: Wallet,
        accentColor: "bg-[#03D26F] text-[#161514]",
      };
    }
    if (pathname.startsWith("/analytics")) {
      return {
        title: "Analytics Hub",
        shortTitle: "Analytics",
        subtitle: "Cross-Module Insights & Performance",
        icon: BarChart2,
        accentColor: "bg-white text-[#161514]",
      };
    }
    if (pathname.startsWith("/settings")) {
      return {
        title: "Settings",
        shortTitle: "Settings",
        subtitle: "Preferences, Backup & Configuration",
        icon: Settings,
        accentColor: "bg-white text-[#161514]",
      };
    }
    if (pathname.startsWith("/profile")) {
      return {
        title: "Profile",
        shortTitle: "Profile",
        subtitle: "Account Details & Activity Matrix",
        icon: User,
        accentColor: "bg-white text-[#161514]",
      };
    }
    if (pathname.startsWith("/admin")) {
      return {
        title: "Admin Panel",
        shortTitle: "Admin",
        subtitle: "System Management & Health",
        icon: ShieldCheck,
        accentColor: "bg-amber-300 text-[#161514]",
      };
    }
    return {
      title: "Invictus",
      shortTitle: "Invictus",
      subtitle: "OmniTracker",
      icon: Sparkles,
      accentColor: "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]",
    };
  };

  const space = getSpaceInfo();
  const subrouteInfo = getSubrouteInfo(pathname);

  const resolveGear = (): StrobiGear => {
    if (pathname.startsWith("/goals")) return "fitness";
    if (pathname.startsWith("/tasks")) return "tasks";
    if (pathname.startsWith("/money")) return "money";
    if (pathname === "/today") return "gladiator";
    return "gladiator";
  };

  const isMobileAppBarRoute =
    pathname === "/today" ||
    pathname.startsWith("/goals") ||
    pathname.startsWith("/money") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/profile");

  return (
    <header className={cn("sticky top-0 w-full bg-white/95 dark:bg-[#161514]/95 backdrop-blur-md border-b border-[#E8E5DF] dark:border-[#2A2724] select-none transition-colors shadow-xs safe-top-pad z-40", isMobileAppBarRoute && "hidden lg:block")}>
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

      {/* Main Header Container: Strict 52px height for dead-center alignment */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-[52px] flex items-center justify-between gap-2 sm:gap-4 relative">
        {/* Left: Strobi Companion (+ Back button on subroutes) */}
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          {subrouteInfo && (
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
          )}

          <StrobiCompanion
            gear={resolveGear()}
            size={36}
            title={`Strobi Companion • ${space.title}`}
          />
        </div>

        {/* Center: Dynamic Island Live Activity Dock - DEAD CENTER IN HEADER */}
        {isDynamicIslandAllowed(pathname) && (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20">
            <div className="pointer-events-auto flex items-center justify-center">
              <DynamicIslandDock variant="header" floatOnScroll={false} />
            </div>
          </div>
        )}

        {/* Spacer between left cluster and right cluster */}
        <div className="flex-1 min-w-0 pointer-events-none" />

        {/* Right: Only the Three Dots Menu (⋯) */}
        <div className="flex items-center shrink-0 justify-end relative z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={() => soundFX.playPop()}
                className="size-9 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#1C1A18] hover:bg-[#F1EFEA] dark:hover:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
                title="More options & account"
                aria-label="More options"
              >
                <MoreVertical className="size-4 stroke-[2]" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 p-1.5 bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* User Account Info */}
              <div className="px-2.5 py-2 border-b border-[#E8E5DF] dark:border-[#2A2724]">
                <p className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] truncate">
                  {user?.displayName || "Invictus User"}
                </p>
                <p className="text-[10px] text-[#8C8882] dark:text-[#A8A29E] truncate font-mono">
                  {user?.email || "Local Guest"}
                </p>
              </div>

              {/* Navigation & Controls */}
              <DropdownMenuItem
                onClick={() => router.push("/profile")}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary"
              >
                <User className="size-3.5 stroke-[2] text-[#8C8882] dark:text-[#A8A29E]" />
                <span>Profile & Activity</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary"
              >
                <Settings className="size-3.5 stroke-[2] text-[#8C8882] dark:text-[#A8A29E]" />
                <span>Settings & Backups</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push("/analytics")}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary"
              >
                <BarChart2 className="size-3.5 stroke-[2] text-[#8C8882] dark:text-[#A8A29E]" />
                <span>Analytics Hub</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setIsReminderModalOpen(true)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary"
              >
                <Bell className="size-3.5 stroke-[2] text-[#8C8882] dark:text-[#A8A29E]" />
                <span>Manage Reminders</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setIsSyncDrawerOpen(true)}
                className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary"
              >
                <div className="flex items-center gap-2.5">
                  <RefreshCw className={cn("size-3.5 stroke-[2] text-[#8C8882] dark:text-[#A8A29E]", isSyncing && "animate-spin")} />
                  <span>Cloud Sync</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {!isOnline ? "Offline" : isSyncing ? "Syncing" : pendingCount > 0 ? `${pendingCount} Queued` : "Synced"}
                </span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-[#E8E5DF] dark:bg-[#2A2724]" />

              {/* Theme Toggle within Menu (Circular View Transition Ripple Animation) */}
              <DropdownMenuItem
                onClick={(e) => {
                  soundFX.playPop();
                  const rect = e.currentTarget.getBoundingClientRect();
                  toggleTheme({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                  });
                }}
                className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="size-3.5 stroke-[2] text-[#03D26F]" />
                  <span>Toggle Theme</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{isDark ? "Dark" : "Light"}</span>
              </DropdownMenuItem>

              {/* Sound FX Toggle */}
              <DropdownMenuItem
                onClick={() => {
                  soundFX.playPop();
                  const next = soundFX.toggleMute();
                  setSoundMuted(next);
                }}
                className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary"
              >
                <div className="flex items-center gap-2.5">
                  {soundMuted ? (
                    <VolumeX className="size-3.5 text-muted-foreground" />
                  ) : (
                    <Volume2 className="size-3.5 text-[#03D26F]" />
                  )}
                  <span>Sound FX</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {soundMuted ? "Muted" : "Active"}
                </span>
              </DropdownMenuItem>

              {(user?.role === "admin" ||
                user?.email?.toLowerCase() === "luckymanojjadhav@gmail.com") && (
                <DropdownMenuItem
                  onClick={() => router.push("/admin")}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-heading font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 cursor-pointer"
                >
                  <ShieldCheck className="size-3.5 stroke-[2]" />
                  <span>Admin Console</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="my-1 bg-[#E8E5DF] dark:bg-[#2A2724]" />

              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  router.push("/login");
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-heading font-bold text-rose-600 dark:text-rose-400 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <LogOut className="size-3.5 stroke-[2]" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
