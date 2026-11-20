"use client";

import { ReceiptText, BarChart2, Target, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface MoneyDoorTileRowProps {
  monthlyBudget?: number;
  activeIouCount?: number;
  currencySymbol?: string;
  onOpenLedger?: () => void;
  onOpenAnalytics?: () => void;
  onOpenReceipts?: () => void;
  onOpenCalc?: () => void;
  // Legacy / fallback props
  onOpenBudgets?: () => void;
  onOpenIncome?: () => void;
  onOpenVault?: () => void;
  onOpenIous?: () => void;
  onOpenAllowances?: () => void;
  onMoveMoney?: () => void;
  onOpenTemplates?: () => void;
  onOpenExport?: () => void;
  className?: string;
}

export function MoneyDoorTileRow({
  monthlyBudget,
  activeIouCount = 0,
  currencySymbol = "₹",
  onOpenLedger,
  onOpenAnalytics,
  onOpenReceipts,
  onOpenCalc,
  onOpenBudgets,
  onOpenIncome,
  onOpenVault,
  onOpenIous,
  onOpenAllowances,
  onMoveMoney,
  onOpenTemplates,
  onOpenExport,
  className,
}: MoneyDoorTileRowProps) {
  const tiles = [
    {
      id: "budgets",
      label: "Budgets",
      value: "Limits",
      icon: Target,
      iconColor: "text-emerald-600 dark:text-[#03D26F]",
      bgClass: "hover:border-[#03D26F]/50",
      onClick: onOpenBudgets || onOpenAllowances || (() => {}),
      title: "Monthly Category Envelopes, Limits & Allowances (L2 Subpage)",
    },
    {
      id: "analytics",
      label: "Analytics",
      value: "Flow",
      icon: BarChart2,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgClass: "hover:border-purple-500/50",
      onClick: onOpenAnalytics || (() => {}),
      title: "Spending Breakdown & Visual Analytics (L2 Subpage)",
    },
    {
      id: "ledger",
      label: "Ledger",
      value: "Records",
      icon: ReceiptText,
      iconColor: "text-sky-600 dark:text-sky-400",
      bgClass: "hover:border-sky-500/50",
      onClick: onOpenLedger || onOpenExport || (() => {}),
      title: "Full Transaction Ledger & Search (L3 Bottom Sheet)",
    },
    {
      id: "vault",
      label: "Vault",
      value: "Reserve",
      icon: PiggyBank,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgClass: "hover:border-amber-500/50",
      onClick: onOpenVault || onOpenIous || onOpenCalc || (() => {}),
      title: "Active Subscriptions, Savings Goals & Emergency Reserves (L2 Subpage)",
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
