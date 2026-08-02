"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory, useTransactions, useAddTransaction, useDeleteTransaction, useUpdateTransaction } from "@/lib/queries/money";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { BUDGET_CATEGORY_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Plus, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight, Trash2, Edit3, PieChart as PieIcon, TrendingUp, ShieldAlert, Tag } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/components/shared/AuthProvider";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { SpaceHeroBanner } from "@/components/shared/SpaceHeroBanner";
import { MoneyQuickActionsAndCards } from "@/components/money/MoneyQuickActionsAndCards";
import { SubscriptionsTracker } from "@/components/money/SubscriptionsTracker";
import { SavingsGoals } from "@/components/money/SavingsGoals";
import { DraggableDashboardGrid } from "@/components/shared/DraggableDashboardGrid";
import { useCostOfLivingIndex } from "@/lib/queries/cost-of-living";
import { useApplyMonthlyBudgetTemplate } from "@/lib/queries/spending";
import { detectCategoryFromNote } from "@/lib/utils/merchant-categorizer";
import { Globe, Sparkles, Layers } from "lucide-react";
import { useSearchParams } from "next/navigation";

function MoneyPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "ledger");
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
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

  const handleApplyCategoryPack = (pack: TemplatePack) => {
    pack.items.forEach((item) => {
      addCatMutation.mutate({
        name: item.title,
        type: item.type === "Income" ? "income" : "expense",
        color: "orange",
        icon: "💳",
        monthlyBudget: item.amount || 500,
      });
    });
    toast.success(`Applied ${pack.name} budget pack!`);
  };

  // Edit Transaction states
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [editTxAmount, setEditTxAmount] = useState("");
  const [editTxType, setEditTxType] = useState<"income" | "expense">("expense");
  const [editTxCategoryId, setEditTxCategoryId] = useState("");
  const [editTxDate, setEditTxDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editTxNote, setEditTxNote] = useState("");
  const [editTxPaymentMethod, setEditTxPaymentMethod] = useState("upi");

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
    } catch {
      toast.error("Failed to update category");
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
        {/* Space Hero Banner */}
        <SpaceHeroBanner
          space="money"
          badgeText="💰 Money & Ledger Space"
          title="Track Finances. Build Wealth."
          subtitle="Budgets, income, and expenses overview."
          stats={[
            { label: "Net Balance", value: `${currencySymbol}${netBalance}`, icon: "💵" },
            { label: "Total Income", value: `${currencySymbol}${totalIncome}`, icon: "📈" },
            { label: "Total Expense", value: `${currencySymbol}${totalExpense}`, icon: "📉" },
          ]}
          actionButton={{
            label: "+ Add Transaction",
            onClick: () => {
              if (categories.length === 0) {
                toast.error("Loading categories...");
                return;
              }
              setTxCategoryId(categories.filter((c) => c.type === txType)[0]?.id || "");
              setIsAddTxOpen(true);
            },
          }}
        />

        {/* Draggable Money Widgets Grid */}
        <DraggableDashboardGrid
          storageKey="money"
          widgets={[
            {
              id: "category-wallets",
              title: "💳 Category Wallets & Accounts",
              component: (
                <MoneyQuickActionsAndCards
                  mainBalance={totalBalance}
                  currencySymbol={currencySymbol}
                  categories={categories.map((c) => ({
                    id: c.id,
                    name: c.name,
                    amount: transactions
                      .filter((t) => t.categoryId === c.id && t.type === "expense")
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
              ),
            },
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
          ]}
        />

        {/* Ledger Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-[0_8px_24px_rgba(31,36,48,0.04)] flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-mint-600/10 flex items-center justify-center text-mint-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Total Income</h5>
              <p className="text-xl font-extrabold text-navy-900 mt-0.5">{currencySymbol}{totalIncome.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-[0_8px_24px_rgba(31,36,48,0.04)] flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-coral-400/20 flex items-center justify-center text-coral-500">
              <ArrowDownRight className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Total Expense</h5>
              <p className="text-xl font-extrabold text-navy-900 mt-0.5">{currencySymbol}{totalExpense.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-[0_8px_24px_rgba(31,36,48,0.04)] flex items-center gap-4">
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", totalBalance >= 0 ? "bg-mint-600/10 text-mint-600" : "bg-coral-400/20 text-coral-500")}>
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Net Balance</h5>
              <p className="text-xl font-extrabold text-navy-900 mt-0.5">{currencySymbol}{totalBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white rounded-full p-1 border border-border shadow-sm flex w-full max-w-[400px] mb-6">
            <TabsTrigger value="ledger" className="flex-1 rounded-full text-xs font-bold py-2 data-state=active:bg-navy-900 data-state=active:text-white transition-all cursor-pointer">
              Ledger
            </TabsTrigger>
            <TabsTrigger value="budgets" className="flex-1 rounded-full text-xs font-bold py-2 data-state=active:bg-navy-900 data-state=active:text-white transition-all cursor-pointer">
              Budgets
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 rounded-full text-xs font-bold py-2 data-state=active:bg-navy-900 data-state=active:text-white transition-all cursor-pointer">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Ledger Tab */}
          <TabsContent value="ledger">
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
            ) : (
              <div className="bg-white rounded-[var(--radius-lg)] shadow-[0_8px_24px_rgba(31,36,48,0.04)] border divide-y divide-border overflow-hidden">
                {transactions.map((tx) => {
                  const category = categories.find((c) => c.id === tx.categoryId);
                  return (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-cream-bg/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", tx.type === "income" ? "bg-mint-600/10 text-mint-600" : "bg-coral-400/20 text-coral-500")}>
                          {tx.type === "income" ? <ArrowUpRight className="h-4.5 w-4.5" /> : <ArrowDownRight className="h-4.5 w-4.5" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-navy-900 flex items-center gap-1.5">
                            {category?.name || "Uncategorized"}
                            {tx.note && <span className="text-[10px] text-navy-600 font-semibold truncate max-w-[120px]">- {tx.note}</span>}
                          </h4>
                          <span className="text-[9px] font-bold text-navy-600/70 uppercase tracking-wide">
                            {tx.date} • {tx.paymentMethod}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className={cn("text-sm font-extrabold", tx.type === "income" ? "text-mint-600" : "text-navy-900")}>
                          {tx.type === "income" ? "+" : "-"}{currencySymbol}{tx.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={() => {
                            setEditingTx(tx);
                            setEditTxAmount(String(tx.amount));
                            setEditTxType(tx.type);
                            setEditTxCategoryId(tx.categoryId);
                            setEditTxDate(tx.date);
                            setEditTxNote(tx.note || "");
                            setEditTxPaymentMethod(tx.paymentMethod || "upi");
                          }}
                          className="text-navy-600 hover:text-navy-900 transition-colors p-1 cursor-pointer outline-none border-none bg-transparent"
                          title="Edit transaction"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="text-navy-600 hover:text-danger transition-colors p-1 cursor-pointer outline-none border-none bg-transparent"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-navy-600" style={{ fontFamily: "var(--font-heading)" }}>
                  Monthly Budget Status
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
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full bg-cream-bg rounded-xl border-2 border-navy-950 px-3 py-1.5 text-xs font-black text-navy-950 outline-none"
                    >
                      {(costOfLivingData?.countries || []).map((c: any) => (
                        <option key={c.country} value={c.country}>
                          {c.country}
                        </option>
                      ))}
                    </select>
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
                  className="bg-navy-950 hover:bg-navy-900 text-white font-black text-xs uppercase px-4 py-2.5 rounded-2xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0 transition-all"
                >
                  {applyTemplateMutation.isPending ? "Applying..." : "⚡ LOAD TEMPLATE"}
                </button>
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
                                <span>{c.icon || "💳"}</span> {c.name}
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

          {/* Analytics Tab */}
          <TabsContent value="analytics">
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
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-navy-600">Type</label>
            <div className="flex gap-2">
              {["expense", "income"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTxType(t as any);
                    // Reset category select based on type
                    setTxCategoryId(categories.filter((c) => c.type === t)[0]?.id || "");
                  }}
                  className={cn(
                    "flex-1 py-1.5 rounded-[var(--radius-sm)] border text-xs font-bold transition-all capitalize cursor-pointer",
                    txType === t
                      ? "bg-navy-900 text-white border-navy-900"
                      : "bg-cream-bg/30 text-navy-600 border-input hover:bg-cream-bg/50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="tx-amount" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Amount ({currencySymbol})
              </label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="e.g. 250"
                required
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-mint-600 transition-all text-navy-900"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="tx-cat" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Category
              </label>
              <select
                id="tx-cat"
                value={txCategoryId}
                onChange={(e) => setTxCategoryId(e.target.value)}
                required
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-mint-600 transition-all text-navy-900"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="tx-date" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Date
              </label>
              <input
                id="tx-date"
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                required
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-mint-600 transition-all text-navy-900"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="tx-pm" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Method
              </label>
              <select
                id="tx-pm"
                value={txPaymentMethod}
                onChange={(e) => setTxPaymentMethod(e.target.value)}
                required
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-mint-600 transition-all text-navy-900"
              >
                <option value="upi">UPI / GPay</option>
                <option value="cash">Cash</option>
                <option value="card">Debit/Credit Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label htmlFor="tx-notes" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Notes (optional)
              </label>
              {detectCategoryFromNote(txNote, categories) && (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-300 animate-pulse">
                  <span>{detectCategoryFromNote(txNote, categories)?.icon}</span>
                  Auto-Matched: {detectCategoryFromNote(txNote, categories)?.categoryName}
                </span>
              )}
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
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-mint-600 transition-all text-navy-900"
            />
          </div>

          <Button
            type="submit"
            disabled={addTxMutation.isPending}
            className="w-full bg-mint-600 hover:bg-mint-700 text-white font-bold rounded-full py-2.5 shadow-sm border-none cursor-pointer"
          >
            {addTxMutation.isPending ? "Logging…" : "Save Record"}
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Edit Budget Dialog Form */}
      <ResponsiveFormContainer
        open={isEditBudgetOpen}
        onOpenChange={setIsEditBudgetOpen}
        title="Edit Category Budget Cap"
        description="Update your monthly spending targets per category"
      >
        <form onSubmit={handleUpdateBudget} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="budget-cat" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Select Category
            </label>
            <select
              id="budget-cat"
              value={selectedBudgetCategory}
              onChange={(e) => setSelectedBudgetCategory(e.target.value)}
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900"
            >
              {categories.filter((c) => c.type === "expense").map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="budget-amount" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              New Budget Cap ({currencySymbol})
            </label>
            <input
              id="budget-amount"
              type="number"
              value={categoryBudgetAmount}
              onChange={(e) => setCategoryBudgetAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900"
            />
          </div>

          <Button
            type="submit"
            disabled={updateCatMutation.isPending}
            className="w-full bg-mint-600 hover:bg-mint-700 text-white font-bold rounded-full py-2.5 shadow-sm border-none cursor-pointer"
          >
            {updateCatMutation.isPending ? "Updating…" : "Save Cap"}
          </Button>
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
        <form onSubmit={handleUpdateTransaction} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-navy-600">Type</label>
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
                    "flex-1 py-1.5 rounded-[var(--radius-sm)] border text-xs font-bold transition-all capitalize cursor-pointer",
                    editTxType === t
                      ? "bg-navy-900 text-white border-navy-900"
                      : "bg-cream-bg/30 text-navy-600 border-input hover:bg-cream-bg/50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="edit-tx-amount" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Amount ({currencySymbol})
              </label>
              <input
                id="edit-tx-amount"
                type="number"
                step="0.01"
                value={editTxAmount}
                onChange={(e) => setEditTxAmount(e.target.value)}
                placeholder="e.g. 250"
                required
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="edit-tx-cat" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Category
              </label>
              <select
                id="edit-tx-cat"
                value={editTxCategoryId}
                onChange={(e) => setEditTxCategoryId(e.target.value)}
                required
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900"
              >
                {categories.filter((c) => c.type === editTxType).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="edit-tx-date" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Date
              </label>
              <input
                id="edit-tx-date"
                type="date"
                value={editTxDate}
                onChange={(e) => setEditTxDate(e.target.value)}
                required
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2 px-3 text-sm outline-none text-navy-900"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="edit-tx-pm" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Method
              </label>
              <select
                id="edit-tx-pm"
                value={editTxPaymentMethod}
                onChange={(e) => setEditTxPaymentMethod(e.target.value)}
                required
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900"
              >
                <option value="upi">UPI / GPay</option>
                <option value="cash">Cash</option>
                <option value="card">Debit/Credit Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-tx-notes" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Notes (optional)
            </label>
            <input
              id="edit-tx-notes"
              type="text"
              value={editTxNote}
              onChange={(e) => setEditTxNote(e.target.value)}
              placeholder="e.g. bought grocery, coffee..."
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900"
            />
          </div>

          <Button
            type="submit"
            disabled={updateTxMutation.isPending}
            className="w-full bg-mint-600 hover:bg-mint-700 text-white font-bold rounded-full py-2.5 shadow-sm border-none cursor-pointer"
          >
            {updateTxMutation.isPending ? "Updating…" : "Save Changes"}
          </Button>
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
        onSelectBlank={() => setIsAddCatOpen(true)}
        onApplyTemplatePack={handleApplyCategoryPack}
      />

      {/* Add Category Dialog Form */}
      <ResponsiveFormContainer
        open={isAddCatOpen}
        onOpenChange={setIsAddCatOpen}
        title="Add Money Category"
        description="Create a custom category for income or expense tracking"
      >
        <form onSubmit={handleAddCategorySubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="cat-name" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Category Name
            </label>
            <input
              id="cat-name"
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Groceries, Investments, Dining..."
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-navy-900 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Category Type
              </label>
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as any)}
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-navy-900 font-medium"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="cat-icon" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Icon / Emoji
              </label>
              <input
                id="cat-icon"
                type="text"
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                placeholder="e.g. 🛒, ☕, 💼"
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-navy-900 font-medium"
              />
            </div>
          </div>

          {newCatType === "expense" && (
            <div className="space-y-1">
              <label htmlFor="cat-budget" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Monthly Budget Cap ({currencySymbol})
              </label>
              <input
                id="cat-budget"
                type="number"
                value={newCatMonthlyBudget}
                onChange={(e) => setNewCatMonthlyBudget(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-navy-900 font-medium"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-navy-600 block">
              Select Color
            </label>
            <div className="flex gap-3">
              {["orange", "amber", "mint", "lavender", "coral", "indigo"].map((c) => {
                const isSelected = newCatColor === c;
                const bgClass =
                  c === "amber"
                    ? "bg-amber-500"
                    : c === "orange"
                    ? "bg-orange-500"
                    : c === "mint"
                    ? "bg-mint-600"
                    : c === "lavender"
                    ? "bg-lavender-400"
                    : c === "coral"
                    ? "bg-coral-400"
                    : "bg-indigo-500";
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    className={`h-8 w-8 rounded-full transition-all border-2 border-transparent cursor-pointer ${bgClass} ${isSelected && "border-navy-900 scale-110"}`}
                  />
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            disabled={addCatMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full py-2.5 shadow-sm border-none cursor-pointer"
          >
            {addCatMutation.isPending ? "Adding…" : "Create Category"}
          </Button>
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
        <form onSubmit={handleUpdateCategorySubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="edit-cat-name" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Category Name
            </label>
            <input
              id="edit-cat-name"
              type="text"
              value={editCatName}
              onChange={(e) => setEditCatName(e.target.value)}
              placeholder="e.g. Groceries, Travel..."
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-navy-900 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Category Type
              </label>
              <select
                value={editCatType}
                onChange={(e) => setEditCatType(e.target.value as any)}
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-navy-900 font-medium"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="edit-cat-icon" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Icon / Emoji
              </label>
              <input
                id="edit-cat-icon"
                type="text"
                value={editCatIcon}
                onChange={(e) => setEditCatIcon(e.target.value)}
                placeholder="e.g. 🛒, ☕, 💼"
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-navy-900 font-medium"
              />
            </div>
          </div>

          {editCatType === "expense" && (
            <div className="space-y-1">
              <label htmlFor="edit-cat-budget" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Monthly Budget Cap ({currencySymbol})
              </label>
              <input
                id="edit-cat-budget"
                type="number"
                value={editCatMonthlyBudget}
                onChange={(e) => setEditCatMonthlyBudget(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-navy-900 font-medium"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-navy-600 block">
              Select Color
            </label>
            <div className="flex gap-3">
              {["orange", "amber", "mint", "lavender", "coral", "indigo"].map((c) => {
                const isSelected = editCatColor === c;
                const bgClass =
                  c === "amber"
                    ? "bg-amber-500"
                    : c === "orange"
                    ? "bg-orange-500"
                    : c === "mint"
                    ? "bg-mint-600"
                    : c === "lavender"
                    ? "bg-lavender-400"
                    : c === "coral"
                    ? "bg-coral-400"
                    : "bg-indigo-500";
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditCatColor(c)}
                    className={`h-8 w-8 rounded-full transition-all border-2 border-transparent cursor-pointer ${bgClass} ${isSelected && "border-navy-900 scale-110"}`}
                  />
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            disabled={updateCatMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full py-2.5 shadow-sm border-none cursor-pointer"
          >
            {updateCatMutation.isPending ? "Updating…" : "Save Changes"}
          </Button>
        </form>
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
