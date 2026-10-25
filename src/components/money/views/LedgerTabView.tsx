"use client";

import React, { useState, useMemo, useEffect } from "react";
import { type Transaction, type Category } from "@/types";
import { cn } from "@/lib/utils";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { Search, Filter, FileDown, Plus, Copy, Edit2, Trash2, Calendar } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { renderCategoryEmoji, MoneyQuickActionsAndCards } from "@/components/money/MoneyQuickActionsAndCards";
import { isCashTransaction, isOnlineTransaction, type MonthlyBudgetStats } from "@/lib/utils/budget-rollover";

interface LedgerTabViewProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  targetMonthKey?: string;
  monthlyStats?: MonthlyBudgetStats;
  initialMethodFilter?: string;
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
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("invictus_ledger_month");
      if (cached) return cached;
    }
    return activeMonthKey;
  });
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
      <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="size-4 text-[#161514]/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by merchant, note, or category…"
              className="w-full bg-white pl-9 pr-3 py-2 text-xs font-bold rounded-xl border-2 border-[#161514] focus:outline-none focus:ring-2 focus:ring-[#CEF431]"
            />
          </div>

          {/* PDF Export Button */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="bg-white hover:bg-[#FAF8F5] text-[#161514] font-black text-xs uppercase tracking-wider py-2 px-3 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <FileDown className="size-3.5 stroke-[2.5]" />
            <span>Export Statement</span>
          </button>
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#161514]/10">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase text-[#161514]/60 mr-1">
            <Filter className="size-3" />
            <span>Filter:</span>
          </div>

          {/* Dedicated Month Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
            <Calendar className="size-3 text-[#161514]/70 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase text-[#161514] focus:outline-none cursor-pointer"
            >
              <option value="all">📅 All Time (All Months)</option>
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label} {m.isCurrent ? "• Current" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex gap-1 bg-white p-1 rounded-xl border border-[#161514]">
            {(["all", "expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                  selectedType === t
                    ? "bg-[#161514] text-white"
                    : "text-[#161514]/70 hover:bg-[#FAF8F5]"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Payment Method Filter */}
          <div className="flex gap-1 bg-white p-1 rounded-xl border border-[#161514]">
            {[
              { id: "all", label: "All Modes" },
              { id: "upi", label: "📱 UPI" },
              { id: "cash", label: "💵 Cash" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMethod(m.id)}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                  selectedMethod === m.id
                    ? "bg-[#CEF431] text-[#161514]"
                    : "text-[#161514]/70 hover:bg-[#FAF8F5]"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white px-2.5 py-1 text-[10px] font-black rounded-xl border border-[#161514] uppercase text-[#161514] cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {renderCategoryEmoji(c.icon)} {c.name}
              </option>
            ))}
          </select>

          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="bg-rose-100 hover:bg-rose-200 text-[#161514] border border-[#161514] px-2 py-1 text-[9.5px] font-black rounded-xl shadow-[1px_1px_0px_#161514] transition-all cursor-pointer flex items-center gap-1 shrink-0"
              title="Reset all search queries and filters to defaults"
            >
              <span>✕</span>
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 📅 Monthly Remaining Days Runway & Telemetry Banner */}
      {selectedMonth === activeMonthKey && monthlyStats ? (
        <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl p-3 sm:p-3.5 shadow-[2px_2px_0px_0px_#161514] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center text-base shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0 font-bold">
              ⚡
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]/60">
                  Daily Safe Spend Limit:
                </span>
                <span className="text-sm font-black text-[#161514] font-heading">
                  ~{currencySymbol}{monthlyStats.dailySafeToSpend.toLocaleString()} / day
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#161514] text-[#FAF8F5] font-mono">
                  {monthlyStats.daysRemainingInMonth} {monthlyStats.daysRemainingInMonth === 1 ? "day" : "days"} left
                </span>
              </div>
              <div className="text-[11px] font-bold text-[#161514]/80 flex items-center gap-1.5 flex-wrap">
                <span>Calculation:</span>
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#161514]/30 text-[#161514]">
                  {currencySymbol}{monthlyStats.remainingBudget.toLocaleString()} left ÷ {monthlyStats.daysRemainingInMonth} days
                </span>
                <span className="text-[#161514]/50">•</span>
                <span>in {monthlyStats.targetMonthLabel}</span>
              </div>
            </div>
          </div>

          {/* Dual Channel Split Pills */}
          <div className="flex items-center gap-1.5 flex-wrap md:shrink-0 text-[10px] font-black uppercase">
            <div className="bg-white px-2.5 py-1.5 rounded-xl border border-[#161514] shadow-[1px_1px_0px_0px_#161514] text-[#161514] flex items-center gap-1.5">
              <span>📱</span>
              <span>UPI: ~{currencySymbol}{monthlyStats.dailySafeToSpendUpi.toLocaleString()}/day</span>
            </div>
            <div className="bg-[#FFF9EA] px-2.5 py-1.5 rounded-xl border border-[#161514] shadow-[1px_1px_0px_0px_#161514] text-[#161514] flex items-center gap-1.5">
              <span>💵</span>
              <span>Cash: ~{currencySymbol}{monthlyStats.dailySafeToSpendCash.toLocaleString()}/day</span>
            </div>
          </div>
        </div>
      ) : selectedMonth !== "all" ? (
        <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-xl px-3 py-2 shadow-[1.5px_1.5px_0px_0px_#161514] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">🗓️</span>
            <span className="font-bold text-[#161514]">
              Showing statement for <strong className="font-black underline">{availableMonths.find((m) => m.key === selectedMonth)?.label || selectedMonth}</strong>
            </span>
          </div>
          <span className="text-[10px] font-black uppercase text-[#161514]/70 font-mono">
            {selectedMonthSummary.count} {selectedMonthSummary.count === 1 ? "record" : "records"} • Spent: {currencySymbol}{selectedMonthSummary.expense.toLocaleString()}
          </span>
        </div>
      ) : (
        <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-xl px-3 py-2 shadow-[1.5px_1.5px_0px_0px_#161514] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">🌐</span>
            <span className="font-bold text-[#161514]">
              Viewing All-Time History across all months ({selectedMonthSummary.count} records)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedMonth(activeMonthKey)}
            className="text-[10px] font-black uppercase text-[#161514] bg-[#CEF431] px-2 py-0.5 rounded border border-[#161514] hover:underline cursor-pointer sm:self-auto self-start"
          >
            Switch to This Month
          </button>
        </div>
      )}

      {/* 📜 TRANSACTION FEED LIST */}
      {groupedByDate.length === 0 ? (
        <div className="bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] p-8 text-center space-y-3">
          <div className="text-4xl">🧾</div>
          <span className="text-sm font-black text-[#161514] block">No Transactions Found</span>
          <p className="text-xs text-[#161514]/70 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== "all" || selectedType !== "all" || selectedMonth !== "all"
              ? "No records match your active filters. Try picking another month or clearing search filters."
              : "Your financial ledger is clear. Log an expense or income to start tracking!"}
          </p>
          <button
            type="button"
            onClick={onOpenAddTransaction}
            className="inline-flex items-center gap-1.5 bg-[#CEF431] text-[#161514] font-black text-xs uppercase px-4 py-2 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>+ Log Transaction</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => (
            <div key={group.dateKey} className="space-y-2">
              {/* Date Group Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#161514] bg-[#FAF8F5] px-2.5 py-0.5 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
                  📅 {group.label}
                </span>
                <span className="text-[10px] font-bold text-[#161514]/60">
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
                      className="bg-white rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] hover:shadow-[4px_4px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      {/* Left: Category Icon & Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-xl bg-[#FAF8F5] border-2 border-[#161514] flex items-center justify-center text-xl shrink-0 shadow-[1px_1px_0px_0px_#161514] group-hover:scale-105 transition-transform">
                          {renderCategoryEmoji(cat?.icon)}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <span className="text-xs sm:text-sm font-black text-[#161514] truncate block">
                            {tx.note || cat?.name || "Transaction"}
                          </span>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black uppercase text-[#161514]/70 bg-[#FAF8F5] px-1.5 py-0.2 rounded border border-[#161514]/20">
                              {cat?.name || "Uncategorized"}
                            </span>
                            <span className="text-[9px] font-bold text-[#161514]/60 uppercase">
                              {tx.paymentMethod === "cash" ? "💵 Cash" : "📱 " + (tx.paymentMethod || "UPI")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Quick Actions */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span
                          className={cn(
                            "text-sm sm:text-base font-black font-heading",
                            isIncome ? "text-emerald-700" : "text-rose-600"
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
                            className="p-1 rounded-lg bg-[#FAF8F5] hover:bg-[#CEF431] border border-[#161514] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                            title="1-Click Duplicate"
                          >
                            <Copy className="size-3 text-[#161514]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditTransaction(tx)}
                            className="p-1 rounded-lg bg-[#FAF8F5] hover:bg-white border border-[#161514] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="size-3 text-[#161514]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-[#161514] text-rose-700 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="size-3" />
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
