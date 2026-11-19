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
import { Receipt, Target, PiggyBank, BarChart2, Users } from "lucide-react";
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
import { MobileAppBar } from "@/components/mobile/MobileAppBar";
import { SegmentedSubNav, type SubNavTab } from "@/components/mobile/SegmentedSubNav";
import { MoneyDoorTileRow } from "@/components/money/MoneyDoorTileRow";
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
  const [activeTab, setActiveTab] = useState(tabParam || "ledger");
  const [ledgerMethodFilter, setLedgerMethodFilter] = useState<string>("all");
  const [ledgerMethodFilterTrigger, setLedgerMethodFilterTrigger] = useState<number>(0);

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
    setActiveTab("ledger");

    // Smooth scroll down to ledger view so user immediately sees all transactions
    setTimeout(() => {
      const scrollContainer = document.getElementById("main-scroll-container");
      const target = document.getElementById("money-ledger-view");
      if (target && scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const offset = targetRect.top - containerRect.top + scrollContainer.scrollTop - 90;
        scrollContainer.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
      } else if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  // Sync tab with URL search parameter
  useEffect(() => {
    if (tabParam && ["ledger", "budgets", "debts", "vault", "analytics"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (val === "ledger") {
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

    window.addEventListener("invictus:money-new-expense", handleNewExpense);
    window.addEventListener("invictus:money-new-income", handleNewIncome);
    window.addEventListener("invictus:money-transfer", handleTransfer);
    window.addEventListener("invictus:money-split", handleSplit);
    window.addEventListener("invictus:open-new-transaction", handleNewExpense);

    return () => {
      window.removeEventListener("invictus:money-new-expense", handleNewExpense);
      window.removeEventListener("invictus:money-new-income", handleNewIncome);
      window.removeEventListener("invictus:money-transfer", handleTransfer);
      window.removeEventListener("invictus:money-split", handleSplit);
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
      id: "ledger",
      label: "Ledger",
      shortLabel: "Ledger",
      icon: Receipt,
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
    <div className="w-full max-w-xl mx-auto select-none space-y-2 sm:space-y-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {/* ================= SLOT 1: SLIM TOP APP BAR (48-56px) ================= */}
      <MobileAppBar title="Money" />

      {/* ================= SLOT 2: STICKY SUB-NAV (4 PILLS: LEDGER | BUDGETS | IOUS | VAULT) ================= */}
      <SegmentedSubNav
        tabs={subNavTabs}
        value={activeTab === "analytics" ? undefined : activeTab}
        onValueChange={handleTabChange}
      />

      <div className="px-3.5 space-y-3">
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

        {/* ================= SLOT 4: 4 L2 DOOR TILES (Limits, Transfer, Packs, Report) ================= */}
        <MoneyDoorTileRow
          monthlyBudget={monthlyStats.totalCombinedBudget || monthlyStats.baseBudget}
          currencySymbol={currencySymbol}
          onOpenAllowances={() => setIsAllowanceModalOpen(true)}
          onMoveMoney={() => setIsMoveMoneyOpen(true)}
          onOpenTemplates={() => setIsTemplateModalOpen(true)}
          onOpenExport={() => setIsExportModalOpen(true)}
        />

        {/* ================= SLOT 5: ACTIVE TAB VIEW ================= */}
        {activeTab === "ledger" && (
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
        )}

        {activeTab === "budgets" && (
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
        )}

        {activeTab === "debts" && (
          <WhoOwesWhoTabView
            currencySymbol={currencySymbol}
            prefill={whoOwesWhoPrefill}
            onLogSettlementIncome={handleLogWhoOwesWhoRepayment}
          />
        )}

        {activeTab === "vault" && (
          <VaultTabView currencySymbol={currencySymbol} />
        )}

        {activeTab === "analytics" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleTabChange("ledger")}
                className="text-xs font-mono font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
              >
                ← Back to Ledger
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
