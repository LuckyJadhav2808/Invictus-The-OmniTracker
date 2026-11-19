"use client";

import React from "react";
import { BottomSheet } from "./BottomSheet";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckSquare,
  Dumbbell,
  Utensils,
  Droplet,
  Plus,
  CheckCircle2,
  Calendar,
  Wallet,
  ArrowRightLeft,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export interface ActionItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  colorClass: string;
  onClick: () => void;
}

export interface ActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customActions?: ActionItem[];
}

export function ActionSheet({
  open,
  onOpenChange,
  customActions,
}: ActionSheetProps) {
  const pathname = usePathname();
  const router = useRouter();

  const getContextActions = (): ActionItem[] => {
    if (customActions && customActions.length > 0) {
      return customActions;
    }

    // Money Space Actions
    if (pathname.startsWith("/money")) {
      return [
        {
          id: "new-expense",
          label: "Log Expense",
          sublabel: "Record purchase, bill, or daily spend",
          icon: Receipt,
          colorClass: "bg-[#CEF431] text-[#161514] border-[#161514]",
          onClick: () => {
            onOpenChange(false);
            window.dispatchEvent(new CustomEvent("invictus:money-new-expense"));
          },
        },
        {
          id: "new-income",
          label: "Log Income",
          sublabel: "Salary, allowance, freelance or dividend",
          icon: TrendingUp,
          colorClass: "bg-[#03D26F] text-[#161514] border-[#161514]",
          onClick: () => {
            onOpenChange(false);
            window.dispatchEvent(new CustomEvent("invictus:money-new-income"));
          },
        },
        {
          id: "transfer",
          label: "Transfer Funds",
          sublabel: "Move funds between accounts or cash till",
          icon: ArrowRightLeft,
          colorClass: "bg-[#C084FC] text-[#161514] border-[#161514]",
          onClick: () => {
            onOpenChange(false);
            window.dispatchEvent(new CustomEvent("invictus:money-transfer"));
          },
        },
        {
          id: "split-bill",
          label: "Split Bill / IOU",
          sublabel: "Track who owes who and settle debts",
          icon: Users,
          colorClass: "bg-[#F59E0B] text-[#161514] border-[#161514]",
          onClick: () => {
            onOpenChange(false);
            window.dispatchEvent(new CustomEvent("invictus:money-split"));
          },
        },
      ];
    }

    // Habits Space Actions
    if (pathname.startsWith("/goals")) {
      return [
        {
          id: "new-habit",
          label: "New Habit",
          sublabel: "Pick from 50+ atomic presets or build custom",
          icon: CheckSquare,
          colorClass: "bg-[#CEF431] text-[#161514] border-[#161514]",
          onClick: () => {
            onOpenChange(false);
            window.dispatchEvent(new CustomEvent("invictus:open-new-habit"));
          },
        },
        {
          id: "log-workout",
          label: "Log Workout",
          sublabel: "Track sets, reps and muscle activation",
          icon: Dumbbell,
          colorClass: "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200 border-cyan-600/40",
          onClick: () => {
            onOpenChange(false);
            router.push("/goals/gym");
          },
        },
        {
          id: "log-meal",
          label: "Log Meal & Macros",
          sublabel: "Record calories, protein, carbs and fats",
          icon: Utensils,
          colorClass: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-600/40",
          onClick: () => {
            onOpenChange(false);
            router.push("/goals/nutrition");
          },
        },
        {
          id: "log-water",
          label: "Log Water (+250ml)",
          sublabel: "Hydrate toward your daily 2,000ml goal",
          icon: Droplet,
          colorClass: "bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 border-sky-600/40",
          onClick: () => {
            onOpenChange(false);
            window.dispatchEvent(new CustomEvent("invictus:quick-log-water", { detail: { amount: 250 } }));
          },
        },
      ];
    }

    // Default Fallback Actions
    return [
      {
        id: "new-habit",
        label: "New Habit",
        sublabel: "Add to daily routines",
        icon: CheckSquare,
        colorClass: "bg-[#CEF431] text-[#161514] border-[#161514]",
        onClick: () => {
          onOpenChange(false);
          window.dispatchEvent(new CustomEvent("invictus:open-new-habit"));
        },
      },
      {
        id: "quick-log-water",
        label: "Quick Water (+250ml)",
        sublabel: "Instant hydration rep",
        icon: Droplet,
        colorClass: "bg-sky-100 text-sky-900 border-sky-600/40",
        onClick: () => {
          onOpenChange(false);
          window.dispatchEvent(new CustomEvent("invictus:quick-log-water", { detail: { amount: 250 } }));
        },
      },
    ];
  };

  const actions = getContextActions();

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Quick Actions"
      description="Select an action to log or create"
    >
      <div className="space-y-2 py-1">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => {
                soundFX.playPop();
                soundFX.vibrate(20);
                act.onClick();
              }}
              className="w-full p-3 sm:p-3.5 rounded-2xl bg-card border-2 border-border hover:border-foreground/40 transition-all flex items-center gap-3.5 text-left cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shadow-[2px_2px_0px_0px_rgba(22,21,20,0.15)] group"
            >
              <div
                className={cn(
                  "size-10 sm:size-11 rounded-xl border-2 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform",
                  act.colorClass
                )}
              >
                <Icon className="size-5 stroke-[2.2]" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-heading font-black text-sm text-foreground tracking-tight leading-tight">
                  {act.label}
                </h4>
                {act.sublabel && (
                  <p className="text-xs text-muted-foreground font-sans line-clamp-1 mt-0.5">
                    {act.sublabel}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
