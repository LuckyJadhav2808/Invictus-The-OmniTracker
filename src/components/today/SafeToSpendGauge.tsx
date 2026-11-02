'use client';

import React, { useState } from 'react';
import { Wallet, Plus, AlertTriangle, Sliders } from 'lucide-react';
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
  className?: string;
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
  className,
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
    <div
      id="expense-section"
      className={cn(
        "bg-white border border-[#E8E5DF] p-5 rounded-xl flex flex-col justify-between space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-[#F1EFEA] flex items-center justify-center text-[#161514]">
            <Wallet className="size-3.5 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="font-sans font-semibold text-[15px] text-[#161514] tracking-tight leading-none">
              Safe-to-Spend
            </h2>
            {isCustomCap && (
              <span className="text-xs text-[#047857] mt-0.5 inline-block font-mono">
                Limit: {currencySymbol}{customDailyBudget}/day
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {onOpenSetDailyLimit && (
            <Button
              variant="outline"
              size="xs"
              onClick={onOpenSetDailyLimit}
              aria-label="Set Daily Spending Limit"
              className="border border-[#E8E5DF] hover:bg-[#F5F3EF] min-h-[34px] px-2.5 cursor-pointer text-xs font-medium text-[#161514]"
              title="Set Daily Spending Amount"
            >
              <Sliders className="size-3 stroke-[1.5]" />
              <span className="hidden sm:inline">Set Limit</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="xs"
            onClick={onToggleQuickExpense}
            className="border border-[#E8E5DF] hover:bg-[#F5F3EF] min-h-[34px] px-2.5 cursor-pointer text-xs font-medium text-[#161514]"
          >
            <Plus className="size-3 stroke-[1.5]" />
            <span>Quick Log</span>
          </Button>
        </div>
      </div>

      {/* Metric Gauge Banner */}
      <div className="p-3.5 bg-[#FBF9F5] border border-[#E8E5DF] rounded-xl space-y-2">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B6B6B] block">
              Today's spend
            </span>
            <span className="font-mono font-semibold text-2xl text-[#161514] tabular-nums">
              {currencySymbol}{spentToday.toFixed(0)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs font-medium text-[#6B6B6B] block">
              {isCustomCap ? "Daily limit left" : "Safe budget left"}
            </span>
            <span
              className={cn(
                'font-mono font-semibold text-base tabular-nums',
                isOverBudget ? 'text-[#C4242A]' : 'text-[#047857]'
              )}
            >
              {isOverBudget ? '-' : ''}{currencySymbol}{Math.abs(remainingSafe).toFixed(0)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#E8E5DF] rounded-full h-1.5 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              isOverBudget ? 'bg-[#C4242A]' : 'bg-[#03D26F]'
            )}
            style={{ width: `${percentSpent}%` }}
          />
        </div>

        {isOverBudget ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#C4242A] pt-0.5">
            <AlertTriangle className="size-3.5 stroke-[1.5]" />
            <span>Exceeded {isCustomCap ? "daily limit" : "safe limit"} by {currencySymbol}{(spentToday - effectiveDailyLimit).toFixed(0)}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] pt-0.5">
            <span>{isCustomCap ? `Daily cap: ${currencySymbol}${customDailyBudget}` : `Safe pace: ~${currencySymbol}${dailySafeToSpend.toFixed(0)}/day`}</span>
            <span>{percentSpent}% used today</span>
          </div>
        )}
      </div>

      {/* Quick Add Expense Form Drawer */}
      {isQuickExpenseOpen && (
        <form
          onSubmit={handleSubmit}
          className="p-3.5 bg-white border border-[#E8E5DF] rounded-xl space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] block mb-1">
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
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8E5DF] bg-white text-xs text-[#161514] outline-none focus:border-[#161514]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#6B6B6B] block mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs font-normal p-1.5 rounded-lg border border-[#E8E5DF] bg-white text-[#161514] outline-none cursor-pointer focus:border-[#161514]"
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
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8E5DF] bg-white text-xs text-[#161514] outline-none focus:border-[#161514]"
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
              size="xs"
              disabled={isSavingExpense}
              className="bg-[#161514] text-white hover:bg-[#252321] rounded-lg text-xs font-medium"
            >
              Record Expense
            </Button>
          </div>
        </form>
      )}

      {/* Today's Transactions List */}
      {transactions.length === 0 ? (
        <div className="flex-1 p-4 text-center bg-[#FBF9F5] border border-dashed border-[#E8E5DF] rounded-xl flex items-center justify-center">
          <p className="font-mono text-xs text-[#6B6B6B]">
            {currencySymbol}0 spent today · Full daily reserve intact
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto max-h-[160px] space-y-1.5 pr-1 scrollbar-thin">
          {transactions.slice(0, 6).map((tx) => (
            <div
              key={tx.id}
              className="p-2.5 bg-white border border-[#E8E5DF] rounded-lg flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-[#161514]/40" />
                <span className="font-medium text-[#161514] truncate max-w-[140px]">
                  {tx.note || 'Expense'}
                </span>
              </div>
              <span
                className={cn(
                  'font-mono font-medium tabular-nums text-xs',
                  tx.type === 'expense' ? 'text-[#C4242A]' : 'text-[#047857]'
                )}
              >
                {tx.type === 'expense' ? '-' : '+'}
                {currencySymbol}{tx.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
