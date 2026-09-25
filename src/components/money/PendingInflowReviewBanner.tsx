"use client";

import { useState } from "react";
import { usePendingInflows, useApproveInflow, useDismissInflow, PendingInflowItem } from "@/lib/queries/inflows";
import { useCategories } from "@/lib/queries/money";
import { Button } from "@/components/ui/button";
import { ArrowDownLeft, Check, X, ShieldAlert, Sparkles, UserCheck, RefreshCw } from "lucide-react";

export function PendingInflowReviewBanner() {
  const { data: pendingInflows = [], isLoading } = usePendingInflows();
  const { data: categories = [] } = useCategories();
  const approveMutation = useApproveInflow();
  const dismissMutation = useDismissInflow();

  const [selectedCatByInflow, setSelectedCatByInflow] = useState<Record<string, string>>({});

  if (isLoading || pendingInflows.length === 0) {
    return null;
  }

  const incomeCategories = categories.filter((c) => c.type === "income" && !c.archived);

  const handleApprove = (inflow: PendingInflowItem, customNote?: string) => {
    const chosenCatId = selectedCatByInflow[inflow.id] || (incomeCategories[0]?.id || "cat-salary");
    approveMutation.mutate({
      id: inflow.id,
      categoryId: chosenCatId,
      note: customNote || `${inflow.merchant} (${inflow.bankName || "Bank"})`,
    });
  };

  const handleTransfer = (inflow: PendingInflowItem) => {
    // Treat as P2P Transfer / Repayment
    const p2pCategory = categories.find((c) => c.name.toLowerCase().includes("transfer") || c.name.toLowerCase().includes("p2p")) || incomeCategories[0];
    approveMutation.mutate({
      id: inflow.id,
      categoryId: p2pCategory?.id || "cat-salary",
      note: `P2P Repayment from ${inflow.merchant}`,
    });
  };

  const handleDismiss = (inflowId: string) => {
    dismissMutation.mutate(inflowId);
  };

  return (
    <div className="rounded-2xl bg-[#1C1B19] border-2 border-[#05DF72] p-4 sm:p-5 shadow-[3px_3px_0px_0px_#05DF72] animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#2E2C29]">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#05DF72]/20 text-[#05DF72] font-black shrink-0">
            <ArrowDownLeft className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
              <span>Pending Inflows to Review</span>
              <span className="px-2 py-0.5 rounded-full bg-[#05DF72] text-black text-[10px] font-black uppercase">
                {pendingInflows.length} New
              </span>
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Credits detected from Bank SMS. Confirm legitimate income or dismiss self-transfers to keep analytics accurate.
            </p>
          </div>
        </div>
      </div>

      {/* Inflow List */}
      <div className="mt-3 space-y-2.5">
        {pendingInflows.map((inflow) => (
          <div
            key={inflow.id}
            className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#23211F] border border-[#33302D] hover:border-stone-500 transition-all"
          >
            {/* Left: Info */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-[#05DF72] font-bold text-sm shrink-0">
                ₹
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-black text-[#05DF72]">
                    +₹{inflow.amount.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-bold text-white">from {inflow.merchant}</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#181716] border border-[#383532] text-stone-300 text-[10px] font-mono">
                    ⚡ {inflow.bankName || "Bank"} {inflow.accountLast4 ? `**${inflow.accountLast4}` : ""}
                  </span>
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  Received on <span className="font-mono text-stone-300">{inflow.date}</span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
              {/* Category Dropdown */}
              {incomeCategories.length > 0 && (
                <select
                  value={selectedCatByInflow[inflow.id] || incomeCategories[0]?.id || ""}
                  onChange={(e) =>
                    setSelectedCatByInflow((prev) => ({ ...prev, [inflow.id]: e.target.value }))
                  }
                  className="bg-[#181716] border border-[#383532] text-stone-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#05DF72] font-medium"
                >
                  {incomeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Confirm as Income */}
              <Button
                type="button"
                size="sm"
                onClick={() => handleApprove(inflow)}
                disabled={approveMutation.isPending}
                className="bg-[#05DF72] hover:bg-[#04C966] text-black text-xs font-black rounded-xl h-8 px-3 shadow-md"
              >
                <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Confirm Income
              </Button>

              {/* Mark as Split / Transfer */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTransfer(inflow)}
                disabled={approveMutation.isPending}
                className="bg-[#2B2926] border-[#3D3A36] text-stone-300 hover:text-white hover:bg-[#33302C] text-xs font-bold rounded-xl h-8 px-2.5"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1" /> Bill Split
              </Button>

              {/* Ignore / Dismiss */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(inflow.id)}
                disabled={dismissMutation.isPending}
                className="text-stone-400 hover:text-rose-400 hover:bg-rose-950/20 text-xs font-bold rounded-xl h-8 px-2"
                title="Ignore self-transfer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
