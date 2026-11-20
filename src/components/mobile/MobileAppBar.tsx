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
} from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
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
import { usePathname } from "next/navigation";
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
  const isAllowedRoute = isDynamicIslandAllowed(pathname);
  const [soundMuted, setSoundMuted] = useState(soundFX.isMuted());

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
        "sticky top-0 z-30 w-full min-h-[52px] safe-top-pad px-3.5 bg-[#FAF8F5]/90 dark:bg-[#161514]/90 backdrop-blur-md border-b border-[#161514]/10 dark:border-white/10 relative flex items-center justify-between select-none transition-colors lg:hidden",
        className
      )}
    >
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

      {/* Center: Dynamic Island Live Activity Dock - ABSOLUTELY CENTERED ON HARDWARE SCREEN */}
      {showDynamicIsland && isAllowedRoute && (
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20 max-w-[calc(100%-120px)]">
          <div className="pointer-events-auto flex items-center justify-center">
            <DynamicIslandDock variant="header" floatOnScroll={false} />
          </div>
        </div>
      )}

      {/* Right: Only the Three Dots Menu (⋯) */}
      <div className="flex items-center shrink-0 justify-end relative z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={() => soundFX.playPop()}
              className="size-9 rounded-xl border border-border bg-secondary hover:bg-muted text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="More actions & view settings"
              aria-label="Overflow menu"
            >
              <MoreVertical className="size-4 stroke-[2.2]" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 p-1.5 bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] z-50 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* If navigated away from today, offer Jump to Today in dropdown */}
            {onSelectDate && !isViewingToday && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    soundFX.playPop();
                    onSelectDate(todayStr);
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-heading font-black cursor-pointer hover:bg-secondary focus:bg-secondary"
                >
                  <Calendar className="size-3.5 text-[#03D26F] stroke-[2.2]" />
                  <span>Jump to Today</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-border" />
              </>
            )}

            {customMenuItems ? (
              <>
                {customMenuItems}
                <DropdownMenuSeparator className="my-1 bg-border" />
              </>
            ) : (
              <>
                {onCheckAllDue && (
                  <>
                    <DropdownMenuLabel className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                      Bulk Actions
                    </DropdownMenuLabel>
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
              </>
            )}

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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
