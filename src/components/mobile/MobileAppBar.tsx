"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Calendar,
  MoreVertical,
  CheckCheck,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  User,
  Settings,
  BarChart2,
  Bell,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { useAuth } from "@/components/shared/AuthProvider";
import { useOfflineSync } from "@/lib/offline/sync-manager";
import { ReminderManagerModal } from "@/components/shared/ReminderManagerModal";
import { CloudSyncDrawer } from "@/components/shared/CloudSyncDrawer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { DynamicIslandDock, isDynamicIslandAllowed } from "@/components/shared/DynamicIslandDock";
import { StrobiCompanion, type StrobiGear, type StrobiState } from "@/components/mascot/StrobiCompanion";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/lib/hooks/useTheme";
import { cn } from "@/lib/utils";

export interface MobileAppBarProps {
  title?: string;
  onBack?: () => void;
  backHref?: string;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  dateLabel?: string;
  dateShortLabel?: string;
  calendarTooltip?: string;
  isCalendarActive?: boolean;
  onCheckAllDue?: () => void;
  isAllDueCompleted?: boolean;
  dueCount?: number;
  className?: string;
  customMenuItems?: React.ReactNode;
  showDynamicIsland?: boolean;
  strobiGear?: StrobiGear;
  strobiState?: StrobiState;
  onStrobiClick?: () => void;
}

