"use client";

import React from "react";
import { DraggableDashboardGrid } from "@/components/shared/DraggableDashboardGrid";
import { SubscriptionsTracker } from "@/components/money/SubscriptionsTracker";
import { SavingsGoals } from "@/components/money/SavingsGoals";
import { DebtTracker } from "@/components/money/DebtTracker";

interface VaultTabViewProps {
  currencySymbol: string;
}

export function VaultTabView({ currencySymbol }: VaultTabViewProps) {
  return (
    <div className="space-y-6">
      <DraggableDashboardGrid
        storageKey="money-vault"
        widgets={[
          {
            id: "subscriptions",
            title: "🔁 Active Subscriptions",
            component: <SubscriptionsTracker />,
          },
          {
            id: "savings-goals",
            title: "🐷 Savings Goals & Piggy Bank",
            component: <SavingsGoals />,
          },
          {
            id: "debt-tracker",
            title: "💸 Lent & Borrowed Money Ledger",
            component: <DebtTracker currencySymbol={currencySymbol} />,
          },
        ]}
      />
    </div>
  );
}
