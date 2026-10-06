import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/shared/AuthProvider";
import { type Category, type Transaction, type Debt } from "@/types";
import { getCustomSession } from "@/lib/custom-auth";
import { executeOfflineMutation } from "@/lib/offline/offline-mutation";

const isGuestMode = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("invictus_guest_mode") === "true";
};

const getActiveUserId = (user: any) => {
  if (user?.uid) return user.uid;
  if (typeof window !== "undefined") {
    const session = getCustomSession();
    if (session?.uid) return session.uid;
  }
  return "user-admin-default";
};

const DEFAULT_CATEGORIES: Category[] = [
  // Income Streams
  { id: "cat-salary", name: "Salary", type: "income", icon: "DollarSign", color: "mint", archived: false },
  { id: "cat-freelance", name: "Freelance", type: "income", icon: "Briefcase", color: "amber", archived: false },
  { id: "cat-allowance", name: "Allowance", type: "income", icon: "PiggyBank", color: "lime", archived: false },

  // Everyday Core Expenses
  { id: "cat-food", name: "Food & Dining", type: "expense", icon: "Coffee", color: "coral", monthlyBudget: 5000, archived: false },
  { id: "cat-groceries", name: "Groceries", type: "expense", icon: "ShoppingBag", color: "mint", monthlyBudget: 3000, archived: false },
  { id: "cat-rent", name: "Rent & Housing", type: "expense", icon: "Home", color: "lavender", monthlyBudget: 15000, archived: false },
  { id: "cat-transport", name: "Transport & Commute", type: "expense", icon: "Compass", color: "orange", monthlyBudget: 2000, archived: false },
  { id: "cat-shopping", name: "Shopping", type: "expense", icon: "Tag", color: "amber", monthlyBudget: 3000, archived: false },
  { id: "cat-education", name: "Books & Tuition", type: "expense", icon: "BookOpen", color: "indigo", monthlyBudget: 2500, archived: false },
  { id: "cat-health", name: "Healthcare & Gym", type: "expense", icon: "HeartPulse", color: "rose", monthlyBudget: 2000, archived: false },
  { id: "cat-leisure", name: "Leisure & Fun", type: "expense", icon: "Smile", color: "lime", monthlyBudget: 2500, archived: false },
  { id: "cat-bills", name: "Bills & Utilities", type: "expense", icon: "Zap", color: "sky", monthlyBudget: 1500, archived: false },
];

// --- CATEGORIES (MongoDB Atlas Connected) ---

export function useCategories() {
  const { user } = useAuth();
  const userId = getActiveUserId(user);

  return useQuery<Category[]>({
    queryKey: ["categories", userId],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_categories");
        if (!local) {
          localStorage.setItem("invictus_categories", JSON.stringify(DEFAULT_CATEGORIES));
          return DEFAULT_CATEGORIES;
        }
        const parsed = JSON.parse(local).filter((c: any) => !c.archived);
        return parsed.map((c: any, idx: number) => ({
          ...c,
          color: c.color || ["orange", "amber", "mint", "lavender", "coral", "indigo"][idx % 6],
        }));
      }

      const res = await fetch(`/api/money/categories?userId=${userId}`);
      if (!res.ok) return [];
      const list = await res.json();
      if (list.length === 0) {
        // Seed default categories on MongoDB first load (in parallel)
        await Promise.allSettled(
          DEFAULT_CATEGORIES.map((cat) =>
            fetch("/api/money/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, ...cat }),
            })
          )
        );
        return DEFAULT_CATEGORIES;
      }
      return list.map((c: any, idx: number) => ({
        ...c,
        id: c.id || c._id,
        color: c.color || ["orange", "amber", "mint", "lavender", "coral", "indigo"][idx % 6],
      }));
    },
    enabled: true,
  });
}

export function useAddCategory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<Category, "id" | "archived" | "createdAt">) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_categories");
        const list = local ? JSON.parse(local) : [...DEFAULT_CATEGORIES];
        const newCategory = {
          ...category,
          id: `cat-${Math.random().toString(36).substring(2, 9)}`,
          archived: false,
          createdAt: new Date().toISOString(),
        } as unknown as Category;
        list.push(newCategory);
        localStorage.setItem("invictus_categories", JSON.stringify(list));
        return newCategory;
      }

      const catId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch("/api/money/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: catId, userId, ...category }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add category to MongoDB");
      }
      return res.json();
    },
    onSuccess: (newCat) => {
      const userId = getActiveUserId(user);
      queryClient.setQueryData<Category[]>(["categories", userId], (old) => {
        if (!old) return [newCat];
        return [...old, newCat];
      });
      queryClient.invalidateQueries({ queryKey: ["categories", userId] });
    },
  });
}

