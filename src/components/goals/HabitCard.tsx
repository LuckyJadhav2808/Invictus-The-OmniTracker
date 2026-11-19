"use client";

import React, { useState } from "react";
import * as LucideIcons from "lucide-react";
import { type Habit, type Streak } from "@/types";
import {
  Flame,
  Check,
  Circle,
  Edit3,
  Trash2,
  Sparkles,
  Clock,
  Moon,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface WeekDayItem {
  dateStr: string;
  dayLabel: string; // "Mon", "Tue"...
  dayNum: string;   // "19", "20"...
  isToday: boolean;
  isSelected?: boolean;
  isCompleted?: boolean;
}

export interface HabitCardProps {
  habit: Habit;
  streak?: Streak;
  isCompletedToday: boolean;
  isRestDay?: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  weekDays?: WeekDayItem[];
  onToggleDate?: (dateStr: string) => void;
  viewMode?: "cards" | "compact" | "matrix";
}

export function HabitCard({
  habit,
  streak,
  isCompletedToday,
  isRestDay = false,
  onToggle,
  onEdit,
  onDelete,
  onClick,
  weekDays = [],
  onToggleDate,
  viewMode = "cards",
}: HabitCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  // Dynamically resolve Lucide icon with safe fallback
  const IconComponent =
    (LucideIcons as any)[habit.icon] || LucideIcons.Target;

  const currentStreak = streak?.currentStreak || 0;

  // 4-Tier Evolving Streak Flame System
  const getStreakTier = (days: number) => {
    if (days >= 21) {
      return {
        label: "Mythic Plasma",
        colorClass: "text-cyan-500 fill-cyan-500",
      };
    }
    if (days >= 8) {
      return {
        label: "Blazing Inferno",
        colorClass: "text-rose-500 fill-rose-500",
      };
    }
    if (days >= 4) {
      return {
        label: "Kinetic Hearth",
        colorClass: "text-orange-500 fill-orange-500",
      };
    }
    return {
      label: "Initiate Spark",
      colorClass: "text-amber-500 fill-amber-500",
    };
  };

  const streakTier = getStreakTier(currentStreak);

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    soundFX.vibrate(20);

    if (!isCompletedToday) {
      soundFX.playPop();
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 900);
    }

    onToggle();
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleDaySquircleClick = (e: React.MouseEvent, dateStr: string) => {
    e.stopPropagation();
    soundFX.playPop();
    soundFX.vibrate(15);
    if (onToggleDate) {
      onToggleDate(dateStr);
    } else if (dateStr === weekDays.find((d) => d.isToday)?.dateStr) {
      onToggle();
    }
  };

  // Compact View Mode
  if (viewMode === "compact") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between transition-all duration-200 cursor-pointer select-none shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] hover:bg-muted active:translate-x-0.5 active:translate-y-0.5 active:shadow-none min-h-[52px]",
          isCompletedToday && "opacity-75 bg-[#F7F9F7] dark:bg-[#121613]",
          isAnimating && "scale-[0.98]"
        )}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 pr-2">
          {/* Primary 44px Checkbox Hit Target */}
          <button
            type="button"
            onClick={handleToggleClick}
            aria-label={isCompletedToday ? `Mark ${habit.title} incomplete` : `Mark ${habit.title} complete`}
            className={cn(
              "size-9 sm:size-9 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs active:scale-95",
              isCompletedToday
                ? "bg-[#03D26F] border-[#161514] text-[#161514]"
                : "bg-secondary border-border text-muted-foreground hover:border-[#161514]"
            )}
          >
            {isCompletedToday ? <Check className="size-4 stroke-[3]" /> : <Circle className="size-4 stroke-[2]" />}
          </button>

          <div className="min-w-0 flex-1">
            <h4
              className={cn(
                "font-heading font-black text-xs sm:text-sm text-foreground leading-snug line-clamp-2 transition-all duration-200",
                isCompletedToday && "line-through text-muted-foreground opacity-75"
              )}
            >
              {habit.title}
            </h4>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {currentStreak > 0 && (
                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-[#FDE68A] flex items-center gap-1">
                  <Flame className={cn("size-2.5", streakTier.colorClass)} />
                  <span>{currentStreak}d streak</span>
                </span>
              )}
              {habit.reminderTime && (
                <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-0.5">
                  <Clock className="size-2.5" />
                  <span>{habit.reminderTime}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden xs:inline-block text-[10px] font-mono font-black px-2 py-0.5 rounded-md border border-border bg-secondary text-foreground">
            {habit.frequency?.type || "Daily"}
          </span>

          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFX.playPop();
                  }}
                  className="size-8 rounded-lg border border-transparent hover:border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all flex items-center justify-center cursor-pointer ml-1"
                  title="More options"
                  aria-label="Habit options"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-xl shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] p-1 min-w-[140px] z-50">
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFX.playPop();
                      onEdit();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-heading font-bold cursor-pointer rounded-lg hover:bg-secondary focus:bg-secondary text-foreground"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Edit Routine</span>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFX.playPop();
                      onDelete();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-heading font-bold cursor-pointer rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 focus:bg-rose-100 text-rose-600 dark:text-rose-400"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete Habit</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }

  // Full Card View Mode
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl p-4 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-3 transition-all duration-200 select-none group overflow-hidden cursor-pointer",
        isCompletedToday && "opacity-75 bg-[#F7F9F7] dark:bg-[#121613]",
        isAnimating && "scale-[0.98]"
      )}
    >
      {/* Floating Sparkle Particles */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="animate-ping flex items-center gap-1 bg-[#161514] text-[#CEF431] px-3 py-1 rounded-xl font-mono text-xs font-black shadow-md border border-[#CEF431]">
            <Sparkles className="size-3.5 fill-current" />
            <span>Done! ⚡</span>
          </div>
        </div>
      )}

      {/* Top Row: Icon, Title, Badges & Action Buttons */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0 pr-1">
          {/* Category Icon Squircle */}
          <div className="size-10 rounded-xl bg-secondary border-2 border-border flex items-center justify-center shrink-0 text-foreground shadow-2xs group-hover:border-[#161514] transition-colors">
            <IconComponent className="size-5 stroke-[2]" />
          </div>

          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                "font-heading font-black text-sm sm:text-base text-foreground leading-snug line-clamp-2 transition-all duration-200",
                isCompletedToday && "line-through text-muted-foreground opacity-75"
              )}
            >
              {habit.title}
            </h4>

            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {/* Frequency Badge */}
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
                {habit.frequency?.type === "daily"
                  ? "Daily"
                  : habit.frequency?.type === "weekly"
                  ? "Weekly"
                  : "Custom"}
              </span>

              {/* Rest Day Badge */}
              {isRestDay && !isCompletedToday && (
                <span className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border flex items-center gap-1">
                  <Moon className="size-2.5" />
                  <span>Rest Day</span>
                </span>
              )}

              {/* Reminder Time Badge */}
              {habit.reminderTime && (
                <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border flex items-center gap-1">
                  <Clock className="size-2.5" />
                  <span>{habit.reminderTime}</span>
                </span>
              )}

              {/* Evolving Streak Flame Badge */}
              {currentStreak > 0 && (
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-black border border-amber-600/30 bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
                  title={`${currentStreak} days • ${streakTier.label}`}
                >
                  <Flame className={cn("size-3", streakTier.colorClass)} />
                  <span className="tabular-nums">{currentStreak}d streak</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Controls: Unified Subtle Options Menu + 44px Check Ring */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFX.playPop();
                  }}
                  className="size-8 rounded-xl border border-transparent hover:border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all flex items-center justify-center cursor-pointer active:scale-95"
                  title="More options"
                  aria-label="Habit options"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-xl shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] p-1 min-w-[140px] z-50">
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFX.playPop();
                      onEdit();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-heading font-bold cursor-pointer rounded-lg hover:bg-secondary focus:bg-secondary text-foreground"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Edit Routine</span>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFX.playPop();
                      onDelete();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-heading font-bold cursor-pointer rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 focus:bg-rose-100 text-rose-600 dark:text-rose-400"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete Habit</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Primary 44px Checkbox Ring */}
          <button
            onClick={handleToggleClick}
            type="button"
            aria-label={isCompletedToday ? "Mark Incomplete" : "Mark Complete"}
            className={cn(
              "size-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(22,21,20,0.6)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
              isCompletedToday
                ? "bg-[#03D26F] border-[#161514] text-[#161514]"
                : "bg-secondary border-border text-muted-foreground hover:border-[#161514]"
            )}
          >
            {isCompletedToday ? (
              <Check className="size-4.5 stroke-[3] animate-in zoom-in-50 duration-150" />
            ) : (
              <Circle className="size-4.5 stroke-[1.8]" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Row: 7-Day Tactile Squircle Strip (Routinr Production Benchmark) */}
      {viewMode === "cards" && weekDays.length > 0 && (
        <div className="pt-2 border-t border-[#161514]/10 dark:border-white/10">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {weekDays.map((day) => {
              const isChecked = day.isCompleted;
              const isToday = day.isToday;

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={(e) => handleDaySquircleClick(e, day.dateStr)}
                  className={cn(
                    "h-10 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer relative",
                    isChecked
                      ? "bg-[#03D26F] text-[#161514] border-[#161514] shadow-2xs font-black"
                      : isToday
                      ? "bg-[#CEF431] text-[#161514] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] font-black animate-pulse"
                      : "bg-secondary text-muted-foreground border-border hover:bg-muted font-bold opacity-80"
                  )}
                  title={`${day.dayLabel} ${day.dayNum} • ${isChecked ? "Completed" : "Pending"}`}
                >
                  <span className="text-[8px] uppercase tracking-wider leading-none">
                    {day.dayLabel[0]}
                  </span>
                  <span className="text-[11px] font-mono font-black mt-0.5 leading-none">
                    {isChecked ? "✓" : day.dayNum}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Matrix View Mode: Pristine 28-Day Calendar Heatmap */}
      {viewMode === "matrix" && (
        <div className="pt-2.5 border-t border-[#161514]/10 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[9px] font-mono font-black uppercase text-muted-foreground tracking-wider">
            <span>28-Day Consistency Matrix</span>
            <span className="text-foreground">
              {Math.min(28, currentStreak)} of 28d active
            </span>
          </div>

          {/* 7-Col Day Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono font-bold text-[9px] text-muted-foreground uppercase opacity-75">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
          </div>

          {/* 7-Col x 4-Row Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, idx) => {
              const isFilled = idx < currentStreak || (isCompletedToday && idx === 0);
              const isTodayCell = idx === 0;

              return (
                <div
                  key={`matrix-cell-${idx}`}
                  className={cn(
                    "h-6 rounded-md border-2 transition-all flex items-center justify-center font-mono text-[9px] font-bold select-none",
                    isFilled
                      ? isTodayCell
                        ? "bg-[#CEF431] border-[#161514] text-[#161514] font-black shadow-2xs"
                        : "bg-[#03D26F] border-[#161514] text-[#161514] font-black"
                      : isTodayCell
                      ? "border-2 border-dashed border-[#161514] dark:border-[#CEF431] bg-secondary"
                      : "bg-secondary/40 border-border text-muted-foreground"
                  )}
                  title={isTodayCell ? "Today" : `${idx}d ago • ${isFilled ? "Completed" : "Pending"}`}
                >
                  {isFilled ? "✓" : isTodayCell ? "•" : ""}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
