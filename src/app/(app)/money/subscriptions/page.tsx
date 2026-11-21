"use client";

import { useState } from "react";
import { Repeat, PiggyBank, Plus } from "lucide-react";
import { SubpageHeader } from "@/components/shared/SubpageHeader";
import { MobileAppBar } from "@/components/mobile/MobileAppBar";
import { SubscriptionsTracker } from "@/components/money/SubscriptionsTracker";
import { SavingsGoals } from "@/components/money/SavingsGoals";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<"subscriptions" | "savings">("subscriptions");

  return (
    <div className="w-full max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-3.5 select-none animate-in fade-in duration-200 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {/* Dynamic Strobi Top App Bar */}
      <div className="-mx-2 -mt-2 sm:-mx-4 sm:-mt-4 lg:hidden">
        <MobileAppBar title="Subscriptions" showDynamicIsland={true} />
      </div>

      {/* 1. Title Bar with inline back button */}
      <SubpageHeader
        backHref="/money"
        backLabel="Money"
        title="Subscriptions & Vault"
        badge="Recurring Engine"
        badgeColorClass="bg-sky-400/20 text-sky-700 dark:text-sky-300 border-sky-500/30"
        subtitle="Manage active subscriptions, auto-renewals & emergency reserves"
        icon={Repeat}
      />

      {/* 2. Strict 2-Tab Navigation */}
      <div className="grid grid-cols-2 p-1 bg-muted/60 dark:bg-card border-2 border-[#161514] dark:border-white/20 rounded-xl shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] gap-1">
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            soundFX.vibrate(10);
            setActiveTab("subscriptions");
          }}
          className={cn(
            "py-2 text-xs font-heading font-black rounded-lg transition-all text-center cursor-pointer",
            activeTab === "subscriptions"
              ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          🔄 Active Subscriptions
        </button>
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            soundFX.vibrate(10);
            setActiveTab("savings");
          }}
          className={cn(
            "py-2 text-xs font-heading font-black rounded-lg transition-all text-center cursor-pointer",
            activeTab === "savings"
              ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          🏦 Savings &amp; Reserves
        </button>
      </div>

      {/* TAB 1: Subscriptions */}
      {activeTab === "subscriptions" && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <SubscriptionsTracker />
        </div>
      )}

      {/* TAB 2: Savings & Reserves */}
      {activeTab === "savings" && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <SavingsGoals />
        </div>
      )}
    </div>
  );
}
