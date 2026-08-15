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
import { format } from "date-fns";

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
          ? `Record saved! ${personName} owes you ${currencySymbol}${amount} 🟢`
          : `Record saved! You owe ${personName} ${currencySymbol}${amount} 🔴`
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
    <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#161514] shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] text-[#161514] transition-all space-y-5">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#161514]/15">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-sky-300 text-[#161514] text-[10px] font-black px-2.5 py-1 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] uppercase flex items-center gap-1">
              <HandCoins className="h-3.5 w-3.5" /> Debt Ledger
            </span>
            <span className="bg-[#CEF431] text-[#161514] text-[10px] font-black px-2.5 py-1 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] uppercase">
              {pendingDebts.length} Pending
            </span>
          </div>
          <h2
            className="text-xl sm:text-2xl font-black tracking-tight text-[#161514] uppercase pt-0.5"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Lent & Borrowed Money
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-[#CEF431] hover:bg-amber-300 border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] font-black text-xs cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Record Lent / Borrowed</span>
        </button>
      </div>

      {/* 2. KPI Summary Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Total Lent */}
        <div className="bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] space-y-1">
          <span className="text-[10px] font-black uppercase text-[#161514]/70 flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" /> You Lent (Receivable)
          </span>
          <div className="text-xl font-black text-emerald-600">
            +{currencySymbol}{totalLent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-bold text-[#161514]/60">Money friends owe you</p>
        </div>

        {/* Card 2: Total Borrowed */}
        <div className="bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] space-y-1">
          <span className="text-[10px] font-black uppercase text-[#161514]/70 flex items-center gap-1">
            <ArrowDownLeft className="h-3.5 w-3.5 text-rose-600 stroke-[2.5]" /> You Borrowed (Payable)
          </span>
          <div className="text-xl font-black text-rose-600">
            -{currencySymbol}{totalBorrowed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-bold text-[#161514]/60">Money you owe to others</p>
        </div>

        {/* Card 3: Net Balance */}
        <div
          className={`rounded-2xl p-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] space-y-1 ${
            netBalance >= 0 ? "bg-[#CEF431]" : "bg-rose-200"
          }`}
        >
          <span className="text-[10px] font-black uppercase text-[#161514] flex items-center gap-1">
            ⚖️ Net Position
          </span>
          <div className="text-xl font-black text-[#161514]">
            {netBalance >= 0 ? "+" : ""}{currencySymbol}{netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-black uppercase text-[#161514]">
            {netBalance >= 0 ? "Net Receivable 🟢" : "Net Owed 🔴"}
          </p>
        </div>
      </div>

      {/* 3. Filter Controls Strip */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#161514]/10">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setFilterStatus("pending")}
            className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-[#161514] transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterStatus === "pending"
                ? "bg-[#CEF431] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]"
                : "bg-[#FAF8F5] text-[#161514]/70 hover:bg-white"
            }`}
          >
            Pending ⏳ ({pendingDebts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-[#161514] transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterStatus === "all"
                ? "bg-amber-300 shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]"
                : "bg-[#FAF8F5] text-[#161514]/70 hover:bg-white"
            }`}
          >
            All Records ({debts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("settled")}
            className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-[#161514] transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterStatus === "settled"
                ? "bg-emerald-300 shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]"
                : "bg-[#FAF8F5] text-[#161514]/70 hover:bg-white"
            }`}
          >
            Settled ✅ ({debts.filter((d) => d.status === "settled").length})
          </button>
        </div>
      </div>

      {/* 4. Debt Records List */}
      <div className="space-y-2.5">
        {filteredDebts.length === 0 ? (
          <div className="text-center py-8 bg-[#FAF8F5] rounded-2xl border-2 border-dashed border-[#161514]/30 space-y-2">
            <UserCheck className="h-8 w-8 mx-auto text-[#161514]/40" />
            <h4 className="font-black text-sm text-[#161514]">No Debt Records Found</h4>
            <p className="text-xs text-[#161514]/60 max-w-xs mx-auto font-medium">
              {filterStatus === "pending"
                ? "Awesome! You have no pending debts or money owed."
                : "Tap '+ Record Lent / Borrowed' above to start tracking loans."}
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
                className={`p-3.5 sm:p-4 rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-2.5 transition-all ${
                  isSettled ? "bg-[#FAF8F5] opacity-75" : "bg-white"
                }`}
              >
                {/* Top Main Row: Avatar + Info (Left) and Amount + Action Buttons (Right) */}
                <div className="flex items-start justify-between gap-2.5">
                  {/* Left: Avatar & Name Details */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`h-10 w-10 shrink-0 rounded-xl border-2 border-[#161514] flex items-center justify-center font-black text-xs shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] ${
                        isLent ? "bg-emerald-200 text-emerald-950" : "bg-rose-200 text-rose-950"
                      }`}
                    >
                      {d.personName.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-black text-sm text-[#161514] truncate leading-tight">{d.personName}</h4>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border border-[#161514] uppercase shrink-0 ${
                            isLent
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-rose-100 text-rose-900"
                          }`}
                        >
                          {isLent ? "LENT 🟢" : "BORROWED 🔴"}
                        </span>
                        {isSettled && (
                          <span className="text-[9px] font-black bg-emerald-300 text-emerald-950 px-1.5 py-0.5 rounded-md border border-[#161514]">
                            SETTLED ✅
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#161514]/70 font-bold truncate">
                        {d.note || (isLent ? "Money lent to friend" : "Borrowed money")}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div
                        className={`font-black text-sm sm:text-base leading-tight ${
                          isLent ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {isLent ? "+" : "-"}{currencySymbol}
                        {d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[9px] text-[#161514]/50 font-bold block">
                        {d.createdAt ? d.createdAt.split("T")[0] : ""}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      {!isSettled && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const msg = isLent
                                ? `Hey ${d.personName}! Just a friendly reminder about the ${currencySymbol}${d.amount} split${d.note ? ` for "${d.note}"` : ""}${d.dueDate ? ` due on ${d.dueDate}` : ""}. Thanks!`
                                : `Hey ${d.personName}! Reminding myself to pay back the ${currencySymbol}${d.amount}${d.note ? ` for "${d.note}"` : ""}. Settling up soon!`;
                              navigator.clipboard.writeText(msg);
                              toast.success(`Reminder text for ${d.personName} copied to clipboard! 📋`);
                            }}
                            className="h-8 w-8 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] flex items-center justify-center cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
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
                            className="h-8 px-2 rounded-xl bg-[#03D26F] hover:bg-emerald-400 text-white font-black text-xs border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] flex items-center gap-1 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                            title="Mark Paid & Settle Up"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span className="hidden sm:inline">Settle</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeletingDebtId(d.id)}
                        className="h-8 w-8 rounded-xl bg-white hover:bg-rose-100 text-rose-600 font-bold border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] flex items-center justify-center cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                        title="Delete record"
                      >
                        <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Due Date Banner (Only rendered when due date is set and pending) */}
                {d.dueDate && !isSettled && (
                  <div className="pt-0.5">
                    {isOverdue ? (
                      <div className="w-full px-2.5 py-1 rounded-xl bg-rose-200 text-rose-950 border-2 border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] text-[10px] font-black flex items-center justify-between gap-2 animate-pulse">
                        <span className="flex items-center gap-1.5 truncate">
                          <AlertCircle className="h-3.5 w-3.5 stroke-[2.5] shrink-0" />
                          <span>OVERDUE PAYMENT</span>
                        </span>
                        <span className="shrink-0 bg-white/80 px-1.5 py-0.5 rounded-md border border-[#161514]">
                          Due: {d.dueDate}
                        </span>
                      </div>
                    ) : isDueToday ? (
                      <div className="w-full px-2.5 py-1 rounded-xl bg-[#CEF431] text-[#161514] border-2 border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] text-[10px] font-black flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 truncate">
                          <Calendar className="h-3.5 w-3.5 stroke-[2.5] shrink-0" />
                          <span>PAYMENT DUE TODAY!</span>
                        </span>
                        <span className="shrink-0 bg-white/80 px-1.5 py-0.5 rounded-md border border-[#161514]">
                          {d.dueDate}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full px-2.5 py-1 rounded-xl bg-[#FAF8F5] text-[#161514]/80 border border-[#161514]/30 text-[10px] font-bold flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 truncate">
                          <Calendar className="h-3.5 w-3.5 stroke-[2.5] text-[#161514]/60 shrink-0" />
                          <span>Target Due Date</span>
                        </span>
                        <span className="shrink-0 font-black">{d.dueDate}</span>
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
        title="Record Lent / Borrowed Money 💸"
        description="Keep track of debts and loans with friends or family"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          {/* Debt Type Selector */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-[#161514]">Record Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDebtType("lent")}
                className={`py-2.5 px-3 rounded-xl font-black text-xs border-2 border-[#161514] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  debtType === "lent"
                    ? "bg-[#03D26F] text-white shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]"
                    : "bg-[#FAF8F5] text-[#161514]/70 hover:bg-white"
                }`}
              >
                <ArrowUpRight className="h-4 w-4 stroke-[3]" />
                You Lent (Receivable)
              </button>
              <button
                type="button"
                onClick={() => setDebtType("borrowed")}
                className={`py-2.5 px-3 rounded-xl font-black text-xs border-2 border-[#161514] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  debtType === "borrowed"
                    ? "bg-[#E11D48] text-white shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]"
                    : "bg-[#FAF8F5] text-[#161514]/70 hover:bg-white"
                }`}
              >
                <ArrowDownLeft className="h-4 w-4 stroke-[3]" />
                You Borrowed (Payable)
              </button>
            </div>
          </div>

          {/* Person Name */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-[#161514]">Person Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma, Priya, Alex"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-white border-2 border-[#161514] font-bold text-sm text-[#161514] focus:outline-none focus:ring-2 focus:ring-[#CEF431]"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-[#161514]">Amount ({currencySymbol}) *</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-white border-2 border-[#161514] font-bold text-sm text-[#161514] focus:outline-none focus:ring-2 focus:ring-[#CEF431]"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-[#161514]">Due Date (Optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-white border-2 border-[#161514] font-bold text-sm text-[#161514] focus:outline-none focus:ring-2 focus:ring-[#CEF431]"
            />
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-[#161514]">Reason / Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Dinner split, Rent share, Concert ticket"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-white border-2 border-[#161514] font-bold text-sm text-[#161514] focus:outline-none focus:ring-2 focus:ring-[#CEF431]"
            />
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 h-11 rounded-xl bg-[#FAF8F5] border-2 border-[#161514] font-black text-xs uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addDebtMutation.isPending}
              className="flex-1 h-11 rounded-xl bg-[#CEF431] border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] font-black text-xs uppercase cursor-pointer"
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
        title="Settle Up Debt Record 🎉"
        description={`Mark payment settled with ${settlingDebt?.personName}`}
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border-2 border-[#161514] space-y-1 text-center">
            <div className="text-xs font-bold text-[#161514]/70">
              {settlingDebt?.type === "lent" ? "You received payment from" : "You paid back"}
            </div>
            <div className="text-xl font-black text-[#161514]">{settlingDebt?.personName}</div>
            <div className="text-2xl font-black text-emerald-600">
              {currencySymbol}{settlingDebt?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Auto-Log Transaction Checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white border-2 border-[#161514] cursor-pointer">
            <input
              type="checkbox"
              checked={autoLogTx}
              onChange={(e) => setAutoLogTx(e.target.checked)}
              className="h-4 w-4 rounded border-2 border-[#161514] text-[#CEF431] focus:ring-0"
            />
            <div className="text-xs">
              <span className="font-black text-[#161514] block">
                Auto-log to Financial Ledger
              </span>
              <span className="text-[#161514]/70 font-medium">
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
              className="flex-1 h-11 rounded-xl bg-[#FAF8F5] border-2 border-[#161514] font-black text-xs uppercase"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSettle}
              disabled={settleDebtMutation.isPending}
              className="flex-1 h-11 rounded-xl bg-[#03D26F] text-white border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] font-black text-xs uppercase cursor-pointer"
            >
              {settleDebtMutation.isPending ? "Settling..." : "Confirm Settlement ✅"}
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
    </div>
  );
}
