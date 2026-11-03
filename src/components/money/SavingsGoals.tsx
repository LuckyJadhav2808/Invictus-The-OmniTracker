"use client";

import { useState } from "react";
import { PiggyBank, Plus, Trophy, Trash2, Sparkles, Target } from "lucide-react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { SAVINGS_GOAL_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
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

const STARTER_GOALS = [
  { title: "Emergency Safety Net", targetAmount: 50000, category: "Security" },
  { title: "Laptop / Tech Upgrade", targetAmount: 75000, category: "Tech" },
  { title: "Travel & Vacation Fund", targetAmount: 25000, category: "Travel" },
  { title: "Course / Skill Cert", targetAmount: 10000, category: "Education" },
];

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
        targetAmount: item.target || 25000,
        currentAmount: 0,
        category: "Savings",
      });
    });
    toast.success(`Applied ${pack.name} goal! 🎯`);
  };

  const handleQuickAddStarterGoal = async (starter: typeof STARTER_GOALS[number]) => {
    try {
      await addGoalMutation.mutateAsync({
        title: starter.title,
        targetAmount: starter.targetAmount,
        currentAmount: 0,
        category: starter.category,
      });
      toast.success(`Created goal: ${starter.title} (Target: ₹${starter.targetAmount.toLocaleString()})`);
    } catch {
      toast.error("Failed to create goal");
    }
  };

  const handleQuickMicroDeposit = async (goal: any, amount: number) => {
    const newTotal = (goal.currentAmount || 0) + amount;
    try {
      await updateGoalMutation.mutateAsync({
        id: goal.id,
        currentAmount: newTotal,
      });
      toast.success(`Deposited +₹${amount.toLocaleString()} into ${goal.title}! 💰`);
    } catch {
      toast.error("Failed to deposit funds");
    }
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
      toast.success("Savings target created");
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
      toast.success(`Deposited ₹${addVal.toLocaleString()} to ${depositGoal.title}`);
      setDepositGoal(null);
      setDepositAmount("");
    } catch {
      toast.error("Failed to deposit funds");
    }
  };

  const totalSavedAll = goals.reduce((sum: number, g: any) => sum + (g.currentAmount || 0), 0);

  return (
    <div className="bg-white dark:bg-[#161514] rounded-2xl p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4 my-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-[#F1EFEA] dark:bg-[#22201D] text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center shrink-0 border border-[#E8E5DF] dark:border-[#2A2724]">
            <PiggyBank className="size-4.5 stroke-[1.5]" />
          </div>
          <div>
            <h4 className="text-[15px] font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight">Savings Goals & Reserves</h4>
            <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E]">
              Total saved across goals: <strong className="text-[#161514] dark:text-[#FAF8F5] font-semibold font-mono tabular-nums">₹{totalSavedAll.toLocaleString()}</strong>
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsChoiceOpen(true)}
          className="text-xs font-medium text-white bg-[#161514] hover:bg-[#2A2826] dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] px-3.5 py-2 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 border border-[#161514] dark:border-white shadow-xs self-start sm:self-auto"
        >
          <Plus className="size-3.5 stroke-[2]" />
          <span>New Goal</span>
        </button>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse bg-[#F1EFEA] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724]" />
      ) : goals.length === 0 ? (
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] space-y-4">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-[#E8E5DF] dark:bg-[#2A2724] flex items-center justify-center shrink-0 text-[#161514] dark:text-[#FAF8F5]">
              <Sparkles className="size-4.5 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h5 className="text-sm font-semibold text-[#161514] dark:text-[#FAF8F5]">
                No savings goals established yet
              </h5>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] leading-relaxed">
                Establish dedicated savings targets for emergencies, equipment, or travel. Make progress with 1-tap micro-deposits whenever you save extra money.
              </p>
            </div>
          </div>

          {/* Quick Preset Packs */}
          <div className="space-y-2 pt-1 border-t border-[#E8E5DF] dark:border-[#2A2724]">
            <span className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] block">
              1-Tap Goal Presets
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SAVINGS_GOAL_TEMPLATE_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-white dark:bg-[#22201D] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-between gap-3 hover:border-[#161514] dark:hover:border-white transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-[#161514] dark:text-[#FAF8F5] truncate block">
                      {pack.name}
                    </span>
                    <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] line-clamp-1">
                      {pack.tagline}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplySavingsPack(pack)}
                    className="shrink-0 text-xs font-medium text-white bg-[#161514] hover:bg-[#2A2826] dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] px-3 py-1.5 rounded-lg border border-[#161514] dark:border-white transition-colors cursor-pointer"
                  >
                    Add Goal
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Single Starter Goals */}
          <div className="space-y-1.5 pt-1 border-t border-[#E8E5DF] dark:border-[#2A2724]">
            <span className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] block">
              Or pick an individual target:
            </span>
            <div className="flex flex-wrap gap-2">
              {STARTER_GOALS.map((starter) => (
                <button
                  key={starter.title}
                  type="button"
                  onClick={() => handleQuickAddStarterGoal(starter)}
                  className="bg-white dark:bg-[#22201D] hover:bg-[#F1EFEA] dark:hover:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="size-3 stroke-[2] text-[#6B6B6B] dark:text-[#A8A29E]" />
                  <span>{starter.title}</span>
                  <span className="font-mono text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">₹{starter.targetAmount.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {goals.map((g: any) => {
            const percent = Math.min(100, Math.round(((g.currentAmount || 0) / (g.targetAmount || 1)) * 100));
            const isCompleted = (g.currentAmount || 0) >= (g.targetAmount || 1);

            return (
              <div
                key={g.id}
                className="bg-white dark:bg-[#1C1A18] rounded-xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] space-y-3 flex flex-col justify-between hover:bg-[#FAF8F5] dark:hover:bg-[#22201D] transition-colors shadow-none hover:shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h5 className="font-semibold text-xs text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5 truncate">
                      {g.title} {isCompleted && <Trophy className="size-3.5 text-[#F59E0B] fill-[#F59E0B] shrink-0" />}
                    </h5>
                    <button
                      onClick={() => setDeleteGoalId(g.id)}
                      className="text-[#6B6B6B] dark:text-[#A8A29E] hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                      title="Delete target"
                    >
                      <Trash2 className="size-3.5 stroke-[1.5]" />
                    </button>
                  </div>
                  <div className="flex justify-between items-baseline text-xs font-mono tabular-nums">
                    <span className="font-semibold text-[#161514] dark:text-[#FAF8F5]">₹{(g.currentAmount || 0).toLocaleString()} saved</span>
                    <span className="text-[#6B6B6B] dark:text-[#A8A29E]">Target: ₹{(g.targetAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-[#F1EFEA] dark:bg-[#2A2724] rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", isCompleted ? "bg-[#03D26F]" : "bg-[#161514] dark:bg-[#FAF8F5]")}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Micro-deposit chips */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <span className="text-[10px] font-mono font-medium text-[#6B6B6B] dark:text-[#A8A29E]">
                      {percent}% Funded
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickMicroDeposit(g, 500)}
                        className="text-[10px] font-mono font-medium bg-[#F1EFEA] hover:bg-[#E8E5DF] dark:bg-[#22201D] dark:hover:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E5DF] dark:border-[#2A2724] transition-colors cursor-pointer"
                        title="Add ₹500 immediately"
                      >
                        +₹500
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickMicroDeposit(g, 1000)}
                        className="text-[10px] font-mono font-medium bg-[#F1EFEA] hover:bg-[#E8E5DF] dark:bg-[#22201D] dark:hover:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E5DF] dark:border-[#2A2724] transition-colors cursor-pointer"
                        title="Add ₹1,000 immediately"
                      >
                        +₹1k
                      </button>
                      <button
                        onClick={() => setDepositGoal(g)}
                        className="text-[10px] font-medium text-[#161514] dark:text-[#FAF8F5] bg-[#F1EFEA] hover:bg-[#E8E5DF] dark:bg-[#22201D] dark:hover:bg-[#2A2724] px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-0.5 border border-[#E8E5DF] dark:border-[#2A2724]"
                      >
                        <Plus className="size-2.5 stroke-[2]" /> Custom
                      </button>
                    </div>
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
        title="Add Savings Goal"
        subtitle="Start from scratch or choose a preset goal."
        blankLabel="Custom Goal"
        blankDesc="Set your own title and target amount"
        templatesLabel="Goal Presets"
        templatesDesc="Emergency fund, gadget, vacation, etc."
        templatePacks={SAVINGS_GOAL_TEMPLATE_PACKS}
        onSelectBlank={() => setIsAddOpen(true)}
        onApplyTemplatePack={handleApplySavingsPack}
      />

      {/* Add New Goal Modal */}
      <ResponsiveFormContainer
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="New Savings Goal"
        description="Set a target amount and track your progress."
      >
        <form onSubmit={handleAddGoal} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] block">Goal Name *</label>
            <input
              type="text"
              placeholder="e.g. Emergency Fund, New Laptop"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2.5 text-xs font-medium text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:border-[#161514] dark:focus:border-white transition-all"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] block">Target Amount (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2.5 text-xs font-medium text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:border-[#161514] dark:focus:border-white transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] block">Starting Amount (₹)</label>
              <input
                type="number"
                placeholder="e.g. 10000"
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2.5 text-xs font-medium text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:border-[#161514] dark:focus:border-white transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={addGoalMutation.isPending}
            className="w-full bg-[#161514] hover:bg-[#2A2826] text-white dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] font-semibold text-xs rounded-xl py-2.5 mt-2 border border-[#161514] dark:border-white shadow-xs cursor-pointer transition-all"
          >
            {addGoalMutation.isPending ? "Creating…" : "Save Goal"}
          </button>
        </form>
      </ResponsiveFormContainer>

      {/* Deposit Funds Modal */}
      <ResponsiveFormContainer
        open={depositGoal !== null}
        onOpenChange={(open) => {
          if (!open) setDepositGoal(null);
        }}
        title={`Add to ${depositGoal?.title || "Goal"}`}
        description="Add money toward this goal."
      >
        <form onSubmit={handleAddDeposit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] block">Amount (₹) *</label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2.5 text-xs font-medium text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:border-[#161514] dark:focus:border-white transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={updateGoalMutation.isPending}
            className="w-full bg-[#161514] hover:bg-[#2A2826] text-white dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] font-semibold text-xs rounded-xl py-2.5 mt-2 border border-[#161514] dark:border-white shadow-xs cursor-pointer transition-all"
          >
            {updateGoalMutation.isPending ? "Adding…" : "Add Money"}
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
        title="Delete Savings Goal"
        description="Are you sure you want to delete this savings goal?"
      />
    </div>
  );
}
