"use client";

import React, { useState } from "react";
import * as LucideIcons from "lucide-react";
import { type Habit, type Streak } from "@/types";
import { Flame, Check, CheckCircle, Circle, Edit3, Trash2, Sparkles, Zap, Clock, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

interface HabitCardProps {
  habit: Habit;
  streak?: Streak;
  isCompletedToday: boolean;
  isRestDay?: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
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
}: HabitCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  // Dynamically resolve Lucide icon with safe fallback
  const IconComponent =
    (LucideIcons as any)[habit.icon] || LucideIcons.Target;

  // Map color tokens to Neobrutalist high-contrast badges
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    amber: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-500" },
    orange: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-500" },
    rose: { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-500" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-500" },
    mint: { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-500" },
    sky: { bg: "bg-sky-100", text: "text-sky-800", border: "border-sky-500" },
    indigo: { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-500" },
    lavender: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-500" },
  };

  const colors = colorMap[habit.color] || colorMap.amber;
  const currentStreak = streak?.currentStreak || 0;

  // 4-Tier Evolving Streak Flame System
  const getStreakTier = (days: number) => {
    if (days >= 21) {
      return {
        label: "Mythic Plasma",
        bg: "bg-cyan-300 text-[#161514]",
        border: "border-[#161514]",
        flameColor: "fill-cyan-800 text-[#161514]",
        glow: "",
      };
    }
    if (days >= 8) {
      return {
        label: "Blazing Inferno",
        bg: "bg-rose-300 text-[#161514]",
        border: "border-rose-600",
        flameColor: "fill-rose-500 text-rose-950",
        glow: "",
      };
    }
    if (days >= 4) {
      return {
        label: "Kinetic Hearth",
        bg: "bg-orange-300 text-[#161514]",
        border: "border-orange-600",
        flameColor: "fill-orange-500 text-orange-950",
        glow: "",
      };
    }
    return {
      label: "Initiate Spark",
      bg: "bg-amber-300 text-[#161514]",
      border: "border-amber-600",
      flameColor: "fill-amber-500 text-amber-950",
      glow: "",
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

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] rounded-xl p-3.5 sm:p-4 flex items-center justify-between",
        "transition-colors cursor-pointer select-none group overflow-hidden hover:bg-[#FAF8F5] dark:hover:bg-[#252321]",
        isCompletedToday && "bg-[#F9FAF9] dark:bg-[#181615] opacity-85",
        isAnimating && "scale-[0.99]"
      )}
    >
      {/* Floating Sparkle Particles on check */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="animate-ping flex items-center gap-1 bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] px-2.5 py-0.5 rounded-md font-mono text-xs shadow-sm">
            <Sparkles className="size-3.5 text-[#03D26F] fill-current" />
            <span>Rep completed</span>
          </div>
        </div>
      )}

      {/* Habit Details */}
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
        {/* Habit Category Icon */}
        <div className="size-10 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] flex items-center justify-center shrink-0 text-[#161514] dark:text-[#FAF8F5]">
          <IconComponent className="size-5 stroke-[1.5]" />
        </div>

        {/* Title, Frequency & Evolving Streak Flame */}
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              "font-sans font-medium text-sm text-[#161514] dark:text-[#FAF8F5] truncate leading-tight transition-colors",
              isCompletedToday && "line-through text-[#6B6B6B] dark:text-[#A8A29E]"
            )}
          >
            {habit.title}
          </h4>

          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {/* Frequency Badge */}
            <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] bg-[#F1EFEA] dark:bg-[#252321] px-2 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531]">
              {habit.frequency?.type === "daily"
                ? "Daily"
                : habit.frequency?.type === "weekly"
                ? "Weekly"
                : "Custom"}
            </span>

            {/* Rest Day Badge */}
            {isRestDay && !isCompletedToday && (
              <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] bg-[#FAF8F5] dark:bg-[#161514] px-2 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531] flex items-center gap-1">
                <Moon className="size-2.5 stroke-[1.5]" />
                <span>Rest Day</span>
              </span>
            )}

            {/* Reminder Time Badge */}
            {habit.reminderTime && (
              <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] bg-white dark:bg-[#252321] px-2 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531] flex items-center gap-1">
                <Clock className="size-2.5 stroke-[1.5]" />
                <span>{habit.reminderTime}</span>
              </span>
            )}

            {/* Evolving Streak Flame Badge */}
            {currentStreak > 0 && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] border border-[#E8E5DF] dark:border-[#78350F]/40 bg-[#FFFBEB] dark:bg-[#78350F]/20 text-[#92400E] dark:text-[#FDE68A]"
                title={`${currentStreak} days • ${streakTier.label}`}
              >
                <Flame className="size-2.5 fill-orange-500 text-orange-500" />
                <span className="tabular-nums">
                  {currentStreak}d streak
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons (All min 40x40px touch targets) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Edit Button */}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundFX.playPop();
              onEdit();
            }}
            type="button"
            className="min-w-[38px] min-h-[38px] size-9 rounded-lg border border-[#E8E5DF] dark:border-[#383531] bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] transition-colors flex items-center justify-center cursor-pointer"
            title="Edit Habit"
            aria-label="Edit Habit"
          >
            <Edit3 className="size-3.5 stroke-[1.5]" />
          </button>
        )}

        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundFX.playPop();
              onDelete();
            }}
            type="button"
            className="min-w-[38px] min-h-[38px] size-9 rounded-lg border border-[#E8E5DF] dark:border-[#383531] bg-white dark:bg-[#252321] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[#6B6B6B] dark:text-[#A8A29E] hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center justify-center cursor-pointer"
            title="Delete Habit"
            aria-label="Delete Habit"
          >
            <Trash2 className="size-3.5 stroke-[1.5]" />
          </button>
        )}

        {/* Complete Checkbox Toggle */}
        <button
          onClick={handleToggleClick}
          type="button"
          aria-label={isCompletedToday ? "Mark Incomplete" : "Mark Complete"}
          className={cn(
            "min-w-[38px] min-h-[38px] size-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer active:translate-y-px",
            isCompletedToday
              ? "bg-[#03D26F] border-[#03D26F] text-white"
              : "bg-white dark:bg-[#252321] border-[#D1D5DB] dark:border-[#4B5563] hover:bg-[#F1EFEA] dark:hover:bg-[#2e2b28] text-[#D1D5DB] dark:text-[#4B5563]"
          )}
        >
          {isCompletedToday ? (
            <Check className="size-4.5 stroke-[2.5]" />
          ) : (
            <Circle className="size-4.5 stroke-[1.5]" />
          )}
        </button>
      </div>
    </div>
  );
}
