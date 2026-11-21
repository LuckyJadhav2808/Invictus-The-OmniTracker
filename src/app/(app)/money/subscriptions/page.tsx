"use client";

import { useState } from "react";
import { Repeat } from "lucide-react";
import { SubpageLayout } from "@/components/shared/SubpageLayout";
import { SubpageTwoTabs } from "@/components/shared/SubpageTwoTabs";
import { SubscriptionsTracker } from "@/components/money/SubscriptionsTracker";
import { SavingsGoals } from "@/components/money/SavingsGoals";

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<"subscriptions" | "savings">("subscriptions");

  return (
    <SubpageLayout
      appBarTitle="Subscriptions"
      backHref="/money"
      backLabel="Money"
      title="Subscriptions & Vault"
      badge="Recurring Engine"
      badgeColorClass="bg-sky-400/20 text-sky-700 dark:text-sky-300 border-sky-500/30"
      subtitle="Manage active subscriptions, auto-renewals & emergency reserves"
      icon={Repeat}
    >
      {/* 2-Tab Navigation */}
      <SubpageTwoTabs<"subscriptions" | "savings">
        tabs={[
          { id: "subscriptions", label: "Active Subscriptions", icon: "🔄" },
          { id: "savings", label: "Savings & Reserves", icon: "🏦" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

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
    </SubpageLayout>
  );
}
