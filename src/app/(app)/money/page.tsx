"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import {
  useCategories,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
  useTransactions,
  useAddTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
  useBudgetPreferences,
  useUpdateBudgetPreferences,
} from "@/lib/queries/money";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { BUDGET_CATEGORY_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, Target, PiggyBank, BarChart2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/components/shared/AuthProvider";
import { ProactiveReminderBanner } from "@/components/shared/ProactiveReminderBanner";
import { useSearchParams } from "next/navigation";
import {
  computeMonthlyBudgetStats,
  computeDailyBudgetStats,
} from "@/lib/utils/budget-rollover";
import { useWidgetSync } from "@/lib/hooks/useWidgetSync";
import { InvictusLoadingScreen } from "@/components/shared/InvictusLoadingScreen";
import { type Transaction, type Category } from "@/types";
import dynamic from "next/dynamic";

// Modular Sub-Components & Views
import { FinancialSummaryCockpit } from "@/components/money/FinancialSummaryCockpit";
import { LedgerTabView } from "@/components/money/views/LedgerTabView";
import { BudgetTabView } from "@/components/money/views/BudgetTabView";
import { VaultTabView } from "@/components/money/views/VaultTabView";
import { AnalyticsTabView } from "@/components/money/views/AnalyticsTabView";
import { TransactionFormModal } from "@/components/money/modals/TransactionFormModal";
import { TransactionDetailModal } from "@/components/money/modals/TransactionDetailModal";
import { CategoryFormModal } from "@/components/money/modals/CategoryFormModal";
import { AllowanceSettingsModal } from "@/components/money/modals/AllowanceSettingsModal";
import { MoveMoneyModal } from "@/components/money/modals/MoveMoneyModal";
import { SendMoneyModal } from "@/components/money/modals/SendMoneyModal";

const PDFExportModal = dynamic(
  () => import("@/components/money/PDFExportModal").then((mod) => mod.PDFExportModal),
  { ssr: false }
);

const BulkExpenseModal = dynamic(
  () => import("@/components/money/BulkExpenseModal").then((mod) => mod.BulkExpenseModal),
  { ssr: false }
);

function MoneyPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const actionParam = searchParams.get("action");
  const [activeTab, setActiveTab] = useState(tabParam || "ledger");

  // Sync tab with URL search parameter
  useEffect(() => {
    if (tabParam && ["ledger", "budgets", "vault", "analytics"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Handle deep-link action triggers (e.g., from quick-action menu or widgets)
  useEffect(() => {
    if (actionParam === "add_tx") {
      setIsAddTxOpen(true);
    }
  }, [actionParam]);

  const { user } = useAuth();
  const [currency, setCurrency] = useState("INR");

  useEffect(() => {
    if ((user as any)?.currency) {
      setCurrency((user as any).currency);
    } else if (typeof window !== "undefined") {
      const saved = localStorage.getItem("invictus_currency");
      if (saved) setCurrency(saved);
    }
  }, [user]);

  const currencySymbol = useMemo(() => {
    switch (currency) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "JPY": return "¥";
      default: return "₹";
    }
  }, [currency]);

  // Data Queries
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: transactions = [], isLoading: txsLoading } = useTransactions();
  const { data: cloudBudgetPrefs } = useBudgetPreferences();

  // Mutations
  const addTxMutation = useAddTransaction();
  const updateTxMutation = useUpdateTransaction();
  const deleteTxMutation = useDeleteTransaction();
  const addCatMutation = useAddCategory();
  const updateCatMutation = useUpdateCategory();
  const deleteCatMutation = useDeleteCategory();
  const updateBudgetMutation = useUpdateBudgetPreferences();

  // Modal States
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [inspectingTx, setInspectingTx] = useState<Transaction | null>(null);
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isMoveMoneyOpen, setIsMoveMoneyOpen] = useState(false);
  const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);
  const [reopenTxAfterCat, setReopenTxAfterCat] = useState(false);

  // Deletion Safeguard
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  // Allowances & Rollover States
  const [baseUpiBudget, setBaseUpiBudget] = useState(8000);
  const [baseCashBudget, setBaseCashBudget] = useState(2000);
  const [customDailyBudget, setCustomDailyBudget] = useState<number | null>(null);
  const [enableRollover, setEnableRollover] = useState(true);

  // Hydrate allowances from Cloud & LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const upi = localStorage.getItem("invictus_monthly_upi_budget");
      const cash = localStorage.getItem("invictus_monthly_cash_budget");
      const daily = localStorage.getItem("invictus_custom_daily_budget");
      const roll = localStorage.getItem("invictus_budget_rollover_enabled");
      if (upi) setBaseUpiBudget(Number(upi));
      if (cash) setBaseCashBudget(Number(cash));
      if (daily) setCustomDailyBudget(Number(daily));
      if (roll !== null) setEnableRollover(roll === "true");
    }
  }, []);

  useEffect(() => {
    if (cloudBudgetPrefs) {
      if (cloudBudgetPrefs.upiBudget !== undefined && cloudBudgetPrefs.upiBudget > 0) {
        setBaseUpiBudget(cloudBudgetPrefs.upiBudget);
      }
      if (cloudBudgetPrefs.cashBudget !== undefined && cloudBudgetPrefs.cashBudget >= 0) {
        setBaseCashBudget(cloudBudgetPrefs.cashBudget);
      }
      if (cloudBudgetPrefs.customDailyBudget !== undefined) {
        setCustomDailyBudget(cloudBudgetPrefs.customDailyBudget);
      }
      if (cloudBudgetPrefs.enableRollover !== undefined) {
        setEnableRollover(cloudBudgetPrefs.enableRollover);
      }
    }
  }, [cloudBudgetPrefs]);

  // Compute Monthly & Daily Stats
  const targetMonthKey = format(new Date(), "yyyy-MM");

  const monthlyStats = useMemo(() => {
    return computeMonthlyBudgetStats({
      transactions,
      categories,
      targetMonthKey,
      baseUpiBudget,
      baseCashBudget,
      enableRollover,
    });
  }, [transactions, categories, targetMonthKey, baseUpiBudget, baseCashBudget, enableRollover]);

  const dailyStats = useMemo(() => {
    return computeDailyBudgetStats({
      transactions,
      monthlyStats,
      customDailyBudget,
      referenceDate: new Date(),
    });
  }, [transactions, monthlyStats, customDailyBudget]);

  // Sync with Global App Widgets
  const { syncToWidget } = useWidgetSync();
  useEffect(() => {
    syncToWidget({
      safeToSpendDaily: monthlyStats.dailySafeToSpend,
      remainingUpiBudget: monthlyStats.remainingUpiBudget,
      remainingCashBudget: monthlyStats.remainingCashBudget,
      totalAvailableUpiBudget: monthlyStats.totalAvailableUpiBudget,
      totalAvailableCashBudget: monthlyStats.totalAvailableCashBudget,
      currencySymbol,
      daysRemainingInMonth: monthlyStats.daysRemainingInMonth,
      targetMonthLabel: monthlyStats.targetMonthLabel,
      hasCashBudget: baseCashBudget > 0,
      todayExpense: dailyStats.todayExpense,
      todayRemaining: dailyStats.todayRemaining,
      dailyBudgetTarget: dailyStats.dailyBudgetTarget,
      isOverDailyBudget: dailyStats.isOverDailyBudget,
      overDailyAmount: dailyStats.overDailyAmount,
    });
  }, [monthlyStats, dailyStats, currencySymbol, baseCashBudget, syncToWidget]);

  // Category map helper
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // --- Handlers ---
  const handleSaveTransaction = async (payload: {
    id?: string;
    amount: number;
    type: "expense" | "income";
    categoryId: string;
    date: string;
    note?: string;
    paymentMethod: string;
  }) => {
    if (payload.id) {
      await updateTxMutation.mutateAsync(payload as any);
      toast.success("Transaction updated! ✏️");
    } else {
      const res = await addTxMutation.mutateAsync(payload as any);
      const newId = (res as any)?.id || (res as any)?._id;
      const cat = categoryMap.get(payload.categoryId);
      toast.success(
        `Logged ${currencySymbol}${payload.amount} ${cat?.icon || ""} ${payload.note ? `• ${payload.note}` : ""}`,
        {
          action: {
            label: "Undo",
            onClick: () => {
              if (newId) deleteTxMutation.mutate(newId);
            },
          },
        }
      );
    }
  };

  const handleDuplicateTransaction = async (tx: Transaction) => {
    try {
      const newTx = await addTxMutation.mutateAsync({
        amount: tx.amount,
        type: tx.type,
        categoryId: tx.categoryId,
        date: format(new Date(), "yyyy-MM-dd"),
        note: tx.note ? `${tx.note} (Copy)` : undefined,
        paymentMethod: tx.paymentMethod,
      } as any);
      const newId = (newTx as any)?.id || (newTx as any)?._id;
      toast.success(`Duplicated transaction! ⚡`, {
        action: {
          label: "Undo",
          onClick: () => {
            if (newId) deleteTxMutation.mutate(newId);
          },
        },
      });
    } catch {
      toast.error("Failed to duplicate transaction");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const existing = transactions.find((t) => t.id === id);
    await deleteTxMutation.mutateAsync(id);
    toast.info("Transaction deleted", {
      action: existing
        ? {
            label: "Restore",
            onClick: () => addTxMutation.mutate(existing as any),
          }
        : undefined,
    });
  };

  const handleExecuteTransfer = async (
    sourceCatId: string,
    destCatId: string,
    amount: number,
    note?: string
  ) => {
    const fromCat = categoryMap.get(sourceCatId);
    const toCat = categoryMap.get(destCatId);
    const dateStr = format(new Date(), "yyyy-MM-dd");

    // 1. Log transfer out expense
    await addTxMutation.mutateAsync({
      amount,
      type: "expense",
      categoryId: sourceCatId,
      date: dateStr,
      note: `Transfer to ${toCat?.name || "Envelope"}${note ? `: ${note}` : ""}`,
      paymentMethod: "Transfer",
      isRecurring: false,
    });

    // 2. Log transfer in income
    await addTxMutation.mutateAsync({
      amount,
      type: "income",
      categoryId: destCatId,
      date: dateStr,
      note: `Transfer from ${fromCat?.name || "Envelope"}${note ? `: ${note}` : ""}`,
      paymentMethod: "Transfer",
      isRecurring: false,
    });

    toast.success(
      `Transferred ${currencySymbol}${amount} from ${fromCat?.name || "Wallet"} to ${toCat?.name || "Wallet"}! 🔄`
    );
  };

  const handleSendMoney = async (payload: {
    recipient: string;
    amount: number;
    categoryId: string;
    paymentMethod: string;
    note?: string;
  }) => {
    const dateStr = format(new Date(), "yyyy-MM-dd");
    const cat = categoryMap.get(payload.categoryId);

    const res = await addTxMutation.mutateAsync({
      amount: payload.amount,
      type: "expense",
      categoryId: payload.categoryId,
      date: dateStr,
      note: `Paid to ${payload.recipient} via ${payload.paymentMethod.toUpperCase()}${payload.note ? ` • ${payload.note}` : ""}`,
      paymentMethod: payload.paymentMethod,
      isRecurring: false,
    });

    const newId = (res as any)?.id || (res as any)?._id;
    toast.success(`Sent ${currencySymbol}${payload.amount} to ${payload.recipient}! 💸`, {
      action: {
        label: "Undo",
        onClick: () => {
          if (newId) deleteTxMutation.mutate(newId);
        },
      },
    });
  };

  const handleSaveCategory = async (payload: {
    id?: string;
    name: string;
    type: "expense" | "income";
    color: string;
    icon: string;
    monthlyBudget: number;
  }) => {
    if (payload.id) {
      await updateCatMutation.mutateAsync(payload as any);
      toast.success(`Updated category envelope: ${payload.name}!`);
    } else {
      await addCatMutation.mutateAsync(payload as any);
      toast.success(`Created category envelope: ${payload.name} ${payload.icon}! ✨`);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCatMutation.mutateAsync(id);
    toast.info("Category deleted.");
    setDeleteCatId(null);
  };

  const handleSaveAllowances = async (payload: {
    upiBudget: number;
    cashBudget: number;
    customDailyBudget: number | null;
    enableRollover: boolean;
  }) => {
    setBaseUpiBudget(payload.upiBudget);
    setBaseCashBudget(payload.cashBudget);
    setCustomDailyBudget(payload.customDailyBudget);
    setEnableRollover(payload.enableRollover);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("invictus_monthly_upi_budget", String(payload.upiBudget));
        localStorage.setItem("invictus_monthly_cash_budget", String(payload.cashBudget));
        if (payload.customDailyBudget !== null) {
          localStorage.setItem("invictus_custom_daily_budget", String(payload.customDailyBudget));
        } else {
          localStorage.removeItem("invictus_custom_daily_budget");
        }
        localStorage.setItem("invictus_budget_rollover_enabled", String(payload.enableRollover));
      } catch {}
    }

    try {
      await updateBudgetMutation.mutateAsync({
        upiBudget: payload.upiBudget,
        cashBudget: payload.cashBudget,
        customDailyBudget: payload.customDailyBudget,
        enableRollover: payload.enableRollover,
      });
      toast.success("Budget allowances saved & synced to cloud! 🎯");
    } catch {
      toast.success("Allowances saved locally! 🎯");
    }
  };

  const handleApplyCategoryPack = async (pack: TemplatePack) => {
    try {
      for (const item of pack.items) {
        const exists = categories.find((c) => c.name.toLowerCase() === item.title.toLowerCase());
        if (exists) {
          await updateCatMutation.mutateAsync({
            id: exists.id,
            monthlyBudget: item.amount || exists.monthlyBudget || 0,
            isTemplate: true,
            templatePackId: pack.id,
          });
        } else {
          await addCatMutation.mutateAsync({
            name: item.title,
            type: (item.type?.toLowerCase() === "income" ? "income" : "expense") as any,
            color: "amber",
            icon: pack.icon || "💳",
            monthlyBudget: item.amount || 0,
            isTemplate: true,
            templatePackId: pack.id,
          } as any);
        }
      }
      toast.success(`Applied ${pack.name} pack! 🚀`);
    } catch {
      toast.error("Failed to apply category pack");
    }
  };

  const handleUnapplyCategoryPack = async (pack: TemplatePack) => {
    try {
      const templateCats = categories.filter((c) => c.templatePackId === pack.id);
      for (const cat of templateCats) {
        await deleteCatMutation.mutateAsync(cat.id);
      }
      toast.success(`Unapplied ${pack.name}! 🧹`);
    } catch {
      toast.error("Failed to unapply category pack");
    }
  };

  if (catsLoading || txsLoading) {
    return <InvictusLoadingScreen message="Loading Financial Cockpit…" />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Contextual Reminder */}
      <ProactiveReminderBanner space="money" />

      {/* 🚀 STICKY SUMMARY COCKPIT WITH CASHFLOW HIGHWAY GAUGE */}
      <FinancialSummaryCockpit
        monthlyStats={monthlyStats}
        dailyStats={dailyStats}
        currencySymbol={currencySymbol}
        onAddTransaction={() => setIsAddTxOpen(true)}
        onBulkScan={() => setIsBulkModalOpen(true)}
        onAddCategory={() => setIsAddCatOpen(true)}
        onOpenEditAllowances={() => setIsAllowanceModalOpen(true)}
      />

      {/* 📑 TABS CONTROLS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="w-full overflow-x-auto no-scrollbar pb-1 mb-4">
          <TabsList className="bg-[#FAF8F5] rounded-2xl p-1.5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex items-center gap-1.5 w-max min-w-full sm:min-w-0 sm:w-auto">
            <TabsTrigger
              value="ledger"
              className="rounded-xl text-xs font-heading font-extrabold py-2 px-3.5 sm:px-4 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#CEF431] data-[state=active]:text-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_#161514] text-[#161514]/70 hover:text-[#161514] hover:bg-white/50 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Receipt className="size-3.5 stroke-[2.2]" />
              <span>Daily Ledger</span>
            </TabsTrigger>
            <TabsTrigger
              value="budgets"
              className="rounded-xl text-xs font-heading font-extrabold py-2 px-3.5 sm:px-4 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#CEF431] data-[state=active]:text-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_#161514] text-[#161514]/70 hover:text-[#161514] hover:bg-white/50 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Target className="size-3.5 stroke-[2.2]" />
              <span>Budget & Rollover</span>
            </TabsTrigger>
            <TabsTrigger
              value="vault"
              className="rounded-xl text-xs font-heading font-extrabold py-2 px-3.5 sm:px-4 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#CEF431] data-[state=active]:text-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_#161514] text-[#161514]/70 hover:text-[#161514] hover:bg-white/50 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <PiggyBank className="size-3.5 stroke-[2.2]" />
              <span>Goals & Debts</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-xl text-xs font-heading font-extrabold py-2 px-3.5 sm:px-4 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#CEF431] data-[state=active]:text-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_#161514] text-[#161514]/70 hover:text-[#161514] hover:bg-white/50 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <BarChart2 className="size-3.5 stroke-[2.2]" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Ledger */}
        <TabsContent value="ledger">
          <LedgerTabView
            transactions={transactions}
            categories={categories}
            currencySymbol={currencySymbol}
            targetMonthKey={targetMonthKey}
            onInspectTransaction={(tx) => setInspectingTx(tx)}
            onEditTransaction={(tx) => setEditingTx(tx)}
            onDuplicateTransaction={handleDuplicateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onOpenAddTransaction={() => setIsAddTxOpen(true)}
            onMoveMoney={() => setIsMoveMoneyOpen(true)}
            onSendMoney={() => setIsSendMoneyOpen(true)}
            onBulkAddExpense={() => setIsBulkModalOpen(true)}
            onAddCategory={() => setIsAddCatOpen(true)}
            onEditCategory={(cat) => setEditingCat(cat)}
            onDeleteCategory={(catId) => setDeleteCatId(catId)}
          />
        </TabsContent>

        {/* Tab 2: Budgets */}
        <TabsContent value="budgets">
          <BudgetTabView
            categories={categories}
            transactions={transactions}
            monthlyStats={monthlyStats}
            currencySymbol={currencySymbol}
            onAddCategory={() => setIsAddCatOpen(true)}
            onEditCategory={(cat) => setEditingCat(cat)}
            onOpenTemplates={() => setIsTemplateModalOpen(true)}
            onOpenAllowances={() => setIsAllowanceModalOpen(true)}
          />
        </TabsContent>

        {/* Tab 3: Vault */}
        <TabsContent value="vault">
          <VaultTabView currencySymbol={currencySymbol} />
        </TabsContent>

        {/* Tab 4: Analytics */}
        <TabsContent value="analytics">
          <AnalyticsTabView
            transactions={transactions}
            categories={categories}
            currencySymbol={currencySymbol}
            onOpenAddTransaction={() => setIsAddTxOpen(true)}
          />
        </TabsContent>
      </Tabs>

      {/* 🚀 MODULAR MODALS (Zero Render Lag) */}
      {/* 1. Transaction Form Modal (Unified Add & Edit + 3-Sec Hyper-Log Keypad) */}
      <TransactionFormModal
        open={isAddTxOpen || editingTx !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddTxOpen(false);
            setEditingTx(null);
          }
        }}
        initialData={editingTx}
        categories={categories}
        currencySymbol={currencySymbol}
        onOpenAddCategory={() => {
          setReopenTxAfterCat(true);
          setIsAddTxOpen(false);
          setIsAddCatOpen(true);
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* 2. Transaction Inspector Modal */}
      <TransactionDetailModal
        open={inspectingTx !== null}
        onOpenChange={(open) => {
          if (!open) setInspectingTx(null);
        }}
        transaction={inspectingTx}
        category={inspectingTx ? categoryMap.get(inspectingTx.categoryId) : null}
        currencySymbol={currencySymbol}
        onEdit={(tx) => {
          setInspectingTx(null);
          setEditingTx(tx);
        }}
        onDuplicate={handleDuplicateTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* 3. Category Form Modal (Unified Add & Edit Category) */}
      <CategoryFormModal
        open={isAddCatOpen || editingCat !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddCatOpen(false);
            setEditingCat(null);
            if (reopenTxAfterCat) {
              setReopenTxAfterCat(false);
              setIsAddTxOpen(true);
            }
          }
        }}
        initialData={editingCat}
        currencySymbol={currencySymbol}
        onSave={async (payload) => {
          await handleSaveCategory(payload);
          if (reopenTxAfterCat) {
            setReopenTxAfterCat(false);
            setIsAddTxOpen(true);
          }
        }}
        onDelete={async (id) => handleDeleteCategory(id)}
      />

      {/* 4. Allowance Settings Modal */}
      <AllowanceSettingsModal
        open={isAllowanceModalOpen}
        onOpenChange={setIsAllowanceModalOpen}
        currencySymbol={currencySymbol}
        defaultUpiBudget={baseUpiBudget}
        defaultCashBudget={baseCashBudget}
        defaultCustomDailyBudget={customDailyBudget}
        defaultEnableRollover={enableRollover}
        dailySafeToSpend={monthlyStats.dailySafeToSpend}
        onSave={handleSaveAllowances}
      />

      {/* 5. Bulk & OCR Modal */}
      <BulkExpenseModal
        open={isBulkModalOpen}
        onOpenChange={setIsBulkModalOpen}
        categories={categories}
        currencySymbol={currencySymbol}
      />

      {/* 6. Statement PDF Export Modal */}
      <PDFExportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        transactions={transactions}
        categories={categories}
        currentMonthKey={targetMonthKey}
        currencySymbol={currencySymbol}
        userName={user?.displayName || "Invictus User"}
      />

      {/* 7. Move Funds / Transfer Modal */}
      <MoveMoneyModal
        open={isMoveMoneyOpen}
        onOpenChange={setIsMoveMoneyOpen}
        categories={categories}
        currencySymbol={currencySymbol}
        onExecuteTransfer={handleExecuteTransfer}
      />

      {/* 8. Send Money / Direct Payout Modal */}
      <SendMoneyModal
        open={isSendMoneyOpen}
        onOpenChange={setIsSendMoneyOpen}
        categories={categories}
        currencySymbol={currencySymbol}
        onSendMoney={handleSendMoney}
      />

      {/* 7. Template Selection Modal */}
      <TemplateSelectionModal
        open={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        title="Category Envelopes Setup"
        blankLabel="Custom Blank Envelope"
        blankDesc="Create an envelope with your own custom name, icon, and cap"
        templatesLabel="Starter Category Packs"
        templatesDesc="Pre-configured budget systems like 50/30/20, Student, Freelancer"
        templatePacks={BUDGET_CATEGORY_TEMPLATE_PACKS}
        appliedPackIds={[]}
        onSelectBlank={() => {
          setIsTemplateModalOpen(false);
          setIsAddCatOpen(true);
        }}
        onApplyTemplatePack={handleApplyCategoryPack}
        onUnapplyTemplatePack={handleUnapplyCategoryPack}
      />

      {/* 8. Destructive Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteCatId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteCatId(null);
        }}
        title="Delete Category Envelope?"
        description="Are you sure you want to delete this category? Existing transactions will remain preserved."
        onConfirm={() => {
          if (deleteCatId) handleDeleteCategory(deleteCatId);
        }}
      />
    </div>
  );
}

export default function MoneyPage() {
  return (
    <Suspense fallback={<InvictusLoadingScreen message="Loading Financial Cockpit…" />}>
      <MoneyPageContent />
    </Suspense>
  );
}