export function useUpdateCategory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Partial<Category> & { id: string }) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_categories");
        const list = local ? JSON.parse(local) : [...DEFAULT_CATEGORIES];
        const idx = list.findIndex((c: any) => c.id === category.id);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...category };
          localStorage.setItem("invictus_categories", JSON.stringify(list));
        }
        return category;
      }

      const res = await fetch("/api/money/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...category }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update category in MongoDB");
      }
      return res.json();
    },
    onSuccess: (updatedCat) => {
      const userId = getActiveUserId(user);
      queryClient.setQueryData<Category[]>(["categories", userId], (old) => {
        if (!old) return [updatedCat as Category];
        return old.map((c) => (c.id === updatedCat.id ? { ...c, ...updatedCat } : c));
      });
      queryClient.invalidateQueries({ queryKey: ["categories", userId] });
    },
  });
}

export function useDeleteCategory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_categories");
        const list = local ? JSON.parse(local) : [...DEFAULT_CATEGORIES];
        const filtered = list.filter((c: any) => c.id !== categoryId);
        localStorage.setItem("invictus_categories", JSON.stringify(filtered));
        return categoryId;
      }

      if (!userId) throw new Error("Unauthenticated");
      const res = await fetch(`/api/money/categories?id=${categoryId}&userId=${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete category from MongoDB");
      return categoryId;
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["categories", userId] });
    },
  });
}

// --- TRANSACTIONS (MongoDB Atlas Connected) ---

export function useTransactions() {
  const { user } = useAuth();
  const userId = getActiveUserId(user);

  return useQuery<Transaction[]>({
    queryKey: ["transactions", userId],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_transactions");
        return local ? JSON.parse(local) : [];
      }
      if (!userId) return [];

      const res = await fetch(`/api/money/transactions?userId=${userId}`);
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((t: any) => ({ ...t, id: t.id || t._id }));
    },
    enabled: !!userId || isGuestMode(),
  });
}

export function useAddTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_transactions");
        const list = local ? JSON.parse(local) : [];
        const newTransaction = {
          ...transaction,
          id: Math.random().toString(36).substring(2, 9),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as unknown as Transaction;
        list.unshift(newTransaction);
        localStorage.setItem("invictus_transactions", JSON.stringify(list));
        return newTransaction;
      }

      if (!userId) throw new Error("Unauthenticated");

      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const txPayload = { id: txId, userId, ...transaction };

      return executeOfflineMutation(txPayload, {
        endpoint: "/api/money/transactions",
        method: "POST",
        type: "money",
        label: `Add ${transaction.type === "income" ? "Income" : "Expense"}: ₹${transaction.amount}`,
        getOptimisticResult: () => txPayload,
      });
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["categories", userId] });
    },
  });
}

export function useBulkAddTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactions: Array<{
      id?: string;
      amount: number;
      categoryId: string;
      date: string;
      note?: string;
      paymentMethod?: string;
      type?: "expense" | "income";
      isRecurring?: boolean;
    }>) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_transactions");
        const list = local ? JSON.parse(local) : [];
        const newTransactions = transactions.map((t, idx) => ({
          ...t,
          id: t.id || `tx_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        const updated = [...newTransactions, ...list];
        localStorage.setItem("invictus_transactions", JSON.stringify(updated));
        return { success: true, count: newTransactions.length, transactions: newTransactions };
      }

      if (!userId) throw new Error("Unauthenticated");

      const res = await fetch("/api/money/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, transactions }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to bulk add transactions");
      }

      return res.json();
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["categories", userId] });
    },
  });
}

