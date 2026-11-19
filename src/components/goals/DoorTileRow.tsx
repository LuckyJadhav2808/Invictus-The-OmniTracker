"use client";

import React from "react";
import { Target, Dumbbell, Utensils, BarChart2, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface DoorTileRowProps {
  waterAmount?: number;
  waterTarget?: number;
  bodyWeight?: string;
  bodyAge?: string;
  onOpenNewHabit?: () => void;
  onOpenGym?: () => void;
  onOpenNutrition?: () => void;
  onOpenStats?: () => void;
  onOpenWater?: () => void;
  onOpenBodyProfile?: () => void;
  onOpenReminders?: () => void;
  onOpenRecovery?: () => void;
  className?: string;
}

export function DoorTileRow({
  waterAmount = 0,
  waterTarget = 2000,
  bodyWeight = "68 kg",
  bodyAge = "24y",
  onOpenNewHabit,
  onOpenGym,
  onOpenNutrition,
  onOpenStats,
  onOpenWater,
  onOpenBodyProfile,
  onOpenReminders,
  onOpenRecovery,
  className,
}: DoorTileRowProps) {
  const tiles = [
    {
      id: "new-habit",
      label: "New Habit",
      value: "Add Routine",
      icon: Target,
      iconColor: "text-lime-600 dark:text-[#CEF431]",
      bgClass: "hover:border-[#CEF431]/60",
      onClick: onOpenNewHabit || onOpenWater || (() => {}),
      title: "Create New Atomic Habit or Pick Presets",
    },
    {
      id: "gym",
      label: "Gym",
      value: "Workouts",
      icon: Dumbbell,
      iconColor: "text-emerald-600 dark:text-[#03D26F]",
      bgClass: "hover:border-[#03D26F]/50",
      onClick: onOpenGym || onOpenBodyProfile || (() => {}),
      title: "Open Gym Workout Studio & Muscle Anatomy",
    },
    {
      id: "diet",
      label: "Diet",
      value: "Fuel & Macros",
      icon: Utensils,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgClass: "hover:border-amber-500/50",
      onClick: onOpenNutrition || onOpenRecovery || (() => {}),
      title: "Open Nutrition, Calories & Macro Balance",
    },
    {
      id: "stats",
      label: "Stats",
      value: "Consistency",
      icon: BarChart2,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgClass: "hover:border-purple-500/50",
      onClick: onOpenStats || onOpenReminders || (() => {}),
      title: "Open Habit Consistency Matrix & Telemetry",
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-4 gap-1.5 sm:gap-2.5 lg:gap-3 w-full select-none",
        className
      )}
    >
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              soundFX.playPop();
              soundFX.vibrate(15);
              t.onClick();
            }}
            className={cn(
              "py-2 sm:py-3 px-1.5 sm:px-3 rounded-xl sm:rounded-2xl bg-card border border-border flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 shadow-2xs group min-h-[58px] sm:min-h-[66px]",
              t.bgClass
            )}
            title={t.title}
          >
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Icon className={cn("size-3.5 sm:size-4 stroke-[2]", t.iconColor)} />
              <span className="font-heading font-black text-[11px] sm:text-xs text-foreground tracking-tight">
                {t.label}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono font-medium text-muted-foreground truncate w-full mt-0.5">
              {t.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}
