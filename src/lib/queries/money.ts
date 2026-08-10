import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/shared/AuthProvider";
import { type Category, type Transaction } from "@/types";

import { getCustomSession } from "@/lib/custom-auth";

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
  { id: "cat-salary", name: "Salary", type: "income", icon: "DollarSign", color: "mint", archived: false },
  { id: "cat-freelance", name: "Freelance", type: "income", icon: "Briefcase", color: "amber", archived: false },
  { id: "cat-food", name: "Food", type: "expense", icon: "Coffee", color: "coral", monthlyBudget: 5000, archived: false },
  { id: "cat-rent", name: "Rent", type: "expense", icon: "Home", color: "lavender", monthlyBudget: 15000, archived: false },
  { id: "cat-transport", name: "Transport", type: "expense", icon: "Compass", color: "orange", monthlyBudget: 2000, archived: false },
  { id: "cat-leisure", name: "Leisure", type: "expense", icon: "Smile", color: "amber", monthlyBudget: 3000, archived: false },
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
        // Seed default categories on MongoDB first load
        for (const cat of DEFAULT_CATEGORIES) {
          await fetch("/api/money/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, ...cat }),
          });
        }
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
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_categories");
        const list = local ? JSON.parse(local) : [...DEFAULT_CATEGORIES];
        const filtered = list.filter((c: any) => c.id !== categoryId);
        localStorage.setItem("invictus_categories", JSON.stringify(filtered));
        return categoryId;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch(`/api/money/categories?id=${categoryId}&userId=${user.uid}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete category from MongoDB");
      return categoryId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", user?.uid] });
    },
  });
}

// --- TRANSACTIONS (MongoDB Atlas Connected) ---

export function useTransactions() {
  const { user } = useAuth();

  return useQuery<Transaction[]>({
    queryKey: ["transactions", user?.uid],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_transactions");
        return local ? JSON.parse(local) : [];
      }
      if (!user) return [];

      const res = await fetch(`/api/money/transactions?userId=${user.uid}`);
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((t: any) => ({ ...t, id: t.id || t._id }));
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useAddTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => {
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

      if (!user) throw new Error("Unauthenticated");
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch("/api/money/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: txId, userId: user.uid, ...transaction }),
      });

      if (!res.ok) throw new Error("Failed to save transaction to MongoDB");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.uid] });
    },
  });
}

export function useDeleteTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_transactions");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((t: any) => t.id !== transactionId);
        localStorage.setItem("invictus_transactions", JSON.stringify(filtered));
        return transactionId;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch(`/api/money/transactions?id=${transactionId}&userId=${user.uid}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete transaction from MongoDB");
      return transactionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.uid] });
    },
  });
}

export function useUpdateTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Partial<Transaction> & { id: string }) => {
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

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/money/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, ...transaction }),
      });

      if (!res.ok) throw new Error("Failed to update transaction in MongoDB");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.uid] });
    },
  });
}

// --- SAVINGS GOALS (MongoDB Atlas Connected) ---

export function useSavingsGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["savingsGoals", user?.uid],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_savings_goals");
        return local ? JSON.parse(local) : [];
      }
      if (!user) return [];

      const res = await fetch(`/api/money/savings?userId=${user.uid}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useAddSavingsGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: any) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_savings_goals");
        const list = local ? JSON.parse(local) : [];
        const newGoal = { ...goal, id: `sg_${Date.now()}` };
        list.push(newGoal);
        localStorage.setItem("invictus_savings_goals", JSON.stringify(list));
        return newGoal;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/money/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, ...goal }),
      });

      if (!res.ok) throw new Error("Failed to save savings goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsGoals", user?.uid] });
    },
  });
}

export function useUpdateSavingsGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: any) => {
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

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/money/savings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, ...goal }),
      });

      if (!res.ok) throw new Error("Failed to update savings goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsGoals", user?.uid] });
    },
  });
}

export function useDeleteSavingsGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_savings_goals");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((g: any) => g.id !== goalId);
        localStorage.setItem("invictus_savings_goals", JSON.stringify(filtered));
        return goalId;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch(`/api/money/savings?id=${goalId}&userId=${user.uid}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete savings goal");
      return goalId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsGoals", user?.uid] });
    },
  });
}

// --- SUBSCRIPTIONS (MongoDB Atlas Connected) ---

export function useSubscriptions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscriptions", user?.uid],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_subscriptions");
        return local ? JSON.parse(local) : [];
      }
      if (!user) return [];

      const res = await fetch(`/api/money/subscriptions?userId=${user.uid}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useAddSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sub: any) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_subscriptions");
        const list = local ? JSON.parse(local) : [];
        const newSub = { ...sub, id: `sub_${Date.now()}` };
        list.push(newSub);
        localStorage.setItem("invictus_subscriptions", JSON.stringify(list));
        return newSub;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/money/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, ...sub }),
      });

      if (!res.ok) throw new Error("Failed to add subscription");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", user?.uid] });
    },
  });
}

export function useDeleteSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subId: string) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_subscriptions");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((s: any) => s.id !== subId);
        localStorage.setItem("invictus_subscriptions", JSON.stringify(filtered));
        return subId;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch(`/api/money/subscriptions?id=${subId}&userId=${user.uid}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete subscription");
      return subId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", user?.uid] });
    },
  });
}

export function useUnapplySpendingTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const userId = getActiveUserId(user);
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_categories");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((c: any) => c.templatePackId !== "monthly-spending-template");
        localStorage.setItem("invictus_categories", JSON.stringify(filtered));
        return;
      }

      const res = await fetch(`/api/money/spending?userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to unapply monthly budget template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

