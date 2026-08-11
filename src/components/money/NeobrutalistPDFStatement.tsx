"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { type Transaction, type Category } from "@/types";
import { renderCategoryEmoji } from "@/components/money/MoneyQuickActionsAndCards";
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
  const generatedAt = useMemo(() => format(new Date(), "MMMM d, yyyy 'at' hh:mm a"), []);

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

  // Group Chronologically by Date (YYYY-MM-DD)
  const groupedTxs = useMemo(() => {
    const groups: { [dateKey: string]: { dateKey: string; txs: Transaction[]; dayNet: number } } = {};
    transactions.forEach((tx) => {
      const dateKey = tx.date ? tx.date.split("T")[0] : format(new Date(), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = { dateKey, txs: [], dayNet: 0 };
      }
      groups[dateKey].txs.push(tx);
      const amt = tx.amount || 0;
      groups[dateKey].dayNet += tx.type === "income" ? amt : -amt;
    });

    return Object.values(groups).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [transactions]);

  return (
    <div
      id="invictus-pdf-statement"
      className="invictus-statement-print bg-[#FAF8F5] text-[#161514] p-6 sm:p-8 rounded-3xl border-4 border-[#161514] shadow-[8px_8px_0px_0px_rgba(22,21,20,1)] space-y-6 min-w-[650px] max-w-4xl mx-auto font-sans"
      style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
    >
      {/* 1. Statement Header & Watermark */}
      <div className="flex items-center justify-between gap-4 pb-6 border-b-4 border-[#161514]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center font-black text-sm shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]">
              ⚡
            </span>
            <span className="text-xl font-black tracking-tight uppercase" style={{ fontFamily: "var(--font-heading)" }}>
              INVICTUS OMNITRACKER
            </span>
          </div>
          <h2 className="text-2xl font-black uppercase text-[#161514] tracking-tight">
            LEDGER & FINANCIAL STATEMENT
          </h2>
          <p className="text-xs font-bold text-[#161514] opacity-70">
            Account Holder: <strong className="text-[#161514]">{userName}</strong> • Generated: {generatedAt}
          </p>
        </div>

        <div className="bg-[#CEF431] text-[#161514] px-4 py-2.5 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] text-right shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest block opacity-80">STATEMENT PERIOD</span>
          <span className="text-xs sm:text-sm font-black uppercase block tracking-wide">{periodLabel}</span>
        </div>
      </div>

      {/* 2. Cashflow Overview Grid */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#161514] opacity-70 block whitespace-nowrap">
            INCOME
          </span>
          <span className="text-base font-black text-[#03D26F] block whitespace-nowrap">
            +{currencySymbol}{income.toLocaleString()}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#161514] opacity-70 block whitespace-nowrap">
            EXPENSE
          </span>
          <span className="text-base font-black text-[#E11D48] block whitespace-nowrap">
            -{currencySymbol}{expense.toLocaleString()}
          </span>
        </div>

        <div className={cn(
          "p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-1",
          net >= 0 ? "bg-[#CEF431]" : "bg-[#FDE68A]"
        )}>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#161514] opacity-80 block whitespace-nowrap">
            NET FLOW
          </span>
          <span className="text-base font-black text-[#161514] block whitespace-nowrap">
            {net < 0 ? `-${currencySymbol}${Math.abs(net).toLocaleString()}` : `+${currencySymbol}${net.toLocaleString()}`}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#161514] opacity-70 block whitespace-nowrap">
            TOTAL LOGS
          </span>
          <span className="text-base font-black text-[#161514] block whitespace-nowrap">
            {transactions.length} {transactions.length === 1 ? "Record" : "Records"}
          </span>
        </div>
      </div>

      {/* 3. Category Spending Summary */}
      {categoryStats.length > 0 && (
        <div className="bg-white p-4.5 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5">
            🏷️ Category Spending Breakdown
          </h4>
          <div className="flex flex-wrap gap-2">
            {categoryStats.map((c) => (
              <span
                key={c.id}
                className="px-3 py-1.5 rounded-xl border border-[#161514] bg-[#FAF8F5] text-xs font-black flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]"
              >
                <span>{renderCategoryEmoji(c.icon)}</span>
                <span>{c.name}:</span>
                <span className="text-[#047857] font-extrabold">{currencySymbol}{c.totalAmount.toLocaleString()}</span>
                <span className="text-[10px] text-[#161514] opacity-60 font-bold">({c.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4. Chronological Day-by-Day Transaction Records */}
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5">
          📜 Itemized Transaction Ledger
        </h4>

        {groupedTxs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border-2 border-[#161514]">
            <p className="text-xs font-black text-[#161514]">No transactions found for this statement period.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedTxs.map((group) => {
              const formattedDayHeader = format(parseISO(group.dateKey), "EEEE • MMMM d, yyyy").toUpperCase();
              return (
                <div key={group.dateKey} className="space-y-2">
                  {/* Day Header */}
                  <div className="bg-[#161514] text-white px-4 py-2 rounded-xl border-2 border-[#161514] flex items-center justify-between">
                    <span className="text-xs font-black tracking-wider">{formattedDayHeader}</span>
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-white/20",
                      group.dayNet >= 0 ? "bg-[#03D26F] text-[#161514]" : "bg-[#CEF431] text-[#161514]"
                    )}>
                      {group.dayNet >= 0 ? `+${currencySymbol}${group.dayNet.toLocaleString()} Net` : `-${currencySymbol}${Math.abs(group.dayNet).toLocaleString()} Spent`}
                    </span>
                  </div>

                  {/* Day's Transactions List */}
                  <div className="bg-white rounded-2xl border-2 border-[#161514] divide-y-2 divide-[#161514] overflow-hidden shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]">
                    {group.txs.map((tx) => {
                      const category = categories.find((c) => c.id === tx.categoryId);
                      const isIncome = tx.type === "income";
                      return (
                        <div
                          key={tx.id}
                          className="invictus-tx-row p-3.5 flex items-center justify-between gap-3 text-xs font-bold"
                          style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="text-base shrink-0">{renderCategoryEmoji(category?.icon)}</span>
                            <div className="truncate">
                              <span className="font-black text-[#161514]">{category?.name || "Uncategorized"}</span>
                              {tx.note && <span className="text-[#161514] opacity-60 font-semibold truncate ml-1.5">- {tx.note}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="capitalize text-[10px] font-black px-2 py-0.5 rounded bg-[#FDE68A] border border-[#161514]">
                              {tx.paymentMethod || "UPI"}
                            </span>
                            <span className={cn("font-black text-sm", isIncome ? "text-[#03D26F]" : "text-[#E11D48]")}>
                              {isIncome ? "+" : "-"}{currencySymbol}{tx.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Statement Footer */}
      <div className="pt-6 border-t-2 border-[#161514]/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-extrabold text-[#161514]/60">
        <span>Invictus Life & Money OmniTracker • Official Statement</span>
        <span>End of Statement</span>
      </div>
    </div>
  );
}
