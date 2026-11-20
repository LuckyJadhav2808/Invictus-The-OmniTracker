"use client";
// Money Workspace Engine — Belanje & Neobrutalist Ledger Benchmark

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
import type { TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { BUDGET_CATEGORY_TEMPLATE_PACKS } from "@/lib/templates-data";
import { Receipt, Target, PiggyBank, BarChart2, Users, Plus, RotateCcw, ChevronRight, Wallet, ArrowLeft } from "lucide-react";
import { DropdownMenuItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";
import { useAuth } from "@/components/shared/AuthProvider";
import { useSearchParams } from "next/navigation";
import {
  computeMonthlyBudgetStats,
  computeDailyBudgetStats,
} from "@/lib/utils/budget-rollover";
import { MoneyCockpitSkeleton } from "@/components/shared/NeobrutalistSkeleton";
import { type Transaction, type Category } from "@/types";
import dynamic from "next/dynamic";

// Modular Sub-Components & Views
import { FinancialSummaryCockpit } from "@/components/money/FinancialSummaryCockpit";
import { LedgerTabView } from "@/components/money/views/LedgerTabView";
import { BelanjeTransactionRow } from "@/components/money/BelanjeTransactionRow";
import { MobileAppBar } from "@/components/mobile/MobileAppBar";
import { SegmentedSubNav, type SubNavTab } from "@/components/mobile/SegmentedSubNav";
import { MoneyDoorTileRow } from "@/components/money/MoneyDoorTileRow";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { useWhoOwesWhoStore } from "@/store/who-owes-who-store";

// Lazy-Loaded Tab Views (Saves Recharts & IOU Bundles on Initial Paint)
const BudgetTabView = dynamic(
  () => import("@/components/money/views/BudgetTabView").then((mod) => mod.BudgetTabView),
  { ssr: false }
);
const VaultTabView = dynamic(
  () => import("@/components/money/views/VaultTabView").then((mod) => mod.VaultTabView),
  { ssr: false }
);
const AnalyticsTabView = dynamic(
  () => import("@/components/money/views/AnalyticsTabView").then((mod) => mod.AnalyticsTabView),
  { ssr: false }
);
const WhoOwesWhoTabView = dynamic(
  () => import("@/components/money/views/WhoOwesWhoTabView").then((mod) => mod.WhoOwesWhoTabView),
  { ssr: false }
);

// Lazy-Loaded Heavy Modals (Zero TBT & Fast Initial Paint)
const TransactionFormModal = dynamic(
  () => import("@/components/money/modals/TransactionFormModal").then((mod) => mod.TransactionFormModal),
  { ssr: false }
);

const TransactionDetailModal = dynamic(
  () => import("@/components/money/modals/TransactionDetailModal").then((mod) => mod.TransactionDetailModal),
  { ssr: false }
);

const CategoryFormModal = dynamic(
  () => import("@/components/money/modals/CategoryFormModal").then((mod) => mod.CategoryFormModal),
  { ssr: false }
);

const AllowanceSettingsModal = dynamic(
  () => import("@/components/money/modals/AllowanceSettingsModal").then((mod) => mod.AllowanceSettingsModal),
  { ssr: false }
);

const MoveMoneyModal = dynamic(
  () => import("@/components/money/modals/MoveMoneyModal").then((mod) => mod.MoveMoneyModal),
  { ssr: false }
);

const SendMoneyModal = dynamic(
  () => import("@/components/money/modals/SendMoneyModal").then((mod) => mod.SendMoneyModal),
  { ssr: false }
);

const QuickCashEntryModal = dynamic(
  () => import("@/components/money/QuickCashEntryModal").then((mod) => mod.QuickCashEntryModal),
  { ssr: false }
);

const NeobrutalistCalculator = dynamic(
  () => import("@/components/shared/NeobrutalistCalculator").then((mod) => mod.NeobrutalistCalculator),
  { ssr: false }
);

const TemplateSelectionModal = dynamic(
  () => import("@/components/shared/TemplateSelectionModal").then((mod) => mod.TemplateSelectionModal),
  { ssr: false }
);



const DeleteConfirmationModal = dynamic(
  () => import("@/components/shared/DeleteConfirmationModal").then((mod) => mod.DeleteConfirmationModal),
  { ssr: false }
);

const PDFExportModal = dynamic(
  () => import("@/components/money/PDFExportModal").then((mod) => mod.PDFExportModal),
  { ssr: false }
);

const BulkExpenseModal = dynamic(
  () => import("@/components/money/BulkExpenseModal").then((mod) => mod.BulkExpenseModal),
  { ssr: false }
);

const WhoOwesWhoModal = dynamic(
  () => import("@/components/money/modals/WhoOwesWhoModal").then((mod) => mod.WhoOwesWhoModal),
  { ssr: false }
);

function MoneyPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const actionParam = searchParams.get("action");
  const [activeTab, setActiveTab] = useState(tabParam === "ledger" ? "overview" : (tabParam || "overview"));
  const [ledgerMethodFilter, setLedgerMethodFilter] = useState<string>("all");
  const [ledgerMethodFilterTrigger, setLedgerMethodFilterTrigger] = useState<number>(0);

  // Modal States
  const [isLedgerSheetOpen, setIsLedgerSheetOpen] = useState(() => {
    return actionParam === "ledger" || searchParams.get("sheet") === "ledger";
  });
  const [isAddTxOpen, setIsAddTxOpen] = useState(() => {
    return actionParam === "new-expense" || actionParam === "add";
  });
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
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isWhoOwesWhoOpen, setIsWhoOwesWhoOpen] = useState(false);
  const [whoOwesWhoPrefill, setWhoOwesWhoPrefill] = useState<{ amount?: number; description?: string } | null>(null);
  const [reopenTxAfterCat, setReopenTxAfterCat] = useState(false);

  // Deletion Safeguard
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  const handleSelectPaymentMethodFromHero = (method: "upi" | "cash" | "all") => {
    setLedgerMethodFilter(method);
    setLedgerMethodFilterTrigger(Date.now());
    setSelectedCategory("all");
    if (typeof window !== "undefined") {
      sessionStorage.setItem("invictus_ledger_method", method);
      sessionStorage.removeItem("invictus_ledger_category");
      sessionStorage.removeItem("invictus_ledger_search");
    }
    soundFX.playPop();
    setIsLedgerSheetOpen(true);
  };

  // Sync tab with URL search parameter
  useEffect(() => {
    if (tabParam && ["overview", "ledger", "budgets", "debts", "vault", "analytics"].includes(tabParam)) {
      setActiveTab(tabParam === "ledger" ? "overview" : tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (val: string) => {
    if (val === "ledger") {
      setActiveTab("overview");
      setIsLedgerSheetOpen(true);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("tab");
        window.history.replaceState(null, "", url.pathname + url.search);
      }
      return;
    }
    setActiveTab(val);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (val === "overview") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", val);
      }
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  };

  // Handle deep-link action triggers (e.g., from quick-action menu or widgets)
  useEffect(() => {
    if (actionParam === "add_tx") {
      setIsAddTxOpen(true);
    }
  }, [actionParam]);

  // Listen for FAB Contextual Action Sheet events
  useEffect(() => {
    const handleNewExpense = () => {
      setIsAddTxOpen(true);
    };
    const handleNewIncome = () => {
      setIsAddTxOpen(true);
    };
    const handleTransfer = () => {
      setIsMoveMoneyOpen(true);
    };
    const handleSplit = () => {
      setIsWhoOwesWhoOpen(true);
    };
    const handleCashTill = () => {
      setIsCashModalOpen(true);
    };
    const handleQuickCash = () => {
      setIsCashModalOpen(true);
    };

    window.addEventListener("invictus:money-new-expense", handleNewExpense);
    window.addEventListener("invictus:money-new-income", handleNewIncome);
    window.addEventListener("invictus:money-transfer", handleTransfer);
    window.addEventListener("invictus:money-split", handleSplit);
    window.addEventListener("invictus:money-cash-till", handleCashTill);
    window.addEventListener("invictus:money-quick-cash", handleQuickCash);
    window.addEventListener("invictus:open-new-transaction", handleNewExpense);

    return () => {
      window.removeEventListener("invictus:money-new-expense", handleNewExpense);
      window.removeEventListener("invictus:money-new-income", handleNewIncome);
      window.removeEventListener("invictus:money-transfer", handleTransfer);
      window.removeEventListener("invictus:money-split", handleSplit);
      window.removeEventListener("invictus:money-cash-till", handleCashTill);
      window.removeEventListener("invictus:money-quick-cash", handleQuickCash);
      window.removeEventListener("invictus:open-new-transaction", handleNewExpense);
    };
  }, []);

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

  // Allowances & Rollover States
  const [baseUpiBudget, setBaseUpiBudget] = useState(8000);
  const [baseCashBudget, setBaseCashBudget] = useState(2000);
  const [customDailyBudget, setCustomDailyBudget] = useState<number | null>(null);
  const [enableRollover, setEnableRollover] = useState(false);
  const [cashRefillDate, setCashRefillDate] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("invictus_cash_refilled_at");
    }
    return null;
  });

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
      const hasCloudBudget = (cloudBudgetPrefs.upiBudget ?? 0) > 0 || (cloudBudgetPrefs.cashBudget ?? 0) > 0;
      if (hasCloudBudget) {
        if (cloudBudgetPrefs.upiBudget !== undefined && cloudBudgetPrefs.upiBudget > 0) {
          setBaseUpiBudget(cloudBudgetPrefs.upiBudget);
        }
        if (cloudBudgetPrefs.cashBudget !== undefined && cloudBudgetPrefs.cashBudget >= 0) {
          setBaseCashBudget(cloudBudgetPrefs.cashBudget);
        }
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
  const currentCalMonthKey = useMemo(() => format(new Date(), "yyyy-MM"), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("invictus_ledger_month");
      if (cached) return cached;
    }
    return format(new Date(), "yyyy-MM");
  });

  const effectiveTargetMonthKey = selectedMonth === "all" ? currentCalMonthKey : selectedMonth;

  const handleSelectMonth = (monthKey: string) => {
    setSelectedMonth(monthKey);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("invictus_ledger_month", monthKey);
    }
  };

  const handleResetToCurrentMonth = () => {
    setSelectedMonth(currentCalMonthKey);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("invictus_ledger_month", currentCalMonthKey);
    }
  };

  const monthlyStats = useMemo(() => {
    return computeMonthlyBudgetStats({
      transactions,
      categories,
      targetMonthKey: effectiveTargetMonthKey,
      baseUpiBudget,
      baseCashBudget,
      enableRollover,
      cashRefillDate,
    });
  }, [transactions, categories, effectiveTargetMonthKey, baseUpiBudget, baseCashBudget, enableRollover, cashRefillDate]);

  const handleRefillCashTill = () => {
    const nowIso = new Date().toISOString();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("invictus_cash_refilled_at", nowIso);
      } catch {}
    }
    setCashRefillDate(nowIso);
    toast.success(`Cash Till refilled to full ${currencySymbol}${baseCashBudget.toLocaleString()}`);
  };

  const dailyStats = useMemo(() => {
    let refDate = new Date();
    try {
      if (!monthlyStats.isCurrentCalendarMonth) {
        refDate = parseISO(`${effectiveTargetMonthKey}-01`);
      }
    } catch {}

    return computeDailyBudgetStats({
      transactions,
      monthlyStats,
      customDailyBudget,
      referenceDate: refDate,
    });
  }, [transactions, monthlyStats, customDailyBudget, effectiveTargetMonthKey]);


  // Category map helper
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Category envelope selection and data calculation
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("invictus_ledger_category") || "all";
    }
    return "all";
  });

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("invictus_ledger_category", catId);
    }
  };

  const categoryCardsData = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      if (tx.type === "expense" && tx.date?.startsWith(effectiveTargetMonthKey)) {
        const curr = map.get(tx.categoryId) || 0;
        map.set(tx.categoryId, curr + Number(tx.amount || 0));
      }
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      amount: map.get(cat.id) || 0,
      color: cat.color || "mint",
      icon: cat.icon || "Wallet",
      type: cat.type,
      monthlyBudget: cat.monthlyBudget,
    }));
  }, [categories, transactions, effectiveTargetMonthKey]);

  // Transactions for the current selected month sorted latest first
  const currentMonthTransactions = useMemo(() => {
    return transactions
      .filter((tx) => selectedMonth === "all" || tx.date?.startsWith(effectiveTargetMonthKey))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.id || "").localeCompare(a.id || ""));
  }, [transactions, selectedMonth, effectiveTargetMonthKey]);

  // Capped 5-row glance for Slot 5 Overview
  const recentTransactions = useMemo(() => {
    return currentMonthTransactions.slice(0, 5);
  }, [currentMonthTransactions]);

  // Telemetry for sub-nav badges
  const todayTxCount = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return transactions.filter((t) => t.date === todayStr).length;
  }, [transactions]);

  const overBudgetCategoriesCount = useMemo(() => {
    return categoryCardsData.filter((cat) => {
      const budget = Number(cat.monthlyBudget || 0);
      return budget > 0 && Number(cat.amount || 0) > budget;
    }).length;
  }, [categoryCardsData]);

  const { ious } = useWhoOwesWhoStore();
  const pendingIous = useMemo(() => {
    return ious.filter((i) => i.status === "pending" && i.type === "lent");
  }, [ious]);

  const totalPendingLentAmount = useMemo(() => {
    return pendingIous.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  }, [pendingIous]);

  const subNavTabs: SubNavTab[] = useMemo(() => [
    {
      id: "overview",
      label: "Overview",
      shortLabel: "Overview",
      icon: Wallet,
      badge: todayTxCount > 0 ? (
        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#161514]/15 dark:bg-white/20 text-inherit tabular-nums ml-0.5">
          {todayTxCount}
        </span>
      ) : undefined,
    },
    {
      id: "budgets",
      label: "Budgets",
      shortLabel: "Budgets",
      icon: Target,
      badge: overBudgetCategoriesCount > 0 ? (
        <span className="size-1.5 rounded-full bg-rose-600 animate-pulse ml-0.5" />
      ) : undefined,
    },
    {
      id: "debts",
      label: "IOUs 🤝",
      shortLabel: "IOUs",
      icon: Users,
      badge: pendingIous.length > 0 ? (
        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] tabular-nums ml-0.5">
          {pendingIous.length}
        </span>
      ) : undefined,
    },
    {
      id: "vault",
      label: "Vault",
      shortLabel: "Vault",
      icon: PiggyBank,
    },
  ], [todayTxCount, overBudgetCategoriesCount, pendingIous.length]);

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
      toast.success("Transaction updated");
    } else {
      const res = await addTxMutation.mutateAsync(payload as any);
      const newId = (res as any)?.id || (res as any)?._id;
      const cat = categoryMap.get(payload.categoryId);
      toast.success(
        `Logged ${currencySymbol}${payload.amount} for ${cat?.name || "Expense"}${payload.note ? ` • ${payload.note}` : ""}`,
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
      toast.success("Duplicated transaction", {
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

  const handleLogWhoOwesWhoRepayment = async (iou: { personName: string; amount: number; description?: string }) => {
    try {
      const generalCat = categories.find((c) => c.type === "income") || categories[0];
      await addTxMutation.mutateAsync({
        amount: iou.amount,
        type: "income",
        categoryId: generalCat?.id || "general",
        date: format(new Date(), "yyyy-MM-dd"),
        note: `Repayment from ${iou.personName}${iou.description ? ` (${iou.description})` : ""}`,
        paymentMethod: "upi",
      } as any);
      soundFX.playCompleteChime();
      soundFX.vibrate(20);
      toast.success(`Logged ${currencySymbol}${iou.amount} repayment from ${iou.personName} in ledger! ⚡`);
    } catch {
      toast.error("Failed to log repayment in ledger");
    }
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
      `Transferred ${currencySymbol}${amount} from ${fromCat?.name || "Wallet"} to ${toCat?.name || "Wallet"}`
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
    toast.success(`Sent ${currencySymbol}${payload.amount} to ${payload.recipient}`, {
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
      toast.success(`Updated category envelope: ${payload.name}`);
    } else {
      await addCatMutation.mutateAsync(payload as any);
      toast.success(`Created category envelope: ${payload.name}`);
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
      toast.success("Budget allowances saved");
    } catch {
      toast.success("Allowances saved locally");
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
            icon: pack.icon || "Wallet",
            monthlyBudget: item.amount || 0,
            isTemplate: true,
            templatePackId: pack.id,
          } as any);
        }
      }
      toast.success(`Applied ${pack.name} pack`);
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
      toast.success(`Unapplied ${pack.name}`);
    } catch {
      toast.error("Failed to unapply category pack");
    }
  };

  if (catsLoading || txsLoading) {
    return <MoneyCockpitSkeleton />;
  }

  return (
    <div className="w-full max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto select-none space-y-3 sm:space-y-4 px-1 sm:px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {/* ================= SLOT 1: SLIM TOP APP BAR (48-56px) ================= */}
      <MobileAppBar
        title="Money"
        customMenuItems={
          <>
            <DropdownMenuLabel className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
              Quick Actions
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                soundFX.playPop();
                setIsAddTxOpen(true);
              }}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-black cursor-pointer hover:bg-secondary focus:bg-secondary"
            >
              <div className="flex items-center gap-2">
                <Plus className="size-3.5 text-[#03D26F] stroke-[2.5]" />
                <span>Log Transaction</span>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                ⌘N
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                soundFX.playPop();
                handleResetToCurrentMonth();
              }}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-bold cursor-pointer hover:bg-secondary focus:bg-secondary"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="size-3.5 text-muted-foreground stroke-[2.2]" />
                <span>Reset to Current Month</span>
              </div>
            </DropdownMenuItem>
          </>
        }
      />

      {/* ================= SLOT 2: DESKTOP SUB-NAV (Hidden on Mobile) ================= */}
      <div className="hidden lg:block">
        <SegmentedSubNav
          tabs={subNavTabs}
          value={activeTab === "analytics" ? undefined : activeTab}
          onValueChange={handleTabChange}
        />
      </div>

      {/* ================= MOBILE L2 SUB-PAGE HEADER (Back to Overview) ================= */}
      {activeTab !== "overview" && activeTab !== "ledger" && (
        <div className="lg:hidden sticky top-0 z-30 w-full h-[52px] px-3.5 bg-[#FAF8F5]/95 dark:bg-[#161514]/95 backdrop-blur-md border-b border-[#161514]/10 dark:border-white/10 flex items-center justify-between select-none">
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              soundFX.vibrate(15);
              handleTabChange("overview");
            }}
            className="flex items-center gap-1.5 font-heading font-black text-xs text-[#161514] px-2.5 py-1.5 rounded-xl border-2 border-[#161514] bg-[#CEF431] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <ArrowLeft className="size-4 stroke-[3]" />
            <span>Overview</span>
          </button>
          <span className="font-heading font-black text-sm text-foreground">
            {activeTab === "budgets" ? "Monthly Budgets" : activeTab === "ious" ? "IOUs & Debts" : activeTab === "vault" ? "Emergency Vault" : "Overview"}
          </span>
          <div className="w-16" />
        </div>
      )}

      <div className="px-3.5 space-y-3">
        {/* Render Slot 3 (Hero Cockpit), Slot 4 (Door Tiles), and Slot 5 (Recent Glance) ONLY on Overview */}
        {(activeTab === "overview" || activeTab === "ledger") && (
          <>
            {/* ================= SLOT 3: BORDERLESS HERO (Untouched WalletCardDeck + Ambient Strobi) ================= */}
            <FinancialSummaryCockpit
              monthlyStats={monthlyStats}
              dailyStats={dailyStats}
              currencySymbol={currencySymbol}
              selectedMonth={selectedMonth}
              onResetToCurrentMonth={handleResetToCurrentMonth}
              onAddTransaction={() => setIsAddTxOpen(true)}
              onBulkScan={() => setIsBulkModalOpen(true)}
              onAddCategory={() => setIsAddCatOpen(true)}
              onOpenEditAllowances={() => setIsAllowanceModalOpen(true)}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
              onSelectPaymentMethod={handleSelectPaymentMethodFromHero}
              onRefillCashTill={handleRefillCashTill}
              onNavigateToTab={handleTabChange}
            />

            {/* ================= SLOT 4: 4 L2 DOOR TILES (Ledger, Analytics, Receipts, Calc) ================= */}
            <MoneyDoorTileRow
              monthlyBudget={monthlyStats.totalCombinedBudget || monthlyStats.baseBudget}
              activeIouCount={pendingIous.length}
              currencySymbol={currencySymbol}
              onOpenLedger={() => setIsLedgerSheetOpen(true)}
              onOpenAnalytics={() => handleTabChange("analytics")}
              onOpenReceipts={() => setIsBulkModalOpen(true)}
              onOpenCalc={() => setIsCalculatorOpen(true)}
            />

            {/* ================= SLOT 5: RECENT TRANSACTIONS GLANCE (Capped 5 Rows + Neobrutalist Action Dock) ================= */}
            <section className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-heading font-black uppercase tracking-wider text-muted-foreground">
                    Recent Activity
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-muted text-muted-foreground tabular-nums">
                    {currentMonthTransactions.length}
                  </span>
                </div>

                {currentMonthTransactions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setIsLedgerSheetOpen(true);
                    }}
                    className="text-xs font-heading font-bold text-muted-foreground hover:text-foreground flex items-center gap-0.5 cursor-pointer transition-colors active:scale-95"
                  >
                    <span>See All</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                )}
              </div>

              {recentTransactions.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="space-y-2">
                    {recentTransactions.map((tx) => (
                      <BelanjeTransactionRow
                        key={tx.id}
                        tx={tx}
                        category={categoryMap.get(tx.categoryId)}
                        currencySymbol={currencySymbol}
                        onInspect={(t) => setInspectingTx(t)}
                        onEdit={(t) => setEditingTx(t)}
                        onDuplicate={handleDuplicateTransaction}
                        onDelete={handleDeleteTransaction}
                        showQuickActions={true}
                        compact={false}
                      />
                    ))}
                  </div>

                  {/* Neobrutalist Action Dock button to open full ledger & envelopes */}
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setIsLedgerSheetOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-[#161514] hover:bg-[#F1EFEA] dark:hover:bg-[#252321] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] flex items-center justify-between transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Receipt className="size-4 text-[#161514] dark:text-[#CEF431] stroke-[2.2]" />
                      <span>Open Full Ledger & Envelopes</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                      <span>{currentMonthTransactions.length} Total</span>
                      <ChevronRight className="size-3.5" />
                    </div>
                  </button>
                </div>
              ) : (
                <div className="bg-card rounded-2xl border-2 border-[#161514] dark:border-[#383531] shadow-[2.5px_2.5px_0px_0px_#161514] p-6 text-center space-y-3">
                  <div className="size-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-[#161514] dark:border-[#383531] flex items-center justify-center mx-auto shadow-[1.5px_1.5px_0px_0px_#161514]">
                    <Receipt className="size-6 stroke-[2]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
                      No Transactions Recorded
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Your ledger is spotless for {monthlyStats.targetMonthLabel}. Tap below to log your first expense or income.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setIsAddTxOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CEF431] text-[#161514] text-xs font-heading font-black border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                  >
                    <Plus className="size-3.5 stroke-[2.5]" />
                    <span>Log First Expense</span>
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {/* ================= SUB-PAGE DOMAINS (Directly Under Sub-Nav) ================= */}
        {activeTab === "budgets" && (
          <div className="space-y-3 pt-1">
            <BudgetTabView
              categories={categories}
              transactions={transactions}
              monthlyStats={monthlyStats}
              currencySymbol={currencySymbol}
              defaultUpiBudget={baseUpiBudget}
              defaultCashBudget={baseCashBudget}
              defaultCustomDailyBudget={customDailyBudget}
              defaultEnableRollover={enableRollover}
              selectedCategoryId={selectedCategory}
              onSelectCategory={handleSelectCategory}
              onSaveAllowances={handleSaveAllowances}
              onAddCategory={() => setIsAddCatOpen(true)}
              onEditCategory={(cat) => setEditingCat(cat)}
              onOpenTemplates={() => setIsTemplateModalOpen(true)}
              onOpenAllowances={() => setIsAllowanceModalOpen(true)}
              onApplyCategoryPack={handleApplyCategoryPack}
            />
          </div>
        )}

        {activeTab === "debts" && (
          <div className="space-y-3 pt-1">
            <WhoOwesWhoTabView
              currencySymbol={currencySymbol}
              prefill={whoOwesWhoPrefill}
              onLogSettlementIncome={handleLogWhoOwesWhoRepayment}
            />
          </div>
        )}

        {activeTab === "vault" && (
          <div className="space-y-3 pt-1">
            <VaultTabView currencySymbol={currencySymbol} />
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => handleTabChange("overview")}
                className="text-xs font-mono font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
              >
                ← Back to Overview
              </button>
            </div>
            <AnalyticsTabView
              transactions={transactions}
              categories={categories}
              currencySymbol={currencySymbol}
              targetMonthKey={effectiveTargetMonthKey}
              onOpenAddTransaction={() => setIsAddTxOpen(true)}
            />
          </div>
        )}
      </div>

      {/* ================= L3 BOTTOM SHEET: FULL TRANSACTION LEDGER & ENVELOPES ================= */}
      <BottomSheet
        open={isLedgerSheetOpen}
        onOpenChange={(open) => {
          setIsLedgerSheetOpen(open);
          if (!open && typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("sheet");
            url.searchParams.delete("action");
            window.history.replaceState(null, "", url.pathname + url.search);
          }
        }}
        title="Transaction Ledger & Envelopes"
        description="Search, filter by envelope, and manage statement records"
        maxHeight="max-h-[92vh]"
      >
        <div className="py-2">
          <LedgerTabView
            categoryCardsData={categoryCardsData}
            transactions={transactions}
            categories={categories}
            currencySymbol={currencySymbol}
            targetMonthKey={effectiveTargetMonthKey}
            monthlyStats={monthlyStats}
            initialMethodFilter={ledgerMethodFilter}
            methodFilterTrigger={ledgerMethodFilterTrigger}
            selectedMonth={selectedMonth}
            onSelectMonth={handleSelectMonth}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
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
        </div>
      </BottomSheet>

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
        transactions={transactions}
        onOpenAddCategory={() => {
          setReopenTxAfterCat(true);
          setIsAddTxOpen(false);
          setIsAddCatOpen(true);
        }}
        onOpenReceiptScan={() => setIsBulkModalOpen(true)}
        onOpenWhoOwesWho={(prefill) => {
          setWhoOwesWhoPrefill(prefill || null);
          setIsAddTxOpen(false);
          setEditingTx(null);
          handleTabChange("debts");
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* 1c. Who Owes Who (Student IOU & Split Tracker) */}
      <WhoOwesWhoModal
        open={isWhoOwesWhoOpen}
        onOpenChange={setIsWhoOwesWhoOpen}
        currencySymbol={currencySymbol}
        prefill={whoOwesWhoPrefill}
        onLogSettlementIncome={handleLogWhoOwesWhoRepayment}
      />

      {/* 1b. 1-Tap Quick Cash Entry Modal */}
      <QuickCashEntryModal
        open={isCashModalOpen}
        onOpenChange={setIsCashModalOpen}
        categories={categories}
        currencySymbol={currencySymbol}
        onSave={async (payload) => {
          return handleSaveTransaction({
            amount: payload.amount,
            type: "expense",
            categoryId: payload.categoryId,
            date: payload.date,
            note: payload.note,
            paymentMethod: "Cash",
          });
        }}
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
        currentMonthKey={effectiveTargetMonthKey}
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

      {/* 9. Floating & Cockpit Quick Neobrutalist Calculator */}
      <NeobrutalistCalculator
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
        hideFloatingTrigger={true}
      />
    </div>
  );
}

export default function MoneyPage() {
  return (
    <Suspense fallback={<MoneyCockpitSkeleton />}>
      <MoneyPageContent />
    </Suspense>
  );
}
