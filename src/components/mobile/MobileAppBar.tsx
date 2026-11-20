"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Calendar,
  MoreVertical,
  CheckCheck,
  RotateCcw,
  Rows,
  LayoutList,
  Grid,
  Volume2,
  VolumeX,
  ArrowLeft,
} from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { useUIStore } from "@/store/ui-store";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { DynamicIslandDock } from "@/components/shared/DynamicIslandDock";
import { cn } from "@/lib/utils";

export interface MobileAppBarProps {
  title: string;
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
}: MobileAppBarProps) {
  const { habitLayoutStyle, setHabitLayoutStyle } = useUIStore();
  const [soundMuted, setSoundMuted] = useState(soundFX.isMuted());

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const dateObj = selectedDate ? new Date(selectedDate.length === 7 ? `${selectedDate}-01` : selectedDate) : null;
  const shortDate = dateShortLabel || (dateObj ? format(dateObj, "MMM d") : null);
  const fullDate = dateLabel || (dateObj ? format(dateObj, "EEE, MMM d") : null);
  const isViewingToday = isCalendarActive !== undefined ? !isCalendarActive : (!selectedDate || selectedDate === todayStr);

  const handleToggleSound = () => {
    soundFX.playPop();
    const next = soundFX.toggleMute();
    setSoundMuted(next);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full min-h-[52px] safe-top-pad px-3.5 bg-[#FAF8F5]/90 dark:bg-[#161514]/90 backdrop-blur-md border-b border-[#161514]/10 dark:border-white/10 flex items-center justify-between select-none transition-colors lg:hidden",
        className
      )}
    >
      {/* Left: Back Button + Title + Date Badge */}
      <div className="flex items-center gap-1.5 min-w-0 shrink-0">
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
        <h1 className="font-heading font-black text-lg sm:text-xl tracking-tight text-foreground truncate">
          {title}
        </h1>
        {shortDate && (
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-muted-foreground bg-secondary px-1.5 sm:px-2 py-0.5 rounded-md border border-border shrink-0">
            <span className="sm:hidden">{shortDate}</span>
            <span className="hidden sm:inline">{fullDate || shortDate}</span>
          </span>
        )}
      </div>

      {/* Center: Dynamic Island Live Activity Dock (Header Integrated, Stays in Header, omitted on domain pages like Habits) */}
      {showDynamicIsland && (
        <div className="flex-1 flex items-center justify-center min-w-0 px-1 h-8">
          <DynamicIslandDock variant="header" floatOnScroll={false} />
        </div>
      )}

      {/* Right: Max 2 Icons (Calendar + Overflow Menu) */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Icon 1: Calendar / Jump to Today */}
        {onSelectDate && (
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              onSelectDate(todayStr);
            }}
            className={cn(
              "size-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95",
              isViewingToday
                ? "bg-secondary border-border text-muted-foreground hover:text-foreground"
                : "bg-[#CEF431] text-[#161514] border-[#161514] shadow-2xs font-bold"
            )}
            title={calendarTooltip || (isViewingToday ? "Viewing Today" : "Jump back to Today")}
            aria-label={calendarTooltip || "Jump to Today"}
          >
            <Calendar className="size-4 stroke-[2.2]" />
          </button>
        )}

        {/* Icon 2: Unified Overflow Menu (⋯) */}
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

                <DropdownMenuLabel className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                  Layout Density
                </DropdownMenuLabel>

                <DropdownMenuItem
                  onClick={() => {
                    soundFX.playPop();
                    setHabitLayoutStyle("compact");
                  }}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary",
                    habitLayoutStyle === "compact" && "bg-secondary font-black text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Rows className="size-3.5" />
                    <span>Compact Rows</span>
                  </div>
                  {habitLayoutStyle === "compact" && (
                    <span className="size-1.5 rounded-full bg-[#03D26F]" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    soundFX.playPop();
                    setHabitLayoutStyle("cards");
                  }}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary",
                    habitLayoutStyle === "cards" && "bg-secondary font-black text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <LayoutList className="size-3.5" />
                    <span>Card View</span>
                  </div>
                  {habitLayoutStyle === "cards" && (
                    <span className="size-1.5 rounded-full bg-[#03D26F]" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    soundFX.playPop();
                    setHabitLayoutStyle("matrix");
                  }}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary",
                    habitLayoutStyle === "matrix" && "bg-secondary font-black text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Grid className="size-3.5" />
                    <span>Heatmap Matrix</span>
                  </div>
                  {habitLayoutStyle === "matrix" && (
                    <span className="size-1.5 rounded-full bg-[#03D26F]" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-border" />
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
