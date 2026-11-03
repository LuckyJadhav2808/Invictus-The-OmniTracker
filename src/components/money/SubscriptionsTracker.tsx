"use client";

import { useState } from "react";
import { CreditCard, Plus, Trash2, Clock, Zap, Check, Sparkles, Layers } from "lucide-react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { SUBSCRIPTION_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSubscriptions, useAddSubscription, useDeleteSubscription, useAddTransaction, useCategories } from "@/lib/queries/money";

export interface SubscriptionItem {
  id: string;
  name: string;
  amount?: number;
  cost?: number;
  billingCycle: "monthly" | "yearly";
  nextRenewalDate?: string;
  renewalDate?: string;
  category: string;
}

const QUICK_SUB_CHIPS = [
  { name: "Spotify Premium", amount: 119, category: "Music", billingCycle: "monthly" as const },
  { name: "YouTube Premium", amount: 149, category: "Media", billingCycle: "monthly" as const },
  { name: "Netflix Basic", amount: 199, category: "Entertainment", billingCycle: "monthly" as const },
  { name: "Amazon Prime", amount: 299, category: "Shopping", billingCycle: "monthly" as const },
  { name: "ChatGPT Plus", amount: 1999, category: "AI Tools", billingCycle: "monthly" as const },
  { name: "Gym Membership", amount: 1500, category: "Fitness", billingCycle: "monthly" as const },
];

