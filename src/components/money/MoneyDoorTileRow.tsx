"use client";

import { Tag, BarChart2, Target, Repeat, FileDown, ReceiptText, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface MoneyDoorTileRowProps {
  monthlyBudget?: number;
  activeIouCount?: number;
  currencySymbol?: string;
  onOpenCategories?: () => void;
  onOpenAnalytics?: () => void;
  onOpenBudgets?: () => void;
  onOpenSubscriptions?: () => void;
  onOpenExport?: () => void;
  // Legacy / fallback props
  onOpenLedger?: () => void;
  onOpenReceipts?: () => void;
  onOpenCalc?: () => void;
  onOpenIncome?: () => void;
  onOpenVault?: () => void;
  onOpenIous?: () => void;
  onOpenAllowances?: () => void;
  onMoveMoney?: () => void;
  onOpenTemplates?: () => void;
  className?: string;
}

export function MoneyDoorTileRow({
  monthlyBudget,
  activeIouCount = 0,
  currencySymbol = "₹",
  onOpenCategories,
  onOpenAnalytics,
  onOpenBudgets,
  onOpenSubscriptions,
  onOpenExport,
  onOpenLedger,
  onOpenReceipts,
  onOpenCalc,
  onOpenIncome,
  onOpenVault,
  onOpenIous,
  onOpenAllowances,
  onMoveMoney,
  onOpenTemplates,
  className,
}: MoneyDoorTileRowProps) {
  const tiles = [
    {
      id: "categories",
      label: "Category",
      value: "Envelopes",
      icon: Tag,
      iconColor: "text-amber-500 dark:text-amber-400",
      bgClass: "hover:border-amber-500/50",
      onClick: onOpenCategories || onOpenTemplates || (() => {}),
      title: "Manage Category Envelopes, Presets & Limits",
    },
    {
      id: "analytics",
      label: "Analytics",
      value: "Trends",
      icon: BarChart2,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgClass: "hover:border-purple-500/50",
      onClick: onOpenAnalytics || (() => {}),
      title: "Spending Breakdown, Cash Velocity & Visual Analytics",
    },
    {
      id: "budgets",
      label: "Budget",
      value: "Limits",
      icon: Target,
      iconColor: "text-emerald-600 dark:text-[#03D26F]",
      bgClass: "hover:border-[#03D26F]/50",
      onClick: onOpenBudgets || onOpenAllowances || (() => {}),
      title: "Monthly Category Envelopes, Limits & Daily Safe Pace",
    },
    {
      id: "subscriptions",
      label: "Subs",
      value: "Recurring",
      icon: Repeat,
      iconColor: "text-sky-600 dark:text-sky-400",
      bgClass: "hover:border-sky-500/50",
      onClick: onOpenSubscriptions || onOpenVault || (() => {}),
      title: "Active Subscriptions, Reminders & Recurring Billing",
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