export function MobileAppBar({
  title,
  onBack,
  backHref,
  selectedDate,
  onSelectDate,
  dateLabel,
  dateShortLabel,
  calendarTooltip,
  isCalendarActive,
  onCheckAllDue,
  isAllDueCompleted = false,
  dueCount = 0,
  className,
  customMenuItems,
  showDynamicIsland = true,
  strobiGear,
  strobiState,
  onStrobiClick,
}: MobileAppBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const isAllowedRoute = isDynamicIslandAllowed(pathname);
  const [soundMuted, setSoundMuted] = useState(soundFX.isMuted());
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);
  const { isOnline, isSyncing, pendingCount } = useOfflineSync();

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isViewingToday = isCalendarActive !== undefined ? !isCalendarActive : (!selectedDate || selectedDate === todayStr);

  const resolveGear = (): StrobiGear => {
    if (strobiGear) return strobiGear;
    if (pathname.startsWith("/goals")) return "fitness";
    if (pathname.startsWith("/tasks")) return "tasks";
    if (pathname.startsWith("/money")) return "money";
    if (pathname === "/today") return "gladiator";
    return "gladiator";
  };

  const handleToggleSound = () => {
    soundFX.playPop();
    const next = soundFX.toggleMute();
    setSoundMuted(next);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full safe-top-pad bg-[#FAF8F5]/90 dark:bg-[#161514]/90 backdrop-blur-md border-b border-[#161514]/10 dark:border-white/10 select-none transition-colors",
        className
      )}
    >
      {/* Strict 52px Inner Bar: Centers Strobi, Dynamic Island, and 3-Dots on the exact same vertical baseline */}
      <div className="w-full h-[52px] px-3.5 relative flex items-center justify-between">
        {/* Left: Strobi Companion (+ Back Button on subroutes) */}
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          {onBack ? (
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                onBack();
              }}
              className="size-8 rounded-lg border border-border bg-secondary hover:bg-muted text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="size-4 stroke-[2.2]" />
            </button>
          ) : backHref ? (
            <Link
              href={backHref}
              onClick={() => soundFX.playPop()}
              className="size-8 rounded-lg border border-border bg-secondary hover:bg-muted text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="size-4 stroke-[2.2]" />
            </Link>
          ) : null}

          <StrobiCompanion
            gear={resolveGear()}
            state={strobiState || "idle"}
            size={36}
            onClick={onStrobiClick}
            title={title ? `Strobi Companion • ${title}` : "Strobi Companion"}
          />
        </div>

        {/* Spacer between left cluster and right cluster */}
        <div className="flex-1 min-w-0 pointer-events-none" />

        {/* Center: Dynamic Island Live Activity Dock - DEAD CENTER IN 52PX BAR */}
        {showDynamicIsland && isAllowedRoute && (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20 max-w-[calc(100%-120px)]">
            <div className="pointer-events-auto flex items-center justify-center">
              <DynamicIslandDock variant="header" floatOnScroll={false} />
            </div>
          </div>
        )}

        {/* Right: Unified Three Dots Overflow Menu (⋯) */}
        <div className="flex items-center shrink-0 justify-end relative z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={() => soundFX.playPop()}
              className="size-9 rounded-xl border border-border bg-secondary hover:bg-muted text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
              title="More actions & view settings"
              aria-label="Overflow menu"
            >
              <MoreVertical className="size-4 stroke-[2.2]" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-64 p-1.5 bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#000000] z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto"
          >
            {/* 1. User Account Header */}
            <div className="px-2.5 py-2 border-b border-border mb-1">
              <p className="text-xs font-heading font-black text-foreground truncate">
                {user?.displayName || "Invictus User"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate font-mono">
                {user?.email || "Local Guest"}
              </p>
            </div>

            {/* 2. Jump to Today (if navigated away from today) */}
            {onSelectDate && !isViewingToday && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    soundFX.playPop();
                    onSelectDate(todayStr);
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-heading font-black cursor-pointer hover:bg-secondary focus:bg-secondary text-[#047857] dark:text-[#03D26F]"
                >
                  <Calendar className="size-3.5 stroke-[2.2]" />
                  <span>Jump to Today</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-border" />
              </>
            )}

            {/* 3. Page-Specific Custom Actions (Desk Notes, Night Closeout, Log Tx, etc.) */}
            {customMenuItems && (
              <>
                <DropdownMenuLabel className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5">
                  Page Actions
                </DropdownMenuLabel>
                {customMenuItems}
                <DropdownMenuSeparator className="my-1 bg-border" />
              </>
            )}

            {/* 4. Bulk Actions (Check All Due / Reset) */}
            {onCheckAllDue && (
              <>
                {!customMenuItems && (
                  <DropdownMenuLabel className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5">
                    Routines
                  </DropdownMenuLabel>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    soundFX.playPop();
                    onCheckAllDue();
                  }}
                  className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-black cursor-pointer hover:bg-secondary focus:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    {isAllDueCompleted ? (
                      <RotateCcw className="size-3.5 text-muted-foreground stroke-[2.2]" />
                    ) : (
                      <CheckCheck className="size-3.5 text-[#03D26F] stroke-[2.5]" />
                    )}
                    <span>{isAllDueCompleted ? "Reset Routines" : "Check All Due"}</span>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    Shift+⌘A
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-border" />
              </>
            )}

            {/* 5. Core Navigation & Modals */}
            <DropdownMenuLabel className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5">
              System
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={() => {
                soundFX.playPop();
                router.push("/profile");
              }}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary"
            >
              <User className="size-3.5 stroke-[2] text-muted-foreground" />
              <span>Profile & Activity</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                soundFX.playPop();
                router.push("/settings");
              }}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary"
            >
              <Settings className="size-3.5 stroke-[2] text-muted-foreground" />
              <span>Settings & Backups</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                soundFX.playPop();
                router.push("/analytics");
              }}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary"
            >
              <BarChart2 className="size-3.5 stroke-[2] text-muted-foreground" />
              <span>Analytics Hub</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                soundFX.playPop();
                setIsReminderModalOpen(true);
              }}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary"
            >
              <Bell className="size-3.5 stroke-[2] text-muted-foreground" />
              <span>Manage Reminders</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                soundFX.playPop();
                setIsSyncDrawerOpen(true);
              }}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary"
            >
              <div className="flex items-center gap-2.5">
                <RefreshCw className={cn("size-3.5 stroke-[2] text-muted-foreground", isSyncing && "animate-spin")} />
                <span>Cloud Sync</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {!isOnline ? "Offline" : isSyncing ? "Syncing" : pendingCount > 0 ? `${pendingCount} Queued` : "Synced"}
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-border" />

            {/* 6. Preferences: Theme & Sound (Circular View Transition Ripple Animation) */}
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

            <DropdownMenuItem
              onClick={handleToggleSound}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary"
            >
              <div className="flex items-center gap-2">
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

            {/* 7. Admin (if applicable) */}
            {(user?.role === "admin" ||
              user?.email?.toLowerCase() === "luckymanojjadhav@gmail.com") && (
              <DropdownMenuItem
                onClick={() => {
                  soundFX.playPop();
                  router.push("/admin");
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-heading font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 cursor-pointer"
              >
                <ShieldCheck className="size-3.5 stroke-[2]" />
                <span>Admin Console</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="my-1 bg-border" />

            {/* 8. Sign Out */}
            <DropdownMenuItem
              onClick={async () => {
                soundFX.playPop();
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
