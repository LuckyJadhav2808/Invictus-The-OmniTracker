"use client";

import { useState } from "react";
import { CreditCard, Plus, Trash2, Clock } from "lucide-react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { SUBSCRIPTION_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSubscriptions, useAddSubscription, useDeleteSubscription } from "@/lib/queries/money";

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

export function SubscriptionsTracker() {
  const { data: subscriptions = [], isLoading } = useSubscriptions();
  const addSubMutation = useAddSubscription();
  const deleteSubMutation = useDeleteSubscription();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);

  const handleApplySubPack = (pack: TemplatePack) => {
    pack.items.forEach((item) => {
      addSubMutation.mutate({
        name: item.title,
        amount: item.amount || 15.0,
        billingCycle: "monthly",
        renewalDate: new Date().toISOString().split("T")[0],
        category: item.category || "General",
      });
    });
    toast.success(`Applied ${pack.name} subscription pack!`);
  };
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);

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
      toast.success("Subscription added! 💳");
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
    <div className="bg-white rounded-3xl p-5 md:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4 my-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#FED7AA] border-2 border-[#161514] text-[#161514] flex items-center justify-center shadow-[2px_2px_0px_0px_#161514] shrink-0">
            <CreditCard className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm font-black text-[#161514] tracking-tight font-heading uppercase">Recurring Subscriptions</h4>
            <p className="text-[10px] text-[#161514]/70 font-bold uppercase tracking-wider">
              Monthly commitment: <strong className="text-[#161514] font-black font-heading">₹{totalMonthlyCommitment.toLocaleString()}</strong>
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsChoiceOpen(true)}
          className="text-xs font-black text-[#161514] bg-[#CEF431] hover:bg-[#b8dd24] px-3.5 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none uppercase tracking-wider"
        >
          <Plus className="h-3.5 w-3.5 stroke-[3]" /> Add Sub
        </button>
      </div>

      {/* Subscription Cards List */}
      {isLoading ? (
        <div className="h-20 animate-pulse bg-[#FAF8F5] rounded-2xl border-2 border-[#161514]" />
      ) : subscriptions.length === 0 ? (
        <div className="bg-[#FFFDF8] rounded-2xl p-6 border-2 border-dashed border-[#161514] text-center space-y-1 shadow-[2px_2px_0px_0px_#161514]">
          <p className="text-xs font-black text-[#161514] font-heading uppercase">No active subscriptions added yet! 💳</p>
          <p className="text-[10px] text-[#161514]/70 font-bold">Click '+ Add Sub' above to log software, media & hosting recurring payments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subscriptions.map((sub: any) => {
            const cost = sub.amount || sub.cost || 0;
            const renDate = sub.renewalDate || sub.nextRenewalDate || "1st of month";

            return (
              <div
                key={sub.id}
                className="bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex items-center justify-between gap-3 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-black text-xs text-[#161514] truncate font-heading">{sub.name}</h5>
                    <span className="bg-[#FED7AA] text-[#161514] text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border-2 border-[#161514]">
                      {sub.category || "General"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#161514]/70 flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-[#EA580C] stroke-[2.5]" /> Renews: {renDate} ({sub.billingCycle})
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-sm font-black text-[#161514] font-heading">
                    ₹{cost.toLocaleString()} <span className="text-[9px] text-[#161514]/70 font-bold">/mo</span>
                  </span>
                  <button
                    onClick={() => setDeleteSubId(sub.id)}
                    className="bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#991B1B] p-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                    title="Cancel subscription"
                  >
                    <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
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
        title="ADD RECURRING SUBSCRIPTION"
        subtitle="LOG A CUSTOM SUBSCRIPTION OR APPLY A READY-MADE PACK."
        blankLabel="CUSTOM SUBSCRIPTION"
        blankDesc="ENTER SERVICE NAME, COST & RENEWAL DATE"
        templatesLabel="SUBSCRIPTION PACKS"
        templatesDesc="STREAMING MEDIA, DEVELOPER SUITE, GYM..."
        templatePacks={SUBSCRIPTION_TEMPLATE_PACKS}
        onSelectBlank={() => setIsAddOpen(true)}
        onApplyTemplatePack={handleApplySubPack}
      />

      {/* Add Subscription Modal */}
      <ResponsiveFormContainer
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Add Recurring Subscription"
        description="Track your active monthly/yearly subscriptions"
      >
        <form onSubmit={handleAddSub} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">Service Name *</label>
            <input
              type="text"
              placeholder="e.g. Netflix, Gym, Notion"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              className="w-full bg-[#FFFDF8] rounded-xl border-2 border-[#161514] px-3.5 py-2.5 text-xs font-black text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:bg-[#FFF9EA] transition-all"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">Amount (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 499"
                value={subAmount}
                onChange={(e) => setSubAmount(e.target.value)}
                className="w-full bg-[#FFFDF8] rounded-xl border-2 border-[#161514] px-3.5 py-2.5 text-xs font-black text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:bg-[#FFF9EA] transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">Billing Cycle</label>
              <NeobrutalistSelect
                value={subCycle}
                onChange={(val) => setSubCycle(val as any)}
                options={[
                  { value: "monthly", label: "Monthly", icon: "📅" },
                  { value: "yearly", label: "Yearly", icon: "🎆" },
                ]}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">Next Renewal Date *</label>
            <input
              type="date"
              value={subDate}
              onChange={(e) => setSubDate(e.target.value)}
              className="w-full bg-[#FFFDF8] rounded-xl border-2 border-[#161514] px-3.5 py-2.5 text-xs font-black text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:bg-[#FFF9EA] transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={addSubMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
          >
            {addSubMutation.isPending ? "Saving…" : "Save Subscription 💳"}
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