export function useDeleteTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_transactions");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((t: any) => t.id !== transactionId);
        localStorage.setItem("invictus_transactions", JSON.stringify(filtered));
        return transactionId;
      }

      if (!userId) throw new Error("Unauthenticated");
      const res = await fetch(`/api/money/transactions?id=${transactionId}&userId=${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete transaction from MongoDB");
      return transactionId;
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["categories", userId] });
    },
  });
}

export function useUpdateTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Partial<Transaction> & { id: string }) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_transactions");
        const list = local ? JSON.parse(local) : [];
        const idx = list.findIndex((t: any) => t.id === transaction.id);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...transaction, updatedAt: new Date().toISOString() };
          localStorage.setItem("invictus_transactions", JSON.stringify(list));
        }
        return transaction;
      }

      if (!userId) throw new Error("Unauthenticated");
      const res = await fetch("/api/money/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...transaction }),
      });

      if (!res.ok) throw new Error("Failed to update transaction in MongoDB");
      return res.json();
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["categories", userId] });
    },
  });
}

// --- SAVINGS GOALS (MongoDB Atlas Connected) ---

export function useSavingsGoals() {
  const { user } = useAuth();
  const userId = getActiveUserId(user);

  return useQuery({
    queryKey: ["savingsGoals", userId],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_savings_goals");
        return local ? JSON.parse(local) : [];
      }
      if (!userId) return [];

      const res = await fetch(`/api/money/savings?userId=${userId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId || isGuestMode(),
  });
}

export function useAddSavingsGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: any) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_savings_goals");
        const list = local ? JSON.parse(local) : [];
        const newGoal = { ...goal, id: `sg_${Date.now()}` };
        list.push(newGoal);
        localStorage.setItem("invictus_savings_goals", JSON.stringify(list));
        return newGoal;
      }

      if (!userId) throw new Error("Unauthenticated");
      const res = await fetch("/api/money/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...goal }),
      });

      if (!res.ok) throw new Error("Failed to save savings goal");
      return res.json();
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["savingsGoals", userId] });
    },
  });
}

export function useUpdateSavingsGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: any) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_savings_goals");
        const list = local ? JSON.parse(local) : [];
        const idx = list.findIndex((g: any) => g.id === goal.id);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...goal };
          localStorage.setItem("invictus_savings_goals", JSON.stringify(list));
        }
        return goal;
      }

      if (!userId) throw new Error("Unauthenticated");
      const res = await fetch("/api/money/savings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...goal }),
      });

      if (!res.ok) throw new Error("Failed to update savings goal");
      return res.json();
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["savingsGoals", userId] });
    },
  });
}

export function useDeleteSavingsGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_savings_goals");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((g: any) => g.id !== goalId);
        localStorage.setItem("invictus_savings_goals", JSON.stringify(filtered));
        return goalId;
      }

      if (!userId) throw new Error("Unauthenticated");
      const res = await fetch(`/api/money/savings?id=${goalId}&userId=${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete savings goal");
      return goalId;
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["savingsGoals", userId] });
    },
  });
}

// --- SUBSCRIPTIONS (MongoDB Atlas Connected) ---

export function useSubscriptions() {
  const { user } = useAuth();
  const userId = getActiveUserId(user);

  return useQuery({
    queryKey: ["subscriptions", userId],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_subscriptions");
        return local ? JSON.parse(local) : [];
      }
      if (!userId) return [];

      const res = await fetch(`/api/money/subscriptions?userId=${userId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId || isGuestMode(),
  });
}

export function useAddSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sub: any) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_subscriptions");
        const list = local ? JSON.parse(local) : [];
        const newSub = { ...sub, id: `sub_${Date.now()}` };
        list.push(newSub);
        localStorage.setItem("invictus_subscriptions", JSON.stringify(list));
        return newSub;
      }

      if (!userId) throw new Error("Unauthenticated");
      const res = await fetch("/api/money/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...sub }),
      });

      if (!res.ok) throw new Error("Failed to add subscription");
      return res.json();
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["subscriptions", userId] });
    },
  });
}

