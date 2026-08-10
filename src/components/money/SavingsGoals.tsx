"use client";

import { useState } from "react";
import { PiggyBank, Plus, Trophy, Trash2 } from "lucide-react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { SAVINGS_GOAL_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSavingsGoals, useAddSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal } from "@/lib/queries/money";

export interface SavingsGoalItem {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category: string;
}

export function SavingsGoals() {
  const { data: goals = [], isLoading } = useSavingsGoals();
  const addGoalMutation = useAddSavingsGoal();
  const updateGoalMutation = useUpdateSavingsGoal();
  const deleteGoalMutation = useDeleteSavingsGoal();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);

  const handleApplySavingsPack = (pack: TemplatePack) => {
    pack.items.forEach((item) => {
      addGoalMutation.mutate({
        title: item.title,
        targetAmount: item.target || 2000,
        currentAmount: 0,
        category: "Savings",
      });
    });
    toast.success(`Applied ${pack.name} goal!`);
  };
  const [depositGoal, setDepositGoal] = useState<SavingsGoalItem | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);

  // Add Form State
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState("");

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return;

    try {
      await addGoalMutation.mutateAsync({
        title: goalTitle.trim(),
        targetAmount: Number(goalTarget),
        currentAmount: Number(goalCurrent) || 0,
        category: "Personal",
      });
      toast.success("Savings target created! 🐷");
      setIsAddOpen(false);
      setGoalTitle("");
      setGoalTarget("");
      setGoalCurrent("");
    } catch {
      toast.error("Failed to create savings goal");
    }
  };

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal || !depositAmount) return;

    const addVal = Number(depositAmount);
    const newTotal = (depositGoal.currentAmount || 0) + addVal;

    try {
      await updateGoalMutation.mutateAsync({
        id: depositGoal.id,
        currentAmount: newTotal,
      });
      toast.success(`Deposited ₹${addVal.toLocaleString()} to ${depositGoal.title}! 💰`);
      setDepositGoal(null);
      setDepositAmount("");
    } catch {
      toast.error("Failed to deposit funds");
    }
  };

  const totalSavedAll = goals.reduce((sum: number, g: any) => sum + (g.currentAmount || 0), 0);

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4 my-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-300 border-2 border-navy-950 text-navy-950 flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
            <PiggyBank className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm font-black text-navy-950 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Savings & Piggy Banks</h4>
            <p className="text-[10px] text-navy-700 font-bold">
              Total saved across goals: <strong className="text-amber-900 font-black">₹{totalSavedAll.toLocaleString()}</strong>
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsChoiceOpen(true)}
          className="text-[10px] font-black text-navy-950 bg-amber-400 hover:bg-amber-500 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1 border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(31,36,48,1)]"
        >
          <Plus className="h-3.5 w-3.5 stroke-[3]" /> New Target
        </button>
      </div>

      {isLoading ? (
        <div className="h-20 animate-pulse bg-cream-bg/60 rounded-2xl border-2 border-navy-950" />
      ) : goals.length === 0 ? (
        <div className="bg-amber-50/60 rounded-2xl p-5 border-2 border-dashed border-navy-950 text-center space-y-1 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
          <p className="text-xs font-black text-navy-950">No savings targets created yet! 🐷</p>
          <p className="text-[10px] text-navy-700 font-bold">Click '+ New Target' above to start building your emergency fund or wishlist targets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {goals.map((g: any) => {
            const percent = Math.min(100, Math.round(((g.currentAmount || 0) / (g.targetAmount || 1)) * 100));
            const isCompleted = (g.currentAmount || 0) >= (g.targetAmount || 1);

            return (
              <div key={g.id} className="bg-cream-bg/60 rounded-2xl p-4 border-2 border-navy-950 space-y-3 flex flex-col justify-between shadow-[2.5px_2.5px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] transition-all">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h5 className="font-black text-xs text-navy-950 flex items-center gap-1 truncate">
                      {g.title} {isCompleted && <Trophy className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                    </h5>
                    <button
                      onClick={() => setDeleteGoalId(g.id)}
                      className="text-navy-700 hover:text-rose-600 p-0.5 transition-colors cursor-pointer border-none bg-transparent outline-none"
                      title="Delete target"
                    >
                      <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                  <div className="flex justify-between items-baseline text-[10px] font-black text-navy-800">
                    <span>₹{(g.currentAmount || 0).toLocaleString()} saved</span>
                    <span>Target: ₹{(g.targetAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-white rounded-full overflow-hidden p-0.5 border-2 border-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", isCompleted ? "bg-emerald-400" : "bg-amber-400")}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-[10px] font-black text-navy-950">{percent}% Funded</span>
                    <button
                      onClick={() => setDepositGoal(g)}
                      className="text-[10px] font-black text-navy-950 bg-emerald-300 hover:bg-emerald-400 px-2.5 py-1 rounded-xl cursor-pointer transition-all flex items-center gap-0.5 border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(31,36,48,1)]"
                    >
                      <Plus className="h-3 w-3 stroke-[3]" /> Deposit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Savings Target Choice Modal */}
      <TemplateSelectionModal
        open={isChoiceOpen}
        onOpenChange={setIsChoiceOpen}
        title="ADD SAVINGS TARGET"
        subtitle="START FROM SCRATCH OR APPLY A SAVINGS PACK."
        blankLabel="BLANK TARGET"
        blankDesc="CUSTOM TITLE, GOAL AMOUNT & CATEGORY"
        templatesLabel="SAVINGS PACKS"
        templatesDesc="EMERGENCY FUND, TECH UPGRADE, VACATION..."
        templatePacks={SAVINGS_GOAL_TEMPLATE_PACKS}
        onSelectBlank={() => setIsAddOpen(true)}
        onApplyTemplatePack={handleApplySavingsPack}
      />

      {/* Add New Goal Modal */}
      <ResponsiveFormContainer
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Create Savings Target"
        description="Set a financial goal for emergency funds or purchases"
      >
        <form onSubmit={handleAddGoal} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">Target Title *</label>
            <input
              type="text"
              placeholder="e.g. Emergency Fund, New Laptop"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">Target Amount (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">Initial Saved (₹)</label>
              <input
                type="number"
                placeholder="e.g. 10000"
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
                className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={addGoalMutation.isPending}
            className="w-full bg-[#F59E0B] hover:bg-[#d98206] text-white font-black text-xs uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
          >
            {addGoalMutation.isPending ? "Creating…" : "Create Savings Target"}
          </button>
        </form>
      </ResponsiveFormContainer>

      {/* Deposit Funds Modal */}
      <ResponsiveFormContainer
        open={depositGoal !== null}
        onOpenChange={(open) => {
          if (!open) setDepositGoal(null);
        }}
        title={`Add Deposit to ${depositGoal?.title || ""}`}
        description="Transfer funds into your piggy bank target"
      >
        <form onSubmit={handleAddDeposit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">Deposit Amount (₹) *</label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={updateGoalMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-black text-xs uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
          >
            {updateGoalMutation.isPending ? "Depositing…" : "Add Deposit"}
          </button>
        </form>
      </ResponsiveFormContainer>

      {/* Delete Goal Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteGoalId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteGoalId(null);
        }}
        onConfirm={async () => {
          if (deleteGoalId) {
            try {
              await deleteGoalMutation.mutateAsync(deleteGoalId);
              toast.success("Savings target deleted 🗑️");
            } catch {
              toast.error("Failed to delete savings goal");
            }
            setDeleteGoalId(null);
          }
        }}
        title="Delete Savings Target"
        description="Are you sure you want to delete this savings target? Any logged progress for this target will be removed."
      />
    </div>
  );
}
