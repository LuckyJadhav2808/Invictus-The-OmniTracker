"use client";

import { useState } from "react";
import {
  useDebts,
  useAddDebt,
  useSettleDebt,
  useDeleteDebt,
  useAddTransaction,
  useCategories,
} from "@/lib/queries/money";
import { type Debt } from "@/types";
import { toast } from "sonner";
import {
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CheckCircle2,
  Trash2,
  Calendar,
  UserCheck,
  Check,
  AlertCircle,
  Filter,
} from "lucide-react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { NeobrutalistDateTimePickerModal } from "@/components/shared/NeobrutalistDateTimePickerModal";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DebtTrackerProps {
  currencySymbol?: string;
}

export function DebtTracker({ currencySymbol = "₹" }: DebtTrackerProps) {
  const { data: debts = [], isLoading } = useDebts();
  const addDebtMutation = useAddDebt();
  const settleDebtMutation = useSettleDebt();
  const deleteDebtMutation = useDeleteDebt();
  const addTransactionMutation = useAddTransaction();
  const { data: categories = [] } = useCategories();

  // Filter State: "all" | "pending" | "settled"
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "settled">("pending");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDueDatePickerOpen, setIsDueDatePickerOpen] = useState(false);
  const [personName, setPersonName] = useState("");
  const [debtType, setDebtType] = useState<"lent" | "borrowed">("lent");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  // Settle Confirmation Modal State
  const [settlingDebt, setSettlingDebt] = useState<Debt | null>(null);
  const [autoLogTx, setAutoLogTx] = useState(true);

  // Delete Modal State
  const [deletingDebtId, setDeletingDebtId] = useState<string | null>(null);

  // Calculations
  const pendingDebts = debts.filter((d) => d.status === "pending");
  const totalLent = pendingDebts
    .filter((d) => d.type === "lent")
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const totalBorrowed = pendingDebts
    .filter((d) => d.type === "borrowed")
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const netBalance = totalLent - totalBorrowed;

  // Filtered List
  const filteredDebts = debts.filter((d) => {
    if (filterStatus === "pending") return d.status === "pending";
    if (filterStatus === "settled") return d.status === "settled";
    return true;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid person name and amount");
      return;
    }

    try {
      await addDebtMutation.mutateAsync({
        personName: personName.trim(),
        type: debtType,
        amount: parseFloat(amount),
        dueDate: dueDate || "",
        note: note.trim() || "",
      });

      toast.success(
        debtType === "lent"
          ? `Record saved: ${personName} owes you ${currencySymbol}${amount}`
          : `Record saved: You owe ${personName} ${currencySymbol}${amount}`
      );

      // Reset Form
      setPersonName("");
      setAmount("");
      setDueDate("");
      setNote("");
      setIsAddModalOpen(false);
    } catch {
      toast.error("Failed to save debt record");
    }
  };

  const handleConfirmSettle = async () => {
    if (!settlingDebt) return;

    try {
      await settleDebtMutation.mutateAsync({ id: settlingDebt.id });

      // Auto-Log transaction in Financial Ledger if selected
      if (autoLogTx) {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        if (settlingDebt.type === "lent") {
          // You got paid back ➔ Log Income
          const incCategory = categories.find((c) => c.type === "income") || categories[0];
          await addTransactionMutation.mutateAsync({
            amount: settlingDebt.amount,
            type: "income",
            categoryId: incCategory?.id || "other-income",
            date: todayStr,
            note: `Debt Settled by ${settlingDebt.personName}${settlingDebt.note ? ` (${settlingDebt.note})` : ""}`,
            paymentMethod: "UPI",
            isRecurring: false,
          });
        } else {
          // You paid back someone ➔ Log Expense
          const expCategory = categories.find((c) => c.type === "expense") || categories[0];
          await addTransactionMutation.mutateAsync({
            amount: settlingDebt.amount,
            type: "expense",
            categoryId: expCategory?.id || "other-expense",
            date: todayStr,
            note: `Settled Debt to ${settlingDebt.personName}${settlingDebt.note ? ` (${settlingDebt.note})` : ""}`,
            paymentMethod: "UPI",
            isRecurring: false,
          });
        }
      }

      toast.success(`Settled up with ${settlingDebt.personName}! 🎉`);
      setSettlingDebt(null);
    } catch {
      toast.error("Failed to settle debt record");
    }
  };

  const handleDelete = async () => {
    if (!deletingDebtId) return;
    try {
      await deleteDebtMutation.mutateAsync(deletingDebtId);
      toast.success("Debt record deleted");
      setDeletingDebtId(null);
    } catch {
      toast.error("Failed to delete record");
    }
  };

  return (
    <div className="bg-white dark:bg-[#161514] rounded-2xl p-5 border border-[#E8E5DF] dark:border-[#2A2724] text-[#161514] dark:text-[#FAF8F5] transition-all space-y-5 my-4 shadow-xs">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E5DF] dark:border-[#2A2724]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#F1EFEA] dark:bg-[#22201D] text-[#161514] dark:text-[#FAF8F5] text-xs font-medium px-2.5 py-0.5 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] flex items-center gap-1.5">
              <HandCoins className="size-3.5 stroke-[1.5]" /> Debt Ledger
            </span>
            <span className="bg-[#F1EFEA] dark:bg-[#22201D] text-[#161514] dark:text-[#FAF8F5] text-xs font-mono font-medium px-2 py-0.5 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724]">
              {pendingDebts.length} Pending
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#161514] dark:text-[#FAF8F5] pt-0.5 font-sans">
            Lent & Borrowed Money
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-[#161514] hover:bg-[#2A2826] text-white dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] font-medium text-xs cursor-pointer transition-colors flex items-center gap-1.5 self-start sm:self-auto border border-[#161514] dark:border-white shadow-xs"
        >
          <Plus className="size-3.5 stroke-[2]" />
          <span>Add Loan or IOU</span>
        </button>
      </div>

      {/* 2. KPI Summary Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Total Lent */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] space-y-1">
          <span className="text-xs font-medium text-[#6B6B6B] dark:text-[#A8A29E] flex items-center gap-1">
            <ArrowUpRight className="size-3.5 text-emerald-600 stroke-[1.5]" /> You Lent (Receivable)
          </span>
          <div className="text-lg sm:text-xl font-semibold text-emerald-600 font-mono tabular-nums">
            +{currencySymbol}{totalLent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">Money friends owe you</p>
        </div>

        {/* Card 2: Total Borrowed */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] space-y-1">
          <span className="text-xs font-medium text-[#6B6B6B] dark:text-[#A8A29E] flex items-center gap-1">
            <ArrowDownLeft className="size-3.5 text-rose-600 stroke-[1.5]" /> You Borrowed (Payable)
          </span>
          <div className="text-lg sm:text-xl font-semibold text-rose-600 font-mono tabular-nums">
            -{currencySymbol}{totalBorrowed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">Money you owe to others</p>
        </div>

        {/* Card 3: Net Balance */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] space-y-1">
          <span className="text-xs font-medium text-[#6B6B6B] dark:text-[#A8A29E] flex items-center gap-1">
            ⚖️ Net Position
          </span>
          <div className={cn("text-lg sm:text-xl font-semibold font-mono tabular-nums", netBalance >= 0 ? "text-emerald-600" : "text-rose-600")}>
            {netBalance >= 0 ? "+" : ""}{currencySymbol}{netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">
            {netBalance >= 0 ? "Net Receivable" : "Net Owed"}
          </p>
        </div>
      </div>

      {/* 3. Filter Controls Strip */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E8E5DF] dark:border-[#2A2724]">
        <div className="flex items-center gap-1 bg-[#F1EFEA] dark:bg-[#1C1A18] p-1 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterStatus("pending")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0",
              filterStatus === "pending"
                ? "bg-white dark:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] shadow-xs font-semibold"
                : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
            )}
          >
            Pending ({pendingDebts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0",
              filterStatus === "all"
                ? "bg-white dark:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] shadow-xs font-semibold"
                : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
            )}
          >
            All Records ({debts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("settled")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0",
              filterStatus === "settled"
                ? "bg-white dark:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] shadow-xs font-semibold"
                : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
            )}
          >
            Settled ({debts.filter((d) => d.status === "settled").length})
          </button>
        </div>
      </div>

      {/* 4. Debt Records List */}
      <div className="space-y-2.5">
        {filteredDebts.length === 0 ? (
          <div className="text-center py-8 bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-dashed border-[#E8E5DF] dark:border-[#2A2724] space-y-2">
            <UserCheck className="size-8 mx-auto text-[#6B6B6B] dark:text-[#A8A29E]" />
            <h4 className="font-semibold text-sm text-[#161514] dark:text-[#FAF8F5]">No Debt Records Found</h4>
            <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] max-w-xs mx-auto">
              {filterStatus === "pending"
                ? "Awesome! You have no pending debts or money owed."
                : "Tap '+ Add Loan or IOU' above to start tracking loans."}
            </p>
          </div>
        ) : (
          filteredDebts.map((d) => {
            const isLent = d.type === "lent";
            const isSettled = d.status === "settled";

            const todayStr = format(new Date(), "yyyy-MM-dd");
            const isDueToday = d.dueDate === todayStr;
            const isOverdue = d.dueDate && d.dueDate < todayStr;

            return (
              <div
                key={d.id}
                className={cn(
                  "p-3.5 sm:p-4 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] space-y-2.5 transition-colors",
                  isSettled
                    ? "bg-[#FAF8F5]/60 dark:bg-[#161514]/60 opacity-75"
                    : "bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#22201D]"
                )}
              >
                {/* Responsive Debt Card Layout */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Avatar & Name Details */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "size-9 shrink-0 rounded-lg flex items-center justify-center font-semibold text-xs font-mono",
                        isLent
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                          : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40"
                      )}
                    >
                      {d.personName.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-semibold text-sm text-[#161514] dark:text-[#FAF8F5] truncate leading-tight">{d.personName}</h4>
                        <span
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded border uppercase shrink-0 font-mono",
                            isLent
                              ? "bg-[#DCFAE5] dark:bg-emerald-950/40 border-[#03D26F]/30 dark:border-emerald-800 text-[#047857] dark:text-emerald-400"
                              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400"
                          )}
                        >
                          {isLent ? "Lent" : "Borrowed"}
                        </span>
                        {isSettled && (
                          <span className="text-[10px] font-medium bg-[#F1EFEA] dark:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531]">
                            Settled
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] truncate">
                        {d.note || (isLent ? "Money lent to friend" : "Borrowed money")}
                      </p>
                    </div>
                  </div>

                  {/* Right/Bottom: Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-1.5 sm:pt-0 border-t border-[#E8E5DF] dark:border-[#2A2724] sm:border-t-0">
                    <div className="text-left sm:text-right">
                      <div
                        className={cn(
                          "font-semibold text-base sm:text-lg leading-tight font-mono tabular-nums",
                          isLent ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {isLent ? "+" : "-"}{currencySymbol}
                        {d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-[#A8A29E] font-mono block">
                        {d.createdAt ? d.createdAt.split("T")[0] : ""}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isSettled && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const msg = isLent
                                ? `Hey ${d.personName}! Just a friendly reminder about the ${currencySymbol}${d.amount} split${d.note ? ` for "${d.note}"` : ""}${d.dueDate ? ` due on ${d.dueDate}` : ""}. Thanks!`
                                : `Hey ${d.personName}! Reminding myself to pay back the ${currencySymbol}${d.amount}${d.note ? ` for "${d.note}"` : ""}. Settling up soon!`;
                              navigator.clipboard.writeText(msg);
                              toast.success(`Reminder text for ${d.personName} copied to clipboard`);
                            }}
                            className="size-8 rounded-lg bg-white dark:bg-[#22201D] hover:bg-[#F5F3EF] dark:hover:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                            title="Copy Reminder Text for WhatsApp/SMS"
                          >
                            <span className="text-xs">💬</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSettlingDebt(d);
                              setAutoLogTx(true);
                            }}
                            className="h-8 px-2.5 rounded-lg bg-[#161514] hover:bg-[#2A2826] text-white dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] font-medium text-xs border border-[#161514] dark:border-white flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            title="Mark Paid & Settle Up"
                          >
                            <CheckCircle2 className="size-3.5 stroke-[2]" />
                            <span>Settle</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeletingDebtId(d.id)}
                        className="size-8 rounded-lg bg-white dark:bg-[#22201D] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center cursor-pointer transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="size-3.5 stroke-[1.5]" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Due Date Banner (Only rendered when due date is set and pending) */}
                {d.dueDate && !isSettled && (
                  <div className="pt-0.5">
                    {isOverdue ? (
                      <div className="w-full px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 text-xs font-medium flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 truncate">
                          <AlertCircle className="size-3.5 stroke-[1.5] shrink-0" />
                          <span>Overdue payment</span>
                        </span>
                        <span className="shrink-0 bg-white dark:bg-[#1C1A18] px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 font-mono text-[10px]">
                          Due: {d.dueDate}
                        </span>
                      </div>
                    ) : isDueToday ? (
                      <div className="w-full px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 text-xs font-medium flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 truncate">
                          <Calendar className="size-3.5 stroke-[1.5] shrink-0" />
                          <span>Payment due today</span>
                        </span>
                        <span className="shrink-0 bg-white dark:bg-[#1C1A18] px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-mono text-[10px]">
                          {d.dueDate}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full px-2.5 py-1 rounded-lg bg-[#F1EFEA] dark:bg-[#22201D] text-[#6B6B6B] dark:text-[#A8A29E] border border-[#E8E5DF] dark:border-[#2A2724] text-xs flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 truncate">
                          <Calendar className="size-3.5 stroke-[1.5] text-[#6B6B6B] dark:text-[#A8A29E] shrink-0" />
                          <span>Target due date</span>
                        </span>
                        <span className="shrink-0 font-mono text-[10px]">{d.dueDate}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. ADD DEBT MODAL */}
      <ResponsiveFormContainer
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Add Loan or IOU"
        description="Track money lent or borrowed."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          {/* Debt Type Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5]">Record Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDebtType("lent")}
                className={`py-2 px-3 rounded-xl font-medium text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  debtType === "lent"
                    ? "bg-[#161514] text-white dark:bg-[#FAF8F5] dark:text-[#161514] border-[#161514] dark:border-white shadow-xs"
                    : "bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#6B6B6B] dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-white dark:hover:bg-[#22201D]"
                }`}
              >
                <ArrowUpRight className="h-4 w-4 stroke-[2] shrink-0" />
                <span>You Lent (Receivable)</span>
              </button>
              <button
                type="button"
                onClick={() => setDebtType("borrowed")}
                className={`py-2 px-3 rounded-xl font-medium text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  debtType === "borrowed"
                    ? "bg-[#161514] text-white dark:bg-[#FAF8F5] dark:text-[#161514] border-[#161514] dark:border-white shadow-xs"
                    : "bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#6B6B6B] dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-white dark:hover:bg-[#22201D]"
                }`}
              >
                <ArrowDownLeft className="h-4 w-4 stroke-[2] shrink-0" />
                <span>You Borrowed (Payable)</span>
              </button>
            </div>
          </div>

          {/* Person Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5]">Person Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma, Priya, Alex"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] font-medium text-xs text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:border-[#161514] dark:focus:border-white transition-all"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5]">Amount ({currencySymbol}) *</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] font-medium text-xs text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:border-[#161514] dark:focus:border-white transition-all"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5]">Due Date (Optional)</label>
            <button
              type="button"
              onClick={() => setIsDueDatePickerOpen(true)}
              className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] font-medium text-xs text-[#161514] dark:text-[#FAF8F5] flex items-center justify-between hover:bg-white dark:hover:bg-[#22201D] transition-all cursor-pointer text-left"
            >
              <span className={dueDate ? "text-[#161514] dark:text-[#FAF8F5] font-semibold" : "text-[#6B6B6B] dark:text-[#A8A29E]"}>
                {dueDate ? format(new Date(dueDate), "EEE, d MMM yyyy") : "Select Due Date..."}
              </span>
              <Calendar className="h-4 w-4 text-[#6B6B6B] dark:text-[#A8A29E] stroke-[1.5]" />
            </button>
            {dueDate && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setDueDate("")}
                  className="text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Clear Date
                </button>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5]">Reason / Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Dinner split, Rent share, Concert ticket"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] font-medium text-xs text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:border-[#161514] dark:focus:border-white transition-all"
            />
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 h-10 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] text-[#161514] dark:text-[#FAF8F5] hover:bg-white dark:hover:bg-[#22201D] font-medium text-xs cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addDebtMutation.isPending}
              className="flex-1 h-10 rounded-xl bg-[#161514] hover:bg-[#2A2826] text-white dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] font-medium text-xs border border-[#161514] dark:border-white shadow-xs cursor-pointer transition-all"
            >
              {addDebtMutation.isPending ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      </ResponsiveFormContainer>

      {/* 6. SETTLE UP CONFIRMATION MODAL */}
      <ResponsiveFormContainer
        open={!!settlingDebt}
        onOpenChange={(open) => {
          if (!open) setSettlingDebt(null);
        }}
        title="Settle Up Debt Record"
        description={`Mark payment settled with ${settlingDebt?.personName}`}
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] space-y-1 text-center">
            <div className="text-xs font-medium text-[#6B6B6B] dark:text-[#A8A29E]">
              {settlingDebt?.type === "lent" ? "You received payment from" : "You paid back"}
            </div>
            <div className="text-lg font-semibold text-[#161514] dark:text-[#FAF8F5]">{settlingDebt?.personName}</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {currencySymbol}{settlingDebt?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Auto-Log Transaction Checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] cursor-pointer hover:bg-white dark:hover:bg-[#22201D] transition-all">
            <input
              type="checkbox"
              checked={autoLogTx}
              onChange={(e) => setAutoLogTx(e.target.checked)}
              className="h-4 w-4 rounded border-[#E8E5DF] text-[#161514] focus:ring-0"
            />
            <div className="text-xs">
              <span className="font-semibold text-[#161514] dark:text-[#FAF8F5] block">
                Auto-log to Financial Ledger
              </span>
              <span className="text-[#6B6B6B] dark:text-[#A8A29E]">
                {settlingDebt?.type === "lent"
                  ? "Automatically log as Income in main Cashflow"
                  : "Automatically log as Expense in main Cashflow"}
              </span>
            </div>
          </label>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setSettlingDebt(null)}
              className="flex-1 h-10 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] text-[#161514] dark:text-[#FAF8F5] hover:bg-white dark:hover:bg-[#22201D] font-medium text-xs cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSettle}
              disabled={settleDebtMutation.isPending}
              className="flex-1 h-10 rounded-xl bg-[#161514] hover:bg-[#2A2826] text-white dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] font-medium text-xs border border-[#161514] dark:border-white shadow-xs cursor-pointer transition-all"
            >
              {settleDebtMutation.isPending ? "Settling..." : "Confirm Settlement"}
            </button>
          </div>
        </div>
      </ResponsiveFormContainer>

      {/* 7. DELETE MODAL */}
      <DeleteConfirmationModal
        open={deletingDebtId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingDebtId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Debt Record"
        description="Are you sure you want to delete this debt record? This action cannot be undone."
      />

      {/* 8. NEOBRUTALIST DATE PICKER MODAL */}
      <NeobrutalistDateTimePickerModal
        open={isDueDatePickerOpen}
        onOpenChange={setIsDueDatePickerOpen}
        dateValue={dueDate || format(new Date(), "yyyy-MM-dd")}
        title="Select Due Date"
        onSave={(newDate) => {
          setDueDate(newDate);
        }}
      />
    </div>
  );
}
