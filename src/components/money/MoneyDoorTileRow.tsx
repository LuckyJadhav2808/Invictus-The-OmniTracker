"use client";

import React from "react";
import { PiggyBank, Users, ShieldCheck, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface MoneyDoorTileRowProps {
  monthlyBudget?: number;
  activeIouCount?: number;
  currencySymbol?: string;
  onOpenBudgets?: () => void;
  onOpenIous?: () => void;
  onOpenVault?: () => void;
  onOpenLedger?: () => void;
  // Legacy compatibility props
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
  onOpenBudgets,
  onOpenIous,
  onOpenVault,
  onOpenLedger,
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
      value: monthlyBudget ? `${currencySymbol}${Math.round(monthlyBudget).toLocaleString()}` : "Envelopes",
      icon: PiggyBank,
      iconColor: "text-emerald-600 dark:text-[#03D26F]",
      bgClass: "hover:border-[#03D26F]/50",
      onClick: onOpenBudgets || onOpenAllowances || (() => {}),
      title: "Category Envelopes & Monthly Spend Limits",
    },
    {
      id: "ious",
      label: "IOUs",
      value: activeIouCount > 0 ? `${activeIouCount} Active` : "Split & Debts",
      icon: Users,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgClass: "hover:border-amber-500/50",
      onClick: onOpenIous || onMoveMoney || (() => {}),
      title: "Who Owes Who & Group Expense Splits",
    },
    {
      id: "vault",
      label: "Vault",
      value: "Emergency",
      icon: ShieldCheck,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgClass: "hover:border-purple-500/50",
      onClick: onOpenVault || onOpenTemplates || (() => {}),
      title: "Emergency Savings & Liquidity Vault",
    },
    {
      id: "ledger",
      label: "Ledger",
      value: "All Records",
      icon: ReceiptText,
      iconColor: "text-sky-600 dark:text-sky-400",
      bgClass: "hover:border-sky-500/50",
      onClick: onOpenLedger || onOpenExport || (() => {}),
      title: "Full Transaction Ledger & Search",
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