export function SubscriptionsTracker() {
  const { data: subscriptions = [], isLoading } = useSubscriptions();
  const addSubMutation = useAddSubscription();
  const deleteSubMutation = useDeleteSubscription();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);
  const [loggingSubId, setLoggingSubId] = useState<string | null>(null);

  const addTxMutation = useAddTransaction();
  const { data: categories = [] } = useCategories();

  const handleApplySubPack = (pack: TemplatePack) => {
    pack.items.forEach((item) => {
      addSubMutation.mutate({
        name: item.title,
        amount: item.amount || 150,
        billingCycle: "monthly",
        renewalDate: new Date().toISOString().split("T")[0],
        category: item.category || "General",
      });
    });
    toast.success(`Applied ${pack.name} subscription pack! 💳`);
  };

  const handleQuickAddSub = async (chip: typeof QUICK_SUB_CHIPS[number]) => {
    try {
      await addSubMutation.mutateAsync({
        name: chip.name,
        amount: chip.amount,
        cost: chip.amount,
        billingCycle: chip.billingCycle,
        renewalDate: new Date().toISOString().split("T")[0],
        nextRenewalDate: new Date().toISOString().split("T")[0],
        category: chip.category,
      });
      toast.success(`Added ${chip.name} (₹${chip.amount.toLocaleString()}/mo)`);
    } catch {
      toast.error("Failed to add subscription");
    }
  };

  const handleLogPayment = async (sub: any) => {
    const cost = sub.amount || sub.cost || 0;
    if (cost <= 0) return;

    try {
      setLoggingSubId(sub.id);
      const targetCat = categories.find((c) =>
        c.type === "expense" && (
          c.name.toLowerCase().includes(sub.category?.toLowerCase() || "") ||
          c.name.toLowerCase().includes("utilit") ||
          c.name.toLowerCase().includes("subscript") ||
          c.name.toLowerCase().includes("entertain")
        )
      ) || categories.find((c) => c.type === "expense") || categories[0];

      await addTxMutation.mutateAsync({
        amount: cost,
        type: "expense",
        categoryId: targetCat?.id || "subscriptions",
        date: format(new Date(), "yyyy-MM-dd"),
        note: `Subscription: ${sub.name} (${sub.billingCycle})`,
        paymentMethod: "UPI",
        isRecurring: true,
      } as any);

      toast.success(`Logged ₹${cost.toLocaleString()} for ${sub.name} in Ledger! ⚡`);
    } catch {
      toast.error("Failed to log subscription payment");
    } finally {
      setTimeout(() => setLoggingSubId(null), 800);
    }
  };

  // Form State
  const [subName, setSubName] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subCycle, setSubCycle] = useState<"monthly" | "yearly">("monthly");
  const [subDate, setSubDate] = useState(new Date().toISOString().split("T")[0]);
  const [subCategory, setSubCategory] = useState("Utilities");

  const handleAddSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName || !subAmount) return;

    try {
      await addSubMutation.mutateAsync({
        name: subName.trim(),
        cost: Number(subAmount),
        amount: Number(subAmount),
        billingCycle: subCycle,
        renewalDate: subDate,
        nextRenewalDate: subDate,
        category: subCategory,
      });
      toast.success("Subscription added");
      setIsAddOpen(false);
      setSubName("");
      setSubAmount("");
    } catch {
      toast.error("Failed to add subscription");
    }
  };

  const totalMonthlyCommitment = subscriptions.reduce((sum: number, s: any) => {
    const costVal = s.cost !== undefined ? s.cost : s.amount !== undefined ? s.amount : 0;
    return sum + (s.billingCycle === "monthly" ? costVal : Math.round(costVal / 12));
  }, 0);

  return (
    <div className="bg-white dark:bg-[#161514] rounded-2xl p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4 my-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-[#F1EFEA] dark:bg-[#22201D] text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center shrink-0 border border-[#E8E5DF] dark:border-[#2A2724]">
            <CreditCard className="size-4.5 stroke-[1.5]" />
          </div>
          <div>
            <h4 className="text-[15px] font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight">Active Subscriptions</h4>
            <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E]">
              Monthly commitment: <strong className="text-[#161514] dark:text-[#FAF8F5] font-semibold font-mono tabular-nums">₹{totalMonthlyCommitment.toLocaleString()}</strong>
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsChoiceOpen(true)}
          className="text-xs font-medium text-white bg-[#161514] hover:bg-[#2A2826] dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] px-3.5 py-2 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 border border-[#161514] dark:border-white shadow-xs self-start sm:self-auto"
        >
          <Plus className="size-3.5 stroke-[2]" />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* Subscription Cards List or Zero-Confusion Onboarding */}
      {isLoading ? (
        <div className="h-24 animate-pulse bg-[#F1EFEA] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724]" />
      ) : subscriptions.length === 0 ? (
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] space-y-4">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-[#E8E5DF] dark:bg-[#2A2724] flex items-center justify-center shrink-0 text-[#161514] dark:text-[#FAF8F5]">
              <Sparkles className="size-4.5 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h5 className="text-sm font-semibold text-[#161514] dark:text-[#FAF8F5]">
                No recurring subscriptions tracked yet
              </h5>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] leading-relaxed">
                Add recurring services like Spotify, Netflix, gym fees, or developer tools. Invictus will calculate your monthly burn and let you log renewals with 1 tap.
              </p>
            </div>
          </div>

          {/* Quick Preset Packs */}
          <div className="space-y-2 pt-1 border-t border-[#E8E5DF] dark:border-[#2A2724]">
            <span className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] block">
              1-Tap Starter Packs
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SUBSCRIPTION_TEMPLATE_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-white dark:bg-[#22201D] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-between gap-3 hover:border-[#161514] dark:hover:border-white transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-[#161514] dark:text-[#FAF8F5] truncate block">
                      {pack.name}
                    </span>
                    <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] line-clamp-1">
                      {pack.items.length} services ({pack.items.map((i) => i.title).join(", ")})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplySubPack(pack)}
                    className="shrink-0 text-xs font-medium text-white bg-[#161514] hover:bg-[#2A2826] dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] px-3 py-1.5 rounded-lg border border-[#161514] dark:border-white transition-colors cursor-pointer"
                  >
                    Add Pack
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Single Popular Quick Add Chips */}
          <div className="space-y-1.5 pt-1 border-t border-[#E8E5DF] dark:border-[#2A2724]">
            <span className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] block">
              Or add individual popular subscriptions:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUB_CHIPS.map((chip) => (
                <button
                  key={chip.name}
                  type="button"
                  onClick={() => handleQuickAddSub(chip)}
                  className="bg-white dark:bg-[#22201D] hover:bg-[#F1EFEA] dark:hover:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="size-3 stroke-[2] text-[#6B6B6B] dark:text-[#A8A29E]" />
                  <span>{chip.name}</span>
                  <span className="font-mono text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">₹{chip.amount}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subscriptions.map((sub: any) => {
            const cost = sub.amount || sub.cost || 0;
            const renDate = sub.renewalDate || sub.nextRenewalDate || "1st of month";

            return (
              <div
                key={sub.id}
                className="bg-white dark:bg-[#1C1A18] rounded-xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-between gap-3 hover:bg-[#FAF8F5] dark:hover:bg-[#22201D] transition-colors shadow-none hover:shadow-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-semibold text-xs text-[#161514] dark:text-[#FAF8F5] truncate">{sub.name}</h5>
                    <span className="bg-[#F1EFEA] dark:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] text-[10px] font-medium px-2 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531]">
                      {sub.category || "General"}
                    </span>
                  </div>
                  <span className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] flex items-center gap-1 mt-1 font-mono">
                    <Clock className="size-3 stroke-[1.5]" /> Renews: {renDate} ({sub.billingCycle})
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-[#161514] dark:text-[#FAF8F5] font-mono tabular-nums">
                    ₹{cost.toLocaleString()} <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] font-normal">/mo</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLogPayment(sub)}
                    disabled={loggingSubId === sub.id}
                    className="bg-[#161514] hover:bg-[#2A2826] dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] text-white font-medium text-xs px-2.5 py-1 rounded-lg border border-[#161514] dark:border-white transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                    title="Log this subscription payment into Ledger"
                  >
                    <Zap className="size-3 stroke-[1.5]" />
                    <span>Log</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteSubId(sub.id)}
                    className="text-[#6B6B6B] dark:text-[#A8A29E] hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Cancel subscription"
                  >
                    <Trash2 className="size-3.5 stroke-[1.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Choice Modal: Blank or Template Packs */}
      <TemplateSelectionModal
        open={isChoiceOpen}
        onOpenChange={setIsChoiceOpen}
        title="Add Subscription"
        subtitle="Add a single subscription or choose a preset pack."
        blankLabel="Custom Subscription"
        blankDesc="Name, price, and renewal cycle"
        templatesLabel="Preset Packs"
        templatesDesc="Streaming, work tools, fitness, etc."
        templatePacks={SUBSCRIPTION_TEMPLATE_PACKS}
        onSelectBlank={() => setIsAddOpen(true)}
        onApplyTemplatePack={handleApplySubPack}
      />

      {/* Add Subscription Modal */}
      <ResponsiveFormContainer
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Add Subscription"
        description="Track recurring bills and plans."
      >
        <form onSubmit={handleAddSub} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] block">Service Name *</label>
            <input
              type="text"
              placeholder="e.g. Netflix, Gym, Notion"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2.5 text-xs font-medium text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:border-[#161514] dark:focus:border-white transition-all"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] block">Amount (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 499"
                value={subAmount}
                onChange={(e) => setSubAmount(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2.5 text-xs font-medium text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:border-[#161514] dark:focus:border-white transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] block">Billing Cycle</label>
              <NeobrutalistSelect
                value={subCycle}
                onChange={(val) => setSubCycle(val as any)}
                options={[
                  { value: "monthly", label: "Monthly", icon: "Calendar" },
                  { value: "yearly", label: "Yearly", icon: "Calendar" },
                ]}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] block">Next Renewal Date *</label>
            <input
              type="date"
              value={subDate}
              onChange={(e) => setSubDate(e.target.value)}
              className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2.5 text-xs font-medium text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:border-[#161514] dark:focus:border-white transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={addSubMutation.isPending}
            className="w-full bg-[#161514] hover:bg-[#2A2826] text-white dark:bg-[#FAF8F5] dark:text-[#161514] dark:hover:bg-[#E8E5DF] font-semibold text-xs rounded-xl py-2.5 mt-2 border border-[#161514] dark:border-white shadow-xs cursor-pointer transition-all"
          >
            {addSubMutation.isPending ? "Saving…" : "Save Subscription"}
          </button>
        </form>
      </ResponsiveFormContainer>

      {/* Delete Subscription Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteSubId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteSubId(null);
        }}
        onConfirm={async () => {
          if (deleteSubId) {
            try {
              await deleteSubMutation.mutateAsync(deleteSubId);
              toast.success("Subscription removed 🗑️");
            } catch {
              toast.error("Failed to remove subscription");
            }
            setDeleteSubId(null);
          }
        }}
        title="Remove Subscription"
        description="Are you sure you want to remove this recurring subscription? You can re-add it anytime."
      />
    </div>
  );
}
