"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type Transaction, type Category } from "@/types";
import { cn } from "@/lib/utils";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { Search, Filter, FileDown, Plus, Calendar, Receipt, X, ArrowRightLeft, Edit2, Sparkles } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { BelanjeTransactionRow } from "@/components/money/BelanjeTransactionRow";
import { CategoryChipFilterRail, type CategoryRailItem } from "@/components/money/CategoryChipFilterRail";
import { CategoryIcon, getCategoryAccent } from "@/components/money/MoneyQuickActionsAndCards";
import { isCashTransaction, isOnlineTransaction, type MonthlyBudgetStats } from "@/lib/utils/budget-rollover";
import { useAddTransaction } from "@/lib/queries/money";
import { computeFrequentExpenses, type FrequentExpenseItem } from "@/lib/utils/frequent-expenses";
import { toast } from "sonner";
import { NumberTicker } from "@/components/ui/number-ticker";
import { TelemetryMarquee } from "@/components/ui/telemetry-marquee";
import { StrobiCompanion } from "@/components/mascot/StrobiCompanion";

interface LedgerTabViewProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  targetMonthKey?: string;
  monthlyStats?: MonthlyBudgetStats;
  initialMethodFilter?: string;
  methodFilterTrigger?: number;
  selectedMonth?: string;
  onSelectMonth?: (monthKey: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  onInspectTransaction: (tx: Transaction) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDuplicateTransaction: (tx: Transaction) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onOpenExportModal: () => void;
  onOpenAddTransaction: () => void;
  onMoveMoney?: () => void;
  onSendMoney?: () => void;
  onBulkAddExpense?: () => void;
  onAddCategory?: () => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
  categoryCardsData?: CategoryRailItem[];
}

