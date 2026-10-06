"use client";

import React, { useState } from "react";
import * as LucideIcons from "lucide-react";
import { type Habit, type Streak } from "@/types";
import { Flame, CheckCircle, Circle, Edit3, Trash2, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

interface HabitCardProps {
  habit: Habit;
  streak?: Streak;
  isCompletedToday: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

export function HabitCard({
  habit,
  streak,
  isCompletedToday,
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
        bg: "bg-gradient-to-r from-cyan-300 to-blue-400 text-[#161514]",
        border: "border-cyan-600",
        flameColor: "fill-cyan-500 text-blue-950",
        glow: "animate-pulse",
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
        "relative bg-white border-[2.5px] border-[#161514] rounded-2xl p-4 flex items-center justify-between",
        "shadow-[3.5px_3.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#161514]",
        "transition-all cursor-pointer select-none group overflow-hidden",
        isCompletedToday && "bg-[#F0FDF4]/90 border-[#161514]",
        isAnimating && "scale-[0.98]"
      )}
    >
      {/* Floating Sparkle Particles on check */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="animate-ping flex items-center gap-1 bg-[#CEF431] text-[#161514] border-2 border-[#161514] px-2.5 py-0.5 rounded-full font-heading font-black text-xs shadow-[2px_2px_0px_0px_#161514]">
            <Sparkles className="size-3.5 fill-current" />
            <span>REP COMPLETE!</span>
          </div>
        </div>
      )}

      {/* Habit Details */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
        {/* Habit Category Icon */}
        <div
          className={cn(
            "size-12 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center shrink-0",
            colors.bg,
            colors.text
          )}
        >
          <IconComponent className="size-6 stroke-[2.5]" />
        </div>

        {/* Title, Frequency & Evolving Streak Flame */}
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              "font-heading font-black text-sm text-[#161514] truncate leading-tight transition-all",
              isCompletedToday && "line-through opacity-60"
            )}
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {habit.title}
          </h4>

          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {/* Frequency Badge */}
            <span className="text-[9px] font-heading font-black text-[#161514] uppercase tracking-wider bg-white px-2 py-0.5 rounded-full border border-[#161514]">
              {habit.frequency?.type === "daily"
                ? "Daily"
                : habit.frequency?.type === "weekly"
                ? "Weekly"
                : "Custom"}
            </span>

            {/* Evolving Streak Flame Badge */}
            {currentStreak > 0 && (
              <div
                className={cn(
                  "flex items-center gap-1 px-2.5 py-0.5 rounded-full font-heading font-black text-[9px] border border-[#161514] shadow-[1px_1px_0px_0px_#161514]",
                  streakTier.bg,
                  streakTier.glow
                )}
                title={`${currentStreak} days • ${streakTier.label}`}
              >
                <Flame className={cn("size-3", streakTier.flameColor)} />
                <span>
                  {currentStreak}d {currentStreak >= 21 ? "🔥 MYTHIC" : "streak"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons (All min 44x44px touch targets) */}
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
            className="min-w-[44px] min-h-[44px] size-11 rounded-xl border-2 border-[#161514] bg-white hover:bg-amber-100 text-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center cursor-pointer"
            title="Edit Habit"
            aria-label="Edit Habit"
          >
            <Edit3 className="size-4 stroke-[2.5]" />
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
            className="min-w-[44px] min-h-[44px] size-11 rounded-xl border-2 border-[#161514] bg-white hover:bg-rose-100 text-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center cursor-pointer"
            title="Delete Habit"
            aria-label="Delete Habit"
          >
            <Trash2 className="size-4 stroke-[2.5]" />
          </button>
        )}

        {/* Complete Checkbox Toggle (Giant 44x44px satisfying tactile pop) */}
        <button
          onClick={handleToggleClick}
          type="button"
          aria-label={isCompletedToday ? "Mark Incomplete" : "Mark Complete"}
          className={cn(
            "min-w-[44px] min-h-[44px] size-11 rounded-xl border-[2.5px] border-[#161514] flex items-center justify-center transition-all cursor-pointer",
            "shadow-[2.5px_2.5px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
            isCompletedToday
              ? "bg-[#03D26F] text-[#161514] hover:bg-[#02b861]"
              : "bg-white text-[#161514] hover:bg-[#FFF9EA]"
          )}
        >
          {isCompletedToday ? (
            <CheckCircle className="size-6 fill-[#161514] text-white stroke-[2]" />
          ) : (
            <Circle className="size-6 stroke-[2.5] text-[#161514]" />
          )}
        </button>
      </div>
    </div>
  );
}
