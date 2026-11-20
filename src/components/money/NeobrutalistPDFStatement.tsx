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
      className="invictus-statement-print bg-[#FAF8F5] text-[#161514] p-4 sm:p-7 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-[#161514] shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] sm:shadow-[6px_6px_0px_0px_rgba(22,21,20,1)] space-y-4 sm:space-y-6 w-full max-w-4xl mx-auto font-sans overflow-hidden"
      style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
    >
      {/* 1. Statement Header & Watermark */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b-3 sm:border-b-4 border-[#161514]">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="size-7 sm:size-8 rounded-xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center font-black text-xs sm:text-sm shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] shrink-0">
              ⚡
            </span>
            <span className="text-sm sm:text-base font-black tracking-tight uppercase truncate" style={{ fontFamily: "var(--font-heading)" }}>
              INVICTUS OMNITRACKER
            </span>
          </div>
          <h2 className="text-base sm:text-xl font-heading font-black uppercase text-[#161514] tracking-tight truncate">
            LEDGER &amp; FINANCIAL STATEMENT
          </h2>
          <p className="text-[10px] sm:text-xs font-mono font-bold text-[#161514]/70 truncate">
            Account Holder: <strong className="text-[#161514]">{userName}</strong> • {generatedAt}
          </p>
        </div>

        <div className="bg-[#CEF431] text-[#161514] px-3.5 py-2 rounded-xl sm:rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] text-left sm:text-right shrink-0 self-start sm:self-auto">
          <span className="text-[9px] font-mono font-black uppercase tracking-widest block opacity-75">STATEMENT PERIOD</span>
          <span className="text-xs sm:text-sm font-heading font-black uppercase block tracking-wide truncate">{periodLabel}</span>
        </div>
      </div>

      {/* 2. Cashflow Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white p-3 rounded-xl sm:rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] space-y-0.5">
          <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-wider text-[#161514]/70 block truncate">
            INCOME
          </span>
          <span className="text-sm sm:text-base font-mono font-black text-[#03D26F] block truncate">
            +{currencySymbol}{income.toLocaleString()}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl sm:rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] space-y-0.5">
          <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-wider text-[#161514]/70 block truncate">
            EXPENSE
          </span>
          <span className="text-sm sm:text-base font-mono font-black text-[#E11D48] block truncate">
            -{currencySymbol}{expense.toLocaleString()}
          </span>
        </div>

        <div className={cn(
          "p-3 rounded-xl sm:rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] space-y-0.5",
          net >= 0 ? "bg-[#CEF431]" : "bg-[#FDE68A]"
        )}>
          <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-wider text-[#161514]/80 block truncate">
            NET FLOW
          </span>
          <span className="text-sm sm:text-base font-mono font-black text-[#161514] block truncate">
            {net < 0 ? `-${currencySymbol}${Math.abs(net).toLocaleString()}` : `+${currencySymbol}${net.toLocaleString()}`}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl sm:rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] space-y-0.5">
          <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-wider text-[#161514]/70 block truncate">
            TOTAL LOGS
          </span>
          <span className="text-sm sm:text-base font-mono font-black text-[#161514] block truncate">
            {transactions.length} Records
          </span>
        </div>
      </div>

      {/* 3. Category Spending Summary */}
      {categoryStats.length > 0 && (
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-2.5">
          <h4 className="text-[11px] sm:text-xs font-heading font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5">
            🏷️ Category Spending Breakdown
          </h4>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {categoryStats.map((c) => (
              <span
                key={c.id}
                className="px-2.5 py-1 rounded-xl border-2 border-[#161514] bg-[#FAF8F5] text-[11px] font-black flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]"
              >
                <CategoryIcon name={c.icon} className="size-3.5 inline-block text-[#161514]" />
                <span>{c.name}:</span>
                <span className="text-[#047857] font-mono font-black">{currencySymbol}{c.totalAmount.toLocaleString()}</span>
                <span className="text-[10px] text-[#161514]/60 font-mono">({c.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4. Chronological Day-by-Day Transaction Records */}
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5">
          Itemized Transaction Ledger
        </h4>

        {groupedTxs.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-2xl border-2 border-[#161514]">
            <p className="text-xs font-black text-[#161514]">No transactions found for this statement period.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {groupedTxs.map((group) => {
              const formattedDayHeader = format(parseISO(group.dateKey), "EEEE • MMMM d, yyyy").toUpperCase();
              return (
                <div key={group.dateKey} className="space-y-2">
                  {/* Day Header */}
                  <div className="bg-[#161514] text-white px-3.5 py-2 rounded-xl border-2 border-[#161514] flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-heading font-black tracking-wider truncate">{formattedDayHeader}</span>
                    <span className={cn(
                      "text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full border border-white/20 shrink-0",
                      group.dayNet >= 0 ? "bg-[#03D26F] text-[#161514]" : "bg-[#CEF431] text-[#161514]"
                    )}>
                      {group.dayNet >= 0 ? `+${currencySymbol}${group.dayNet.toLocaleString()}` : `-${currencySymbol}${Math.abs(group.dayNet).toLocaleString()}`}
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
                          className="invictus-tx-row p-3 flex items-center justify-between gap-2.5 text-xs font-bold"
                          style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <CategoryIcon name={category?.icon} className="size-4 shrink-0 text-[#161514]" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-heading font-black text-[#161514] truncate">{category?.name || "Uncategorized"}</span>
                                {tx.note && <span className="text-[#161514]/60 font-medium text-[11px] truncate">- {tx.note}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="uppercase text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FDE68A] border border-[#161514]">
                              {tx.paymentMethod || "UPI"}
                            </span>
                            <span className={cn("font-mono font-black text-xs sm:text-sm", isIncome ? "text-[#03D26F]" : "text-[#E11D48]")}>
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
      <div className="pt-4 border-t-2 border-[#161514]/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono font-bold text-[#161514]/60">
        <span>Invictus Life &amp; Money OmniTracker • Official Statement</span>
        <span>End of Statement</span>
      </div>
    </div>
  );
}
