"use client";

import { useRouter } from "next/navigation";
import { Tag, BarChart2, Target, Repeat } from "lucide-react";
import { DoorTileGrid, type DoorTileItem } from "@/components/shared/DoorTileGrid";

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
  onOpenCategories,
  onOpenAnalytics,
  onOpenBudgets,
  onOpenSubscriptions,
  className,
}: MoneyDoorTileRowProps) {
  const router = useRouter();

  const tiles: DoorTileItem[] = [
    {
      id: "categories",
      label: "Category",
      value: "Envelopes",
      icon: Tag,
      iconColorClass: "text-amber-500 dark:text-amber-400",
      bgClass: "hover:border-amber-500/50",
      onClick: onOpenCategories || (() => router.push("/money/categories")),
      title: "Category Envelopes, Presets & Limits (Dedicated Page)",
    },
    {
      id: "analytics",
      label: "Analytics",
      value: "Trends",
      icon: BarChart2,
      iconColorClass: "text-purple-600 dark:text-purple-400",
      bgClass: "hover:border-purple-500/50",
      onClick: onOpenAnalytics || (() => router.push("/money/analytics")),
      title: "Spending Breakdown, Cash Velocity & Analytics (Dedicated Page)",
    },
    {
      id: "budgets",
      label: "Budget",
      value: "Limits",
      icon: Target,
      iconColorClass: "text-emerald-600 dark:text-[#03D26F]",
      bgClass: "hover:border-[#03D26F]/50",
      onClick: onOpenBudgets || (() => router.push("/money/budgets")),
      title: "Monthly Allowances, Safe Daily Pace & Caps (Dedicated Page)",
    },
    {
      id: "subscriptions",
      label: "Subs",
      value: "Recurring",
      icon: Repeat,
      iconColorClass: "text-sky-600 dark:text-sky-400",
      bgClass: "hover:border-sky-500/50",
      onClick: onOpenSubscriptions || (() => router.push("/money/subscriptions")),
      title: "Active Subscriptions & Recurring Bills (Dedicated Page)",
    },
  ];

  return <DoorTileGrid tiles={tiles} className={className} />;
}
