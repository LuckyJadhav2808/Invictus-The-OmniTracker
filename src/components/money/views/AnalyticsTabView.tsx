"use client";

import React, { useMemo, useState } from "react";
import { type Transaction, type Category } from "@/types";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from "recharts";
import { TrendingUp, Plus, Calendar, BarChart2, Smartphone, Banknote, CreditCard, Store, PieChart as PieChartIcon } from "lucide-react";
import { format, subMonths, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface AnalyticsTabViewProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  targetMonthKey?: string;
  onOpenAddTransaction: () => void;
}

// 4-token semantic palette aligned with Invictus neobrutalism
const PALETTE = [
  "#CEF431", // Electric lime
  "#03D26F", // Malachite emerald
  "#C084FC", // Lavender
  "#161514", // Obsidian
  "#64748B", // Slate
  "#94A3B8", // Light slate
  "#38BDF8", // Sky blue
  "#F59E0B", // Amber
];

export function AnalyticsTabView({
  transactions,
  categories,
  currencySymbol,
  targetMonthKey,
  onOpenAddTransaction,
}: AnalyticsTabViewProps) {
  const activeMonthKey = targetMonthKey || format(new Date(), "yyyy-MM");
  const [selectedMonth, setSelectedMonth] = useState<string>(activeMonthKey);

  // Available months discovered from transactions
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
      .map((key) => {
        try {
          const d = parseISO(`${key}-01`);
          return {
            key,
            label: format(d, "MMMM yyyy"),
            isCurrent: key === currentCalMonth,
          };
        } catch {
          return { key, label: key, isCurrent: key === currentCalMonth };
        }
      });
  }, [transactions, targetMonthKey]);

  // Filtered transactions by selectedMonth ("all" means aggregate across all history)
  const scopedTransactions = useMemo(() => {
    if (selectedMonth === "all") return transactions;
    return transactions.filter((tx) => tx.date?.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Aggregate metrics for selected month
  const monthMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;

    scopedTransactions.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      if (tx.type === "income") income += amt;
      else if (tx.type === "expense") expense += amt;
    });

    const net = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0;

    return { income, expense, net, savingsRate };
  }, [scopedTransactions]);

  // Categories Map for lookups
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Pie chart data: spend by category
  const expensePieData = useMemo(() => {
    const map = new Map<string, number>();

    scopedTransactions.forEach((tx) => {
      if (tx.type === "expense") {
        const curr = map.get(tx.categoryId) || 0;
        map.set(tx.categoryId, curr + Number(tx.amount || 0));
      }
    });

    const items: Array<{ name: string; value: number; color: string }> = [];
    let idx = 0;

    map.forEach((total, catId) => {
      if (total > 0) {
        const cat = categoryMap.get(catId);
        items.push({
          name: cat?.name || "Uncategorized",
          value: total,
          color: PALETTE[idx % PALETTE.length],
        });
        idx++;
      }
    });

    return items.sort((a, b) => b.value - a.value);
  }, [scopedTransactions, categoryMap]);

  // 6-Month Rolling Income vs Expense Bar Chart Data
  const barChartData = useMemo(() => {
    const months: string[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      months.push(format(subMonths(now, i), "yyyy-MM"));
    }

    return months.map((mKey) => {
      let income = 0;
      let expense = 0;

      transactions.forEach((tx) => {
        if (tx.date?.startsWith(mKey)) {
          const amt = Number(tx.amount || 0);
          if (tx.type === "income") income += amt;
          else if (tx.type === "expense") expense += amt;
        }
      });

      let label = mKey;
      try {
        label = format(parseISO(`${mKey}-01`), "MMM");
      } catch {}

      return {
        monthKey: mKey,
        name: label,
        Income: income,
        Expense: expense,
      };
    });
  }, [transactions]);

  // Channel breakdown
  const channelData = useMemo(() => {
    let upi = 0;
    let cash = 0;
    let other = 0;

    scopedTransactions.forEach((tx) => {
      if (tx.type === "expense") {
        const amt = Number(tx.amount || 0);
        const method = (tx.paymentMethod || "upi").toLowerCase();
        if (method === "upi") upi += amt;
        else if (method === "cash") cash += amt;
        else other += amt;
      }
    });

    return { upi, cash, other };
  }, [scopedTransactions]);

  // Top Outflow Merchants
  const topMerchantsData = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();

    scopedTransactions.forEach((tx) => {
      if (tx.type === "expense") {
        const desc = (tx.note || "General Outflow").trim();
        const curr = map.get(desc) || { total: 0, count: 0 };
        map.set(desc, {
          total: curr.total + Number(tx.amount || 0),
          count: curr.count + 1,
        });
      }
    });

    const arr: Array<{ name: string; total: number; count: number }> = [];
    map.forEach((val, name) => arr.push({ name, ...val }));
    return arr.sort((a, b) => b.total - a.total).slice(0, 5);
  }, [scopedTransactions]);

  if (transactions.length === 0) {
    return (
      <div className="bg-[#FAF8F5] rounded-3xl p-8 sm:p-12 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] text-center space-y-4">
        <div className="size-14 rounded-2xl bg-[#CEF431] border-2 border-[#161514] mx-auto flex items-center justify-center shadow-[2px_2px_0px_0px_#161514]">
          <TrendingUp className="size-7 text-[#161514]" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-black uppercase text-[#161514] font-heading">
            No Telemetry Data Yet
          </h3>
          <p className="text-xs text-[#161514]/70 max-w-sm mx-auto font-medium">
            Start logging your digital UPI or physical cash transactions to generate deep financial analytics.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddTransaction}
          className="inline-flex items-center gap-2 bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-xs uppercase px-4 py-2.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
        >
          <Plus className="size-4 stroke-[3]" />
          <span>Log First Expense</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Month Scope Selector & Executive KPI Strip */}
      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-3xl border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="size-8 rounded-xl bg-white border-2 border-[#161514] flex items-center justify-center shadow-[1px_1px_0px_0px_#161514] shrink-0">
              <TrendingUp className="size-4 text-[#161514]" />
            </span>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[#161514] font-heading">
                Financial Telemetry Analytics
              </h3>
              <p className="text-[10px] text-[#161514]/60 font-bold">
                {selectedMonth === "all" ? "Viewing all-time aggregate cashflow" : `Telemetry filtered to ${availableMonths.find(m => m.key === selectedMonth)?.label || selectedMonth}`}
              </p>
            </div>
          </div>

          {/* Month Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] self-start sm:self-auto">
            <Calendar className="size-3.5 text-[#161514]/70 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-[11px] font-black uppercase text-[#161514] focus:outline-none cursor-pointer"
            >
              <option value="all">All Time (All Months)</option>
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label} {m.isCurrent ? "• Current" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Executive KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#161514]/10">
          <div className="bg-white p-2.5 rounded-xl border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#03D26F] block font-mono">Total Inflow</span>
            <span className="text-sm sm:text-base font-black text-[#03D26F] font-mono tabular-nums mt-0.5 block">
              +{currencySymbol}{monthMetrics.income.toLocaleString()}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700 block font-mono">Total Outflow</span>
            <span className="text-sm sm:text-base font-black text-rose-700 font-mono tabular-nums mt-0.5 block">
              -{currencySymbol}{monthMetrics.expense.toLocaleString()}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#161514]/60 block font-mono">Net Cashflow</span>
            <span className={cn(
              "text-sm sm:text-base font-black font-mono tabular-nums mt-0.5 block",
              monthMetrics.net >= 0 ? "text-[#03D26F]" : "text-rose-700"
            )}>
              {monthMetrics.net >= 0 ? `+${currencySymbol}${monthMetrics.net.toLocaleString()}` : `-${currencySymbol}${Math.abs(monthMetrics.net).toLocaleString()}`}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#161514]/60 block font-mono">Savings Rate</span>
            <span className="text-sm sm:text-base font-black text-[#161514] font-mono tabular-nums mt-0.5 block">
              {monthMetrics.savingsRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Expense Categories Share Donut */}
      {expensePieData.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-3">
          <div className="flex items-center gap-2">
            <span className="size-8 rounded-xl bg-[#FAF8F5] border-2 border-[#161514] flex items-center justify-center shadow-[1px_1px_0px_0px_#161514] shrink-0">
              <PieChartIcon className="size-4 text-[#161514]" />
            </span>
            <h3 className="font-black text-sm uppercase tracking-wider text-[#161514] font-heading">
              Expense Categories Share
            </h3>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {expensePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#161514" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${currencySymbol}${Number(v).toLocaleString()}`, "Spend"]} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 6-Month Income vs Expenses Comparison */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-3">
        <div className="flex items-center gap-2">
          <span className="size-8 rounded-xl bg-[#FAF8F5] border-2 border-[#161514] flex items-center justify-center shadow-[1px_1px_0px_0px_#161514] shrink-0">
            <BarChart2 className="size-4 text-[#161514]" />
          </span>
          <h3 className="font-black text-sm uppercase tracking-wider text-[#161514] font-heading">
            Income vs Expenses (Past 6 Months)
          </h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#161514" fontSize={10} fontWeight={800} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#161514"
                fontSize={10}
                fontWeight={800}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${currencySymbol}${v}`}
              />
              <Tooltip
                formatter={(v) => [`${currencySymbol}${Number(v).toLocaleString()}`]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "2px solid #161514",
                  boxShadow: "3px 3px 0px 0px #161514",
                  fontWeight: "bold",
                }}
              />
              <Legend />
              <Bar dataKey="Income" fill="#03D26F" stroke="#161514" strokeWidth={2} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Expense" fill="#E11D48" stroke="#161514" strokeWidth={2} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spending Channels Total Outflow */}
      <div className="bg-[#FAF8F5] rounded-3xl p-5 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-3">
        <span className="text-xs font-black uppercase tracking-wider text-[#161514] block font-heading">
          Spending Channels Total Outflow
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#161514]/60 flex items-center gap-1.5 font-mono">
              <Smartphone className="size-3 text-[#161514]" />
              <span>UPI & Online</span>
            </span>
            <span className="text-lg font-black text-[#161514] font-mono tabular-nums mt-0.5 block">
              {currencySymbol}{channelData.upi.toLocaleString()}
            </span>
          </div>
          <div className="bg-white p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#161514]/60 flex items-center gap-1.5 font-mono">
              <Banknote className="size-3 text-[#161514]" />
              <span>Physical Cash</span>
            </span>
            <span className="text-lg font-black text-[#161514] font-mono tabular-nums mt-0.5 block">
              {currencySymbol}{channelData.cash.toLocaleString()}
            </span>
          </div>
          <div className="bg-white p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#161514]/60 flex items-center gap-1.5 font-mono">
              <CreditCard className="size-3 text-[#161514]" />
              <span>Cards / Transfer</span>
            </span>
            <span className="text-lg font-black text-[#161514] font-mono tabular-nums mt-0.5 block">
              {currencySymbol}{channelData.other.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Top Merchants Leaderboard */}
      {topMerchantsData.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-8 rounded-xl bg-[#FAF8F5] border-2 border-[#161514] flex items-center justify-center shadow-[1px_1px_0px_0px_#161514] shrink-0">
                <Store className="size-4 text-[#161514]" />
              </span>
              <h3 className="font-black text-sm uppercase tracking-wider text-[#161514] font-heading">
                Top Merchants Outflow
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#161514]/60 uppercase font-mono">
              By Spend Volume
            </span>
          </div>

          <div className="space-y-2">
            {topMerchantsData.map((m, idx) => {
              const pct = monthMetrics.expense > 0 ? Math.round((m.total / monthMetrics.expense) * 100) : 0;
              return (
                <div
                  key={m.name}
                  className="bg-[#FAF8F5] p-3 rounded-2xl border-2 border-[#161514] flex items-center justify-between gap-3 shadow-[1.5px_1.5px_0px_0px_#161514]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-6 rounded-lg bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center font-black text-xs shrink-0 font-mono">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#161514] truncate block">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-[#161514]/60 font-mono font-medium block">
                        {m.count} {m.count === 1 ? "transaction" : "transactions"} • {pct}% of outflows
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-black text-[#161514] font-mono tabular-nums shrink-0">
                    {currencySymbol}{m.total.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
