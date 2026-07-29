import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/shared/AuthProvider";

const isGuestMode = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("invictus_guest_mode") === "true";
};

// --- GYM ROUTINES & EXERCISES ---

export function useGymRoutines(dayOfWeek?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["gymRoutines", user?.uid, dayOfWeek],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_gym_routines");
        const list = local ? JSON.parse(local) : [];
        if (dayOfWeek) return list.filter((r: any) => r.dayOfWeek === dayOfWeek);
        return list;
      }
      if (!user) return [];

      const url = dayOfWeek
        ? `/api/gym/routines?userId=${user.uid}&dayOfWeek=${dayOfWeek}`
        : `/api/gym/routines?userId=${user.uid}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useAddGymRoutine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routine: any) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_gym_routines");
        const list = local ? JSON.parse(local) : [];
        const existingIdx = list.findIndex((r: any) => r.dayOfWeek === routine.dayOfWeek);
        let updated;
        if (existingIdx > -1) {
          list[existingIdx] = { ...list[existingIdx], ...routine };
          updated = list[existingIdx];
        } else {
          updated = { ...routine, id: `gr_${Date.now()}` };
          list.push(updated);
        }
        localStorage.setItem("invictus_gym_routines", JSON.stringify(list));
        return updated;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/gym/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, ...routine }),
      });

      if (!res.ok) throw new Error("Failed to save gym routine");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gymRoutines", user?.uid] });
    },
  });
}

export function useUpdateGymRoutine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routine: any) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_gym_routines");
        const list = local ? JSON.parse(local) : [];
        const idx = list.findIndex((r: any) => r.id === routine.id);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...routine };
          localStorage.setItem("invictus_gym_routines", JSON.stringify(list));
        }
        return routine;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/gym/routines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, ...routine }),
      });

      if (!res.ok) throw new Error("Failed to update gym routine");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gymRoutines", user?.uid] });
    },
  });
}

export function useDeleteGymRoutine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routineId: string) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_gym_routines");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((r: any) => r.id !== routineId);
        localStorage.setItem("invictus_gym_routines", JSON.stringify(filtered));
        return routineId;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch(`/api/gym/routines?id=${routineId}&userId=${user.uid}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete gym routine");
      return routineId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gymRoutines", user?.uid] });
    },
  });
}

// --- MEAL PLANS & DAILY NUTRITION ---

export function useMealPlans(date?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["mealPlans", user?.uid, date],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_meal_plans");
        const list = local ? JSON.parse(local) : [];
        if (date) return list.filter((m: any) => m.date === date);
        return list;
      }
      if (!user) return [];

      const url = date
        ? `/api/gym/meals?userId=${user.uid}&date=${date}`
        : `/api/gym/meals?userId=${user.uid}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useAddMealPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meal: any) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_meal_plans");
        const list = local ? JSON.parse(local) : [];
        const newMeal = { ...meal, id: `meal_${Date.now()}` };
        list.push(newMeal);
        localStorage.setItem("invictus_meal_plans", JSON.stringify(list));
        return newMeal;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/gym/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, ...meal }),
      });

      if (!res.ok) throw new Error("Failed to add meal plan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealPlans", user?.uid] });
    },
  });
}

export function useUpdateMealPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meal: any) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_meal_plans");
        const list = local ? JSON.parse(local) : [];
        const idx = list.findIndex((m: any) => m.id === meal.id);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...meal };
          localStorage.setItem("invictus_meal_plans", JSON.stringify(list));
        }
        return meal;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/gym/meals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, ...meal }),
      });

      if (!res.ok) throw new Error("Failed to update meal plan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealPlans", user?.uid] });
    },
  });
}

export function useDeleteMealPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mealId: string) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_meal_plans");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((m: any) => m.id !== mealId);
        localStorage.setItem("invictus_meal_plans", JSON.stringify(filtered));
        return mealId;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch(`/api/gym/meals?id=${mealId}&userId=${user.uid}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete meal plan");
      return mealId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealPlans", user?.uid] });
    },
  });
}
