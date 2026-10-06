"use client";

import React, { useState } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { type Transaction, type Category } from "@/types";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Copy, Edit2, Trash2, Calendar, CreditCard, Tag, ExternalLink } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { renderCategoryEmoji } from "@/components/money/MoneyQuickActionsAndCards";

interface TransactionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  category?: Category | null;
  currencySymbol: string;
  onEdit: (tx: Transaction) => void;
  onDuplicate: (tx: Transaction) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TransactionDetailModal({
  open,
  onOpenChange,
  transaction,
  category,
  currencySymbol,
  onEdit,
  onDuplicate,
  onDelete,
}: TransactionDetailModalProps) {
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!transaction) return null;

  const isIncome = transaction.type === "income";

  let formattedDate = transaction.date;
  try {
    formattedDate = format(parseISO(transaction.date), "EEEE, MMMM d, yyyy");
  } catch {}

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      soundFX.playPop();
      soundFX.vibrate(25);
      await onDuplicate(transaction);
      onOpenChange(false);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(transaction);
  };

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="Transaction Inspector"
      description="Record telemetry and receipt audit"
    >
      <div className="space-y-4 pt-1">
        {/* Hero Amount & Type Card */}
        <div
          className={cn(
            "p-4 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] text-center space-y-1",
            isIncome ? "bg-[#03D26F]/15" : "bg-rose-50"
          )}
        >
          <span
            className={cn(
              "text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#161514] inline-block",
              isIncome ? "bg-[#03D26F] text-[#161514]" : "bg-rose-400 text-[#161514]"
            )}
          >
            {isIncome ? "💰 Income Deposit" : "💸 Expense Outflow"}
          </span>

          <span
            className={cn(
              "text-3xl sm:text-4xl font-black block font-heading",
              isIncome ? "text-emerald-700" : "text-rose-600"
            )}
          >
            {isIncome ? "+" : "-"}{currencySymbol}{Number(transaction.amount).toLocaleString()}
          </span>

          {transaction.note && (
            <p className="text-sm font-bold text-[#161514] pt-1">
              &ldquo;{transaction.note}&rdquo;
            </p>
          )}
        </div>

        {/* Telemetry Breakdown Details */}
        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] space-y-2.5 text-xs">
          {/* Category */}
          <div className="flex items-center justify-between py-1 border-b border-[#161514]/10">
            <span className="text-[#161514]/60 font-bold flex items-center gap-1.5">
              <Tag className="size-3.5" />
              <span>Category</span>
            </span>
            <span className="font-black text-[#161514] flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-[#161514]">
              <span>{renderCategoryEmoji(category?.icon)}</span>
              <span>{category?.name || "Uncategorized"}</span>
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between py-1 border-b border-[#161514]/10">
            <span className="text-[#161514]/60 font-bold flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <span>Date Logged</span>
            </span>
            <span className="font-bold text-[#161514]">{formattedDate}</span>
          </div>

          {/* Payment Method */}
          <div className="flex items-center justify-between py-1 border-b border-[#161514]/10">
            <span className="text-[#161514]/60 font-bold flex items-center gap-1.5">
              <CreditCard className="size-3.5" />
              <span>Payment Mode</span>
            </span>
            <span className="font-black uppercase text-[#161514] bg-white px-2 py-0.5 rounded-lg border border-[#161514]">
              {transaction.paymentMethod === "cash" ? "💵 Cash" : "📱 " + (transaction.paymentMethod || "UPI")}
            </span>
          </div>

          {/* Telemetry ID */}
          <div className="flex items-center justify-between py-1 text-[10px] text-[#161514]/50">
            <span>Audit Ref:</span>
            <span className="font-mono">{transaction.id}</span>
          </div>
        </div>

        {/* Receipt Attachment (if present) */}
        {transaction.attachmentUrl && (
          <div className="bg-white p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] space-y-2">
            <span className="text-[10px] font-black uppercase text-[#161514] block">Attached Receipt</span>
            <div className="relative rounded-xl overflow-hidden border border-[#161514] max-h-48 bg-gray-100 flex items-center justify-center">
              <img
                src={transaction.attachmentUrl}
                alt="Receipt"
                className="w-full h-full object-contain"
              />
            </div>
            <a
              href={transaction.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-black text-navy-700 flex items-center gap-1 hover:underline"
            >
              <span>View Full Resolution</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        )}

        {/* ⚡ Action Buttons Dock: 1-Click Duplicate, Edit, Delete */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {/* 1-Click Duplicate */}
          <button
            type="button"
            disabled={isDuplicating}
            onClick={handleDuplicate}
            className="bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-[11px] uppercase tracking-wider py-2.5 px-2 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            title="Duplicate with today's date"
          >
            <Copy className="size-3.5" />
            <span>{isDuplicating ? "Copying…" : "Duplicate"}</span>
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={handleEdit}
            className="bg-white hover:bg-[#FAF8F5] text-[#161514] font-black text-[11px] uppercase tracking-wider py-2.5 px-2 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <Edit2 className="size-3.5" />
            <span>Edit</span>
          </button>

          {/* Delete */}
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-black text-[11px] uppercase tracking-wider py-2.5 px-2 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            <span>{isDeleting ? "…" : "Delete"}</span>
          </button>
        </div>
      </div>
    </ResponsiveFormContainer>
  );
}
