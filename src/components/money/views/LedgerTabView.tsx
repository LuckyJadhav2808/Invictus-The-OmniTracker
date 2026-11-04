"use client";

import React, { useState, useMemo, useEffect } from "react";
import { type Transaction, type Category } from "@/types";
import { cn } from "@/lib/utils";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { Search, Filter, FileDown, Plus, Copy, Edit2, Trash2, Calendar, Zap, Smartphone, Banknote, Globe, Receipt, X } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { CategoryIcon, MoneyQuickActionsAndCards } from "@/components/money/MoneyQuickActionsAndCards";
import { isCashTransaction, isOnlineTransaction, type MonthlyBudgetStats } from "@/lib/utils/budget-rollover";
import { useAddTransaction } from "@/lib/queries/money";
import { toast } from "sonner";

interface LedgerTabViewProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  targetMonthKey?: string;
  monthlyStats?: MonthlyBudgetStats;
  initialMethodFilter?: string;
  selectedMonth?: string;
  onSelectMonth?: (monthKey: string) => void;
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
}

export function LedgerTabView({
  transactions,
  categories,
  currencySymbol,
  targetMonthKey,
  monthlyStats,
  initialMethodFilter,
  selectedMonth: selectedMonthProp,
  onSelectMonth,
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
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("invictus_ledger_category") || "all";
    }
    return "all";
  });
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
  }, [initialMethodFilter]);

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

  const handleQuickLogExpense = async (item: { name: string; amount: number; method: string; cat: string }) => {
    try {
      setIsQuickLogging(true);
      const targetCat = categories.find((c) =>
        c.type === "expense" && (
          c.name.toLowerCase().includes(item.cat.toLowerCase()) ||
          c.name.toLowerCase().includes(item.name.toLowerCase())
        )
      ) || categories.find((c) => c.type === "expense") || categories[0];

      await addTxMutation.mutateAsync({
        amount: item.amount,
        type: "expense",
        categoryId: targetCat?.id || "general",
        date: format(new Date(), "yyyy-MM-dd"),
        note: item.name,
        paymentMethod: item.method,
      } as any);

      soundFX.playCompleteChime();
      soundFX.vibrate(20);
      toast.success(`Logged ${currencySymbol}${item.amount} for ${item.name}! ⚡`);
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

  const effectiveCategoryMonthKey = selectedMonth === "all" ? activeMonthKey : selectedMonth;
  const categoryCardsData = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      if (tx.type === "expense" && tx.date?.startsWith(effectiveCategoryMonthKey)) {
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
  }, [categories, transactions, effectiveCategoryMonthKey]);

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

  return (
    <div className="space-y-4">
      {/* 💳 CATEGORY WALLETS CAROUSEL & QUICK ACTIONS DOCK */}
      <MoneyQuickActionsAndCards
        currencySymbol={currencySymbol}
        categories={categoryCardsData}
        selectedCategoryId={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onAddTransaction={onOpenAddTransaction}
        onMoveMoney={onMoveMoney}
        onSendMoney={onSendMoney}
        onBulkAddExpense={onBulkAddExpense}
        onAddCategory={onAddCategory}
        onEditCategory={onEditCategory}
        onDeleteCategory={onDeleteCategory}
      />

      {/* 🔍 Search & Filters Bar */}
      <div className="bg-white dark:bg-[#1C1A18] p-4 rounded-xl border border-[#E8E5DF] dark:border-[#383531] space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="size-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by merchant, note, or category…"
              className="w-full bg-white dark:bg-[#252321] pl-9 pr-3 py-2 text-xs font-medium rounded-lg border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#161514] dark:focus:ring-[#CEF431]"
            />
          </div>

          {/* PDF Export Button */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] font-medium text-xs py-2 px-3 rounded-lg border border-[#E8E5DF] dark:border-[#383531] transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <FileDown className="size-3.5 stroke-[1.5]" />
            <span>Export Statement</span>
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
        <span className="text-xs font-mono font-medium text-[#6B6B6B] dark:text-[#A8A29E] tabular-nums">
          {selectedMonthSummary.count} {selectedMonthSummary.count === 1 ? "record" : "records"} • Spent: {currencySymbol}{selectedMonthSummary.expense.toLocaleString()}
        </span>
      </div>

      {/* TRANSACTION FEED LIST */}
      {groupedByDate.length === 0 ? (
        transactions.length === 0 ? (
          /* ─── ZERO-CONFUSION FIRST-RUN ONBOARDING COCKPIT ─── */
          <div className="bg-white dark:bg-[#161514] rounded-2xl p-6 sm:p-8 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

              <button
                type="button"
                onClick={onOpenAddTransaction}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161514] text-white hover:bg-[#2A2826] dark:bg-white dark:text-[#161514] dark:hover:bg-stone-200 text-xs font-heading font-black shadow-xs cursor-pointer transition-all self-start sm:self-auto shrink-0"
              >
                <Plus className="size-3.5 stroke-[2.2]" />
                <span>+ Custom Transaction</span>
              </button>
            </div>

            {/* Quick 1-Tap Student Expenses */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E] block">
                Quick Log Common Student Expenses:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { name: "Chai & Snack", icon: "☕", amount: 40, method: "UPI", cat: "Food & Dining" },
                  { name: "Mess / Lunch", icon: "🍛", amount: 120, method: "UPI", cat: "Food & Dining" },
                  { name: "Metro / Auto", icon: "🚇", amount: 50, method: "UPI", cat: "Transport" },
                  { name: "Books / Prints", icon: "📚", amount: 150, method: "UPI", cat: "Education" },
                  { name: "Groceries / Milk", icon: "🛒", amount: 180, method: "Cash", cat: "Groceries" },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleQuickLogExpense(item)}
                    disabled={isQuickLogging}
                    className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-white dark:hover:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] hover:border-[#161514]/40 hover:shadow-xs transition-all text-left cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-lg block mb-1">{item.icon}</span>
                      <h5 className="font-heading font-black text-xs text-[#161514] dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {item.name}
                      </h5>
                      <span className="text-[9px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                        {item.method} • {item.cat}
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
        <div className="space-y-4">
          {groupedByDate.map((group) => (
            <div key={group.dateKey} className="space-y-2">
              {/* Date Group Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono font-medium text-[#161514] dark:text-[#FAF8F5] bg-[#F1EFEA] dark:bg-[#252321] px-2.5 py-0.5 rounded-md border border-[#E8E5DF] dark:border-[#383531]">
                  {group.label}
                </span>
                <span className="text-xs font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                  {group.items.length} record{group.items.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Transactions in Date Group */}
              <div className="space-y-2">
                {group.items.map((tx) => {
                  const cat = categoryMap.get(tx.categoryId);
                  const isIncome = tx.type === "income";

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onInspectTransaction(tx)}
                      className="bg-white dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#383531] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] transition-colors p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      {/* Left: Category Icon & Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] flex items-center justify-center shrink-0 text-[#161514] dark:text-[#FAF8F5]">
                          <CategoryIcon name={cat?.icon} className="size-4 stroke-[1.5]" />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <span className="text-xs sm:text-[13px] font-medium text-[#161514] dark:text-[#FAF8F5] truncate block">
                            {tx.note || cat?.name || "Transaction"}
                          </span>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-medium text-[#6B6B6B] dark:text-[#A8A29E] bg-[#F1EFEA] dark:bg-[#252321] px-1.5 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531]">
                              {cat?.name || "Uncategorized"}
                            </span>
                            <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                              {tx.paymentMethod === "cash" ? "Cash" : tx.paymentMethod || "UPI"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Quick Actions */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span
                          className={cn(
                            "text-sm sm:text-[15px] font-semibold font-mono tabular-nums",
                            isIncome ? "text-[#03D26F]" : "text-rose-600 dark:text-rose-400"
                          )}
                        >
                          {isIncome ? "+" : "-"}{currencySymbol}{Number(tx.amount).toLocaleString()}
                        </span>

                        {/* Quick 1-Click Duplicate & Edit (visible on desktop or tap) */}
                        <div
                          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playPop();
                              onDuplicateTransaction(tx);
                            }}
                            className="p-1 rounded-md bg-white dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2e2b28] border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] transition-colors cursor-pointer"
                            title="1-Click Duplicate"
                          >
                            <Copy className="size-3 stroke-[1.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditTransaction(tx)}
                            className="p-1 rounded-md bg-white dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2e2b28] border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="size-3 stroke-[1.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-1 rounded-md bg-white dark:bg-[#252321] hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-[#E8E5DF] dark:border-[#383531] text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="size-3 stroke-[1.5]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