export function LedgerTabView({
  transactions,
  categories,
  currencySymbol,
  targetMonthKey,
  monthlyStats,
  initialMethodFilter,
  methodFilterTrigger,
  selectedMonth: selectedMonthProp,
  onSelectMonth,
  selectedCategory: selectedCategoryProp,
  onSelectCategory,
  onInspectTransaction,
  onEditTransaction,
  onDuplicateTransaction,
  onDeleteTransaction,
  onOpenExportModal,
  onOpenAddTransaction,
  onMoveMoney,
  onSendMoney,
  onBulkAddExpense,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  categoryCardsData,
}: LedgerTabViewProps) {
  const activeMonthKey = targetMonthKey || format(new Date(), "yyyy-MM");
  // Retain filter and search state across tab navigations via sessionStorage
  const [internalSelectedMonth, setInternalSelectedMonth] = useState<string>(() => {
    if (selectedMonthProp !== undefined) return selectedMonthProp;
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("invictus_ledger_month");
      if (cached) return cached;
    }
    return activeMonthKey;
  });

  const selectedMonth = selectedMonthProp !== undefined ? selectedMonthProp : internalSelectedMonth;
  const setSelectedMonth = (val: string) => {
    setInternalSelectedMonth(val);
    onSelectMonth?.(val);
  };

  useEffect(() => {
    if (selectedMonthProp !== undefined && selectedMonthProp !== internalSelectedMonth) {
      setInternalSelectedMonth(selectedMonthProp);
    }
  }, [selectedMonthProp, internalSelectedMonth]);
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("invictus_ledger_search") || "";
    }
    return "";
  });
  const [internalSelectedCategory, setInternalSelectedCategory] = useState<string>(() => {
    if (selectedCategoryProp !== undefined) return selectedCategoryProp;
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("invictus_ledger_category") || "all";
    }
    return "all";
  });

  const selectedCategory = selectedCategoryProp !== undefined ? selectedCategoryProp : internalSelectedCategory;
  const setSelectedCategory = (val: string) => {
    setInternalSelectedCategory(val);
    onSelectCategory?.(val);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("invictus_ledger_category", val);
    }
  };

  useEffect(() => {
    if (selectedCategoryProp !== undefined && selectedCategoryProp !== internalSelectedCategory) {
      setInternalSelectedCategory(selectedCategoryProp);
    }
  }, [selectedCategoryProp, internalSelectedCategory]);
  const [selectedType, setSelectedType] = useState<"all" | "expense" | "income">(() => {
    if (typeof window !== "undefined") {
      return (sessionStorage.getItem("invictus_ledger_type") as any) || "all";
    }
    return "all";
  });
  const [selectedMethod, setSelectedMethod] = useState<string>(() => {
    if (initialMethodFilter) return initialMethodFilter;
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("invictus_ledger_method") || "all";
    }
    return "all";
  });

  // Persist filter values to sessionStorage whenever updated
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("invictus_ledger_month", selectedMonth);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("invictus_ledger_search", searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("invictus_ledger_category", selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("invictus_ledger_type", selectedType);
    }
  }, [selectedType]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("invictus_ledger_method", selectedMethod);
    }
  }, [selectedMethod]);


  useEffect(() => {
    if (initialMethodFilter) {
      setSelectedMethod(initialMethodFilter);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("invictus_ledger_method", initialMethodFilter);
      }
    }
  }, [initialMethodFilter, methodFilterTrigger]);

  const handleResetFilters = () => {
    soundFX.playPop();
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedType("all");
    setSelectedMethod("all");
    setSelectedMonth(activeMonthKey);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("invictus_ledger_search");
      sessionStorage.removeItem("invictus_ledger_category");
      sessionStorage.removeItem("invictus_ledger_type");
      sessionStorage.removeItem("invictus_ledger_method");
      sessionStorage.removeItem("invictus_ledger_month");
    }
  };

  const addTxMutation = useAddTransaction();
  const [isQuickLogging, setIsQuickLogging] = useState(false);

  // Dynamic Habit Mining: Computes genuine user frequent habits or starter suggestions
  const frequentHabits = useMemo(() => {
    return computeFrequentExpenses(transactions, categories, 5);
  }, [transactions, categories]);

  const handleQuickLogExpense = async (item: FrequentExpenseItem) => {
    try {
      setIsQuickLogging(true);
      const targetCat =
        categories.find((c) => c.id === item.categoryId) ||
        categories.find(
          (c) =>
            c.type === "expense" &&
            (c.name.toLowerCase().includes(item.categoryName.toLowerCase()) ||
              c.name.toLowerCase().includes(item.name.toLowerCase()))
        ) ||
        categories.find((c) => c.type === "expense") ||
        categories[0];

      const res = await addTxMutation.mutateAsync({
        amount: item.amount,
        type: "expense",
        categoryId: targetCat?.id || "general",
        date: format(new Date(), "yyyy-MM-dd"),
        note: item.name,
        paymentMethod: item.paymentMethod || "upi",
      } as any);

      const newId = (res as any)?.id || (res as any)?._id;
      soundFX.playCompleteChime();
      soundFX.vibrate(20);
      toast.success(
        `Logged ${currencySymbol}${item.amount} for ${item.name}! ⚡`,
        {
          action: newId && onDeleteTransaction
            ? {
                label: "Undo",
                onClick: () => {
                  onDeleteTransaction(newId);
                },
              }
            : undefined,
        }
      );
    } catch {
      toast.error("Failed to log quick expense");
    } finally {
      setIsQuickLogging(false);
    }
  };

  const isFilterActive =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedType !== "all" ||
    selectedMethod !== "all" ||
    selectedMonth !== activeMonthKey;

  // Extract all available months from recorded transactions plus current month
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    const currentCalMonth = format(new Date(), "yyyy-MM");
    monthsSet.add(currentCalMonth);
    if (targetMonthKey) monthsSet.add(targetMonthKey);

    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        monthsSet.add(tx.date.slice(0, 7));
      }
    });

    return Array.from(monthsSet)
      .sort((a, b) => b.localeCompare(a))
      .map((m) => {
        let label = m;
        try {
          label = format(parseISO(`${m}-01`), "MMMM yyyy");
        } catch {}
        return {
          key: m,
          label,
          isCurrent: m === currentCalMonth,
        };
      });
  }, [transactions, targetMonthKey]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedMonth !== "all" && !tx.date?.startsWith(selectedMonth)) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noteMatch = tx.note?.toLowerCase().includes(q);
        const cat = categoryMap.get(tx.categoryId);
        const catMatch = cat?.name.toLowerCase().includes(q);
        if (!noteMatch && !catMatch) return false;
      }

      if (selectedCategory !== "all" && tx.categoryId !== selectedCategory) {
        return false;
      }

      if (selectedType !== "all" && tx.type !== selectedType) {
        return false;
      }

      if (selectedMethod !== "all") {
        if (selectedMethod === "cash" && !isCashTransaction(tx.paymentMethod)) return false;
        if (selectedMethod === "upi" && !isOnlineTransaction(tx.paymentMethod)) return false;
      }

      return true;
    });
  }, [transactions, selectedMonth, searchQuery, selectedCategory, selectedType, selectedMethod, categoryMap]);

  // Group transactions by date
  const groupedByDate = useMemo(() => {
    const groups: { dateKey: string; label: string; items: Transaction[] }[] = [];
    const dateMap = new Map<string, Transaction[]>();

    filteredTransactions.forEach((tx) => {
      const d = tx.date || "Unknown";
      if (!dateMap.has(d)) {
        dateMap.set(d, []);
      }
      dateMap.get(d)!.push(tx);
    });

    Array.from(dateMap.keys())
      .sort((a, b) => b.localeCompare(a))
      .forEach((d) => {
        let label = d;
        try {
          const parsed = parseISO(d);
          if (isToday(parsed)) label = "Today";
          else if (isYesterday(parsed)) label = "Yesterday";
          else label = format(parsed, "EEEE, MMMM d");
        } catch {}

        groups.push({
          dateKey: d,
          label,
          items: dateMap.get(d)!,
        });
      });

    return groups;
  }, [filteredTransactions]);

  const listRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: groupedByDate.length,
    getScrollElement: () => listRef.current,
    estimateSize: useCallback(
      (index: number) => {
        const group = groupedByDate[index];
        return 34 + (group?.items.length || 1) * 74 + 16;
      },
      [groupedByDate]
    ),
    overscan: 4,
  });

  const selectedMonthSummary = useMemo(() => {
    let expense = 0;
    let income = 0;
    filteredTransactions.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      if (tx.type === "expense") expense += amt;
      else if (tx.type === "income") income += amt;
    });
    return { expense, income, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const activeCategory = useMemo(() => {
    if (!selectedCategory || selectedCategory === "all") return null;
    return categories.find((c) => c.id === selectedCategory) || null;
  }, [categories, selectedCategory]);

  const activeCategoryStats = useMemo(() => {
    if (!activeCategory) return null;
    const targetMonth = selectedMonth === "all" ? activeMonthKey : selectedMonth;
    const spentThisMonth = transactions.reduce((sum, tx) => {
      if (
        tx.type === "expense" &&
        tx.categoryId === activeCategory.id &&
        tx.date?.startsWith(targetMonth)
      ) {
        return sum + Number(tx.amount || 0);
      }
      return sum;
    }, 0);

    const budget = activeCategory.monthlyBudget || 0;
    const remainingBudget = Math.max(0, budget - spentThisMonth);
    const percentUsed = budget > 0 ? Math.min(100, Math.round((spentThisMonth / budget) * 100)) : 0;
    const isOverBudget = budget > 0 && spentThisMonth > budget;

    // Remaining days in current month for pace calculation
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(1, lastDay - now.getDate() + 1);
    const safeDailyPace = remainingBudget > 0 ? Math.round(remainingBudget / daysRemaining) : 0;

    return {
      spentThisMonth,
      budget,
      remainingBudget,
      percentUsed,
      isOverBudget,
      safeDailyPace,
      daysRemaining,
    };
  }, [activeCategory, transactions, selectedMonth, activeMonthKey]);

  // Computed category cards data for the scoped rail
  const computedCategoryCardsData: CategoryRailItem[] = useMemo(() => {
    if (categoryCardsData) return categoryCardsData;

    const map = new Map<string, number>();
    const targetMonth = selectedMonth === "all" ? activeMonthKey : selectedMonth;
    transactions.forEach((tx) => {
      if (tx.type === "expense" && tx.date?.startsWith(targetMonth)) {
        const curr = map.get(tx.categoryId) || 0;
        map.set(tx.categoryId, curr + Number(tx.amount || 0));
      }
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      amount: map.get(cat.id) || 0,
      color: cat.color || "mint",
      icon: cat.icon || "Wallet",
      type: cat.type,
      monthlyBudget: cat.monthlyBudget,
    }));
  }, [categoryCardsData, categories, transactions, selectedMonth, activeMonthKey]);

  return (
    <div id="money-ledger-view" className="space-y-4 scroll-mt-24">
      {/* 🏷️ CATEGORY ENVELOPES CHIP RAIL (Contextually Scoped to Ledger) */}
      <CategoryChipFilterRail
        currencySymbol={currencySymbol}
        categories={computedCategoryCardsData}
        selectedCategoryId={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onMoveMoney={onMoveMoney}
        onSendMoney={onSendMoney}
        onBulkAddExpense={onBulkAddExpense}
        onAddCategory={onAddCategory}
        onEditCategory={onEditCategory}
        onDeleteCategory={onDeleteCategory}
      />

      {/* 🏷️ ENVELOPE STUDIO PAGE-IN-PAGE (Belanje In-Situ Benchmark) */}
      {activeCategory && activeCategoryStats && (
        <div className="bg-white dark:bg-[#161514] rounded-3xl p-4 sm:p-5 border-2 border-[#161514] dark:border-[#383531] shadow-[2.5px_2.5px_0px_0px_#161514] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="size-12 rounded-2xl flex items-center justify-center border border-[#161514] text-[#161514] shrink-0 shadow-[1.5px_1.5px_0px_0px_#161514]"
                style={{ backgroundColor: getCategoryAccent(activeCategory) }}
              >
                <CategoryIcon name={activeCategory.icon} className="size-6 stroke-[2]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-black text-base sm:text-lg text-[#161514] dark:text-[#FAF8F5] truncate">
                    {activeCategory.name}
                  </h3>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] text-[#6B6B6B] dark:text-[#A8A29E]">
                    Envelope Studio
                  </span>
                </div>
                <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5">
                  {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? "" : "s"} logged in this envelope
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {onMoveMoney && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    onMoveMoney();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2E2B28] text-[#161514] dark:text-[#FAF8F5] text-xs font-heading font-bold border border-[#E8E5DF] dark:border-[#383531] shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  title="Move money between envelopes"
                >
                  <ArrowRightLeft className="size-3.5 stroke-[2]" />
                  <span>Move Funds</span>
                </button>
              )}

              {onEditCategory && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    onEditCategory(activeCategory);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2E2B28] text-[#161514] dark:text-[#FAF8F5] text-xs font-heading font-bold border border-[#E8E5DF] dark:border-[#383531] shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  title="Edit category envelope"
                >
                  <Edit2 className="size-3.5 stroke-[2]" />
                  <span>Edit Cap</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setSelectedCategory("all");
                }}
                className="px-3 py-1.5 rounded-xl bg-[#161514] text-white dark:bg-[#CEF431] dark:text-[#161514] text-xs font-heading font-black border border-[#161514] dark:border-[#CEF431] shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                title="Return to global ledger"
              >
                <X className="size-3.5 stroke-[2.5]" />
                <span>All Envelopes</span>
              </button>
            </div>
          </div>

          {/* Budget & Daily Pace Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531]">
              <span className="text-[10px] font-mono uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">
                Spent This Month
              </span>
              <span className="text-sm sm:text-base font-mono font-black text-rose-600 dark:text-rose-400 tabular-nums mt-0.5 block">
                {currencySymbol}{Math.round(activeCategoryStats.spentThisMonth).toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531]">
              <span className="text-[10px] font-mono uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">
                Monthly Envelope Cap
              </span>
              <span className="text-sm sm:text-base font-mono font-black text-[#161514] dark:text-[#FAF8F5] tabular-nums mt-0.5 block">
                {activeCategoryStats.budget > 0 ? `${currencySymbol}${activeCategoryStats.budget.toLocaleString()}` : "No Limit"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531]">
              <span className="text-[10px] font-mono uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">
                Remaining Cap
              </span>
              <span
                className={cn(
                  "text-sm sm:text-base font-mono font-black tabular-nums mt-0.5 block",
                  activeCategoryStats.isOverBudget
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-[#047857] dark:text-[#03D26F]"
                )}
              >
                {activeCategoryStats.budget > 0
                  ? activeCategoryStats.isOverBudget
                    ? `Over by ${currencySymbol}${Math.round(activeCategoryStats.spentThisMonth - activeCategoryStats.budget).toLocaleString()}`
                    : `${currencySymbol}${Math.round(activeCategoryStats.remainingBudget).toLocaleString()}`
                  : "N/A"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531]">
              <span className="text-[10px] font-mono uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">
                Safe Daily Pace
              </span>
              <span className="text-sm sm:text-base font-mono font-black text-amber-700 dark:text-amber-400 tabular-nums mt-0.5 block">
                {activeCategoryStats.budget > 0 && !activeCategoryStats.isOverBudget
                  ? `${currencySymbol}${activeCategoryStats.safeDailyPace}/day`
                  : "—"}
              </span>
            </div>
          </div>

          {/* Budget Progress Bar */}
          {activeCategoryStats.budget > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="font-bold text-[#6B6B6B] dark:text-[#A8A29E]">
                  Envelope Consumption
                </span>
                <span
                  className={cn(
                    "font-black",
                    activeCategoryStats.isOverBudget
                      ? "text-rose-600 dark:text-rose-400"
                      : activeCategoryStats.percentUsed > 80
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-[#047857] dark:text-[#03D26F]"
                  )}
                >
                  {activeCategoryStats.percentUsed}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#161514] overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    activeCategoryStats.isOverBudget
                      ? "bg-rose-500"
                      : activeCategoryStats.percentUsed > 80
                      ? "bg-amber-400"
                      : "bg-[#03D26F]"
                  )}
                  style={{ width: `${Math.min(100, activeCategoryStats.percentUsed)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔍 Search & Filters Bar */}
      <div className="bg-white dark:bg-[#1C1A18] p-4 rounded-xl border border-[#E8E5DF] dark:border-[#383531] space-y-3">
        <div className="flex flex-row gap-2 items-center justify-between">
          {/* Search Input with 1-Tap Clear */}
          <div className="relative flex-1">
            <Search className="size-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by merchant, note, or category…"
              className="w-full bg-[#FAF8F5] dark:bg-[#252321] pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#161514] dark:focus:ring-[#CEF431] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#8C8882] cursor-pointer"
                title="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* PDF Export Button (Compact on mobile, full on desktop) */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] font-semibold text-xs py-2 px-3 rounded-xl border border-[#E8E5DF] dark:border-[#383531] transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95"
            title="Export monthly statement PDF"
          >
            <FileDown className="size-3.5 stroke-[2]" />
            <span className="hidden sm:inline">Export Statement</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E8E5DF] dark:border-[#383531]">
          <div className="flex items-center gap-1 text-xs font-medium text-[#6B6B6B] dark:text-[#A8A29E] mr-1">
            <Filter className="size-3 stroke-[1.5]" />
            <span>Filter:</span>
          </div>

          {/* Dedicated Month Filter Dropdown */}
          <div className="w-auto min-w-[140px]">
            <NeobrutalistSelect
              size="sm"
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={[
                { value: "all", label: "All Months", icon: "Calendar" },
                ...availableMonths.map((m) => ({
                  value: m.key,
                  label: m.label,
                  badge: m.isCurrent ? "Current" : undefined,
                  icon: "Calendar",
                })),
              ]}
              placeholder="Select month"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-0.5 bg-[#F1EFEA] dark:bg-[#252321] p-0.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531]">
            {(["all", "expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer",
                  selectedType === t
                    ? "bg-white dark:bg-[#161514] text-[#161514] dark:text-[#FAF8F5] shadow-sm font-semibold"
                    : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Payment Method Filter */}
          <div className="flex gap-0.5 bg-[#F1EFEA] dark:bg-[#252321] p-0.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531]">
            {[
              { id: "all", label: "All Modes" },
              { id: "upi", label: "UPI" },
              { id: "cash", label: "Cash" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMethod(m.id)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer",
                  selectedMethod === m.id
                    ? "bg-white dark:bg-[#161514] text-[#161514] dark:text-[#FAF8F5] shadow-sm font-semibold"
                    : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown Filter */}
          <div className="w-auto min-w-[160px]">
            <NeobrutalistSelect
              size="sm"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={[
                { value: "all", label: "All Categories", icon: "Tag" },
                ...categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                  icon: c.icon,
                })),
              ]}
              placeholder="All Categories"
            />
          </div>

          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 px-2 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              title="Reset all search queries and filters to defaults"
            >
              <X className="size-3 stroke-[2]" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Statement Summary Strip */}
      <div className="bg-[#F1EFEA] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] rounded-lg px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="size-3.5 stroke-[1.5] text-[#161514] dark:text-[#FAF8F5]" />
          <span className="text-[#161514] dark:text-[#FAF8F5] font-medium">
            Statement for <strong className="font-semibold">{selectedMonth === "all" ? "All Time" : (availableMonths.find((m) => m.key === selectedMonth)?.label || selectedMonth)}</strong>
          </span>
        </div>
        <span className="text-xs font-mono font-medium text-[#6B6B6B] dark:text-[#A8A29E] tabular-nums flex items-center gap-1">
          <NumberTicker value={selectedMonthSummary.count} duration={250} /> {selectedMonthSummary.count === 1 ? "record" : "records"} • Spent: <NumberTicker value={selectedMonthSummary.expense} prefix={currencySymbol} duration={250} />
        </span>
      </div>

      {/* Real-time Ledger Telemetry Marquee Tape */}
      <TelemetryMarquee
        items={[
          "SAFE DAILY PACE: " + currencySymbol + (activeCategoryStats?.safeDailyPace ?? 350) + "/DAY",
          "CASH TILL & DIGITAL UPI BALANCED",
          "0 UNRECONCILED TRANSACTIONS",
          "ENVELOPE DISCIPLINE ACTIVE",
          "AIR-GAPPED ON-DEVICE ML CATEGORIZATION READY",
        ]}
        className="rounded-lg border-2 border-[#161514] dark:border-[#383531] shadow-2xs"
        speed={28}
      />

      {/* TRANSACTION FEED LIST */}
      {groupedByDate.length === 0 ? (
        transactions.length === 0 ? (
          /* ─── ZERO-CONFUSION FIRST-RUN ONBOARDING COCKPIT ─── */
          <div className="bg-white dark:bg-[#161514] rounded-2xl p-5 sm:p-7 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="size-14 shrink-0 flex items-center justify-center p-1 rounded-2xl bg-[#FAF8F5] dark:bg-[#201E1B] border-2 border-[#161514] dark:border-[#383531] shadow-xs">
                  <StrobiCompanion size={52} gear="money" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#03D26F] animate-pulse" />
                    <h4 className="text-sm font-heading font-black text-[#161514] dark:text-stone-100 uppercase tracking-wider">
                      Start Your Financial Ledger 💳
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 font-bold">
                      1-TAP QUICK LOG
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] max-w-lg leading-relaxed">
                    Your ledger tracks every rupee across digital UPI and cash till envelopes. Tap any common student daily expense below to record your first transaction instantly.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenAddTransaction}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161514] text-white hover:bg-[#2A2826] dark:bg-white dark:text-[#161514] dark:hover:bg-stone-200 text-xs font-heading font-black shadow-xs cursor-pointer transition-all self-start sm:self-auto shrink-0"
              >
                <Plus className="size-3.5 stroke-[2.2]" />
                <span>+ Custom Transaction</span>
              </button>
            </div>

            {/* Quick 1-Tap Frequent Habits / Expenses */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] flex items-center gap-1">
                  <Sparkles className="size-3 text-[#03D26F]" />
                  <span>
                    {frequentHabits.some((h) => h.isHabit)
                      ? "Frequent Habits (Learned from your history):"
                      : "Quick Log Common Student Expenses:"}
                  </span>
                </span>
                {frequentHabits.some((h) => h.isHabit) && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#CEF431] text-[#161514]">
                    Auto-Mined
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {frequentHabits.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleQuickLogExpense(item)}
                    disabled={isQuickLogging}
                    className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-white dark:hover:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] hover:border-[#161514]/40 hover:shadow-xs transition-all text-left cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg block">{item.icon}</span>
                        {item.isHabit && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#161514]/10 dark:bg-white/15 text-inherit">
                            {item.frequency}x
                          </span>
                        )}
                      </div>
                      <h5 className="font-heading font-black text-xs text-[#161514] dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {item.name}
                      </h5>
                      <span className="text-[9px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                        {item.paymentMethod.toUpperCase()} • {item.categoryName}
                      </span>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-[#E8E5DF]/60 dark:border-[#2A2724] flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-[#161514] dark:text-stone-200">{currencySymbol}{item.amount}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 text-[10px] group-hover:translate-x-0.5 transition-transform">+ Log</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active Filter Empty State */
          <div className="bg-white dark:bg-[#161514] rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] p-8 text-center space-y-3 shadow-xs">
            <div className="size-10 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center mx-auto text-[#161514] dark:text-stone-200">
              <Receipt className="size-5 stroke-[1.5]" />
            </div>
            <span className="text-sm font-semibold text-[#161514] dark:text-stone-100 block">No Matching Records</span>
            <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] max-w-sm mx-auto">
              No transactions match your active query or filters. Clear your search or change the month selector.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 bg-[#161514] hover:bg-[#2A2826] dark:bg-white dark:text-[#161514] dark:hover:bg-stone-200 text-white font-medium text-xs px-3.5 py-2 rounded-xl border border-[#161514] cursor-pointer transition-colors"
            >
              <X className="size-3.5 stroke-[2]" />
              <span>Reset Filters</span>
            </button>
          </div>
        )
      ) : (
        <div
          ref={listRef}
          className="max-h-[750px] overflow-y-auto pr-1 select-none scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const group = groupedByDate[virtualRow.index];
              if (!group) return null;
              return (
                <div
                  key={group.dateKey}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="pb-4"
                >
                  <div className="space-y-2">
                    {/* Date Group Header */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-mono font-medium text-[#161514] dark:text-[#FAF8F5] bg-[#F1EFEA] dark:bg-[#252321] px-2.5 py-0.5 rounded-md border border-[#E8E5DF] dark:border-[#383531]">
                        {group.label}
                      </span>
                      <span className="text-xs font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                        {group.items.length} record{group.items.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {/* Transactions in Date Group (Belanje Squircle Rows) */}
                    <div className="space-y-2">
                      {group.items.map((tx) => (
                        <BelanjeTransactionRow
                          key={tx.id}
                          tx={tx}
                          category={categoryMap.get(tx.categoryId)}
                          currencySymbol={currencySymbol}
                          onInspect={onInspectTransaction}
                          onEdit={onEditTransaction}
                          onDuplicate={onDuplicateTransaction}
                          onDelete={onDeleteTransaction}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
