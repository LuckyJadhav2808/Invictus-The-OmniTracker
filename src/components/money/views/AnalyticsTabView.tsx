"use client";

import React, { useMemo, useState } from "react";
import { type Transaction, type Category } from "@/types";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from "recharts";
import { TrendingUp, Plus, Calendar, BarChart2, Smartphone, Banknote, CreditCard, Store, PieChart as PieChartIcon, Sparkles, ShieldCheck, ArrowUpRight } from "lucide-react";
import { format, subMonths, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";

interface AnalyticsTabViewProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  targetMonthKey?: string;
  onOpenAddTransaction: () => void;
}

// 4-token semantic palette aligned with Invictus neobrutalism
const PALETTE = [
  "#03D26F", // Malachite emerald
  "#CEF431", // Electric lime
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

  // Zero-confusion empty state
  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-[#161514] rounded-2xl p-6 sm:p-8 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-6 transition-colors">
        <div className="max-w-md mx-auto text-center space-y-2">
          <div className="size-12 rounded-2xl bg-[#F1EFEA] dark:bg-[#22201D] mx-auto flex items-center justify-center text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724]">
            <TrendingUp className="size-6 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight">
            Financial Intelligence & Telemetry
          </h3>
          <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] leading-relaxed">
            Invictus automatically tracks your cashflows, computes savings rate velocity, and audits your digital UPI vs cash leakage once transactions are logged.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenAddTransaction}
              className="inline-flex items-center gap-2 bg-[#161514] hover:bg-[#2A2826] text-white dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] font-medium text-xs px-4 py-2 rounded-xl border border-[#161514] dark:border-white transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="size-3.5 stroke-[2]" />
              <span>Log First Expense</span>
            </button>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#E8E5DF] dark:border-[#2A2724]">
          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-4 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] space-y-1.5">
            <span className="text-xs font-semibold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
              <PieChartIcon className="size-3.5 text-[#03D26F] stroke-[1.5]" />
              <span>Category Share Donut</span>
            </span>
            <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] leading-snug">
              Visual breakdown of where your monthly budget goes across dining, transit, rent, and shopping.
            </p>
          </div>

          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-4 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] space-y-1.5">
            <span className="text-xs font-semibold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
              <Smartphone className="size-3.5 text-[#38BDF8] stroke-[1.5]" />
              <span>Dual Channel Audit</span>
            </span>
            <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] leading-snug">
              Tracks digital UPI vs physical cash till spend separately so offline pocket money never leaks unnoticed.
            </p>
          </div>

          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-4 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] space-y-1.5">
            <span className="text-xs font-semibold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
              <BarChart2 className="size-3.5 text-[#C084FC] stroke-[1.5]" />
              <span>6-Month Rolling Velocity</span>
            </span>
            <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] leading-snug">
              Tracks month-over-month income vs outflow bars and calculates your true monthly savings rate.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Month Scope Selector & Executive KPI Strip */}
      <div className="bg-white dark:bg-[#161514] p-5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="size-9 rounded-xl bg-[#F1EFEA] dark:bg-[#22201D] flex items-center justify-center text-[#161514] dark:text-[#FAF8F5] shrink-0 border border-[#E8E5DF] dark:border-[#2A2724]">
              <TrendingUp className="size-4.5 stroke-[1.5]" />
            </span>
            <div>
              <h3 className="font-semibold text-[15px] text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                Financial Telemetry Analytics
              </h3>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E]">
                {selectedMonth === "all" ? "Viewing all-time aggregate cashflow" : `Telemetry filtered to ${availableMonths.find(m => m.key === selectedMonth)?.label || selectedMonth}`}
              </p>
            </div>
          </div>

          {/* Month Selector Dropdown */}
          <div className="w-auto min-w-[170px] self-start sm:self-auto">
            <NeobrutalistSelect
              size="sm"
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={[
                { value: "all", label: "All Time (All Months)", icon: "Calendar" },
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
        </div>

        {/* Executive KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-[#E8E5DF] dark:border-[#2A2724]">
          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724]">
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 block">Total Inflow</span>
            <span className="text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5 block">
              +{currencySymbol}{monthMetrics.income.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724]">
            <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 block">Total Outflow</span>
            <span className="text-sm sm:text-base font-semibold text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-0.5 block">
              -{currencySymbol}{monthMetrics.expense.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724]">
            <span className="text-[10px] font-medium text-[#6B6B6B] dark:text-[#A8A29E] block">Net Cashflow</span>
            <span className={cn(
              "text-sm sm:text-base font-semibold font-mono tabular-nums mt-0.5 block",
              monthMetrics.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {monthMetrics.net >= 0 ? `+${currencySymbol}${monthMetrics.net.toLocaleString()}` : `-${currencySymbol}${Math.abs(monthMetrics.net).toLocaleString()}`}
            </span>
          </div>

          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724]">
            <span className="text-[10px] font-medium text-[#6B6B6B] dark:text-[#A8A29E] block">Savings Rate</span>
            <span className="text-sm sm:text-base font-semibold text-[#161514] dark:text-[#FAF8F5] font-mono tabular-nums mt-0.5 block">
              {monthMetrics.savingsRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Expense Categories Share Donut */}
      {expensePieData.length > 0 && (
        <div className="bg-white dark:bg-[#161514] rounded-2xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-3 transition-colors">
          <div className="flex items-center gap-2.5">
            <span className="size-8 rounded-lg bg-[#F1EFEA] dark:bg-[#22201D] flex items-center justify-center text-[#161514] dark:text-[#FAF8F5] shrink-0 border border-[#E8E5DF] dark:border-[#2A2724]">
              <PieChartIcon className="size-4 stroke-[1.5]" />
            </span>
            <h3 className="font-semibold text-[15px] text-[#161514] dark:text-[#FAF8F5] tracking-tight">
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
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
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
      <div className="bg-white dark:bg-[#161514] rounded-2xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-3 transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="size-8 rounded-lg bg-[#F1EFEA] dark:bg-[#22201D] flex items-center justify-center text-[#161514] dark:text-[#FAF8F5] shrink-0 border border-[#E8E5DF] dark:border-[#2A2724]">
            <BarChart2 className="size-4 stroke-[1.5]" />
          </span>
          <h3 className="font-semibold text-[15px] text-[#161514] dark:text-[#FAF8F5] tracking-tight">
            Income vs Expenses (Past 6 Months)
          </h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#888888" fontSize={11} fontWeight={500} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={11}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${currencySymbol}${v}`}
              />
              <Tooltip
                formatter={(v) => [`${currencySymbol}${Number(v).toLocaleString()}`]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E8E5DF",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                  fontSize: "12px",
                }}
              />
              <Legend />
              <Bar dataKey="Income" fill="#03D26F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expense" fill="#E11D48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spending Channels Total Outflow */}
      <div className="bg-white dark:bg-[#161514] rounded-2xl p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-3 transition-colors">
        <span className="text-[15px] font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight block">
          Spending Channels Total Outflow
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724]">
            <span className="text-xs font-medium text-[#6B6B6B] dark:text-[#A8A29E] flex items-center gap-1.5">
              <Smartphone className="size-3.5 stroke-[1.5] text-[#161514] dark:text-[#FAF8F5]" />
              <span>UPI & Online</span>
            </span>
            <span className="text-lg font-semibold text-[#161514] dark:text-[#FAF8F5] font-mono tabular-nums mt-1 block">
              {currencySymbol}{channelData.upi.toLocaleString()}
            </span>
          </div>
          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724]">
            <span className="text-xs font-medium text-[#6B6B6B] dark:text-[#A8A29E] flex items-center gap-1.5">
              <Banknote className="size-3.5 stroke-[1.5] text-[#161514] dark:text-[#FAF8F5]" />
              <span>Physical Cash</span>
            </span>
            <span className="text-lg font-semibold text-[#161514] dark:text-[#FAF8F5] font-mono tabular-nums mt-1 block">
              {currencySymbol}{channelData.cash.toLocaleString()}
            </span>
          </div>
          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724]">
            <span className="text-xs font-medium text-[#6B6B6B] dark:text-[#A8A29E] flex items-center gap-1.5">
              <CreditCard className="size-3.5 stroke-[1.5] text-[#161514] dark:text-[#FAF8F5]" />
              <span>Cards / Transfer</span>
            </span>
            <span className="text-lg font-semibold text-[#161514] dark:text-[#FAF8F5] font-mono tabular-nums mt-1 block">
              {currencySymbol}{channelData.other.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Top Merchants Leaderboard */}
      {topMerchantsData.length > 0 && (
        <div className="bg-white dark:bg-[#161514] rounded-2xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="size-8 rounded-lg bg-[#F1EFEA] dark:bg-[#22201D] flex items-center justify-center text-[#161514] dark:text-[#FAF8F5] shrink-0 border border-[#E8E5DF] dark:border-[#2A2724]">
                <Store className="size-4 stroke-[1.5]" />
              </span>
              <h3 className="font-semibold text-[15px] text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                Top Merchants Outflow
              </h3>
            </div>
            <span className="text-xs font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
              By Spend Volume
            </span>
          </div>

          <div className="space-y-2">
            {topMerchantsData.map((m, idx) => {
              const pct = monthMetrics.expense > 0 ? Math.round((m.total / monthMetrics.expense) * 100) : 0;
              return (
                <div
                  key={m.name}
                  className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-6 rounded-md bg-[#F1EFEA] dark:bg-[#22201D] flex items-center justify-center font-semibold text-xs text-[#161514] dark:text-[#FAF8F5] shrink-0 font-mono border border-[#E8E5DF] dark:border-[#2A2724]">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-[#161514] dark:text-[#FAF8F5] truncate block">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] font-mono block">
                        {m.count} {m.count === 1 ? "transaction" : "transactions"} • {pct}% of outflows
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-semibold text-[#161514] dark:text-[#FAF8F5] font-mono tabular-nums shrink-0">
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
