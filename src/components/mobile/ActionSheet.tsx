"use client";

import { BottomSheet } from "./BottomSheet";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckSquare,
  Dumbbell,
  Utensils,
  Droplet,
  Receipt,
  TrendingUp,
  Users,
  ReceiptText,
  CheckCircle2,
  FolderKanban,
  Kanban,
  Flame,
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

    // 1. Money Space: log expense, log income, who owes who, ledger
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
          id: "split-bill",
          label: "Who Owes Who",
          sublabel: "Track shared bills, IOUs and repayments",
          icon: Users,
          colorClass: "bg-[#38BDF8] text-[#161514] border-[#161514]",
          onClick: () => {
            onOpenChange(false);
            window.dispatchEvent(new CustomEvent("invictus:money-split"));
          },
        },
        {
          id: "open-ledger",
          label: "Open Ledger",
          sublabel: "View all transactions, envelopes & search",
          icon: ReceiptText,
          colorClass: "bg-[#C084FC] text-[#161514] border-[#161514]",
          onClick: () => {
            onOpenChange(false);
            window.dispatchEvent(new CustomEvent("invictus:money-open-ledger"));
          },
        },
      ];
    }

    // 2. Habits Space: water logger, meal, habit, workout (no mood logging)
    if (pathname.startsWith("/goals")) {
      return [
        {
          id: "log-water",
          label: "Log Water (+250ml)",
          sublabel: "Hydrate toward your daily 2,000ml goal",
          icon: Droplet,
          colorClass: "bg-[#38BDF8] text-[#161514] border-[#161514]",
          onClick: () => {
            onOpenChange(false);
            window.dispatchEvent(
              new CustomEvent("invictus:quick-log-water", { detail: { amount: 250 } })
            );
          },
        },
        {
          id: "log-meal",
          label: "Log Meal",
          sublabel: "Macros, calories, and nutrition tracker",
          icon: Utensils,
          colorClass: "bg-[#03D26F] text-[#161514] border-[#161514]",
          onClick: () => {
            onOpenChange(false);
            router.push("/goals/nutrition");
          },
        },
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
          sublabel: "Track sets, reps and muscle activation studio",
          icon: Dumbbell,
          colorClass: "bg-[#F59E0B] text-[#161514] border-[#161514]",
          onClick: () => {
            onOpenChange(false);
            router.push("/goals/gym");
          },
        },
      ];
    }

    // 3. Tasks Space: creating task, project, matrix, kanban
    if (pathname.startsWith("/tasks")) {
      return [
        {
          id: "new-task",
          label: "New Task",
          sublabel: "Capture next action or project milestone",
          icon: CheckCircle2,
          colorClass: "bg-[#CEF431] text-[#161514] border-[#161514]",
          onClick: () => {
            onOpenChange(false);
            window.dispatchEvent(new CustomEvent("invictus:tasks-new-task"));
          },
        },
        {
          id: "new-project",
          label: "New Project",
          sublabel: "Organize tasks under a unified project banner",
          icon: Kanban,
          colorClass: "bg-[#03D26F] text-[#161514] border-[#161514]",
          onClick: () => {
            onOpenChange(false);
            window.dispatchEvent(new CustomEvent("invictus:tasks-new-project"));
          },
        },
        {
          id: "priority-matrix",
          label: "Eisenhower Matrix",
          sublabel: "Urgent vs Important quadrant prioritization",
          icon: Flame,
          colorClass: "bg-[#F59E0B] text-[#161514] border-[#161514]",
          onClick: () => {
            onOpenChange(false);
            window.dispatchEvent(new CustomEvent("invictus:tasks-open-matrix"));
          },
        },
        {
          id: "kanban-board",
          label: "Kanban Board",
          sublabel: "Visual pipeline columns and swimlanes",
          icon: FolderKanban,
          colorClass: "bg-[#38BDF8] text-[#161514] border-[#161514]",
          onClick: () => {
            onOpenChange(false);
            window.dispatchEvent(new CustomEvent("invictus:tasks-open-kanban"));
          },
        },
      ];
    }

    // 4. Today Overview (Default): pure action buttons (task, expense, water, habit)
    return [
      {
        id: "today-task",
        label: "New Task",
        sublabel: "Capture action item with priority and due date",
        icon: CheckCircle2,
        colorClass: "bg-[#CEF431] text-[#161514] border-[#161514]",
        onClick: () => {
          onOpenChange(false);
          window.dispatchEvent(new CustomEvent("invictus:tasks-new-task"));
        },
      },
      {
        id: "today-expense",
        label: "Log Expense",
        sublabel: "Record purchase against daily safe-to-spend",
        icon: Receipt,
        colorClass: "bg-[#03D26F] text-[#161514] border-[#161514]",
        onClick: () => {
          onOpenChange(false);
          window.dispatchEvent(new CustomEvent("invictus:money-new-expense"));
        },
      },
      {
        id: "today-water",
        label: "Quick Water (+250ml)",
        sublabel: "Instant hydration rep toward 2,000ml goal",
        icon: Droplet,
        colorClass: "bg-[#38BDF8] text-[#161514] border-[#161514]",
        onClick: () => {
          onOpenChange(false);
          window.dispatchEvent(
            new CustomEvent("invictus:quick-log-water", { detail: { amount: 250 } })
          );
        },
      },
      {
        id: "today-habit",
        label: "New Habit",
        sublabel: "Add a new routine to your daily conquest",
        icon: CheckSquare,
        colorClass: "bg-[#C084FC] text-[#161514] border-[#161514]",
        onClick: () => {
          onOpenChange(false);
          window.dispatchEvent(new CustomEvent("invictus:open-new-habit"));
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
