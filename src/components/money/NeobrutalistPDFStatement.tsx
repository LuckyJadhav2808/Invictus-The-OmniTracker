"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { type Transaction, type Category } from "@/types";
import { CategoryIcon } from "@/components/money/MoneyQuickActionsAndCards";
import { cn } from "@/lib/utils";

interface NeobrutalistPDFStatementProps {
  transactions: Transaction[];
  categories: Category[];
  periodLabel: string;
  currencySymbol?: string;
  userName?: string;
}

export function NeobrutalistPDFStatement({
  transactions,
  categories,
  periodLabel,
  currencySymbol = "₹",
  userName = "Invictus User",
}: NeobrutalistPDFStatementProps) {
  const generatedAt = useMemo(() => format(new Date(), "MMM d, yyyy 'at' hh:mm a"), []);

  // Compute Totals
  const income = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + (t.amount || 0), 0),
    [transactions]
  );

  const expense = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + (t.amount || 0), 0),
    [transactions]
  );

  const net = income - expense;

  // Category Totals
  const categoryStats = useMemo(() => {
    return categories
      .map((cat) => {
        const catTxs = transactions.filter((t) => t.categoryId === cat.id);
        const totalAmount = catTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
        return {
          ...cat,
          count: catTxs.length,
          totalAmount,
        };
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [categories, transactions]);

  // Sort transactions chronologically (newest first)
  const sortedTxs = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dA = a.date || "";
      const dB = b.date || "";
      return dB.localeCompare(dA);
    });
  }, [transactions]);

  return (
    <div
      id="invictus-pdf-statement"
      className="invictus-statement-print bg-[#FAF8F5] text-[#161514] p-4 sm:p-5 rounded-2xl border border-[#161514]/30 space-y-4 w-full font-sans overflow-hidden"
      style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
    >
      {/* ─── 1. STATEMENT MASTHEAD ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#161514]/20">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="size-6 rounded-lg bg-[#CEF431] border border-[#161514]/30 flex items-center justify-center font-black text-xs shrink-0">
              ⚡
            </span>
            <span className="text-xs font-heading font-black tracking-wider uppercase text-[#161514]">
              INVICTUS OMNITRACKER
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-heading font-black uppercase text-[#161514] tracking-tight">
            Financial Statement &amp; Ledger
          </h2>
          <p className="text-[11px] font-mono text-[#161514]/70">
            Account: <strong className="text-[#161514] font-bold">{userName}</strong> • Generated {generatedAt}
          </p>
        </div>

        <div className="bg-[#CEF431] text-[#161514] px-3 py-1.5 rounded-xl border border-[#161514]/40 shrink-0 self-start sm:self-auto max-w-[160px]">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider block opacity-75">PERIOD</span>
          <span className="text-xs font-heading font-black uppercase block tracking-wide truncate">{periodLabel}</span>
        </div>
      </div>

      {/* ─── 2. EXECUTIVE SUMMARY KPI STRIP ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white p-2.5 rounded-xl border border-[#161514]/20">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#161514]/60 block">
            Total Income
          </span>
          <span className="text-sm font-mono font-black text-[#03D26F] block mt-0.5">
            +{currencySymbol}{income.toLocaleString()}
          </span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-[#161514]/20">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#161514]/60 block">
            Total Expenses
          </span>
          <span className="text-sm font-mono font-black text-rose-600 block mt-0.5">
            -{currencySymbol}{expense.toLocaleString()}
          </span>
        </div>

        <div className={cn(
          "p-2.5 rounded-xl border border-[#161514]/20",
          net >= 0 ? "bg-[#CEF431]/30" : "bg-[#FDE68A]/40"
        )}>
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#161514]/70 block">
            Net Flow
          </span>
          <span className="text-sm font-mono font-black text-[#161514] block mt-0.5">
            {net < 0 ? `-${currencySymbol}${Math.abs(net).toLocaleString()}` : `+${currencySymbol}${net.toLocaleString()}`}
          </span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-[#161514]/20">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#161514]/60 block">
            Total Logs
          </span>
          <span className="text-sm font-mono font-black text-[#161514] block mt-0.5">
            {transactions.length} Records
          </span>
        </div>
      </div>

      {/* ─── 3. CATEGORY SPENDING BREAKDOWN ─── */}
      {categoryStats.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#161514]/70 block">
            Category Breakdown
          </span>
          <div className="flex flex-wrap gap-1.5">
            {categoryStats.map((c) => (
              <span
                key={c.id}
                className="px-2 py-0.5 rounded-lg border border-[#161514]/20 bg-white text-[11px] font-bold flex items-center gap-1.5"
              >
                <CategoryIcon name={c.icon} className="size-3 text-[#161514]" />
                <span>{c.name}:</span>
                <span className="text-[#161514] font-mono font-black">{currencySymbol}{c.totalAmount.toLocaleString()}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── 4. ITEMIZED TRANSACTION TABLE (CLEAN BANK STATEMENT LAYOUT) ─── */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] block">
          Itemized Transactions ({sortedTxs.length})
        </span>

        {sortedTxs.length === 0 ? (
          <div className="p-4 text-center bg-white rounded-xl border border-[#161514]/20">
            <p className="text-xs font-bold text-[#161514]">No transactions recorded for this period.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#161514]/25 overflow-hidden">
            {/* Table Header */}
            <div className="bg-[#161514] text-white px-2.5 sm:px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-between">
              <span className="w-16 sm:w-24 shrink-0">Date</span>
              <span className="flex-1 min-w-0 px-1.5 sm:px-2">Description &amp; Category</span>
              <span className="w-16 text-center shrink-0 hidden sm:block">Method</span>
              <span className="w-16 sm:w-24 text-right shrink-0">Amount</span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#161514]/15 border-t border-[#161514]/20">
              {sortedTxs.map((tx, idx) => {
                const category = categories.find((c) => c.id === tx.categoryId);
                const isIncome = tx.type === "income";
                const dateFormatted = tx.date ? format(parseISO(tx.date), "MMM d, yyyy") : "—";
                const dateShort = tx.date ? format(parseISO(tx.date), "MMM d") : "—";

                return (
                  <div
                    key={tx.id || idx}
                    className="px-2.5 sm:px-3 py-2 flex items-center justify-between text-xs hover:bg-[#FAF8F5] transition-colors"
                  >
                    {/* Date */}
                    <span className="w-16 sm:w-24 text-[10px] font-mono font-bold text-[#161514]/70 shrink-0 leading-tight">
                      <span className="sm:hidden">{dateShort}</span>
                      <span className="hidden sm:inline">{dateFormatted}</span>
                    </span>

                    {/* Description & Category: Stacked 2-line layout (Belanje/Apple Card benchmark) */}
                    <div className="flex-1 min-w-0 px-1.5 sm:px-2 flex items-center gap-2">
                      <CategoryIcon name={category?.icon} className="size-4 shrink-0 text-[#161514]" />
                      <div className="min-w-0 flex flex-col justify-center">
                        <span className="font-heading font-black text-xs text-[#161514] truncate leading-tight">
                          {category?.name || "Uncategorized"}
                        </span>
                        {tx.note && (
                          <span className="text-[10px] font-mono text-[#161514]/65 truncate leading-tight mt-0.5">
                            {tx.note}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Method */}
                    <span className="w-16 text-center shrink-0 hidden sm:block">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#FAF8F5] border border-[#161514]/30">
                        {tx.paymentMethod || "UPI"}
                      </span>
                    </span>

                    {/* Amount */}
                    <span className={cn(
                      "w-16 sm:w-24 text-right font-mono font-black text-xs shrink-0",
                      isIncome ? "text-[#03D26F]" : "text-rose-600"
                    )}>
                      {isIncome ? "+" : "-"}{currencySymbol}{Math.round(Number(tx.amount || 0)).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── 5. STATEMENT FOOTER ─── */}
      <div className="pt-2 border-t border-[#161514]/20 flex items-center justify-between text-[9px] font-mono text-[#161514]/60">
        <span>Invictus Life &amp; Money OS • Official Statement</span>
        <span>End of Statement</span>
      </div>
    </div>
  );
}
