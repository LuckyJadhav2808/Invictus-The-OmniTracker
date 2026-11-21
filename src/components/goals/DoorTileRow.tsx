"use client";

import { useRouter } from "next/navigation";
import { BarChart2, Utensils, CheckSquare, Moon } from "lucide-react";
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
  const router = useRouter();

  const tiles = [
    {
      id: "stats",
      label: "Analytics",
      value: "Trends",
      icon: BarChart2,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgClass: "hover:border-purple-500/50",
      onClick: onOpenStats || (() => router.push("/goals/analytics")),
      title: "Habit Analytics, Consistency Trends & Heatmap",
    },
    {
      id: "diet",
      label: "Diet",
      value: "Macros",
      icon: Utensils,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgClass: "hover:border-amber-500/50",
      onClick: onOpenNutrition || (() => router.push("/goals/nutrition")),
      title: "Daily Macro Targets, Caloric Deficit & Weekly Distribution",
    },
    {
      id: "vault",
      label: "Vault",
      value: "Roster",
      icon: CheckSquare,
      iconColor: "text-lime-600 dark:text-[#CEF431]",
      bgClass: "hover:border-[#CEF431]/60",
      onClick: onOpenNewHabit || (() => router.push("/goals/habits")),
      title: "All Habits Roster, Routine Rules & Archive",
    },
    {
      id: "recovery",
      label: "Recovery",
      value: "Sleep",
      icon: Moon,
      iconColor: "text-sky-600 dark:text-sky-400",
      bgClass: "hover:border-sky-500/50",
      onClick: onOpenRecovery || (() => router.push("/goals/recovery")),
      title: "Sleep Quality, Circadian Clock & Hydration Baseline",
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
              "py-2 sm:py-3 px-1 sm:px-2.5 rounded-xl sm:rounded-2xl bg-card border border-border flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 shadow-2xs group min-h-[58px] sm:min-h-[66px]",
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
            <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-tight text-muted-foreground leading-tight text-center block w-full truncate mt-0.5">
              {t.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}
