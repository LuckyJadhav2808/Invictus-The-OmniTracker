"use client";

import * as LucideIcons from "lucide-react";
import { type Habit, type Streak } from "@/types";
import { Flame, CheckCircle, Circle, Edit3, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  // Resolve Lucide icon dynamically
  const IconComponent =
    (LucideIcons as any)[habit.icon] || LucideIcons.Target;

  // Map design color tokens to tailwind classes
  const colorMap: Record<string, { bg: string; text: string; border: string; accent: string }> = {
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-600",
      border: "border-amber-500/30",
      accent: "bg-amber-500",
    },
    orange: {
      bg: "bg-orange-500/10",
      text: "text-orange-600",
      border: "border-orange-500/30",
      accent: "bg-orange-500",
    },
    mint: {
      bg: "bg-mint-600/10",
      text: "text-mint-600",
      border: "border-mint-600/30",
      accent: "bg-mint-600",
    },
    lavender: {
      bg: "bg-lavender-400/20",
      text: "text-lavender-600",
      border: "border-lavender-400/40",
      accent: "bg-lavender-400",
    },
    coral: {
      bg: "bg-coral-400/20",
      text: "text-coral-500",
      border: "border-coral-400/40",
      accent: "bg-coral-400",
    },
  };

  const colors = colorMap[habit.color] || colorMap.amber;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border-[2.5px] border-[#161514] rounded-2xl p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#161514] transition-all cursor-pointer select-none",
        isCompletedToday && "bg-[#ECFDF5]/80"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Habit Icon */}
        <div className={cn("h-11 w-11 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center shrink-0 font-black", colors.bg, colors.text)}>
          <IconComponent className="h-5 w-5 stroke-[2.5]" />
        </div>

        {/* Title & Streak Info */}
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-heading font-black text-sm text-[#161514] truncate leading-snug", isCompletedToday && "line-through opacity-55")}>
            {habit.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-heading font-black text-[#161514] uppercase tracking-wider bg-white px-2 py-0.5 rounded-full border border-[#161514]">
              {habit.frequency?.type === "daily" ? "Daily" : habit.frequency?.type === "weekly" ? "Weekly" : "Custom"}
            </span>
            {streak && streak.currentStreak > 0 && (
              <div className="flex items-center gap-1 text-[#161514] bg-amber-300 border border-[#161514] px-2.5 py-0.5 rounded-full font-heading font-black text-[9px] shadow-[1px_1px_0px_0px_#161514]">
                <Flame className="h-3 w-3 fill-amber-500 text-amber-950" />
                <span>{streak.currentStreak} day streak</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Edit Button */}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            type="button"
            className="p-2 rounded-xl border-2 border-[#161514] bg-white hover:bg-amber-200 text-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            title="Edit Habit"
          >
            <Edit3 className="h-4 w-4 stroke-[2.5]" />
          </button>
        )}

        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            type="button"
            className="p-2 rounded-xl border-2 border-[#161514] bg-white hover:bg-rose-200 text-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            title="Delete Habit"
          >
            <Trash2 className="h-4 w-4 stroke-[2.5]" />
          </button>
        )}

        {/* Complete Button toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          type="button"
          className={cn(
            "h-10 w-10 rounded-xl border-[2.5px] border-[#161514] flex items-center justify-center transition-all cursor-pointer shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#161514] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ml-1",
            isCompletedToday ? "bg-[#03D26F] text-[#161514]" : "bg-white text-[#161514] hover:bg-[#FFF9EA]"
          )}
          title={isCompletedToday ? "Mark Incomplete" : "Mark Complete"}
        >
          {isCompletedToday ? (
            <CheckCircle className="h-6 w-6 fill-[#161514] text-white" />
          ) : (
            <Circle className="h-6 w-6 stroke-[2.5]" />
          )}
        </button>
      </div>
    </div>
  );
}
