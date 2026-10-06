'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Wallet, Plus, ArrowRight, AlertTriangle, Sliders } from 'lucide-react';
import { type Transaction, type Category } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SafeToSpendGaugeProps {
  spentToday: number;
  dailySafeToSpend: number;
  customDailyBudget?: number | null;
  currencySymbol: string;
  transactions: Transaction[];
  categories: Category[];
  isQuickExpenseOpen: boolean;
  onToggleQuickExpense: () => void;
  onAddExpense: (amount: number, categoryId: string, note: string) => Promise<void>;
  isSavingExpense: boolean;
  onOpenSetDailyLimit?: () => void;
}

export function SafeToSpendGauge({
  spentToday,
  dailySafeToSpend,
  customDailyBudget = null,
  currencySymbol,
  transactions,
  categories,
  isQuickExpenseOpen,
  onToggleQuickExpense,
  onAddExpense,
  isSavingExpense,
  onOpenSetDailyLimit,
}: SafeToSpendGaugeProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');

  const isCustomCap = customDailyBudget !== null && customDailyBudget !== undefined && customDailyBudget > 0;
  const effectiveDailyLimit = isCustomCap ? customDailyBudget : dailySafeToSpend;
  const remainingSafe = effectiveDailyLimit - spentToday;
  const isOverBudget = spentToday > effectiveDailyLimit && effectiveDailyLimit > 0;
  const percentSpent = effectiveDailyLimit > 0 ? Math.min(100, Math.round((spentToday / effectiveDailyLimit) * 100)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    await onAddExpense(num, categoryId || (categories[0]?.id || 'cat-food'), note);
    setAmount('');
    setNote('');
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div id="expense-section" className="bg-white border-2 border-[#161514] p-5 rounded-xl shadow-[3px_3px_0px_#161514] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#161514]/15 pb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-[#03D26F] border-2 border-[#161514] flex items-center justify-center text-[#161514]">
            <Wallet className="size-3.5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-heading font-black text-base text-[#161514] tracking-tight leading-none">
              Safe-to-Spend Gauge
            </h2>
            {isCustomCap && (
              <span className="text-[9px] font-black uppercase text-[#037A48] mt-0.5 inline-block">
                ⚡ Fixed Limit: {currencySymbol}{customDailyBudget}/day
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSetDailyLimit && (
            <Button
              variant="outline"
              size="xs"
              onClick={onOpenSetDailyLimit}
              className="border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] active:scale-[0.97]"
              title="Set Daily Spending Amount"
            >
              <Sliders className="size-3 stroke-[2.5]" />
              <span className="hidden sm:inline">{isCustomCap ? `${currencySymbol}${customDailyBudget}/d` : "Set Daily Cap"}</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="xs"
            onClick={onToggleQuickExpense}
            className="border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] active:scale-[0.97]"
          >
            <Plus className="size-3 stroke-[3]" />
            <span>Quick Log</span>
          </Button>
        </div>
      </div>

      {/* Metric Gauge Banner */}
      <div className="p-3.5 bg-[#FBF9F5] border-2 border-[#161514] rounded-xl space-y-2 shadow-[2px_2px_0px_#161514]">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[10px] font-mono font-black uppercase text-[#161514]/65 block">
              TODAY'S SPENT
            </span>
            <span className="font-mono font-black text-2xl text-[#161514]">
              {currencySymbol}{spentToday.toFixed(0)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono font-black uppercase text-[#161514]/65 block">
              {isCustomCap ? "DAILY LIMIT LEFT" : "SAFE BUDGET LEFT"}
            </span>
            <span
              className={cn(
                'font-mono font-black text-base',
                isOverBudget ? 'text-rose-600' : 'text-emerald-700'
              )}
            >
              {isOverBudget ? '-' : ''}{currencySymbol}{Math.abs(remainingSafe).toFixed(0)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#EAE8E3] rounded-full h-2.5 border border-[#161514]/25 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              isOverBudget ? 'bg-[#FF4343]' : 'bg-[#03D26F]'
            )}
            style={{ width: `${percentSpent}%` }}
          />
        </div>

        {isOverBudget ? (
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700 pt-0.5">
            <AlertTriangle className="size-3.5 stroke-[2.5]" />
            <span>Exceeded today's {isCustomCap ? "daily limit" : "safe limit"} by {currencySymbol}{(spentToday - effectiveDailyLimit).toFixed(0)}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[10px] font-bold text-[#161514]/60 pt-0.5">
            <span>{isCustomCap ? `Daily Cap: ${currencySymbol}${customDailyBudget}` : `Safe Pace: ~${currencySymbol}${dailySafeToSpend.toFixed(0)}/day`}</span>
            <span>{percentSpent}% used today</span>
          </div>
        )}
      </div>

      {/* Quick Add Expense Form Drawer */}
      {isQuickExpenseOpen && (
        <form
          onSubmit={handleSubmit}
          className="p-3.5 bg-[#FFFDF8] border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_#161514] space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-heading font-black uppercase text-[#161514]/70 block mb-1">
                Amount ({currencySymbol})
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full neo-input py-1.5 text-base md:text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-heading font-black uppercase text-[#161514]/70 block mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs font-bold p-1.5 rounded-lg border-2 border-[#161514] bg-white outline-none cursor-pointer"
              >
                {expenseCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="Note (e.g. Lunch with team)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full neo-input py-1.5 text-base md:text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onToggleQuickExpense}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="xs"
              disabled={isSavingExpense}
              className="bg-[#03D26F] text-[#161514] hover:bg-[#02B860]"
            >
              Record Expense
            </Button>
          </div>
        </form>
      )}

      {/* Today's Transactions List */}
      {transactions.length === 0 ? (
        <div className="p-5 text-center space-y-1.5 bg-[#FBF9F5] border-2 border-dashed border-[#161514]/25 rounded-xl">
          <p className="font-heading font-black text-xs text-[#161514]">
            No expenses logged today!
          </p>
          <p className="text-[11px] text-[#161514]/60">
            Daily safe limit is intact and untouched.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.slice(0, 4).map((tx) => (
            <div
              key={tx.id}
              className="p-2.5 bg-white border-2 border-[#161514] rounded-lg flex items-center justify-between text-xs shadow-[1.5px_1.5px_0px_#161514]"
            >
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-[#161514]" />
                <span className="font-bold text-[#161514] truncate max-w-[140px]">
                  {tx.note || 'Expense'}
                </span>
              </div>
              <span
                className={cn(
                  'font-mono font-black',
                  tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-700'
                )}
              >
                {tx.type === 'expense' ? '-' : '+'}
                {currencySymbol}{tx.amount}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer Navigation Link */}
      <div className="pt-2 border-t border-[#161514]/15 flex items-center justify-between text-xs">
        <span className="text-[#161514]/60 font-medium">Vault balances & rollover</span>
        <Link
          href="/money"
          className="font-heading font-black text-[#161514] hover:underline flex items-center gap-1"
        >
          <span>Ledger & Vault</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
