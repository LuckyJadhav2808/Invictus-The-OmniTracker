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
    <div className="bg-white rounded-3xl p-5 md:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4 my-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#FED7AA] border-2 border-[#161514] text-[#161514] flex items-center justify-center shadow-[2px_2px_0px_0px_#161514] shrink-0">
            <PiggyBank className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm font-black text-[#161514] tracking-tight font-heading uppercase">Savings & Piggy Banks</h4>
            <p className="text-[10px] text-[#161514]/70 font-bold uppercase tracking-wider">
              Total saved across goals: <strong className="text-[#161514] font-black font-heading">₹{totalSavedAll.toLocaleString()}</strong>
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsChoiceOpen(true)}
          className="text-xs font-black text-[#161514] bg-[#CEF431] hover:bg-[#b8dd24] px-3.5 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none uppercase tracking-wider"
        >
          <Plus className="h-3.5 w-3.5 stroke-[3]" /> New Target
        </button>
      </div>

      {isLoading ? (
        <div className="h-20 animate-pulse bg-[#FAF8F5] rounded-2xl border-2 border-[#161514]" />
      ) : goals.length === 0 ? (
        <div className="bg-[#FFFDF8] rounded-2xl p-6 border-2 border-dashed border-[#161514] text-center space-y-1 shadow-[2px_2px_0px_0px_#161514]">
          <p className="text-xs font-black text-[#161514] font-heading uppercase">No savings targets created yet! 🐷</p>
          <p className="text-[10px] text-[#161514]/70 font-bold">Click '+ New Target' above to start building your emergency fund or wishlist targets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {goals.map((g: any) => {
            const percent = Math.min(100, Math.round(((g.currentAmount || 0) / (g.targetAmount || 1)) * 100));
            const isCompleted = (g.currentAmount || 0) >= (g.targetAmount || 1);

            return (
              <div key={g.id} className="bg-[#FFFDF8] rounded-2xl p-4 border-2 border-[#161514] space-y-3 flex flex-col justify-between shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h5 className="font-black text-xs text-[#161514] flex items-center gap-1 truncate font-heading">
                      {g.title} {isCompleted && <Trophy className="h-3.5 w-3.5 text-[#F59E0B] fill-[#F59E0B]" />}
                    </h5>
                    <button
                      onClick={() => setDeleteGoalId(g.id)}
                      className="bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#991B1B] p-1 rounded-xl border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                      title="Delete target"
                    >
                      <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                  <div className="flex justify-between items-baseline text-[10px] font-black text-[#161514]">
                    <span>₹{(g.currentAmount || 0).toLocaleString()} saved</span>
                    <span className="text-[#161514]/70">Target: ₹{(g.targetAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-3.5 w-full bg-white rounded-full overflow-hidden p-0.5 border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", isCompleted ? "bg-[#03D26F]" : "bg-[#FACC15]")}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-[10px] font-black text-[#161514] uppercase tracking-wider">{percent}% Funded</span>
                    <button
                      onClick={() => setDepositGoal(g)}
                      className="text-[10px] font-black text-[#161514] bg-[#CEF431] hover:bg-[#b8dd24] px-2.5 py-1 rounded-xl cursor-pointer transition-all flex items-center gap-1 border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none uppercase tracking-wider"
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
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">Target Title *</label>
            <input
              type="text"
              placeholder="e.g. Emergency Fund, New Laptop"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full bg-[#FFFDF8] rounded-xl border-2 border-[#161514] px-3.5 py-2.5 text-xs font-black text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:bg-[#FFF9EA] transition-all"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">Target Amount (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="w-full bg-[#FFFDF8] rounded-xl border-2 border-[#161514] px-3.5 py-2.5 text-xs font-black text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:bg-[#FFF9EA] transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">Initial Saved (₹)</label>
              <input
                type="number"
                placeholder="e.g. 10000"
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
                className="w-full bg-[#FFFDF8] rounded-xl border-2 border-[#161514] px-3.5 py-2.5 text-xs font-black text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:bg-[#FFF9EA] transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={addGoalMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
          >
            {addGoalMutation.isPending ? "Creating…" : "Create Savings Target 🐷"}
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
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">Deposit Amount (₹) *</label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full bg-[#FFFDF8] rounded-xl border-2 border-[#161514] px-3.5 py-2.5 text-xs font-black text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:bg-[#FFF9EA] transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={updateGoalMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
          >
            {updateGoalMutation.isPending ? "Depositing…" : "Add Deposit 💰"}
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
