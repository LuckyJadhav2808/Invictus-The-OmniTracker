"use client";

import { useRouter } from "next/navigation";
import { BarChart2, Utensils, CheckSquare, Moon } from "lucide-react";
import { DoorTileGrid, type DoorTileItem } from "@/components/shared/DoorTileGrid";

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
  onOpenNewHabit,
  onOpenNutrition,
  onOpenStats,
  onOpenRecovery,
  className,
}: DoorTileRowProps) {
  const router = useRouter();

  const tiles: DoorTileItem[] = [
    {
      id: "stats",
      label: "Analytics",
      value: "Trends",
      icon: BarChart2,
      iconColorClass: "text-purple-600 dark:text-purple-400",
      bgClass: "hover:border-purple-500/50",
      onClick: onOpenStats || (() => router.push("/goals/analytics")),
      title: "Habit Analytics, Consistency Trends & Heatmap",
    },
    {
      id: "diet",
      label: "Diet",
      value: "Macros",
      icon: Utensils,
      iconColorClass: "text-amber-600 dark:text-amber-400",
      bgClass: "hover:border-amber-500/50",
      onClick: onOpenNutrition || (() => router.push("/goals/nutrition")),
      title: "Daily Macro Targets, Caloric Deficit & Weekly Distribution",
    },
    {
      id: "vault",
      label: "Vault",
      value: "Roster",
      icon: CheckSquare,
      iconColorClass: "text-lime-600 dark:text-[#CEF431]",
      bgClass: "hover:border-[#CEF431]/60",
      onClick: onOpenNewHabit || (() => router.push("/goals/habits")),
      title: "All Habits Roster, Routine Rules & Archive",
    },
    {
      id: "recovery",
      label: "Recovery",
      value: "Sleep",
      icon: Moon,
      iconColorClass: "text-sky-600 dark:text-sky-400",
      bgClass: "hover:border-sky-500/50",
      onClick: onOpenRecovery || (() => router.push("/goals/recovery")),
      title: "Sleep Quality, Circadian Clock & Hydration Baseline",
    },
  ];

  return <DoorTileGrid tiles={tiles} className={className} />;
}
