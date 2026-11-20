"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Target, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface TodayDoorTileRowProps {
  taskCount?: number;
  completedTasksCount?: number;
  habitCount?: number;
  completedHabitsCount?: number;
  remainingSafeToSpend?: number;
  dailySafeToSpend?: number;
  currencySymbol?: string;
  onOpenTasks?: () => void;
  onOpenHabits?: () => void;
  onOpenMoney?: () => void;
  onOpenProfile?: () => void;
  // Legacy / fallback props
  waterAmount?: number;
  waterTarget?: number;
  notesCount?: number;
  onOpenScratchpad?: () => void;
  onOpenCloseout?: () => void;
  onOpenWater?: () => void;
  onOpenDailyLimit?: () => void;
  onQuickLogWater?: () => void;
  className?: string;
}

export function TodayDoorTileRow({
  taskCount,
  completedTasksCount,
  habitCount,
  completedHabitsCount,
  remainingSafeToSpend,
  dailySafeToSpend = 727,
  currencySymbol = "₹",
  onOpenTasks,
  onOpenHabits,
  onOpenMoney,
  onOpenProfile,
  waterAmount,
  waterTarget,
  notesCount,
  onOpenScratchpad,
  onOpenCloseout,
  onOpenWater,
  onOpenDailyLimit,
  onQuickLogWater,
  className,
}: TodayDoorTileRowProps) {
  const router = useRouter();

  const safeAmount =
    remainingSafeToSpend !== undefined ? remainingSafeToSpend : dailySafeToSpend;

  const tiles = [
    {
      id: "tasks",
      label: "Task",
      value:
        taskCount !== undefined
          ? `${completedTasksCount || 0}/${taskCount}`
          : "Work",
      icon: CheckCircle2,
      iconColor: "text-lime-600 dark:text-[#CEF431]",
      bgClass: "hover:border-[#CEF431]/60",
      onClick: onOpenTasks || (() => router.push("/tasks")),
      title: "Open Tasks Workspace",
    },
    {
      id: "habits",
      label: "Habit",
      value:
        habitCount !== undefined
          ? `${completedHabitsCount || 0}/${habitCount}`
          : "Routine",
      icon: Target,
      iconColor: "text-orange-500 dark:text-orange-400",
      bgClass: "hover:border-orange-500/50",
      onClick: onOpenHabits || (() => router.push("/goals")),
      title: "Open Habits & Routines Workspace",
    },
    {
      id: "money",
      label: "Money",
      value: `${currencySymbol}${safeAmount >= 1000 ? Math.round(safeAmount / 1000) + "k" : safeAmount} Safe`,
      icon: Wallet,
      iconColor: "text-emerald-600 dark:text-[#03D26F]",
      bgClass: "hover:border-[#03D26F]/50",
      onClick: onOpenMoney || (() => router.push("/money")),
      title: "Open Money Ledger & Budget Workspace",
    },
    {
      id: "profile",
      label: "Profile",
      value: "Account",
      icon: User,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgClass: "hover:border-purple-500/50",
      onClick: onOpenProfile || (() => router.push("/profile")),
      title: "Open Profile & Preferences",
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
