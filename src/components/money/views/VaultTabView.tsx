"use client";

import { DraggableDashboardGrid } from "@/components/shared/DraggableDashboardGrid";
import { SubscriptionsTracker } from "@/components/money/SubscriptionsTracker";
import { SavingsGoals } from "@/components/money/SavingsGoals";

interface VaultTabViewProps {
  currencySymbol?: string;
}

export function VaultTabView({ currencySymbol = "₹" }: VaultTabViewProps) {
  return (
    <div className="space-y-6">
      <DraggableDashboardGrid
        storageKey="money-vault"
        widgets={[
          {
            id: "subscriptions",
            title: "Active Subscriptions",
            component: <SubscriptionsTracker />,
          },
          {
            id: "savings-goals",
            title: "Savings Goals & Reserves",
            component: <SavingsGoals />,
          },
        ]}
      />
    </div>
  );
}
