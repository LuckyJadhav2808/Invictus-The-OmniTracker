"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory, useTransactions, useAddTransaction, useDeleteTransaction, useUpdateTransaction } from "@/lib/queries/money";
import { useApplyMonthlyBudgetTemplate, useUnapplyMonthlyBudgetTemplate } from "@/lib/queries/spending";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { BUDGET_CATEGORY_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Plus, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight, Trash2, Edit3, PieChart as PieIcon, TrendingUp, ShieldAlert, Tag, Search, X, Filter, ChevronLeft, ChevronRight, Copy, Eye, Receipt, FileText } from "lucide-react";
import { format, parseISO, isToday, isYesterday, subMonths, addMonths } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/components/shared/AuthProvider";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { SpaceHeroBanner } from "@/components/shared/SpaceHeroBanner";
import { ProactiveReminderBanner } from "@/components/shared/ProactiveReminderBanner";
import { MoneyQuickActionsAndCards, renderCategoryEmoji } from "@/components/money/MoneyQuickActionsAndCards";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { SubscriptionsTracker } from "@/components/money/SubscriptionsTracker";
import { SavingsGoals } from "@/components/money/SavingsGoals";
import { DebtTracker } from "@/components/money/DebtTracker";
import { PDFExportModal } from "@/components/money/PDFExportModal";
import { DraggableDashboardGrid } from "@/components/shared/DraggableDashboardGrid";
import { useCostOfLivingIndex } from "@/lib/queries/cost-of-living";
import { detectCategoryFromNote } from "@/lib/utils/merchant-categorizer";
import { Globe, Sparkles, Layers, DollarSign, PiggyBank, Smartphone, Banknote, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { computeMonthlyBudgetStats, isCashTransaction, isOnlineTransaction } from "@/lib/utils/budget-rollover";

const PRESET_CATEGORY_EMOJIS = [
  "🛒", "🍕", "☕", "🍔", "🍣", "🧋", "🍿", "🍩",
  "🏠", "⚡", "💧", "📱", "🌐", "💳", "🔌", "🛠️",
  "🚗", "⛽", "🚕", "✈️", "🚆", "🛵", "🚌",
  "🛍️", "🎬", "🎮", "👟", "💄", "🎁", "📚", "🎧",
  "💼", "💸", "💰", "📈", "🏦", "💎", "🎯", "🏧"
];

const CATEGORY_COLOR_PALETTE = [
  { id: "orange", hex: "#FF6B00", label: "Orange" },
  { id: "amber", hex: "#F59E0B", label: "Amber" },
  { id: "mint", hex: "#03D26F", label: "Mint" },
  { id: "lavender", hex: "#A78BFA", label: "Lavender" },
  { id: "coral", hex: "#FF5A5F", label: "Coral" },
  { id: "indigo", hex: "#6366F1", label: "Indigo" },
  { id: "rose", hex: "#EC4899", label: "Rose" },
  { id: "cyan", hex: "#06B6D4", label: "Cyan" },
];

function MoneyPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "ledger");
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);

  // Category CRUD states
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense");
  const [newCatColor, setNewCatColor] = useState("orange");
  const [newCatIcon, setNewCatIcon] = useState("💳");
  const [newCatMonthlyBudget, setNewCatMonthlyBudget] = useState("");

  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatType, setEditCatType] = useState<"expense" | "income">("expense");
  const [editCatColor, setEditCatColor] = useState("orange");
  const [editCatIcon, setEditCatIcon] = useState("💳");
  const [editCatMonthlyBudget, setEditCatMonthlyBudget] = useState("");

  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Profile Preferences
  const [currency, setCurrency] = useState("INR");

  // Dataset 3: Cost of Living Calculator State
  const { data: costOfLivingData } = useCostOfLivingIndex();
  const [selectedCountry, setSelectedCountry] = useState("India");
  const [incomeForCalc, setIncomeForCalc] = useState("50000");

  const countryItem = useMemo(() => {
    if (!costOfLivingData?.countries) return null;
    return (
      costOfLivingData.countries.find((c) => c.country.toLowerCase() === selectedCountry.toLowerCase()) ||
      costOfLivingData.countries[0]
    );
  }, [costOfLivingData, selectedCountry]);

  // Dataset 4: 1-Click Monthly Budget Template State & Mutation
  const applyTemplateMutation = useApplyMonthlyBudgetTemplate();

  // Transaction Form States
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txCategoryId, setTxCategoryId] = useState("");
  const [txDate, setTxDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [txNote, setTxNote] = useState("");
  const [txPaymentMethod, setTxPaymentMethod] = useState("upi");

  // Budget Edit Form States
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState("");
  const [categoryBudgetAmount, setCategoryBudgetAmount] = useState("");

  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: transactions = [], isLoading: txsLoading } = useTransactions();

  const addTxMutation = useAddTransaction();
  const deleteTxMutation = useDeleteTransaction();
  const updateTxMutation = useUpdateTransaction();
  const addCatMutation = useAddCategory();
  const updateCatMutation = useUpdateCategory();
  const deleteCatMutation = useDeleteCategory();
  const unapplyMonthlyTemplateMutation = useUnapplyMonthlyBudgetTemplate();

  const [isCreatingAutoCat, setIsCreatingAutoCat] = useState(false);

  const handleQuickCreateCategory = async (detected: { categoryName?: string; icon?: string }) => {
    if (!detected.categoryName) return;
    setIsCreatingAutoCat(true);
    try {
      const res = await addCatMutation.mutateAsync({
        name: detected.categoryName,
        type: txType,
        icon: detected.icon || "💳",
        color: "orange",
        monthlyBudget: 0,
      });
      const newId = (res as any)?.id || (res as any)?._id;
      if (newId) setTxCategoryId(newId);
      toast.success(`Created & selected category: ${detected.categoryName} ${detected.icon || ""}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to auto-create category.");
    } finally {
      setIsCreatingAutoCat(false);
    }
  };

  // Move Money Modal states
  const [isMoveMoneyOpen, setIsMoveMoneyOpen] = useState(false);
  const [moveFromCatId, setMoveFromCatId] = useState("");
  const [moveToCatId, setMoveToCatId] = useState("");
  const [moveAmount, setMoveAmount] = useState("");
  const [moveNote, setMoveNote] = useState("");

  // Send Money Modal states
  const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendPaymentMethod, setSendPaymentMethod] = useState("UPI");
  const [sendCatId, setSendCatId] = useState("");
  const [sendNote, setSendNote] = useState("");

  // 1-Tap UPI vs Cash state
  const [showMorePaymentMethods, setShowMorePaymentMethods] = useState(false);

  // Top frequent merchants/notes from past user transactions + smart fallbacks
  const frequentMerchantPills = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.note && t.note.trim().length > 1) {
        const clean = t.note.trim();
        const primary = clean.split(/[ ,-]/)[0];
        if (primary && primary.length > 2) {
          const capitalized = primary.charAt(0).toUpperCase() + primary.slice(1).toLowerCase();
          counts[capitalized] = (counts[capitalized] || 0) + 1;
        }
      }
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    const defaults = ["Swiggy", "Blinkit", "Uber", "Chai", "Fuel", "Groceries"];
    const combined = Array.from(new Set([...sorted, ...defaults])).slice(0, 6);

    const emojiMap: Record<string, { emoji: string; mode: string }> = {
      swiggy: { emoji: "🍔", mode: "upi" },
      zomato: { emoji: "🍕", mode: "upi" },
      blinkit: { emoji: "🛒", mode: "upi" },
      zepto: { emoji: "🛍️", mode: "upi" },
      instamart: { emoji: "🛒", mode: "upi" },
      uber: { emoji: "🚕", mode: "upi" },
      ola: { emoji: "🛵", mode: "upi" },
      chai: { emoji: "☕", mode: "cash" },
      coffee: { emoji: "☕", mode: "upi" },
      fuel: { emoji: "⛽", mode: "upi" },
      petrol: { emoji: "⛽", mode: "upi" },
      groceries: { emoji: "🥦", mode: "upi" },
      dmart: { emoji: "🛒", mode: "upi" },
      recharge: { emoji: "📱", mode: "upi" },
      rent: { emoji: "🏠", mode: "bank" },
    };

    return combined.map((m) => {
      const lower = m.toLowerCase();
      const meta = emojiMap[lower] || { emoji: "🏷️", mode: "upi" };
      return {
        label: m,
        icon: meta.emoji,
        defaultMode: meta.mode,
      };
    });
  }, [transactions]);

  // Granular Envelope Rollover Allocation Handler
  const handleBoostCategoryEnvelope = async (item: { categoryId: string; categoryName: string; saved: number; budget: number }) => {
    const currentCat = categories.find((c) => c.id === item.categoryId);
    const currentBudget = currentCat?.monthlyBudget || item.budget || 0;
    const newBudget = currentBudget + item.saved;
    try {
      await updateCatMutation.mutateAsync({
        id: item.categoryId,
        monthlyBudget: newBudget,
      });
      toast.success(`🎉 Boosted ${item.categoryName} envelope by +${currencySymbol}${item.saved.toLocaleString()}! New monthly budget: ${currencySymbol}${newBudget.toLocaleString()}`);
    } catch {
      toast.error("Failed to boost category envelope.");
    }
  };

  // Ledger Search & Filter states (Feature 1 & Feature 2)
  const currentMonthKey = useMemo(() => format(new Date(), "yyyy-MM"), []);
  const [ledgerMonthFilter, setLedgerMonthFilter] = useState(currentMonthKey);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState("all");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [paymentChannelFilter, setPaymentChannelFilter] = useState<"all" | "online" | "cash">("all");

  // User Base Monthly Budget Target (Defaults to ₹9,000, persisted in localStorage & User Profile)
  const [baseBudget, setBaseBudget] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("invictus_monthly_budget_target");
      if (saved && !isNaN(Number(saved)) && Number(saved) > 0) {
        return Number(saved);
      }
    }
    return 9000;
  });
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [tempBudgetInput, setTempBudgetInput] = useState(String(baseBudget));

  const handleSaveMonthlyBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(tempBudgetInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }
    setBaseBudget(val);
    try {
      localStorage.setItem("invictus_monthly_budget_target", String(val));
    } catch {}
    toast.success(`Monthly Budget Target set to ${currencySymbol}${val.toLocaleString()}! 🎯`);
    setIsBudgetModalOpen(false);
  };

  // Available Month options dynamically generated from transactions + current month
  const monthOptions = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentMonthKey);
    transactions.forEach((tx) => {
      if (tx.date) {
        monthsSet.add(tx.date.substring(0, 7));
      }
    });

    const sortedMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
    const opts = sortedMonths.map((m) => {
      const dateObj = parseISO(`${m}-01`);
      return {
        value: m,
        label: format(dateObj, "MMMM yyyy"),
        icon: "📅",
      };
    });

    return [
      { value: "all", label: "All Time (Full History)", icon: "♾️" },
      ...opts,
    ];
  }, [transactions, currentMonthKey]);

  // Compute Full Monthly Budget & Rollover Metrics
  const activeMonthForStats = ledgerMonthFilter === "all" ? currentMonthKey : ledgerMonthFilter;
  const budgetStats = useMemo(() => {
    return computeMonthlyBudgetStats({
      transactions,
      categories,
      targetMonthKey: activeMonthForStats,
      baseBudget,
      enableRollover: true,
    });
  }, [transactions, categories, activeMonthForStats, baseBudget]);

  const filteredLedgerTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const category = categories.find((c) => c.id === tx.categoryId);
      const catName = category?.name || "";
      const searchLower = ledgerSearchQuery.toLowerCase().trim();

      const matchesSearch =
        !searchLower ||
        (tx.note && tx.note.toLowerCase().includes(searchLower)) ||
        catName.toLowerCase().includes(searchLower) ||
        (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(searchLower)) ||
        String(tx.amount).includes(searchLower);

      const matchesCategory =
        ledgerCategoryFilter === "all" || tx.categoryId === ledgerCategoryFilter;

      const matchesType =
        ledgerTypeFilter === "all" || tx.type === ledgerTypeFilter;

      const matchesMonth =
        ledgerMonthFilter === "all" || (tx.date && tx.date.startsWith(ledgerMonthFilter));

      const matchesChannel =
        paymentChannelFilter === "all" ||
        (paymentChannelFilter === "cash" && isCashTransaction(tx.paymentMethod)) ||
        (paymentChannelFilter === "online" && isOnlineTransaction(tx.paymentMethod));

      return matchesSearch && matchesCategory && matchesType && matchesMonth && matchesChannel;
    });
  }, [transactions, categories, ledgerSearchQuery, ledgerCategoryFilter, ledgerTypeFilter, ledgerMonthFilter, paymentChannelFilter]);

  const monthlyStats = useMemo(() => {
    const income = filteredLedgerTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const expense = filteredLedgerTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const net = income - expense;
    return { income, expense, net };
  }, [filteredLedgerTransactions]);

  const groupedLedgerTransactions = useMemo(() => {
    const groups: { [dateStr: string]: { dateStr: string; txs: typeof transactions; dayNet: number } } = {};

    filteredLedgerTransactions.forEach((tx) => {
      const dateKey = tx.date ? tx.date.split("T")[0] : format(new Date(), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = { dateStr: dateKey, txs: [], dayNet: 0 };
      }
      groups[dateKey].txs.push(tx);
      const amt = tx.amount || 0;
      groups[dateKey].dayNet += tx.type === "income" ? amt : -amt;
    });

    return Object.values(groups).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [filteredLedgerTransactions]);

  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d, 12, 0, 0);
    }
    return parseISO(dateStr);
  };

  const formatTimelineDateHeader = (dateStr: string) => {
    try {
      const d = parseLocalDate(dateStr);
      if (isToday(d)) return `TODAY • ${format(d, "MMM d, yyyy").toUpperCase()}`;
      if (isYesterday(d)) return `YESTERDAY • ${format(d, "MMM d, yyyy").toUpperCase()}`;
      return format(d, "EEEE • MMM d, yyyy").toUpperCase();
    } catch {
      return dateStr;
    }
  };

  const handlePrevMonth = () => {
    if (ledgerMonthFilter === "all") {
      setLedgerMonthFilter(currentMonthKey);
      return;
    }
    try {
      const d = parseLocalDate(`${ledgerMonthFilter}-01`);
      setLedgerMonthFilter(format(subMonths(d, 1), "yyyy-MM"));
    } catch {
      setLedgerMonthFilter(currentMonthKey);
    }
  };

  const handleNextMonth = () => {
    if (ledgerMonthFilter === "all") {
      setLedgerMonthFilter(currentMonthKey);
      return;
    }
    try {
      const d = parseLocalDate(`${ledgerMonthFilter}-01`);
      setLedgerMonthFilter(format(addMonths(d, 1), "yyyy-MM"));
    } catch {
      setLedgerMonthFilter(currentMonthKey);
    }
  };

  // Edit Transaction states
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [editTxAmount, setEditTxAmount] = useState("");
  const [editTxType, setEditTxType] = useState<"expense" | "income">("expense");
  const [editTxCategoryId, setEditTxCategoryId] = useState("");
  const [editTxDate, setEditTxDate] = useState("");
  const [editTxNote, setEditTxNote] = useState("");
  const [editTxPaymentMethod, setEditTxPaymentMethod] = useState("upi");

  const handleOpenEditTxModal = (tx: any) => {
    setEditingTx(tx);
    setEditTxAmount(String(tx.amount));
    setEditTxType(tx.type);
    setEditTxCategoryId(tx.categoryId);
    setEditTxDate(tx.date ? tx.date.split("T")[0] : format(new Date(), "yyyy-MM-dd"));
    setEditTxNote(tx.note || "");
    setEditTxPaymentMethod(tx.paymentMethod || "upi");
  };

  // Transaction Inspector state (Feature 3)
  const [inspectingTx, setInspectingTx] = useState<any | null>(null);
  const [isPDFExportOpen, setIsPDFExportOpen] = useState(false);

  const handleDuplicateTx = (tx: any) => {
    setTxAmount(String(tx.amount));
    setTxType(tx.type);
    setTxCategoryId(tx.categoryId);
    setTxDate(format(new Date(), "yyyy-MM-dd"));
    setTxNote(tx.note ? `${tx.note} (Copy)` : "");
    setTxPaymentMethod(tx.paymentMethod || "upi");
    setInspectingTx(null);
    setIsAddTxOpen(true);
    toast.success("Transaction duplicated! Review & save ✨");
  };

  // Load user profile details for currency
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const isGuestMode = localStorage.getItem("invictus_guest_mode") === "true";
      if (isGuestMode) {
        const profileStr = localStorage.getItem("invictus_user_profile");
        if (profileStr) {
          const profile = JSON.parse(profileStr);
          if (profile.currency) setCurrency(profile.currency);
        }
      } else if (user.currency) {
        setCurrency(user.currency);
      }
    };
    loadProfile();
  }, [user]);

  const currencySymbol = (() => {
    switch (currency) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "JPY": return "¥";
      default: return "₹";
    }
  })();

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txCategoryId) return;
    try {
      await addTxMutation.mutateAsync({
        amount: Number(txAmount),
        type: txType,
        categoryId: txCategoryId,
        date: txDate,
        note: txNote,
        paymentMethod: txPaymentMethod,
        isRecurring: false,
      });
      toast.success("Transaction logged successfully! 💰");
      setTxAmount("");
      setTxNote("");
      setIsAddTxOpen(false);
    } catch {
      toast.error("Failed to log transaction");
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !editTxAmount || !editTxCategoryId) return;
    try {
      await updateTxMutation.mutateAsync({
        id: editingTx.id,
        amount: Number(editTxAmount),
        type: editTxType,
        categoryId: editTxCategoryId,
        date: editTxDate,
        note: editTxNote,
        paymentMethod: editTxPaymentMethod,
      });
      toast.success("Transaction updated successfully! 📝");
      setEditingTx(null);
    } catch {
      toast.error("Failed to update transaction");
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setDeleteTxId(id);
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudgetCategory || !categoryBudgetAmount) return;
    try {
      await updateCatMutation.mutateAsync({
        id: selectedBudgetCategory,
        monthlyBudget: Number(categoryBudgetAmount),
      });
      toast.success("Budget cap updated successfully! 🎯");
      setCategoryBudgetAmount("");
      setIsEditBudgetOpen(false);
    } catch {
      toast.error("Failed to update budget");
    }
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await addCatMutation.mutateAsync({
        name: newCatName.trim(),
        type: newCatType,
        color: newCatColor,
        icon: newCatIcon || "💳",
        monthlyBudget: Number(newCatMonthlyBudget) || 0,
      });
      toast.success("Category added successfully! 🏷️");
      setIsAddCatOpen(false);
      setNewCatName("");
      setNewCatMonthlyBudget("");
    } catch {
      toast.error("Failed to add category");
    }
  };

  const handleUpdateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editCatName.trim()) return;
    try {
      await updateCatMutation.mutateAsync({
        id: editingCat.id,
        name: editCatName.trim(),
        type: editCatType,
        color: editCatColor,
        icon: editCatIcon || "💳",
        monthlyBudget: Number(editCatMonthlyBudget) || 0,
      });
      toast.success("Category updated successfully! 📝");
      setEditingCat(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update category");
    }
  };
  const appliedCategoryTemplatePackIds = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => {
      if (c.templatePackId) set.add(c.templatePackId);
    });
    return Array.from(set);
  }, [categories]);

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
      toast.success(`Applied ${pack.name} non-destructively! 🚀`);
    } catch {
      toast.error("Failed to apply category template pack");
    }
  };

  const handleUnapplyCategoryPack = async (pack: TemplatePack) => {
    try {
      if (pack.id === "monthly-spending-template") {
        await unapplyMonthlyTemplateMutation.mutateAsync(user?.uid || "user-admin-default");
      } else {
        const templateCats = categories.filter((c) => c.templatePackId === pack.id);
        for (const cat of templateCats) {
          await deleteCatMutation.mutateAsync(cat.id);
        }
      }
      toast.success(`Unapplied ${pack.name}! Original user data preserved. 🧹`);
    } catch {
      toast.error("Failed to unapply category template pack");
    }
  };

  const handleMoveMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(moveAmount);
    if (!amt || amt <= 0 || !moveFromCatId || !moveToCatId) {
      toast.error("Please select source and destination categories and enter a valid amount");
      return;
    }
    if (moveFromCatId === moveToCatId) {
      toast.error("Source and destination categories must be different");
      return;
    }
    const fromCat = categories.find((c) => c.id === moveFromCatId);
    const toCat = categories.find((c) => c.id === moveToCatId);
    const dateStr = format(new Date(), "yyyy-MM-dd");

    try {
      // 1. Log transfer out expense
      await addTxMutation.mutateAsync({
        amount: amt,
        type: "expense",
        categoryId: moveFromCatId,
        date: dateStr,
        note: `Transfer to ${toCat?.name || "Category"}${moveNote ? `: ${moveNote}` : ""}`,
        paymentMethod: "Transfer",
        isRecurring: false,
      });
      // 2. Log transfer in income
      await addTxMutation.mutateAsync({
        amount: amt,
        type: "income",
        categoryId: moveToCatId,
        date: dateStr,
        note: `Transfer from ${fromCat?.name || "Category"}${moveNote ? `: ${moveNote}` : ""}`,
        paymentMethod: "Transfer",
        isRecurring: false,
      });
      toast.success(`Transferred ${currencySymbol}${amt} from ${fromCat?.name} to ${toCat?.name}! 🔄`);
      setIsMoveMoneyOpen(false);
      setMoveAmount("");
      setMoveNote("");
    } catch {
      toast.error("Failed to execute money transfer");
    }
  };

  const handleSendMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(sendAmount);
    if (!amt || amt <= 0 || !sendRecipient.trim() || !sendCatId) {
      toast.error("Please enter payee name, select a category, and enter a valid amount");
      return;
    }
    const dateStr = format(new Date(), "yyyy-MM-dd");
    try {
      await addTxMutation.mutateAsync({
        amount: amt,
        type: "expense",
        categoryId: sendCatId,
        date: dateStr,
        note: `Paid to ${sendRecipient.trim()} via ${sendPaymentMethod}${sendNote ? ` (${sendNote.trim()})` : ""}`,
        paymentMethod: sendPaymentMethod,
        isRecurring: false,
      });
      toast.success(`Sent ${currencySymbol}${amt} to ${sendRecipient.trim()} via ${sendPaymentMethod}! 💸`);
      setIsSendMoneyOpen(false);
      setSendRecipient("");
      setSendAmount("");
      setSendNote("");
    } catch {
      toast.error("Failed to send money transaction");
    }
  };

  // Filter Categories by Type
  const filteredCategories = categories.filter((c) => c.type === txType);

  // Computations for budget progress
  const getCategorySpend = (catId: string) => {
    // Sum expense transactions this month for the category
    const currentMonthStr = format(new Date(), "yyyy-MM");
    return transactions
      .filter((t) => t.categoryId === catId && t.type === "expense" && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Color Palette Mapping
  const colorMap: Record<string, string> = {
    amber: "#F5B942",
    orange: "#F0824A",
    mint: "#7CC3A2",
    lavender: "#C9BEEA",
    coral: "#F2A6A0",
  };

  // Sum total income and expense
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  // Pie Chart Data: Expense Categories
  const expensePieData = categories
    .filter((c) => c.type === "expense")
    .map((c) => ({
      name: c.name,
      value: transactions
        .filter((t) => t.categoryId === c.id && t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
      color: colorMap[c.color] || "#F5B942",
    }))
    .filter((d) => d.value > 0);

  const netBalance = totalIncome - totalExpense;
  const barChartData = [
    { name: "Overall Summary", Income: totalIncome, Expense: totalExpense },
  ];

  return (
    <div className="min-h-screen bg-cream-bg p-4 md:p-8 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 💰 EXECUTIVE FINANCIAL COMMAND HEADER */}
        <div className="bg-[#FAF8F5] rounded-3xl p-5 md:p-6 border-2.5 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4">
          {/* Top Bar: Title, Month Stepper & Primary CTA */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-navy-950/10 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-[#CEF431] border-2 border-navy-950 flex items-center justify-center text-navy-950 font-black text-lg shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] shrink-0">
                💰
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-black text-sm sm:text-base uppercase tracking-wider text-navy-950" style={{ fontFamily: "var(--font-heading)" }}>
                    Money & Ledger Space
                  </h2>
                </div>
                <p className="text-[10px] text-navy-700 font-bold mt-0.5">
                  Track daily liquidity, stay within budget & build cumulative wealth
                </p>
              </div>
            </div>

            {/* Stepper + Action CTA */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap self-start md:self-auto">
              {/* 📅 FEATURE 2: MONTH STEPPER IN EXECUTIVE HEADER */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-white hover:bg-[#CEF431] text-[#161514] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all shrink-0"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-3.5 w-3.5 stroke-[3]" />
                </button>

                <div className="w-36 sm:w-44">
                  <NeobrutalistSelect
                    value={ledgerMonthFilter}
                    onChange={setLedgerMonthFilter}
                    options={monthOptions}
                    placeholder="Select Month"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-white hover:bg-[#CEF431] text-[#161514] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all shrink-0"
                  title="Next Month"
                >
                  <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
                </button>
              </div>

              {/* Primary Action Button */}
              <button
                onClick={() => {
                  if (categories.length === 0) {
                    toast.error("Loading categories...");
                    return;
                  }
                  setTxCategoryId(categories.filter((c) => c.type === txType)[0]?.id || "");
                  setIsAddTxOpen(true);
                }}
                className="px-3.5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-navy-950 text-xs font-black uppercase tracking-wider border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Log Transaction</span>
              </button>
            </div>
          </div>

          {/* Centerpiece: Safe To Spend Hero Gauge & Intelligent Burn Pace Indicator */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-navy-600">
                  Safe To Spend ({budgetStats.targetMonthLabel.split(" ")[0]})
                </span>
                {budgetStats.rolloverSurplus > 0 && (
                  <span className="text-[9px] font-black bg-[#03D26F] text-[#161514] px-1.5 py-0.5 rounded-full border border-[#161514] shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]">
                    +{currencySymbol}{budgetStats.rolloverSurplus.toLocaleString()} Rolled
                  </span>
                )}
                {/* 🧭 FEATURE 3: INTELLIGENT BURN PACE BADGE */}
                <span className={cn(
                  "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] flex items-center gap-1",
                  budgetStats.burnPaceStatus === "fast"
                    ? "bg-rose-100 text-rose-950 border-[#161514]"
                    : budgetStats.burnPaceStatus === "frugal"
                    ? "bg-[#03D26F]/25 text-emerald-950 border-[#161514]"
                    : "bg-[#CEF431] text-[#161514] border-[#161514]"
                )}>
                  {budgetStats.burnPaceStatus === "fast" ? "⚠️ Fast Burn" : budgetStats.burnPaceStatus === "frugal" ? "🟢 Frugal Pace" : "✨ On Track"}
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
                {currencySymbol}{budgetStats.remainingBudget.toLocaleString()}
              </div>
              <p className="text-xs text-navy-700 font-bold">
                {budgetStats.burnPaceMessage}
              </p>
            </div>

            {/* Quick Metrics Badge Group */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:self-center">
              <div className="bg-[#FAF8F5] px-3 py-2 rounded-xl border border-navy-950 text-left shrink-0 min-w-[110px]">
                <span className="text-[9px] font-black uppercase text-navy-600 block">Total Pool</span>
                <span className="text-sm font-black text-navy-950 block">
                  {currencySymbol}{budgetStats.totalAvailableBudget.toLocaleString()}
                </span>
              </div>
              <div className="bg-[#FAF8F5] px-3 py-2 rounded-xl border border-navy-950 text-left shrink-0 min-w-[110px]">
                <span className="text-[9px] font-black uppercase text-rose-600 block">Spent</span>
                <span className="text-sm font-black text-rose-600 block">
                  -{currencySymbol}{budgetStats.monthlyExpense.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Status Rail: Budget Allowance, Mode Split & Lifetime Vault */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-bold text-navy-800">
            {/* Allowance Pill with Edit Button */}
            <div className="bg-white p-2.5 rounded-xl border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] flex items-center justify-between gap-2">
              <span className="truncate">
                🎯 <strong>{currencySymbol}{budgetStats.baseBudget.toLocaleString()}</strong> Base Budget
              </span>
              <button
                type="button"
                onClick={() => {
                  setTempBudgetInput(String(baseBudget));
                  setIsBudgetModalOpen(true);
                }}
                className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-500 border border-navy-950 cursor-pointer shrink-0"
              >
                Edit
              </button>
            </div>

            {/* Payment Mode Ratio Pill */}
            <div className="bg-white p-2.5 rounded-xl border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] flex items-center justify-between gap-1 truncate">
              <span>💳 Spends Split:</span>
              <span className="font-black text-navy-950 text-[10px] shrink-0">
                📱 {currencySymbol}{budgetStats.onlineExpense.toLocaleString()} ({budgetStats.onlinePercentage}%) • 💵 {currencySymbol}{budgetStats.cashExpense.toLocaleString()} ({budgetStats.cashPercentage}%)
              </span>
            </div>

            {/* Lifetime Vault Pill */}
            <div className="bg-white p-2.5 rounded-xl border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] flex items-center justify-between gap-1">
              <span>🏦 Lifetime Vault:</span>
              <span className={cn(
                "text-[10px] font-black px-1.5 py-0.5 rounded-md border",
                totalBalance >= 0 ? "bg-[#03D26F]/20 text-emerald-950 border-[#161514]" : "bg-rose-100 text-rose-950 border-[#161514]"
              )}>
                {totalBalance < 0 ? `-${currencySymbol}${Math.abs(totalBalance).toLocaleString()}` : `+${currencySymbol}${totalBalance.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Proactive Reminder Banner */}
        <ProactiveReminderBanner space="money" />

        {/* Tab Controls */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full overflow-x-auto no-scrollbar pb-1 mb-4">
            <TabsList className="bg-[#FAF8F5] rounded-2xl p-1.5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] flex items-center gap-1.5 w-max min-w-full sm:min-w-0 sm:w-auto">
              <TabsTrigger
                value="ledger"
                className="rounded-xl text-xs font-black py-2 px-3.5 sm:px-4 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#CEF431] data-[state=active]:text-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] text-[#161514]/70 hover:text-[#161514] hover:bg-white/50 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>📒</span>
                <span>Daily Ledger</span>
              </TabsTrigger>
              <TabsTrigger
                value="budgets"
                className="rounded-xl text-xs font-black py-2 px-3.5 sm:px-4 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#CEF431] data-[state=active]:text-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] text-[#161514]/70 hover:text-[#161514] hover:bg-white/50 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>🎯</span>
                <span>Budget & Rollover</span>
              </TabsTrigger>
              <TabsTrigger
                value="vault"
                className="rounded-xl text-xs font-black py-2 px-3.5 sm:px-4 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#CEF431] data-[state=active]:text-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] text-[#161514]/70 hover:text-[#161514] hover:bg-white/50 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>🐷</span>
                <span>Goals & Debts</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="rounded-xl text-xs font-black py-2 px-3.5 sm:px-4 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#CEF431] data-[state=active]:text-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] text-[#161514]/70 hover:text-[#161514] hover:bg-white/50 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>📊</span>
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 📒 Tab 1: Daily Ledger */}
          <TabsContent id="money-ledger" value="ledger" className="space-y-4 scroll-mt-24">
            {/* Category Wallets Carousel */}
            <MoneyQuickActionsAndCards
              mainBalance={budgetStats.remainingBudget}
              currencySymbol={currencySymbol}
              categories={categories.map((c) => ({
                id: c.id,
                name: c.name,
                amount: transactions
                  .filter((t) => t.categoryId === c.id && t.type === "expense" && (ledgerMonthFilter === "all" ? true : t.date?.startsWith(activeMonthForStats)))
                  .reduce((sum, t) => sum + t.amount, 0),
                color: c.color,
                icon: c.icon || "💳",
                type: c.type,
                monthlyBudget: c.monthlyBudget,
              }))}
              onAddTransaction={() => {
                if (categories.length === 0) {
                  toast.error("Loading categories...");
                  return;
                }
                setTxCategoryId(categories.filter((c) => c.type === txType)[0]?.id || "");
                setIsAddTxOpen(true);
              }}
              onMoveMoney={() => {
                if (categories.length < 2) {
                  toast.error("Please create at least 2 categories to move money between them!");
                  return;
                }
                setMoveFromCatId(categories[0]?.id || "");
                setMoveToCatId(categories[1]?.id || "");
                setIsMoveMoneyOpen(true);
              }}
              onSendMoney={() => {
                if (categories.length === 0) {
                  toast.error("Please create a category first!");
                  return;
                }
                setSendCatId(categories[0]?.id || "");
                setIsSendMoneyOpen(true);
              }}
              onViewDetails={() => setActiveTab("analytics")}
              onAddCategory={() => setIsChoiceOpen(true)}
              onEditCategory={(cat) => {
                const full = categories.find((c) => c.id === cat.id);
                setEditingCat(full || cat);
                setEditCatName(full?.name || cat.name);
                setEditCatType(full?.type || "expense");
                setEditCatColor(full?.color || "orange");
                setEditCatIcon(full?.icon || "💳");
                setEditCatMonthlyBudget(String(full?.monthlyBudget || 0));
              }}
              onDeleteCategory={(catId) => setDeleteCatId(catId)}
            />

            {/* Online (UPI) vs Cash Liquidity Split Card */}
            <div className="bg-white rounded-3xl p-5 border-2.5 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-navy-950/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-[#03D26F] border-2 border-navy-950 flex items-center justify-center text-navy-950 font-black text-base shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] shrink-0">
                    💳
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-wider text-[#161514]">
                      Online (UPI) vs Cash Breakdown ({budgetStats.targetMonthLabel.split(" ")[0]})
                    </h4>
                    <p className="text-[10px] text-navy-700 font-bold mt-0.5">
                      Segregation of Digital Wallet / UPI spends vs Physical Cash expenses
                    </p>
                  </div>
                </div>

                {/* Quick Channel Filter Toggles */}
                <div className="flex items-center bg-[#FAF8F5] rounded-xl border-2 border-navy-950 p-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] self-start sm:self-auto">
                  {(["all", "online", "cash"] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setPaymentChannelFilter(ch)}
                      className={cn(
                        "text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                        paymentChannelFilter === ch
                          ? "bg-[#CEF431] text-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
                          : "text-navy-700 hover:bg-white"
                      )}
                    >
                      {ch === "all" ? "All Modes" : ch === "online" ? "📱 UPI/Online" : "💵 Cash"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Online Spends */}
                <div
                  onClick={() => setPaymentChannelFilter("online")}
                  className={cn(
                    "p-4 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] cursor-pointer transition-all hover:-translate-y-0.5",
                    paymentChannelFilter === "online" ? "bg-[#03D26F]/20 ring-2 ring-[#03D26F]" : "bg-[#FAF8F5]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-[#161514] flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4 text-emerald-700 stroke-[2.5]" />
                      <span>Online / UPI Spends</span>
                    </span>
                    <span className="text-xs font-black bg-[#03D26F] text-[#161514] px-2 py-0.5 rounded-full border border-[#161514]">
                      {budgetStats.onlinePercentage}%
                    </span>
                  </div>
                  <span className="text-2xl font-black text-[#161514] block mt-2">
                    {currencySymbol}{budgetStats.onlineExpense.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-navy-600 block mt-1">
                    GPay, PhonePe, Cards & Bank Transfers
                  </span>
                </div>

                {/* Cash Spends */}
                <div
                  onClick={() => setPaymentChannelFilter("cash")}
                  className={cn(
                    "p-4 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] cursor-pointer transition-all hover:-translate-y-0.5",
                    paymentChannelFilter === "cash" ? "bg-amber-100 ring-2 ring-amber-500" : "bg-[#FAF8F5]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-[#161514] flex items-center gap-1.5">
                      <Banknote className="h-4 w-4 text-amber-700 stroke-[2.5]" />
                      <span>Physical Cash Spends</span>
                    </span>
                    <span className="text-xs font-black bg-amber-400 text-[#161514] px-2 py-0.5 rounded-full border border-[#161514]">
                      {budgetStats.cashPercentage}%
                    </span>
                  </div>
                  <span className="text-2xl font-black text-[#161514] block mt-2">
                    {currencySymbol}{budgetStats.cashExpense.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-navy-600 block mt-1">
                    Pocket money, street vendors & cash tips
                  </span>
                </div>
              </div>

              {/* Ratio bar */}
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border-2 border-navy-950 flex p-0.5 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]">
                <div
                  className="bg-[#03D26F] h-full rounded-l-full transition-all duration-500"
                  style={{ width: `${budgetStats.onlinePercentage}%` }}
                  title={`Online/UPI: ${budgetStats.onlinePercentage}%`}
                />
                <div
                  className="bg-amber-400 h-full rounded-r-full transition-all duration-500"
                  style={{ width: `${budgetStats.cashPercentage}%` }}
                  title={`Cash: ${budgetStats.cashPercentage}%`}
                />
              </div>
            </div>
            {/* Search, Month Selector & Multi-Filter Control Bar */}
            {transactions.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border-2 border-navy-950 shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] space-y-3">
                {/* Top Row: Month Picker Stepper & Search */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  {/* Monthly Stepper Selector */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-2.5 rounded-2xl bg-white hover:bg-[#CEF431] text-[#161514] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all shrink-0"
                      title="Previous Month"
                    >
                      <ChevronLeft className="h-4 w-4 stroke-[3]" />
                    </button>

                    <div className="w-48 sm:w-56">
                      <NeobrutalistSelect
                        value={ledgerMonthFilter}
                        onChange={setLedgerMonthFilter}
                        options={monthOptions}
                        placeholder="Select Month"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-2.5 rounded-2xl bg-white hover:bg-[#CEF431] text-[#161514] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all shrink-0"
                      title="Next Month"
                    >
                      <ChevronRight className="h-4 w-4 stroke-[3]" />
                    </button>
                  </div>

                  {/* Search Input Box */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-600 stroke-[2.5]" />
                    <input
                      type="text"
                      value={ledgerSearchQuery}
                      onChange={(e) => setLedgerSearchQuery(e.target.value)}
                      placeholder="Search notes, categories, amounts..."
                      className="w-full bg-[#FAF8F5] rounded-xl border-2 border-[#161514] pl-10 pr-9 py-2 text-xs font-bold text-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
                    />
                    {ledgerSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setLedgerSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-600 hover:text-navy-950 p-0.5 cursor-pointer border-none bg-transparent"
                      >
                        <X className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>
                    )}
                  </div>

                  {/* Category Dropdown */}
                  <div className="sm:w-48">
                    <NeobrutalistSelect
                      value={ledgerCategoryFilter}
                      onChange={setLedgerCategoryFilter}
                      options={[
                        { value: "all", label: `All Categories (${categories.length})`, icon: "🏷️" },
                        ...categories.map((c) => ({
                          value: c.id,
                          label: c.name,
                          icon: c.icon,
                        })),
                      ]}
                      placeholder="All Categories"
                    />
                  </div>
                </div>

                {/* Bottom Row: Monthly Summary Stats & Type / Channel Filter Pills */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-navy-950/10 overflow-x-auto no-scrollbar py-0.5">
                  <div className="flex items-center gap-3 flex-wrap shrink-0">
                    {/* Type Filter Pills */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-black uppercase text-navy-700 mr-1 flex items-center gap-1 whitespace-nowrap shrink-0">
                        <Filter className="h-3 w-3 stroke-[2.5]" /> Type:
                      </span>
                      {(["all", "income", "expense"] as const).map((t) => {
                        const isActive = ledgerTypeFilter === t;
                        const label = t === "all" ? "All" : t === "income" ? "Income (+)" : "Expense (-)";
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setLedgerTypeFilter(t)}
                            className={cn(
                              "px-2.5 py-1 rounded-xl text-[10px] font-black transition-all border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] cursor-pointer whitespace-nowrap shrink-0",
                              isActive
                                ? t === "income"
                                  ? "bg-[#03D26F] text-[#161514] scale-105"
                                  : t === "expense"
                                  ? "bg-rose-400 text-[#161514] scale-105"
                                  : "bg-[#CEF431] text-[#161514] scale-105"
                                : "bg-white text-navy-800 hover:bg-amber-100"
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Payment Channel Filter Pills (UPI vs Cash) */}
                    <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-navy-950/20">
                      <span className="text-[10px] font-black uppercase text-navy-700 mr-1 flex items-center gap-1 whitespace-nowrap shrink-0">
                        💳 Mode:
                      </span>
                      {(["all", "online", "cash"] as const).map((ch) => {
                        const isActive = paymentChannelFilter === ch;
                        const label = ch === "all" ? "All Modes" : ch === "online" ? "📱 UPI/Online" : "💵 Cash";
                        return (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => setPaymentChannelFilter(ch)}
                            className={cn(
                              "px-2.5 py-1 rounded-xl text-[10px] font-black transition-all border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] cursor-pointer whitespace-nowrap shrink-0",
                              isActive
                                ? ch === "online"
                                  ? "bg-[#03D26F] text-[#161514] scale-105"
                                  : ch === "cash"
                                  ? "bg-amber-400 text-[#161514] scale-105"
                                  : "bg-[#CEF431] text-[#161514] scale-105"
                                : "bg-white text-navy-800 hover:bg-amber-100"
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Monthly Summary Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-[#03D26F]/20 text-emerald-950 border border-[#161514] whitespace-nowrap shrink-0">
                      In: +{currencySymbol}{monthlyStats.income.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-rose-100 text-rose-950 border border-[#161514] whitespace-nowrap shrink-0">
                      Out: -{currencySymbol}{monthlyStats.expense.toLocaleString()}
                    </span>
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2.5 py-1 rounded-xl border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] whitespace-nowrap shrink-0",
                      monthlyStats.net >= 0 ? "bg-[#CEF431] text-[#161514]" : "bg-amber-300 text-[#161514]"
                    )}>
                      Net: {monthlyStats.net >= 0 ? "+" : ""}{currencySymbol}{monthlyStats.net.toLocaleString()}
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsPDFExportOpen(true)}
                      className="px-3 py-1 rounded-xl bg-white hover:bg-[#CEF431] text-[#161514] text-[10px] font-black border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ml-1"
                    >
                      <FileText className="h-3 w-3 stroke-[2.5]" />
                      <span>Export PDF 📄</span>
                    </button>

                    {(ledgerSearchQuery || ledgerCategoryFilter !== "all" || ledgerTypeFilter !== "all" || ledgerMonthFilter !== currentMonthKey) && (
                      <button
                        type="button"
                        onClick={() => {
                          setLedgerSearchQuery("");
                          setLedgerCategoryFilter("all");
                          setLedgerTypeFilter("all");
                          setLedgerMonthFilter(currentMonthKey);
                        }}
                        className="text-[10px] font-black text-rose-600 hover:underline cursor-pointer border-none bg-transparent ml-1"
                      >
                        Reset 🧹
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {txsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-[var(--radius-lg)] p-4 h-16 animate-pulse" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
               <EmptyState
                 title="No transactions logged yet 💰"
                 description="Keep a record of your everyday finances by logging income and expenses category-wise."
                 Icon={Wallet}
                 ctaText="Log Transaction"
                 onCtaClick={() => setIsAddTxOpen(true)}
                 iconBgClass="bg-mint-600/10"
                 iconColorClass="text-mint-600"
               />
            ) : filteredLedgerTransactions.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border-2 border-navy-950 text-center space-y-3 shadow-[3px_3px_0px_0px_rgba(22,21,20,1)]">
                <p className="text-sm font-black text-navy-950">No transactions match your month/search filter 🔍</p>
                <p className="text-xs text-navy-700 font-bold max-w-sm mx-auto">
                  Try selecting another month or reset active filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLedgerSearchQuery("");
                    setLedgerCategoryFilter("all");
                    setLedgerTypeFilter("all");
                    setLedgerMonthFilter("all");
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-navy-950 text-xs font-black border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] cursor-pointer"
                >
                  Show All Time Transactions ♾️
                </button>
              </div>
            ) : (
              /* Chronological Timeline Day-by-Day Groups */
              <div className="space-y-4">
                {groupedLedgerTransactions.map((group) => (
                  <div key={group.dateStr} className="space-y-2">
                    {/* Studio Neobrutalist Day Header */}
                    <div className="bg-[#161514] text-white px-4 py-2 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] flex items-center justify-between gap-2">
                      <span className="text-xs font-black tracking-wider flex items-center gap-2">
                        <CalendarIcon className="h-3.5 w-3.5 text-[#CEF431] stroke-[2.5]" />
                        {formatTimelineDateHeader(group.dateStr)}
                      </span>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-white/20",
                        group.dayNet >= 0 ? "bg-[#03D26F] text-[#161514]" : "bg-[#CEF431] text-[#161514]"
                      )}>
                        {group.dayNet >= 0 ? `+${currencySymbol}${group.dayNet.toLocaleString()} Net` : `-${currencySymbol}${Math.abs(group.dayNet).toLocaleString()} Spent`}
                      </span>
                    </div>

                    {/* Day's Transactions List */}
                    <div className="bg-white rounded-2xl shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] border-2 border-[#161514] divide-y-2 divide-[#161514] overflow-hidden">
                      {group.txs.map((tx) => {
                        const category = categories.find((c) => c.id === tx.categoryId);
                        return (
                          <div
                            key={tx.id}
                            onClick={() => setInspectingTx(tx)}
                            className="p-3.5 flex items-center justify-between hover:bg-[#CEF431]/20 transition-colors gap-3 cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 truncate">
                              <div className={cn("h-9 w-9 rounded-xl border-2 border-[#161514] flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] group-hover:scale-105 transition-transform", tx.type === "income" ? "bg-[#03D26F] text-[#161514]" : "bg-rose-400 text-[#161514]")}>
                                {tx.type === "income" ? <ArrowUpRight className="h-4.5 w-4.5 stroke-[3]" /> : <ArrowDownRight className="h-4.5 w-4.5 stroke-[3]" />}
                              </div>
                              <div className="truncate">
                                <h4 className="font-black text-xs sm:text-sm text-[#161514] flex items-center gap-1.5 truncate">
                                  <span>{renderCategoryEmoji(category?.icon)}</span>
                                  <span className="truncate">{category?.name || "Uncategorized"}</span>
                                  {tx.note && <span className="text-[10px] text-[#161514]/60 font-bold truncate max-w-[150px] sm:max-w-[250px]">- {tx.note}</span>}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] font-extrabold text-[#161514]/70">
                                  <span className="capitalize px-1.5 py-0.2 rounded bg-amber-200 border border-[#161514]">{tx.paymentMethod || "UPI"}</span>
                                  <span>•</span>
                                  <span>{tx.date && tx.date.includes("T") ? format(parseISO(tx.date), "hh:mm a") : "Logged"}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                              <span className={cn("font-black text-xs sm:text-sm tracking-tight px-2 py-1 rounded-xl border border-[#161514] whitespace-nowrap", tx.type === "income" ? "bg-[#03D26F]/20 text-emerald-950" : "bg-rose-100 text-rose-950")}>
                                {tx.type === "income" ? "+" : "-"}{currencySymbol}{tx.amount.toLocaleString()}
                              </span>
                              <div className="hidden sm:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateTx(tx)}
                                  className="text-[#161514]/70 hover:text-[#161514] p-1.5 hover:bg-[#CEF431] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#161514]"
                                  title="1-Click Duplicate"
                                >
                                  <Copy className="h-3.5 w-3.5 stroke-[2.5]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTxModal(tx)}
                                  className="text-[#161514]/70 hover:text-[#161514] p-1.5 hover:bg-[#CEF431] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#161514]"
                                  title="Edit transaction"
                                >
                                  <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTxId(tx.id)}
                                  className="text-[#161514]/70 hover:text-rose-600 p-1.5 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#161514]"
                                  title="Delete transaction"
                                >
                                  <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 🎯 Tab 2: Budgets & Rollover */}
          <TabsContent id="money-budgets" value="budgets" className="space-y-4 scroll-mt-24">
            {/* 🎯 FEATURE 4 & 5: MONTHLY BUDGET CEILING & ROLLOVER ALLOWANCE CARD */}
            <div className="bg-white rounded-3xl p-5 border-2.5 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-navy-950/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-2xl bg-[#CEF431] border-2 border-navy-950 flex items-center justify-center text-[#161514] font-black text-lg shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] shrink-0">
                    🎯
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm uppercase tracking-wider text-[#161514]">
                        {budgetStats.targetMonthLabel} Budget & Rollover
                      </h4>
                      {budgetStats.rolloverSurplus > 0 && (
                        <span className="text-[10px] font-black bg-[#03D26F] text-[#161514] px-2 py-0.5 rounded-full border border-[#161514] shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] flex items-center gap-1">
                          <Sparkles className="h-3 w-3 stroke-[3]" /> +{currencySymbol}{budgetStats.rolloverSurplus.toLocaleString()} Rolled from {budgetStats.previousMonthLabel.split(" ")[0]}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-navy-700 font-bold mt-0.5">
                      Base Income Budget: {currencySymbol}{budgetStats.baseBudget.toLocaleString()} • Daily expenses deduct from this pool
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTempBudgetInput(String(baseBudget));
                    setIsBudgetModalOpen(true);
                  }}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-navy-950 text-xs font-black border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Edit Allowance</span>
                </button>
              </div>

              {/* Budget Meter Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-navy-600 block">Total Available Pool</span>
                  <span className="text-xl font-black text-[#161514] block mt-0.5">
                    {currencySymbol}{budgetStats.totalAvailableBudget.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-navy-600 block mt-0.5">
                    {budgetStats.baseBudget.toLocaleString()} base {budgetStats.rolloverSurplus > 0 ? `+ ${budgetStats.rolloverSurplus.toLocaleString()} rollover` : ""}
                  </span>
                </div>

                <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">Spent This Month</span>
                  <span className="text-xl font-black text-rose-600 block mt-0.5">
                    -{currencySymbol}{budgetStats.monthlyExpense.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-navy-600 block mt-0.5">
                    {budgetStats.budgetUsedPercentage}% of monthly pool used
                  </span>
                </div>

                <div className={cn(
                  "p-3.5 rounded-2xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]",
                  budgetStats.remainingBudget >= 0 ? "bg-[#CEF431]/30" : "bg-rose-100"
                )}>
                  <span className="text-[10px] font-black uppercase tracking-wider text-navy-800 block">Remaining Safe-to-Spend</span>
                  <span className={cn("text-xl font-black block mt-0.5", budgetStats.remainingBudget >= 0 ? "text-emerald-900" : "text-rose-700")}>
                    {currencySymbol}{budgetStats.remainingBudget.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-navy-800 block mt-0.5">
                    {budgetStats.remainingBudget > 0
                      ? `~${currencySymbol}${budgetStats.dailySafeToSpend}/day safe (${budgetStats.daysRemainingInMonth}d left)`
                      : "Over-budget! Trim expenses"}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-navy-800">
                  <span>Budget Consumption Progress</span>
                  <span>{budgetStats.budgetUsedPercentage}%</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border-2 border-navy-950 p-0.5 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      budgetStats.budgetUsedPercentage > 90 ? "bg-rose-500" : budgetStats.budgetUsedPercentage > 75 ? "bg-amber-400" : "bg-[#03D26F]"
                    )}
                    style={{ width: `${Math.min(100, budgetStats.budgetUsedPercentage)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 🐷 FEATURE 5: WHERE DID YOU SAVE LAST MONTH? CARD */}
            {(budgetStats.categorySavingsAudit.length > 0 || budgetStats.previousMonthSavings > 0) && (
              <div className="bg-[#FAF8F5] rounded-3xl p-5 border-2.5 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-amber-400 border-2 border-navy-950 flex items-center justify-center text-navy-950 font-black text-base shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] shrink-0">
                    🐷
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-wider text-[#161514]">
                      {budgetStats.previousMonthLabel} Savings Audit & Highlights
                    </h4>
                    <p className="text-[10px] text-navy-700 font-bold">
                      You saved {currencySymbol}{budgetStats.previousMonthSavings.toLocaleString()} in {budgetStats.previousMonthLabel}! Here is where you stayed under budget:
                    </p>
                  </div>
                </div>

                {budgetStats.categorySavingsAudit.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                    {budgetStats.categorySavingsAudit.map((item) => (
                      <div
                        key={item.categoryId}
                        className="bg-white p-3 rounded-2xl border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg shrink-0">{renderCategoryEmoji(item.icon)}</span>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-[#161514] block truncate">{item.categoryName}</span>
                              <span className="text-[9px] font-bold text-navy-600 block">
                                Spent: {currencySymbol}{item.spent} / {currencySymbol}{item.budget}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-emerald-800 bg-[#03D26F]/20 px-2 py-0.5 rounded-lg border border-emerald-800/30 shrink-0">
                            +{currencySymbol}{item.saved}
                          </span>
                        </div>

                        {/* 🔄 FEATURE 5: 1-CLICK GRANULAR ENVELOPE ROLLOVER BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleBoostCategoryEnvelope(item)}
                          disabled={updateCatMutation.isPending}
                          className="w-full py-1.5 px-2 rounded-xl bg-[#FAF8F5] hover:bg-[#CEF431] text-navy-950 text-[10px] font-black border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <Sparkles className="h-3 w-3 stroke-[3]" />
                          <span>Boost {budgetStats.targetMonthLabel.split(" ")[0]} Envelope (+{currencySymbol}{item.saved})</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-2xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-navy-950/10 pb-2.5">
                      <div>
                        <span className="text-xs font-black text-[#161514] block">
                          Total {budgetStats.previousMonthLabel.split(" ")[0]} Rollover Surplus: +{currencySymbol}{budgetStats.previousMonthSavings.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-navy-700 font-bold mt-0.5 block">
                          You spent {currencySymbol}{budgetStats.previousMonthExpense.toLocaleString()} of your {currencySymbol}{budgetStats.baseBudget.toLocaleString()} overall budget!
                        </span>
                      </div>
                      <span className="text-xs font-black text-emerald-800 bg-[#03D26F]/25 px-2.5 py-1 rounded-xl border border-emerald-800/30 self-start sm:self-auto">
                        +{currencySymbol}{budgetStats.previousMonthSavings.toLocaleString()} Available
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
                        <span>🎯</span>
                        <span>1-Tap Allocate +{currencySymbol}{budgetStats.previousMonthSavings.toLocaleString()} to a {budgetStats.targetMonthLabel.split(" ")[0]} Category Envelope:</span>
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {categories.filter((c) => c.type === "expense").slice(0, 6).map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleBoostCategoryEnvelope({
                              categoryId: cat.id,
                              categoryName: cat.name,
                              saved: budgetStats.previousMonthSavings,
                              budget: cat.monthlyBudget || 0,
                            })}
                            disabled={updateCatMutation.isPending}
                            className="p-3 rounded-2xl bg-[#FAF8F5] hover:bg-[#CEF431] text-navy-950 border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between gap-2.5 text-left disabled:opacity-50 group"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xl leading-none">{renderCategoryEmoji(cat.icon)}</span>
                              <span className="text-[10px] font-black text-emerald-950 bg-[#03D26F]/25 px-2 py-0.5 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]">
                                +{currencySymbol}{budgetStats.previousMonthSavings}
                              </span>
                            </div>
                            <div className="w-full">
                              <span className="text-xs font-black text-[#161514] block leading-snug break-words">
                                {cat.name}
                              </span>
                              <span className="text-[9px] font-bold text-navy-600 group-hover:text-navy-950 block mt-0.5">
                                Tap to boost 🎯
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-navy-600" style={{ fontFamily: "var(--font-heading)" }}>
                  Category Budget Envelopes
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsChoiceOpen(true)}
                    size="sm"
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm border-none"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> New Category
                  </Button>
                  <Button
                    onClick={() => setIsEditBudgetOpen(true)}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-input text-navy-900 bg-white cursor-pointer"
                  >
                    Edit Budgets
                  </Button>
                </div>
              </div>

              {/* 🌐 DATASET 3: GLOBAL COST OF LIVING & SMART BUDGET BENCHMARK CALCULATOR */}
              <div className="bg-amber-400 rounded-3xl p-5 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4 text-navy-950">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-2xl bg-white border-2 border-navy-950 flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
                      <Globe className="h-5 w-5 text-navy-950 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-wider">
                        🌐 Global Cost of Living Budget Calculator
                      </h4>
                      <p className="text-[10px] font-bold text-navy-800">
                        Powered by 122-country Numbeo cost indices dataset
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-navy-950 text-white px-2.5 py-1 rounded-xl border border-navy-950 self-start sm:self-auto">
                    Rank #{countryItem?.rank || 1} • {countryItem?.country || "India"}
                  </span>
                </div>

                {/* Country Selector & Income Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-navy-700 block">Select Your Country</label>
                    <NeobrutalistSelect
                      value={selectedCountry}
                      onChange={setSelectedCountry}
                      options={(costOfLivingData?.countries || []).map((c: any) => ({
                        value: c.country,
                        label: c.country,
                        icon: "🌐",
                      }))}
                      placeholder="Select Country"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-navy-700 block">Monthly Net Income ({currencySymbol})</label>
                    <input
                      type="number"
                      value={incomeForCalc}
                      onChange={(e) => setIncomeForCalc(e.target.value)}
                      className="w-full bg-cream-bg rounded-xl border-2 border-navy-950 px-3 py-1.5 text-xs font-black text-navy-950 outline-none"
                      placeholder="50000"
                    />
                  </div>
                </div>

                {/* Auto-Calculated Benchmark Budget Caps */}
                {countryItem && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="bg-white rounded-2xl p-2.5 border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] text-center">
                      <span className="text-[9px] font-black text-navy-700 uppercase block">🛒 Groceries Cap</span>
                      <p className="text-xs font-black text-navy-950 mt-0.5">
                        {currencySymbol}
                        {Math.round(
                          (Number(incomeForCalc) || 50000) *
                            0.25 *
                            ((countryItem.groceriesIndex || 50) / 50)
                        ).toLocaleString()}
                      </p>
                      <span className="text-[8px] font-extrabold text-navy-600">Idx: {countryItem.groceriesIndex}</span>
                    </div>

                    <div className="bg-white rounded-2xl p-2.5 border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] text-center">
                      <span className="text-[9px] font-black text-navy-700 uppercase block">🏠 Rent & Housing</span>
                      <p className="text-xs font-black text-navy-950 mt-0.5">
                        {currencySymbol}
                        {Math.round(
                          (Number(incomeForCalc) || 50000) *
                            0.3 *
                            ((countryItem.rentIndex || 20) / 20)
                        ).toLocaleString()}
                      </p>
                      <span className="text-[8px] font-extrabold text-navy-600">Idx: {countryItem.rentIndex}</span>
                    </div>

                    <div className="bg-white rounded-2xl p-2.5 border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] text-center">
                      <span className="text-[9px] font-black text-navy-700 uppercase block">🍕 Dining Out</span>
                      <p className="text-xs font-black text-navy-950 mt-0.5">
                        {currencySymbol}
                        {Math.round(
                          (Number(incomeForCalc) || 50000) *
                            0.15 *
                            ((countryItem.restaurantIndex || 50) / 50)
                        ).toLocaleString()}
                      </p>
                      <span className="text-[8px] font-extrabold text-navy-600">Idx: {countryItem.restaurantIndex}</span>
                    </div>

                    <div className="bg-white rounded-2xl p-2.5 border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] text-center">
                      <span className="text-[9px] font-black text-navy-700 uppercase block">💰 Savings Target</span>
                      <p className="text-xs font-black text-emerald-800 mt-0.5">
                        {currencySymbol}
                        {Math.round((Number(incomeForCalc) || 50000) * 0.2).toLocaleString()}
                      </p>
                      <span className="text-[8px] font-extrabold text-navy-600">Pwr: {countryItem.purchasingPowerIndex}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ⚡ DATASET 4: 1-CLICK TYPICAL MONTHLY BUDGET TEMPLATE CARD */}
              <div className="bg-emerald-400 rounded-3xl p-5 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] flex flex-col sm:flex-row items-center justify-between gap-4 text-navy-950">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white border-2 border-navy-950 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] shrink-0">
                    <Sparkles className="h-6 w-6 text-navy-950 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-wider">
                      ⚡ 1-Click Monthly Budget Template Preset
                    </h4>
                    <p className="text-[10px] font-bold text-navy-800 mt-0.5">
                      Auto-configures 10 essential spending categories (Rent, Groceries, Utilities, Transport, Gym, Savings)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {categories.some((c) => c.templatePackId === "monthly-spending-template" || ["Rent & Housing", "Groceries & Provisions", "Utilities & Wifi", "Transportation & Fuel"].includes(c.name)) && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await unapplyMonthlyTemplateMutation.mutateAsync(user?.uid || "user-admin-default");
                          toast.success("Unapplied 1-Click Monthly Budget Preset! Your custom categories are preserved. 🧹");
                        } catch {
                          toast.error("Failed to unapply template");
                        }
                      }}
                      disabled={unapplyMonthlyTemplateMutation.isPending}
                      className="bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase px-4 py-2.5 rounded-2xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                    >
                      {unapplyMonthlyTemplateMutation.isPending ? "Removing..." : "🧹 UNAPPLY TEMPLATE"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await applyTemplateMutation.mutateAsync(user?.uid || "guest");
                        toast.success("Applied 1-Click Monthly Budget Template! ⚡");
                      } catch {
                        toast.error("Failed to apply template");
                      }
                    }}
                    disabled={applyTemplateMutation.isPending}
                    className="bg-navy-950 hover:bg-navy-900 text-white font-black text-xs uppercase px-4 py-2.5 rounded-2xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    {applyTemplateMutation.isPending ? "Applying..." : "⚡ LOAD TEMPLATE"}
                  </button>
                </div>
              </div>

              {categories.filter((c) => c.type === "expense").length === 0 ? (
                <EmptyState
                  title="No Expense Budgets Configured 🎯"
                  description="Set monthly spending caps for your categories (e.g., Food, Travel, Shopping) to keep track of your financial limits."
                  Icon={TrendingUp}
                  ctaText="Create Category"
                  onCtaClick={() => setIsAddCatOpen(true)}
                  iconBgClass="bg-mint-600/10"
                  iconColorClass="text-mint-600"
                />
              ) : (
                <div className="columns-1 sm:columns-2 gap-4 space-y-4 [column-fill:_balance]">
                  {categories
                    .filter((c) => c.type === "expense")
                    .map((c) => {
                      const spend = getCategorySpend(c.id);
                      const budget = c.monthlyBudget || 0;
                      const percent = budget > 0 ? Math.min(100, Math.round((spend / budget) * 100)) : 0;
                      const nearCap = percent >= 85;

                      return (
                        <div key={c.id} className="break-inside-avoid block bg-white rounded-[var(--radius-lg)] p-5 shadow-[0_8px_24px_rgba(31,36,48,0.04)] border space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm text-navy-900 flex items-center gap-1.5">
                                <span>{renderCategoryEmoji(c.icon)}</span> {c.name}
                              </h4>
                              <p className="text-[10px] text-navy-600 font-semibold mt-0.5">Budget Cap: {currencySymbol}{budget.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {nearCap && (
                                <span className="text-danger flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-danger/5 px-2 py-0.5 rounded-full">
                                  <ShieldAlert className="h-3 w-3" /> Near Cap
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setEditingCat(c);
                                  setEditCatName(c.name);
                                  setEditCatType(c.type);
                                  setEditCatColor(c.color || "orange");
                                  setEditCatIcon(c.icon || "💳");
                                  setEditCatMonthlyBudget(String(c.monthlyBudget || 0));
                                }}
                                className="text-navy-600 hover:text-navy-900 p-1 cursor-pointer transition-colors outline-none border-none bg-transparent"
                                title="Edit category"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteCatId(c.id)}
                                className="text-navy-600 hover:text-danger p-1 cursor-pointer transition-colors outline-none border-none bg-transparent"
                                title="Delete category"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="h-2 w-full bg-cream-bg rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-500", nearCap ? "bg-danger" : "bg-mint-600")}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-navy-600">
                              <span>{currencySymbol}{spend.toLocaleString()} spent</span>
                              <span>{percent}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* 🐷 Tab 3: Goals, Subscriptions & Debts */}
          <TabsContent id="money-vault" value="vault" className="space-y-6 scroll-mt-24">
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
          </TabsContent>

          {/* 📊 Tab 4: Analytics */}
          <TabsContent id="money-analytics" value="analytics" className="scroll-mt-24">
            <div className="space-y-6">
              {transactions.length === 0 ? (
                <EmptyState
                  title="No financial data logged yet 📊"
                  description="Log your first income or expense transaction to visualize your spending habits and category breakdowns."
                  Icon={TrendingUp}
                  ctaText="Log Transaction"
                  onCtaClick={() => setIsAddTxOpen(true)}
                  iconBgClass="bg-mint-600/10"
                  iconColorClass="text-mint-600"
                />
              ) : (
                <>
                  {/* Expense category share pie chart */}
                  {expensePieData.length > 0 && (
                    <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[0_8px_24px_rgba(31,36,48,0.06)] space-y-4">
                      <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
                        Expense Categories Share
                      </h3>
                      <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expensePieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {expensePieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => [`${currencySymbol}${v}`, "Spend"]} />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Income vs Expenses comparisons */}
                  <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[0_8px_24px_rgba(31,36,48,0.06)] space-y-4">
                    <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
                      Income vs Expenses Comparison
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                          <YAxis stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(v) => `${currencySymbol}${v}`} />
                          <Tooltip formatter={(v) => [`${currencySymbol}${v}`]} contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                          <Legend />
                          <Bar dataKey="Income" fill="#7CC3A2" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="Expense" fill="#F2A6A0" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Log Transaction Dialog Form */}
      <ResponsiveFormContainer
        open={isAddTxOpen}
        onOpenChange={setIsAddTxOpen}
        title="Add Transaction"
        description="Fill out the fields to add income or expense record"
      >
        <form onSubmit={handleAddTransaction} className="space-y-4 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">Transaction Type *</label>
            <div className="flex gap-2">
              {["expense", "income"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTxType(t as any);
                    setTxCategoryId(categories.filter((c) => c.type === t)[0]?.id || "");
                  }}
                  className={cn(
                    "flex-1 py-2 rounded-2xl border-2 border-[#161514] text-xs font-black transition-all uppercase tracking-wider cursor-pointer shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]",
                    txType === t
                      ? "bg-[#161514] text-white"
                      : "bg-white text-[#161514]/70 hover:bg-[#FAF8F5]"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="tx-amount" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Amount ({currencySymbol}) *
              </label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="e.g. 250"
                required
                className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="tx-cat" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Category *
              </label>
              <NeobrutalistSelect
                value={txCategoryId}
                onChange={setTxCategoryId}
                options={filteredCategories.map((c) => ({
                  value: c.id,
                  label: c.name,
                  icon: c.icon,
                }))}
                placeholder="Select Category"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="tx-date" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Date *
              </label>
              <input
                id="tx-date"
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                required
                className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-3 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                  Payment Method *
                </label>
                <button
                  type="button"
                  onClick={() => setShowMorePaymentMethods(!showMorePaymentMethods)}
                  className="text-[9px] font-black uppercase text-navy-600 hover:text-navy-950 underline cursor-pointer border-none bg-transparent"
                >
                  {showMorePaymentMethods ? "Simple Mode" : "Card / Bank ▾"}
                </button>
              </div>

              {!showMorePaymentMethods ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxPaymentMethod("upi")}
                    className={cn(
                      "py-2.5 px-3 rounded-2xl border-2 border-[#161514] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5",
                      txPaymentMethod !== "cash"
                        ? "bg-[#03D26F] text-[#161514]"
                        : "bg-white text-[#161514]/70 hover:bg-[#FAF8F5]"
                    )}
                  >
                    <span>📱</span>
                    <span>UPI / Online</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTxPaymentMethod("cash")}
                    className={cn(
                      "py-2.5 px-3 rounded-2xl border-2 border-[#161514] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5",
                      txPaymentMethod === "cash"
                        ? "bg-amber-400 text-[#161514]"
                        : "bg-white text-[#161514]/70 hover:bg-[#FAF8F5]"
                    )}
                  >
                    <span>💵</span>
                    <span>Cash</span>
                  </button>
                </div>
              ) : (
                <NeobrutalistSelect
                  value={txPaymentMethod}
                  onChange={setTxPaymentMethod}
                  options={[
                    { value: "upi", label: "UPI / GPay / PhonePe", icon: "📱" },
                    { value: "cash", label: "Cash", icon: "💵" },
                    { value: "card", label: "Debit/Credit Card", icon: "💳" },
                    { value: "bank", label: "Bank Transfer", icon: "🏦" },
                  ]}
                />
              )}
            </div>
          </div>

          {/* 🏷️ FEATURE 4: FREQUENT MERCHANT TAP CHIPS */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#161514] flex items-center gap-1">
                <span>⚡</span>
                <span>Frequent Presets (1-Tap Fill)</span>
              </span>
              <span className="text-[9px] font-bold text-navy-600 lowercase">fills note, cat & mode</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {frequentMerchantPills.map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => {
                    setTxNote(pill.label);
                    setTxPaymentMethod(pill.defaultMode);
                    const detected = detectCategoryFromNote(pill.label, categories);
                    if (detected?.categoryId) {
                      setTxCategoryId(detected.categoryId);
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#CEF431] text-[#161514] text-[10px] font-black border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>{pill.icon}</span>
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label htmlFor="tx-notes" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Notes (optional)
              </label>
              {(() => {
                const detected = detectCategoryFromNote(txNote, categories);
                if (!detected) return null;

                if (detected.categoryId) {
                  return (
                    <span className="text-[10px] font-black text-[#161514] bg-[#CEF431] px-2 py-0.5 rounded-lg flex items-center gap-1 border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]">
                      <span>{detected.icon}</span>
                      Auto-Matched: {detected.categoryName}
                    </span>
                  );
                }

                return (
                  <button
                    type="button"
                    disabled={isCreatingAutoCat}
                    onClick={() => handleQuickCreateCategory(detected)}
                    className="text-[10px] font-black text-[#161514] bg-[#CEF431] hover:bg-[#bce028] px-2 py-0.5 rounded-lg flex items-center gap-1 border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>{detected.icon}</span>
                    <span>Auto-Match: {detected.categoryName}</span>
                    <span className="bg-[#161514] text-[#CEF431] px-1 py-0.2 rounded text-[9px] font-black ml-0.5">
                      {isCreatingAutoCat ? "..." : "+ Create"}
                    </span>
                  </button>
                );
              })()}
            </div>
            <input
              id="tx-notes"
              type="text"
              value={txNote}
              onChange={(e) => {
                const val = e.target.value;
                setTxNote(val);
                const detected = detectCategoryFromNote(val, categories);
                if (detected?.categoryId) {
                  setTxCategoryId(detected.categoryId);
                }
              }}
              placeholder="e.g. Swiggy biryani, Uber trip, D-Mart..."
              className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={addTxMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-black text-xs uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
          >
            {addTxMutation.isPending ? "Logging…" : "Save Record"}
          </button>
        </form>
      </ResponsiveFormContainer>

      {/* Edit Budget Dialog Form */}
      <ResponsiveFormContainer
        open={isEditBudgetOpen}
        onOpenChange={setIsEditBudgetOpen}
        title="Edit Category Budget Cap"
        description="Update your monthly spending targets per category"
      >
        <form onSubmit={handleUpdateBudget} className="space-y-4 pt-1">
          <div className="space-y-1">
            <label htmlFor="budget-cat" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
              Select Category *
            </label>
            <NeobrutalistSelect
              value={selectedBudgetCategory}
              onChange={setSelectedBudgetCategory}
              options={categories
                .filter((c) => c.type === "expense")
                .map((c) => ({
                  value: c.id,
                  label: c.name,
                  icon: c.icon,
                }))}
              placeholder="Select Category"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="budget-amount" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
              New Budget Cap ({currencySymbol}) *
            </label>
            <input
              id="budget-amount"
              type="number"
              value={categoryBudgetAmount}
              onChange={(e) => setCategoryBudgetAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
              className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={updateCatMutation.isPending}
            className="w-full bg-[#F59E0B] hover:bg-[#d98206] text-white font-black text-xs uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
          >
            {updateCatMutation.isPending ? "Updating…" : "Save Cap"}
          </button>
        </form>
      </ResponsiveFormContainer>

      {/* Edit Transaction Dialog Form */}
      <ResponsiveFormContainer
        open={editingTx !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTx(null);
        }}
        title="Edit Transaction"
        description="Update transaction details"
      >
        <form onSubmit={handleUpdateTransaction} className="space-y-4 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">Type *</label>
            <div className="flex gap-2">
              {["expense", "income"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setEditTxType(t as any);
                    setEditTxCategoryId(categories.filter((c) => c.type === t)[0]?.id || "");
                  }}
                  className={cn(
                    "flex-1 py-2 rounded-2xl border-2 border-[#161514] text-xs font-black transition-all uppercase tracking-wider cursor-pointer shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]",
                    editTxType === t
                      ? "bg-[#161514] text-white"
                      : "bg-white text-[#161514]/70 hover:bg-[#FAF8F5]"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="edit-tx-amount" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Amount ({currencySymbol}) *
              </label>
              <input
                id="edit-tx-amount"
                type="number"
                step="0.01"
                value={editTxAmount}
                onChange={(e) => setEditTxAmount(e.target.value)}
                placeholder="e.g. 250"
                required
                className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="edit-tx-cat" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Category *
              </label>
              <NeobrutalistSelect
                value={editTxCategoryId}
                onChange={setEditTxCategoryId}
                options={categories
                  .filter((c) => c.type === editTxType)
                  .map((c) => ({
                    value: c.id,
                    label: c.name,
                    icon: c.icon,
                  }))}
                placeholder="Select Category"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="edit-tx-date" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Date *
              </label>
              <input
                id="edit-tx-date"
                type="date"
                value={editTxDate}
                onChange={(e) => setEditTxDate(e.target.value)}
                required
                className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-3 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="edit-tx-pm" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Payment Method *
              </label>
              <NeobrutalistSelect
                value={editTxPaymentMethod}
                onChange={setEditTxPaymentMethod}
                options={[
                  { value: "upi", label: "UPI / GPay / PhonePe", icon: "📱" },
                  { value: "cash", label: "Cash", icon: "💵" },
                  { value: "card", label: "Debit/Credit Card", icon: "💳" },
                  { value: "bank", label: "Bank Transfer", icon: "🏦" },
                ]}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-tx-notes" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
              Notes (optional)
            </label>
            <input
              id="edit-tx-notes"
              type="text"
              value={editTxNote}
              onChange={(e) => setEditTxNote(e.target.value)}
              placeholder="e.g. bought grocery, coffee..."
              className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={updateTxMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-black text-xs uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
          >
            {updateTxMutation.isPending ? "Updating…" : "Save Changes"}
          </button>
        </form>
      </ResponsiveFormContainer>

      <DeleteConfirmationModal
        open={deleteTxId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTxId(null);
        }}
        onConfirm={async () => {
          if (deleteTxId) {
            try {
              await deleteTxMutation.mutateAsync(deleteTxId);
              toast.success("Transaction removed");
            } catch {
              toast.error("Failed to delete transaction");
            }
            setDeleteTxId(null);
          }
        }}
        title="Delete Transaction"
        description="Are you sure you want to delete this log? This cannot be undone."
      />

      {/* Add Category Choice Modal */}
      <TemplateSelectionModal
        open={isChoiceOpen}
        onOpenChange={setIsChoiceOpen}
        title="ADD BUDGET CATEGORY"
        subtitle="START FROM SCRATCH OR APPLY A BUDGET PACK."
        blankLabel="BLANK CATEGORY"
        blankDesc="CUSTOM NAME, TYPE & MONTHLY BUDGET CAP"
        templatesLabel="BUDGET PACKS"
        templatesDesc="50/30/20 RULE, STUDENT BUDGET, TECH..."
        templatePacks={BUDGET_CATEGORY_TEMPLATE_PACKS}
        appliedPackIds={appliedCategoryTemplatePackIds}
        onSelectBlank={() => setIsAddCatOpen(true)}
        onApplyTemplatePack={handleApplyCategoryPack}
        onUnapplyTemplatePack={handleUnapplyCategoryPack}
      />

      {/* Add Category Dialog Form */}
      <ResponsiveFormContainer
        open={isAddCatOpen}
        onOpenChange={setIsAddCatOpen}
        title="Add Money Category"
        description="Create a custom category for income or expense tracking"
      >
        <form onSubmit={handleAddCategorySubmit} className="space-y-4 pt-1">
          <div className="space-y-1">
            <label htmlFor="cat-name" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
              Category Name *
            </label>
            <input
              id="cat-name"
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Groceries, Investments, Dining..."
              required
              className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Category Type *
              </label>
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as any)}
                className="w-full bg-white rounded-2xl border-2 border-[#161514] px-3 py-2.5 text-xs sm:text-sm font-black text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all cursor-pointer"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="cat-icon" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Icon / Emoji
              </label>
              <input
                id="cat-icon"
                type="text"
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                placeholder="e.g. 🛒, ☕, 💼"
                className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
              />
              <div className="flex flex-wrap gap-1.5 pt-1.5 max-h-24 overflow-y-auto">
                {PRESET_CATEGORY_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewCatIcon(emoji)}
                    className={cn(
                      "h-7 w-7 text-xs rounded-xl border-2 border-[#161514] flex items-center justify-center transition-all cursor-pointer shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5",
                      newCatIcon === emoji ? "bg-[#CEF431] scale-110 font-bold" : "bg-white hover:bg-amber-100"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {newCatType === "expense" && (
            <div className="space-y-1">
              <label htmlFor="cat-budget" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Monthly Budget Cap ({currencySymbol})
              </label>
              <input
                id="cat-budget"
                type="number"
                value={newCatMonthlyBudget}
                onChange={(e) => setNewCatMonthlyBudget(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514] block">
              Select Color Accent
            </label>
            <div className="flex flex-wrap gap-2.5">
              {CATEGORY_COLOR_PALETTE.map((c) => {
                const isSelected = newCatColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNewCatColor(c.id)}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] cursor-pointer flex items-center justify-center",
                      isSelected ? "scale-110 ring-4 ring-[#161514] ring-offset-2" : "hover:scale-105"
                    )}
                  >
                    {isSelected && <span className="text-white text-xs font-black drop-shadow">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={addCatMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-black text-xs uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
          >
            {addCatMutation.isPending ? "Adding…" : "Create Category"}
          </button>
        </form>
      </ResponsiveFormContainer>

      {/* Edit Category Dialog Form */}
      <ResponsiveFormContainer
        open={editingCat !== null}
        onOpenChange={(open) => {
          if (!open) setEditingCat(null);
        }}
        title="Edit Category"
        description="Update category attributes or budget limits"
      >
        <form onSubmit={handleUpdateCategorySubmit} className="space-y-4 pt-1">
          <div className="space-y-1">
            <label htmlFor="edit-cat-name" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
              Category Name *
            </label>
            <input
              id="edit-cat-name"
              type="text"
              value={editCatName}
              onChange={(e) => setEditCatName(e.target.value)}
              placeholder="e.g. Groceries, Travel..."
              required
              className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Category Type *
              </label>
              <select
                value={editCatType}
                onChange={(e) => setEditCatType(e.target.value as any)}
                className="w-full bg-white rounded-2xl border-2 border-[#161514] px-3 py-2.5 text-xs sm:text-sm font-black text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all cursor-pointer"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="edit-cat-icon" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Icon / Emoji
              </label>
              <input
                id="edit-cat-icon"
                type="text"
                value={editCatIcon}
                onChange={(e) => setEditCatIcon(e.target.value)}
                placeholder="e.g. 🛒, ☕, 💼"
                className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
              />
              <div className="flex flex-wrap gap-1.5 pt-1.5 max-h-24 overflow-y-auto">
                {PRESET_CATEGORY_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setEditCatIcon(emoji)}
                    className={cn(
                      "h-7 w-7 text-xs rounded-xl border-2 border-[#161514] flex items-center justify-center transition-all cursor-pointer shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5",
                      editCatIcon === emoji ? "bg-[#CEF431] scale-110 font-bold" : "bg-white hover:bg-amber-100"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {editCatType === "expense" && (
            <div className="space-y-1">
              <label htmlFor="edit-cat-budget" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Monthly Budget Cap ({currencySymbol})
              </label>
              <input
                id="edit-cat-budget"
                type="number"
                value={editCatMonthlyBudget}
                onChange={(e) => setEditCatMonthlyBudget(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514] block">
              Select Color Accent
            </label>
            <div className="flex flex-wrap gap-2.5">
              {CATEGORY_COLOR_PALETTE.map((c) => {
                const isSelected = editCatColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setEditCatColor(c.id)}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] cursor-pointer flex items-center justify-center",
                      isSelected ? "scale-110 ring-4 ring-[#161514] ring-offset-2" : "hover:scale-105"
                    )}
                  >
                    {isSelected && <span className="text-white text-xs font-black drop-shadow">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={updateCatMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-black text-xs uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
          >
            {updateCatMutation.isPending ? "Updating…" : "Save Changes"}
          </button>
        </form>
      </ResponsiveFormContainer>

      {/* Move Money (Transfer) Modal */}
      <ResponsiveFormContainer
        open={isMoveMoneyOpen}
        onOpenChange={setIsMoveMoneyOpen}
        title="Move Funds / Transfer"
        description="Transfer money between category wallets or accounts"
      >
        <form onSubmit={handleMoveMoneySubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="move-from" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                From Category / Source *
              </label>
              <NeobrutalistSelect
                value={moveFromCatId}
                onChange={setMoveFromCatId}
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                  icon: c.icon,
                }))}
                placeholder="Select Source"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="move-to" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                To Category / Destination *
              </label>
              <NeobrutalistSelect
                value={moveToCatId}
                onChange={setMoveToCatId}
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                  icon: c.icon,
                }))}
                placeholder="Select Destination"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="move-amount" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
              Transfer Amount ({currencySymbol}) *
            </label>
            <input
              id="move-amount"
              type="number"
              step="0.01"
              value={moveAmount}
              onChange={(e) => setMoveAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="move-note" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
              Transfer Note / Reason
            </label>
            <input
              id="move-note"
              type="text"
              value={moveNote}
              onChange={(e) => setMoveNote(e.target.value)}
              placeholder="e.g. Monthly SIP re-allocation, Savings transfer"
              className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-400 hover:bg-amber-500 text-navy-950 font-black text-xs uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <span>Execute Transfer</span>
          </button>
        </form>
      </ResponsiveFormContainer>

      {/* Send Money Modal */}
      <ResponsiveFormContainer
        open={isSendMoneyOpen}
        onOpenChange={setIsSendMoneyOpen}
        title="Send Money / Log Payout"
        description="Log an instant payment to a person, merchant, or service"
      >
        <form onSubmit={handleSendMoneySubmit} className="space-y-4 pt-1">
          <div className="space-y-1">
            <label htmlFor="send-payee" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
              Recipient / Payee Name *
            </label>
            <input
              id="send-payee"
              type="text"
              value={sendRecipient}
              onChange={(e) => setSendRecipient(e.target.value)}
              placeholder="e.g. Khushi, Landlord, Swiggy, Gym..."
              required
              className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="send-amount" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Amount ({currencySymbol}) *
              </label>
              <input
                id="send-amount"
                type="number"
                step="0.01"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="send-method" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
                Payment Method
              </label>
              <NeobrutalistSelect
                value={sendPaymentMethod}
                onChange={setSendPaymentMethod}
                options={[
                  { value: "UPI", label: "UPI / GPay / PhonePe", icon: "📱" },
                  { value: "Bank Transfer", label: "Bank Transfer / IMPS", icon: "🏦" },
                  { value: "Cash", label: "Cash", icon: "💵" },
                  { value: "Credit/Debit Card", label: "Credit / Debit Card", icon: "💳" },
                ]}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="send-cat" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
              Expense Category *
            </label>
            <NeobrutalistSelect
              value={sendCatId}
              onChange={setSendCatId}
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
                icon: c.icon,
              }))}
              placeholder="Select Category"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="send-note" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
              Note / Reference
            </label>
            <input
              id="send-note"
              type="text"
              value={sendNote}
              onChange={(e) => setSendNote(e.target.value)}
              placeholder="e.g. Dinner split, Monthly rent, Grocery bill"
              className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-black text-xs uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <span>Confirm & Send Payout</span>
          </button>
        </form>
      </ResponsiveFormContainer>

      {/* Transaction Inspector Modal (Feature 3) */}
      <ResponsiveFormContainer
        open={inspectingTx !== null}
        onOpenChange={(open) => {
          if (!open) setInspectingTx(null);
        }}
        title="TRANSACTION INSPECTOR"
        description="Detailed record breakdown and quick action suite"
      >
        {inspectingTx && (() => {
          const cat = categories.find((c) => c.id === inspectingTx.categoryId);
          const isIncome = inspectingTx.type === "income";
          return (
            <div className="space-y-4 pt-1">
              {/* Highlight Amount Banner */}
              <div className={cn(
                "p-4 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] text-center space-y-1",
                isIncome ? "bg-[#03D26F]/20" : "bg-rose-100"
              )}>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70">
                  {isIncome ? "INCOME RECEIVED 🟢" : "EXPENSE SPENT 🔻"}
                </span>
                <h3 className={cn("text-2xl sm:text-3xl font-black tracking-tight", isIncome ? "text-[#03D26F]" : "text-rose-600")}>
                  {isIncome ? "+" : "-"}{currencySymbol}{inspectingTx.amount?.toLocaleString()}
                </h3>
              </div>

              {/* Transaction Metadata Grid */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] space-y-2.5 text-xs font-bold text-[#161514]">
                <div className="flex justify-between items-center pb-2 border-b border-[#161514]/10">
                  <span className="text-[#161514]/60 font-black uppercase text-[10px]">Category</span>
                  <span className="flex items-center gap-1.5 font-black">
                    <span>{renderCategoryEmoji(cat?.icon)}</span>
                    {cat?.name || "Uncategorized"}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#161514]/10">
                  <span className="text-[#161514]/60 font-black uppercase text-[10px]">Payment Method</span>
                  <span className="capitalize font-black px-2 py-0.5 rounded-lg bg-amber-200 border border-[#161514]">
                    {inspectingTx.paymentMethod || "UPI"}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#161514]/10">
                  <span className="text-[#161514]/60 font-black uppercase text-[10px]">Logged Date</span>
                  <span className="font-black">
                    {inspectingTx.date ? format(parseLocalDate(inspectingTx.date), "MMMM d, yyyy (EEEE)") : "Today"}
                  </span>
                </div>
                {inspectingTx.note && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#161514]/60 font-black uppercase text-[10px]">Note / Memo</span>
                    <span className="font-black italic text-right max-w-[200px] truncate">{inspectingTx.note}</span>
                  </div>
                )}
              </div>

              {/* Actions Grid: Duplicate, Edit, Delete */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleDuplicateTx(inspectingTx)}
                  className="w-full bg-[#CEF431] hover:bg-[#bce028] text-[#161514] font-black text-xs uppercase tracking-wider py-2.5 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <Copy className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Duplicate</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const txToEdit = inspectingTx;
                    setInspectingTx(null);
                    handleOpenEditTxModal(txToEdit);
                  }}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-[#161514] font-black text-xs uppercase tracking-wider py-2.5 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const txIdToDelete = inspectingTx.id;
                    setInspectingTx(null);
                    setDeleteTxId(txIdToDelete);
                  }}
                  className="w-full bg-rose-400 hover:bg-rose-500 text-[#161514] font-black text-xs uppercase tracking-wider py-2.5 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })()}
      </ResponsiveFormContainer>

      {/* Delete Category Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteCatId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteCatId(null);
        }}
        onConfirm={async () => {
          if (deleteCatId) {
            try {
              await deleteCatMutation.mutateAsync(deleteCatId);
              toast.success("Category deleted 🗑️");
            } catch {
              toast.error("Failed to delete category");
            }
            setDeleteCatId(null);
          }
        }}
        title="Delete Category"
        description="Are you sure you want to delete this money category? Existing transaction logs in this category will remain, but will show as uncategorized."
      />
      {/* PDF Export Modal */}
      <PDFExportModal
        open={isPDFExportOpen}
        onOpenChange={setIsPDFExportOpen}
        transactions={transactions}
        categories={categories}
        currentMonthKey={ledgerMonthFilter}
        currencySymbol={currencySymbol}
        userName={user?.displayName || "Invictus Explorer"}
      />

      {/* Monthly Budget Allowance Setup Modal */}
      <ResponsiveFormContainer
        open={isBudgetModalOpen}
        onOpenChange={setIsBudgetModalOpen}
        title="Set Monthly Budget Allowance"
        description="Your base monthly income/budget from which daily expenses are deducted"
      >
        <form onSubmit={handleSaveMonthlyBudget} className="space-y-4 pt-1">
          <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-navy-600 block">
              How Monthly Budget Works
            </span>
            <p className="text-xs text-navy-800 font-medium leading-relaxed">
              If you set your budget to <strong>{currencySymbol}9,000</strong>, all daily expenses will be deducted from it. If you spend <strong>{currencySymbol}8,000</strong>, the remaining <strong>{currencySymbol}1,000</strong> rolls over to give you <strong>{currencySymbol}10,000</strong> next month! 🚀
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="budget-input" className="text-xs font-black uppercase tracking-wider text-[#161514] block">
              Base Monthly Budget Amount ({currencySymbol}) *
            </label>
            <input
              id="budget-input"
              type="number"
              min="100"
              step="50"
              value={tempBudgetInput}
              onChange={(e) => setTempBudgetInput(e.target.value)}
              placeholder="e.g. 9000, 15000, 50000"
              required
              className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-3 text-sm font-black text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[5000, 9000, 15000, 25000, 50000, 100000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTempBudgetInput(String(preset))}
                className="py-1.5 rounded-xl bg-white hover:bg-[#CEF431] text-[#161514] font-black text-xs border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
              >
                {currencySymbol}{preset.toLocaleString()}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-[#CEF431] hover:bg-[#03D26F] text-[#161514] font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>Save Monthly Budget Target 🎯</span>
          </button>
        </form>
      </ResponsiveFormContainer>
    </div>
  );
}

export default function MoneyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream-bg">
        <div className="h-8 w-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
      </div>
    }>
      <MoneyPageContent />
    </Suspense>
  );
}
