"use client";

import React, { useMemo } from "react";
import { type Transaction, type Category } from "@/types";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from "recharts";
import { TrendingUp, Plus } from "lucide-react";
import { format, subMonths } from "date-fns";

interface AnalyticsTabViewProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
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
  onOpenAddTransaction,
}: AnalyticsTabViewProps) {
  // Category map
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // 1. Expense Pie Chart Data
  const expensePieData = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
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
  }, [transactions, categoryMap]);

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

  // 3. Payment Method Distribution
  const channelData = useMemo(() => {
    let upi = 0;
    let cash = 0;
    let other = 0;

    transactions.forEach((tx) => {
      if (tx.type === "expense") {
        const amt = Number(tx.amount) || 0;
        if (tx.paymentMethod === "cash") cash += amt;
        else if (tx.paymentMethod === "upi") upi += amt;
        else other += amt;
      }
    });

    return { upi, cash, other };
  }, [transactions]);

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
    </div>
  );
}
