"use client";

import { type Category } from "@/types";
import { TransactionFormModal } from "@/components/money/modals/TransactionFormModal";

export interface QuickCashEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  currencySymbol: string;
  onSave: (payload: {
    amount: number;
    type: "expense";
    categoryId: string;
    date: string;
    note: string;
    paymentMethod: "Cash" | "cash";
  }) => Promise<any>;
}

/**
 * QuickCashEntryModal - Consolidated adapter around canonical TransactionFormModal (mode="cash")
 * Reuses the single TransactionFormModal pipeline with 1-Tap Cash spend chips and auto-categorization.
 */
export function QuickCashEntryModal({
  open,
  onOpenChange,
  categories,
  currencySymbol,
  onSave,
}: QuickCashEntryModalProps) {
  return (
    <TransactionFormModal
      open={open}
      onOpenChange={onOpenChange}
      mode="cash"
      categories={categories}
      currencySymbol={currencySymbol}
      onSave={async (payload) => {
        return onSave({
          amount: payload.amount,
          type: "expense",
          categoryId: payload.categoryId,
          date: payload.date,
          note: payload.note || "Cash Expense",
          paymentMethod: "Cash",
        });
      }}
    />
  );
}
