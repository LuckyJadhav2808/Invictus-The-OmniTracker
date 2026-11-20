"use client";

import React from "react";
import { type Category } from "@/types";
import { TransactionFormModal } from "@/components/money/modals/TransactionFormModal";

export interface TodayQuickExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencySymbol: string;
  categories: Category[];
  onAddExpense: (amount: number, categoryId: string, note: string) => Promise<void>;
  isSaving?: boolean;
}

/**
 * TodayQuickExpenseModal - Consolidated adapter around canonical TransactionFormModal (mode="quick")
 * Eliminates duplicate modals while preserving 100% backward compatibility for Today page workflows.
 */
export function TodayQuickExpenseModal({
  open,
  onOpenChange,
  currencySymbol,
  categories,
  onAddExpense,
}: TodayQuickExpenseModalProps) {
  return (
    <TransactionFormModal
      open={open}
      onOpenChange={onOpenChange}
      mode="quick"
      currencySymbol={currencySymbol}
      categories={categories}
      onSave={async (payload) => {
        await onAddExpense(
          payload.amount,
          payload.categoryId,
          payload.note || "Quick Expense"
        );
      }}
    />
  );
}
