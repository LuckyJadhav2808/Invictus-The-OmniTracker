"use client";

import React, { useMemo, useState } from "react";
import { type Transaction, type Category } from "@/types";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from "recharts";
import { TrendingUp, Plus, Calendar } from "lucide-react";
import { format, subMonths, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface AnalyticsTabViewProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  targetMonthKey?: string;
  onOpenAddTransaction: () => void;
}

const PALETTE = [
  "#CEF431", "#03D26F", "#FF4757", "#FFA502",
  "#2ED573", "#1E90FF", "#9B59B6", "#FF6B81"
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

  // Filtered transactions for the selected month
  const monthFilteredTransactions = useMemo(() => {
    if (selectedMonth === "all") return transactions;
    return transactions.filter((tx) => tx.date?.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Selected Month Overview Metrics (Income, Expense, Net Flow, Savings Rate)
  const monthMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;

    monthFilteredTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "income") income += amt;
      else if (tx.type === "expense") expense += amt;
    });

    const net = income - expense;
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;

    return { income, expense, net, savingsRate };
  }, [monthFilteredTransactions]);

  // Category map
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // 1. Expense Pie Chart Data (Month-Filtered)
  const expensePieData = useMemo(() => {
    const map = new Map<string, number>();
    monthFilteredTransactions.forEach((tx) => {
      if (tx.type === "expense") {
        const cat = categoryMap.get(tx.categoryId);
        const name = cat?.name || "Uncategorized";
        const amt = Number(tx.amount) || 0;
        map.set(name, (map.get(name) || 0) + amt);
      }
    });

    return Array.from(map.entries())
      .map(([name, value], i) => ({
        name,
        value,
        color: PALETTE[i % PALETTE.length],
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [monthFilteredTransactions, categoryMap]);

  // 2. 6-Month Income vs Expenses Bar Chart Data
  const barChartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return {
        key: format(d, "yyyy-MM"),
        name: format(d, "MMM yyyy"),
        Income: 0,
        Expense: 0,
      };
    });

    const monthMap = new Map(months.map((m) => [m.key, m]));

    transactions.forEach((tx) => {
      if (!tx.date) return;
      const mKey = tx.date.substring(0, 7);
      const target = monthMap.get(mKey);
      if (target) {
        const amt = Number(tx.amount) || 0;
        if (tx.type === "income") target.Income += amt;
        else if (tx.type === "expense") target.Expense += amt;
      }
    });

    return months;
  }, [transactions]);

  // 3. Payment Method Distribution (Month-Filtered)
  const channelData = useMemo(() => {
    let upi = 0;
    let cash = 0;
    let other = 0;

    monthFilteredTransactions.forEach((tx) => {
      if (tx.type === "expense") {
        const amt = Number(tx.amount) || 0;
        if (tx.paymentMethod === "cash") cash += amt;
        else if (tx.paymentMethod === "upi") upi += amt;
        else other += amt;
      }
    });

    return { upi, cash, other };
  }, [monthFilteredTransactions]);

  // 4. Top Merchants Leaderboard (Month-Filtered)
  const topMerchantsData = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    monthFilteredTransactions.forEach((tx) => {
      if (tx.type === "expense") {
        const name = tx.note?.trim() || "Unspecified";
        const current = map.get(name) || { count: 0, total: 0 };
        current.count += 1;
        current.total += Number(tx.amount) || 0;
        map.set(name, current);
      }
    });

    return Array.from(map.entries())
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        total: Math.round(stats.total * 100) / 100,
      }))
      .filter((m) => m.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [monthFilteredTransactions]);

  if (transactions.length === 0) {
    return (
      <div className="bg-[#FAF8F5] rounded-3xl border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] p-8 text-center space-y-3">
        <div className="size-12 rounded-2xl bg-[#CEF431] border-2 border-[#161514] mx-auto flex items-center justify-center shadow-[2px_2px_0px_0px_#161514]">
          <TrendingUp className="size-6 text-[#161514]" />
        </div>
        <span className="text-sm font-black text-[#161514] block" style={{ fontFamily: "var(--font-heading)" }}>
          No Financial Telemetry Logged Yet
        </span>
        <p className="text-xs text-[#161514]/70 max-w-sm mx-auto">
          Log your daily expenses and income to generate automated cashflow trends, velocity charts, and category breakdowns.
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
    );
  }

  return (
    <div className="space-y-6">
      {/* 📅 Analytics Month Scope Selector & Executive KPI Strip */}
      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-3xl border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">📈</span>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[#161514]" style={{ fontFamily: "var(--font-heading)" }}>
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
              <option value="all">📅 All Time (All Months)</option>
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
          <div className="bg-white p-2.5 rounded-xl border border-[#161514]">
            <span className="text-[9px] font-black uppercase text-emerald-700 block">Total Inflow</span>
            <span className="text-sm sm:text-base font-black text-emerald-700 font-mono mt-0.5 block" style={{ fontFamily: "var(--font-heading)" }}>
              +{currencySymbol}{monthMetrics.income.toLocaleString()}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#161514]">
            <span className="text-[9px] font-black uppercase text-rose-700 block">Total Outflow</span>
            <span className="text-sm sm:text-base font-black text-rose-700 font-mono mt-0.5 block" style={{ fontFamily: "var(--font-heading)" }}>
              -{currencySymbol}{monthMetrics.expense.toLocaleString()}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#161514]">
            <span className="text-[9px] font-black uppercase text-[#161514]/60 block">Net Cashflow</span>
            <span className={cn(
              "text-sm sm:text-base font-black font-mono mt-0.5 block",
              monthMetrics.net >= 0 ? "text-emerald-700" : "text-rose-700"
            )} style={{ fontFamily: "var(--font-heading)" }}>
              {monthMetrics.net >= 0 ? `+${currencySymbol}${monthMetrics.net.toLocaleString()}` : `-${currencySymbol}${Math.abs(monthMetrics.net).toLocaleString()}`}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#161514]">
            <span className="text-[9px] font-black uppercase text-[#161514]/60 block">Savings Rate</span>
            <span className="text-sm sm:text-base font-black text-[#161514] font-mono mt-0.5 block" style={{ fontFamily: "var(--font-heading)" }}>
              {monthMetrics.savingsRate}%
            </span>
          </div>
        </div>
      </div>

      {/* 🥧 Expense Categories Share Donut */}
      {expensePieData.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🥧</span>
            <h3 className="font-black text-sm uppercase tracking-wider text-[#161514]" style={{ fontFamily: "var(--font-heading)" }}>
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

      {/* 📊 6-Month Income vs Expenses Comparison */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="font-black text-sm uppercase tracking-wider text-[#161514]" style={{ fontFamily: "var(--font-heading)" }}>
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
              <Bar dataKey="Expense" fill="#FF4757" stroke="#161514" strokeWidth={2} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 📱 Channel Breakdown Telemetry */}
      <div className="bg-[#FAF8F5] rounded-3xl p-5 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-3">
        <span className="text-xs font-black uppercase tracking-wider text-[#161514] block" style={{ fontFamily: "var(--font-heading)" }}>
          Spending Channels Total Outflow
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
            <span className="text-[10px] font-black uppercase text-[#161514]/60 block">📱 UPI & Online</span>
            <span className="text-lg font-black text-[#161514] font-heading mt-0.5 block">
              {currencySymbol}{channelData.upi.toLocaleString()}
            </span>
          </div>
          <div className="bg-white p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
            <span className="text-[10px] font-black uppercase text-[#161514]/60 block">💵 Physical Cash</span>
            <span className="text-lg font-black text-[#161514] font-heading mt-0.5 block">
              {currencySymbol}{channelData.cash.toLocaleString()}
            </span>
          </div>
          <div className="bg-white p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
            <span className="text-[10px] font-black uppercase text-[#161514]/60 block">💳 Cards / Transfer</span>
            <span className="text-lg font-black text-[#161514] font-heading mt-0.5 block">
              {currencySymbol}{channelData.other.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 🏆 Top Merchants Leaderboard */}
      {topMerchantsData.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏪</span>
              <h3 className="font-black text-sm uppercase tracking-wider text-[#161514]" style={{ fontFamily: "var(--font-heading)" }}>
                Top Merchants Outflow
              </h3>
            </div>
            <span className="text-[10px] font-black text-[#161514]/60 uppercase">
              By Spend Volume
            </span>
          </div>

          <div className="space-y-2">
            {topMerchantsData.map((m, idx) => {
              const pct = monthMetrics.expense > 0 ? Math.round((m.total / monthMetrics.expense) * 100) : 0;
              return (
                <div
                  key={m.name}
                  className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#161514] flex items-center justify-between gap-3 shadow-[1.5px_1.5px_0px_0px_#161514]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-6 rounded-lg bg-[#CEF431] border border-[#161514] flex items-center justify-center font-black text-xs shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-[#161514] truncate block">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-[#161514]/60 font-bold block">
                        {m.count} {m.count === 1 ? "transaction" : "transactions"} • {pct}% of outflows
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-black text-[#161514] font-mono shrink-0">
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
