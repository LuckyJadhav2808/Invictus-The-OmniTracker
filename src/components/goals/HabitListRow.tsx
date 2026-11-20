"use client";

import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { type Habit, type Streak } from "@/types";
import {
  Flame,
  Check,
  Circle,
  Clock,
  ChevronDown,
  Edit3,
  Trash2,
  ExternalLink,
  FastForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { SwipeActionRow } from "@/components/mobile/SwipeActionRow";

export interface WeekDayStatus {
  dateStr: string;
  dayLabel: string;
  dayNum: string;
  isToday: boolean;
  isSelected?: boolean;
  isCompleted?: boolean;
}

export interface HabitListRowProps {
  habit: Habit;
  streak?: Streak;
  isCompletedToday: boolean;
  isRestDay?: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSkip?: () => void;
  onViewDetail?: () => void;
  weekDays?: WeekDayStatus[];
  onToggleDate?: (dateStr: string) => void;
}

export function HabitListRow({
  habit,
  streak,
  isCompletedToday,
  isRestDay = false,
  onToggle,
  onEdit,
  onDelete,
  onSkip,
  onViewDetail,
  weekDays = [],
  onToggleDate,
}: HabitListRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Dynamically resolve Lucide icon
  const IconComponent =
    (LucideIcons as any)[habit.icon] || LucideIcons.Target;

  const currentStreak = streak?.currentStreak || 0;

  // Streak flame coloring
  const getStreakColor = (days: number) => {
    if (days >= 21) return "text-cyan-500 fill-cyan-500";
    if (days >= 8) return "text-rose-500 fill-rose-500";
    if (days >= 4) return "text-orange-500 fill-orange-500";
    return "text-amber-500 fill-amber-500";
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playPop();
    soundFX.vibrate(20);
    onToggle();
  };

  return (
    <SwipeActionRow
      rightAction={{
        icon: <Check className="size-4 stroke-[3]" />,
        label: isCompletedToday ? "Undo" : "Done",
        color: "bg-[#03D26F]",
        textColor: "text-[#161514]",
        onTrigger: () => {
          soundFX.playCompleteChime();
          soundFX.vibrate(25);
          onToggle();
        },
      }}
      leftAction={
        onDelete
          ? {
              icon: <Trash2 className="size-4 stroke-[2.2]" />,
              label: "Delete",
              color: "bg-rose-600",
              textColor: "text-white",
              onTrigger: () => {
                soundFX.playPop();
                onDelete();
              },
            }
          : onEdit
          ? {
              icon: <Edit3 className="size-4 stroke-[2.2]" />,
              label: "Edit",
              color: "bg-stone-800",
              textColor: "text-white",
              onTrigger: () => {
                soundFX.playPop();
                onEdit();
              },
            }
          : undefined
      }
    >
      <div
        className={cn(
          "border-b border-[#161514]/10 dark:border-white/10 transition-colors select-none",
          isCompletedToday && "opacity-80"
        )}
      >
        {/* Main Row Surface (56-64px height) */}
        <div
          onClick={() => {
            soundFX.playPop();
            setIsExpanded((prev) => !prev);
          }}
          className={cn(
            "w-full min-h-[58px] py-2 px-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:bg-black/[0.04] transition-colors relative",
            isExpanded && "bg-black/[0.02] dark:bg-white/[0.02]"
          )}
        >
          {/* Left: Icon + Title + Meta Stack */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Compact 32px Icon Squircle */}
          <div
            className={cn(
              "size-8 rounded-lg border flex items-center justify-center shrink-0 transition-all",
              isCompletedToday
                ? "bg-[#03D26F]/15 border-[#03D26F]/30 text-[#047857] dark:text-[#03D26F]"
                : "bg-secondary border-border text-foreground"
            )}
          >
            <IconComponent className="size-4 stroke-[2.2]" />
          </div>

          {/* Text Telemetry */}
          <div className="min-w-0 flex-1 pr-1">
            <h4
              className={cn(
                "font-heading font-black text-xs sm:text-sm text-foreground leading-snug line-clamp-2 transition-all",
                isCompletedToday && "line-through text-muted-foreground opacity-75"
              )}
            >
              {habit.title}
            </h4>

            {/* Meta Line: Time + Streak */}
            <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[10px] font-mono font-medium text-muted-foreground">
              {currentStreak > 0 && (
                <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                  <Flame className={cn("size-3", getStreakColor(currentStreak))} />
                  <span>{currentStreak}d streak</span>
                </span>
              )}
              {habit.reminderTime && (
                <span className="flex items-center gap-0.5">
                  <Clock className="size-2.5" />
                  <span>{habit.reminderTime}</span>
                </span>
              )}
              {isRestDay && (
                <span className="text-muted-foreground font-bold italic">
                  Rest day
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Expand Indicator + Primary 44px Hit Target Checkbox */}
        <div className="flex items-center gap-1 shrink-0">
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-200 hidden sm:block",
              isExpanded && "rotate-180"
            )}
          />

          <button
            type="button"
            onClick={handleToggle}
            aria-label={isCompletedToday ? `Mark ${habit.title} incomplete` : `Mark ${habit.title} complete`}
            className={cn(
              "size-10 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs",
              isCompletedToday
                ? "bg-[#03D26F] border-[#161514] text-[#161514] shadow-[1px_1px_0px_0px_#161514]"
                : "bg-secondary border-border text-muted-foreground hover:border-[#161514]"
            )}
          >
            {isCompletedToday ? (
              <Check className="size-4 stroke-[3]" />
            ) : (
              <Circle className="size-4 stroke-[2]" />
            )}
          </button>
        </div>
      </div>

      {/* Expand Drawer (Reveals 7-Day History + Quick Actions) */}
      {isExpanded && (
        <div className="px-3 py-2.5 bg-black/[0.03] dark:bg-white/[0.03] border-t border-[#161514]/5 dark:border-white/5 space-y-2.5 animate-in fade-in duration-150">
          {/* 7-Day Routine Strip for this Habit */}
          {weekDays.length > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                7-Day Completion History
              </span>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      if (onToggleDate) {
                        onToggleDate(d.dateStr);
                      }
                    }}
                    className={cn(
                      "py-1 px-0.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[36px]",
                      d.isCompleted
                        ? "bg-[#03D26F] text-[#161514] border-[#161514] font-black shadow-2xs"
                        : d.isToday
                        ? "bg-secondary text-foreground border-[#03D26F] font-bold"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    )}
                    title={`${d.dayLabel} ${d.dayNum}: ${d.isCompleted ? "Completed" : "Incomplete"}`}
                  >
                    <span className="text-[8px] uppercase tracking-wider leading-none">
                      {d.dayLabel}
                    </span>
                    <span className="text-[10px] font-mono font-bold mt-0.5 leading-none">
                      {d.dayNum}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Row Actions: Edit, Delete, Skip, Details */}
          <div className="flex items-center justify-between gap-1.5 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFX.playPop();
                    onEdit();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-muted text-foreground text-xs font-heading font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                >
                  <Edit3 className="size-3" />
                  <span>Edit</span>
                </button>
              )}

              {onSkip && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFX.playPop();
                    onSkip();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-heading font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                >
                  <FastForward className="size-3" />
                  <span>Skip Today</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFX.playPop();
                    onDelete();
                  }}
                  className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-heading font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="Delete habit"
                >
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>

            {onViewDetail && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundFX.playPop();
                  onViewDetail();
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
              >
                <span>Analytics</span>
                <ExternalLink className="size-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  </SwipeActionRow>
  );
}