export function useDeleteSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subId: string) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_subscriptions");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((s: any) => s.id !== subId);
        localStorage.setItem("invictus_subscriptions", JSON.stringify(filtered));
        return subId;
      }

      if (!userId) throw new Error("Unauthenticated");
      const res = await fetch(`/api/money/subscriptions?id=${subId}&userId=${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete subscription");
      return subId;
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["subscriptions", userId] });
    },
  });
}


// --- LENT & BORROWED DEBT LEDGER ---

export function useDebts() {
  const { user } = useAuth();
  const userId = getActiveUserId(user);

  return useQuery<Debt[]>({
    queryKey: ["debts", userId],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_debts");
        return local ? JSON.parse(local) : [];
      }
      const res = await fetch(`/api/money/debts?userId=${userId}`);
      if (!res.ok) return [];
      const data = await res.json();
      const debtsList = data.debts || [];
      if (typeof window !== "undefined") {
        localStorage.setItem("invictus_debts", JSON.stringify(debtsList));
      }
      return debtsList;
    },
    enabled: true,
  });
}

export function useAddDebt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newDebt: Omit<Debt, "id" | "userId" | "status" | "createdAt" | "updatedAt">) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_debts");
        const list = local ? JSON.parse(local) : [];
        const item: Debt = {
          id: `debt-${Date.now()}`,
          userId,
          ...newDebt,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        list.unshift(item);
        localStorage.setItem("invictus_debts", JSON.stringify(list));
        return item;
      }

      const debtPayload = { userId, ...newDebt };

      return executeOfflineMutation(debtPayload, {
        endpoint: "/api/money/debts",
        method: "POST",
        type: "money",
        label: `Record ${newDebt.type === "lent" ? "Lent to" : "Borrowed from"} ${newDebt.personName}`,
        getOptimisticResult: () => ({ id: `debt-${Date.now()}`, status: "pending", ...debtPayload }),
      });
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["debts", userId] });
    },
  });
}

export function useUpdateDebt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedDebt: Partial<Debt> & { id: string }) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_debts");
        const list = local ? JSON.parse(local) : [];
        const idx = list.findIndex((d: any) => d.id === updatedDebt.id);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...updatedDebt, updatedAt: new Date().toISOString() };
          localStorage.setItem("invictus_debts", JSON.stringify(list));
        }
        return updatedDebt;
      }

      const res = await fetch("/api/money/debts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDebt),
      });

      if (!res.ok) throw new Error("Failed to update debt record");
      const data = await res.json();
      return data.debt;
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["debts", userId] });
    },
  });
}

export function useSettleDebt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_debts");
        const list = local ? JSON.parse(local) : [];
        const idx = list.findIndex((d: any) => d.id === id);
        if (idx > -1) {
          list[idx].status = "settled";
          list[idx].settledAt = new Date().toISOString();
          localStorage.setItem("invictus_debts", JSON.stringify(list));
        }
        return list[idx];
      }

      const res = await fetch("/api/money/debts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "settled" }),
      });

      if (!res.ok) throw new Error("Failed to settle debt record");
      const data = await res.json();
      return data.debt;
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["debts", userId] });
      queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
    },
  });
}

export function useDeleteDebt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_debts");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((d: any) => d.id !== id);
        localStorage.setItem("invictus_debts", JSON.stringify(filtered));
        return;
      }

      const res = await fetch(`/api/money/debts?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete debt record");
      return res.json();
    },
    onSuccess: () => {
      const userId = getActiveUserId(user);
      queryClient.invalidateQueries({ queryKey: ["debts", userId] });
    },
  });
}

// --- CLOUD BUDGET PREFERENCES (Daily Budget Cap & Rollover Sync) ---

export interface BudgetPreferences {
  upiBudget: number;
  cashBudget: number;
  monthlyBudget: number;
  customDailyBudget: number | null;
  enableRollover: boolean;
  budgetViewMode: "monthly" | "daily";
  smsReaderEnabled: boolean;
}

export function useBudgetPreferences() {
  const { user } = useAuth();
  const userId = getActiveUserId(user);

  return useQuery<BudgetPreferences>({
    queryKey: ["budgetPreferences", userId],
    queryFn: async () => {
      const res = await fetch(`/api/money/budget?userId=${userId}`);
      if (!res.ok) {
        throw new Error("Failed to load budget preferences");
      }
      const data = await res.json();
      return data.budgetPreferences;
    },
    staleTime: 1000 * 60 * 5, // 5 mins cache
  });
}

export function useUpdateBudgetPreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = getActiveUserId(user);

  return useMutation({
    mutationFn: async (prefs: Partial<BudgetPreferences>) => {
      const res = await fetch("/api/money/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...prefs }),
      });
      if (!res.ok) throw new Error("Failed to save budget preferences");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["budgetPreferences", userId], data.budgetPreferences);
      queryClient.invalidateQueries({ queryKey: ["budgetPreferences"] });
    },
  });
}

