"use client";

import React, { useMemo } from "react";
import { type Transaction, type Category } from "@/types";
import { type DailyBudgetStats, type MonthlyBudgetStats } from "@/lib/utils/budget-rollover";
import { BelanjeTransactionRow } from "@/components/money/BelanjeTransactionRow";
import { soundFX } from "@/components/shared/SoundFX";
import {
  ChevronRight,
  Receipt,
  Plus,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Gauge,
} from "lucide-react";

interface RecentAccountFeedProps {
  activeCardIndex: number;
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  dailyStats: DailyBudgetStats;
  monthlyStats: MonthlyBudgetStats;
  onInspectTransaction: (tx: Transaction) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDuplicateTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onSeeAll: (method?: "upi" | "cash" | "all") => void;
  onAddTransaction: (method?: "upi" | "cash") => void;
  onOpenAllowances?: () => void;
}

export function RecentAccountFeed({
  activeCardIndex,
  transactions,
  categories,
  currencySymbol,
  dailyStats,
  monthlyStats,
  onInspectTransaction,
  onEditTransaction,
  onDuplicateTransaction,
  onDeleteTransaction,
  onSeeAll,
  onAddTransaction,
  onOpenAllowances,
}: RecentAccountFeedProps) {
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Determine current feed config based on active card in deck
  const feedConfig = useMemo(() => {
    switch (activeCardIndex) {
      case 1:
        return {
          title: "Recent · Cash Till",
          subtitle: "Pocket cash slips",
          filterMethod: "cash" as const,
          items: transactions
            .filter((t) => t.paymentMethod?.toLowerCase() === "cash")
            .slice(0, 3),
        };
      case 2:
        return {
          title: "Recent · Safe-to-Spend",
          subtitle: "Daily pace velocity",
          filterMethod: "all" as const,
          items: transactions
            .filter((t) => {
              const today = new Date().toISOString().slice(0, 10);
              return t.date === today;
            })
            .slice(0, 3),
        };
      case 3:
        return {
          title: "Account Limits & Allowances",
          subtitle: "Configured budgets",
          filterMethod: "all" as const,
          items: [],
        };
      case 0:
      default:
        return {
          title: "Recent · Main account",
          subtitle: "UPI & Digital Bank",
          filterMethod: "upi" as const,
          items: transactions
            .filter((t) => t.paymentMethod?.toLowerCase() !== "cash")
            .slice(0, 3),
        };
    }
  }, [activeCardIndex, transactions]);

  const handleSeeAllClick = () => {
    soundFX.playPop();
    onSeeAll(feedConfig.filterMethod);
  };

  return (
    <div className="bg-white dark:bg-[#1C1A18] rounded-2xl border border-[#E8E5DF] dark:border-[#383531] p-3.5 sm:p-4 space-y-3 shadow-xs transition-all">
      {/* ─── HEADER: Title + "See all >" (Belanje Photo 1 Benchmark) ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#161514] dark:bg-[#CEF431]" />
          <div>
            <h3 className="text-xs sm:text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight leading-tight">
              {feedConfig.title}
            </h3>
            <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] leading-none">
              {feedConfig.subtitle}
            </span>
          </div>
        </div>

        {activeCardIndex === 3 ? (
          <button
            type="button"
            onClick={onOpenAllowances}
            className="text-[11px] font-heading font-bold text-[#161514] dark:text-[#CEF431] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>Configure</span>
            <ChevronRight className="size-3" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSeeAllClick}
            className="text-[11px] font-heading font-bold text-[#161514] dark:text-[#CEF431] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>See all</span>
            <ChevronRight className="size-3" />
          </button>
        )}
      </div>

      {/* ─── CONTENT BODY: List of Belanje Squircles or Empty State or Card 3 Allowances ─── */}
      <div key={activeCardIndex} className="animate-in fade-in-50 duration-200">
        {activeCardIndex === 3 ? (
          /* Allowances Summary Card for Card 3 */
          <div className="space-y-2.5 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531]">
              <span className="text-[10px] font-mono uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">
                Main UPI Budget
              </span>
              <span className="text-sm font-mono font-bold text-[#161514] dark:text-[#FAF8F5]">
                {currencySymbol}{monthlyStats.totalAvailableUpiBudget.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531]">
              <span className="text-[10px] font-mono uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">
                Cash Till Budget
              </span>
              <span className="text-sm font-mono font-bold text-[#161514] dark:text-[#FAF8F5]">
                {currencySymbol}{monthlyStats.totalAvailableCashBudget.toLocaleString()}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAllowances}
            className="w-full py-2 rounded-xl bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] text-xs font-heading font-black flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <SlidersHorizontal className="size-3.5 stroke-[2]" />
            <span>Manage Budget Limits &amp; Rollovers</span>
          </button>
        </div>
      ) : activeCardIndex === 2 ? (
        /* Safe to Spend Spend Velocity Meter (Zero Duplicate Text) */
        <div className="space-y-2.5">
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <Gauge className="size-3.5 stroke-[2] text-[#6B6B6B] dark:text-[#A8A29E]" />
                <span className="font-heading font-bold text-[#161514] dark:text-[#FAF8F5]">
                  Today&apos;s Spend Velocity
                </span>
              </div>
              <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">
                {monthlyStats.daysRemainingInMonth} days left
              </span>
            </div>

            {/* Velocity Bar */}
            <div className="h-2 w-full bg-[#E8E5DF] dark:bg-[#383531] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  dailyStats.isOverDailyBudget
                    ? "bg-rose-500"
                    : dailyStats.todayUsedPercentage > 80
                    ? "bg-amber-400"
                    : "bg-[#03D26F]"
                }`}
                style={{ width: `${Math.min(100, Math.max(4, dailyStats.todayUsedPercentage))}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div>
                <span className="text-[9.5px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] block">Spent Today</span>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  -{currencySymbol}{dailyStats.todayExpense.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[9.5px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] block">Daily Target</span>
                <span className="text-xs font-mono font-bold text-[#161514] dark:text-[#FAF8F5] tabular-nums">
                  {currencySymbol}{dailyStats.dailyBudgetTarget.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[9.5px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] block">Headroom</span>
                <span className="text-xs font-mono font-bold text-[#047857] dark:text-[#03D26F] tabular-nums">
                  {currencySymbol}{dailyStats.todayRemaining.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {feedConfig.items.length > 0 ? (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-[#6B6B6B] dark:text-[#A8A29E] block px-0.5">
                Today&apos;s Activity:
              </span>
              {feedConfig.items.map((tx) => (
                <BelanjeTransactionRow
                  key={tx.id}
                  tx={tx}
                  category={categoryMap.get(tx.categoryId)}
                  currencySymbol={currencySymbol}
                  onInspect={onInspectTransaction}
                  onEdit={onEditTransaction}
                  onDuplicate={onDuplicateTransaction}
                  onDelete={onDeleteTransaction}
                  compact={true}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] text-center space-y-1.5">
              <span className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] block">
                No Spend Logged Today ⚡
              </span>
              <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E]">
                You have full headroom of {currencySymbol}{dailyStats.todayRemaining.toLocaleString()} available for today.
              </p>
            </div>
          )}
        </div>
      ) : feedConfig.items.length === 0 ? (
        /* Belanje Signature Empty State */
        <div className="bg-[#FAF8F5] dark:bg-[#252321] rounded-xl p-5 sm:p-6 text-center space-y-3 border border-dashed border-[#E8E5DF] dark:border-[#383531]">
          <div className="size-9 rounded-full bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-center mx-auto text-[#6B6B6B] dark:text-[#A8A29E]">
            <Receipt className="size-4 stroke-[1.8]" />
          </div>
          <div>
            <h4 className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
              No transactions for this account yet
            </h4>
            <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] max-w-xs mx-auto mt-0.5">
              Import old transactions or tap below to record your first transaction.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onAddTransaction(feedConfig.filterMethod === "cash" ? "cash" : "upi")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161514] text-white dark:bg-[#CEF431] dark:text-[#161514] text-xs font-heading font-black cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>+ Log Transaction</span>
          </button>
        </div>
      ) : (
        /* Render Belanje Squircles */
        <div className="space-y-1.5">
          {feedConfig.items.map((tx) => (
            <BelanjeTransactionRow
              key={tx.id}
              tx={tx}
              category={categoryMap.get(tx.categoryId)}
              currencySymbol={currencySymbol}
              onInspect={onInspectTransaction}
              onEdit={onEditTransaction}
              onDuplicate={onDuplicateTransaction}
              onDelete={onDeleteTransaction}
              compact={true}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
