import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/shared/AuthProvider";
import { type Habit, type HabitLog, type Streak, type HealthProfile, type WaterLog, type Workout, type Macros, type Diet } from "@/types";
import { calculateStreak } from "@/lib/utils/streaks";
import { format } from "date-fns";

const isGuestMode = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("invictus_guest_mode") === "true";
};

// 1. Fetch Habits (MongoDB Atlas Connected)
export function useHabits() {
  const { user } = useAuth();

  return useQuery<Habit[]>({
    queryKey: ["habits", user?.uid],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_habits");
        const list = local ? JSON.parse(local) : [];
        return list.filter((h: any) => !h.archived);
      }
      if (!user) return [];

      const res = await fetch(`/api/goals/habits?userId=${user.uid}`);
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((h: any) => ({
        ...h,
        id: h.id || h._id,
      }));
    },
    enabled: !!user || isGuestMode(),
  });
}

// 2. Add Habit (MongoDB Atlas Connected)
export function useAddHabit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habit: Omit<Habit, "id" | "archived" | "createdAt" | "updatedAt">) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_habits");
        const list = local ? JSON.parse(local) : [];
        const newHabit = {
          ...habit,
          id: Math.random().toString(36).substring(2, 9),
          archived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as unknown as Habit;
        list.push(newHabit);
        localStorage.setItem("invictus_habits", JSON.stringify(list));
        return newHabit;
      }

      if (!user) throw new Error("Unauthenticated");

      const habitId = `h_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch("/api/goals/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: habitId,
          userId: user.uid,
          ...habit,
        }),
      });

      if (!res.ok) throw new Error("Failed to create habit in MongoDB");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", user?.uid] });
    },
  });
}

// 3. Update Habit
export function useUpdateHabit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habit: Partial<Habit> & { id: string }) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_habits");
        const list = local ? JSON.parse(local) : [];
        const idx = list.findIndex((h: any) => h.id === habit.id);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...habit, updatedAt: new Date().toISOString() };
          localStorage.setItem("invictus_habits", JSON.stringify(list));
        }
        return habit;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/goals/habits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, ...habit }),
      });
      if (!res.ok) throw new Error("Failed to update habit in MongoDB");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", user?.uid] });
    },
  });
}

// 4. Delete/Archive Habit
export function useDeleteHabit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_habits");
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((h: any) => h.id !== habitId);
        localStorage.setItem("invictus_habits", JSON.stringify(filtered));
        return;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch(`/api/goals/habits?id=${habitId}&userId=${user.uid}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete habit in MongoDB");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["habitLogs", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["streaks", user?.uid] });
    },
  });
}

// 5. Fetch Habit Logs for Today/Date
export function useHabitLogs(date: string) {
  const { user } = useAuth();

  return useQuery<HabitLog[]>({
    queryKey: ["habitLogs", user?.uid, date],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_habit_logs");
        const logs = local ? JSON.parse(local) : [];
        return logs.filter((l: any) => l.date === date);
      }
      if (!user) return [];
      const res = await fetch(`/api/goals/logs?userId=${user.uid}&date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch habit logs from MongoDB");
      return res.json();
    },
    enabled: !!user || isGuestMode(),
  });
}

// 5b. Fetch Habit Logs for a Date Range (for heatmap & analytics)
export function useMonthHabitLogs(startDate: string, endDate: string) {
  const { user } = useAuth();

  return useQuery<HabitLog[]>({
    queryKey: ["habitLogsRange", user?.uid, startDate, endDate],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_habit_logs");
        const logs = local ? JSON.parse(local) : [];
        return logs.filter((l: any) => l.date >= startDate && l.date <= endDate && l.completed);
      }
      if (!user) return [];
      const res = await fetch(`/api/goals/logs?userId=${user.uid}&startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Failed to fetch range logs from MongoDB");
      const logs = await res.json();
      return logs.filter((l: any) => l.completed);
    },
    enabled: !!user || isGuestMode(),
  });
}

// 6. Fetch Streaks for All Habits
export function useStreaks() {
  const { user } = useAuth();

  return useQuery<Record<string, Streak>>({
    queryKey: ["streaks", user?.uid],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_streaks");
        return local ? JSON.parse(local) : {};
      }
      if (!user) return {};
      const res = await fetch(`/api/goals/logs?userId=${user.uid}`);
      if (!res.ok) return {};
      const logs: HabitLog[] = await res.json();
      
      let frozenDates: string[] = [];
      try {
        const freezeRes = await fetch(`/api/goals/streak-freeze?userId=${user.uid}`);
        if (freezeRes.ok) {
          const freezeData = await freezeRes.json();
          frozenDates = freezeData.streakFreeze?.frozenDates || [];
        }
      } catch {}

      const streaks: Record<string, Streak> = {};
      const habitGroup: Record<string, string[]> = {};
      
      logs.filter((l) => l.completed).forEach((l) => {
        if (!habitGroup[l.habitId]) habitGroup[l.habitId] = [];
        habitGroup[l.habitId].push(l.date);
      });

      const todayStr = format(new Date(), "yyyy-MM-dd");
      Object.entries(habitGroup).forEach(([habitId, completedDates]) => {
        const { currentStreak, longestStreak } = calculateStreak(completedDates, todayStr, frozenDates);
        streaks[habitId] = {
          habitId,
          currentStreak,
          longestStreak,
          lastCompletedDate: completedDates.sort().reverse()[0] || "",
          updatedAt: new Date().toISOString(),
        };
      });

      return streaks;
    },
    enabled: !!user || isGuestMode(),
  });
}

// 7. Toggle Habit Log & Update Streak
export function useToggleHabitLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      date,
      completed,
      countLogged = 0,
      note = "",
      quickTags = [],
    }: {
      habitId: string;
      date: string;
      completed: boolean;
      countLogged?: number;
      note?: string;
      quickTags?: string[];
    }) => {
      if (isGuestMode()) {
        const localLogs = localStorage.getItem("invictus_habit_logs");
        let logs = localLogs ? JSON.parse(localLogs) : [];
        const logId = `${habitId}_${date}`;

        if (completed) {
          const idx = logs.findIndex((l: any) => l.id === logId);
          if (idx > -1) {
            logs[idx].completed = true;
            logs[idx].countLogged = countLogged;
            logs[idx].note = note;
            logs[idx].quickTags = quickTags;
          } else {
            logs.push({
              id: logId,
              habitId,
              date,
              completed: true,
              countLogged,
              note,
              quickTags,
              createdAt: new Date().toISOString(),
            });
          }
        } else {
          logs = logs.filter((l: any) => l.id !== logId);
        }
        localStorage.setItem("invictus_habit_logs", JSON.stringify(logs));

        // Recalculate streak
        const completedDates = logs
          .filter((l: any) => l.habitId === habitId && l.completed)
          .map((l: any) => l.date);

        const { currentStreak, longestStreak } = calculateStreak(completedDates, format(new Date(), "yyyy-MM-dd"));

        const localStreaks = localStorage.getItem("invictus_streaks");
        const streaks = localStreaks ? JSON.parse(localStreaks) : {};
        streaks[habitId] = {
          habitId,
          currentStreak,
          longestStreak,
          lastCompletedDate: completed ? date : (completedDates.sort().reverse()[0] || ""),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem("invictus_streaks", JSON.stringify(streaks));
        return;
      }

      if (!user) throw new Error("Unauthenticated");

      const res = await fetch("/api/goals/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          habitId,
          date,
          completed,
          value: countLogged,
          note,
          quickTags,
        }),
      });

      if (!res.ok) throw new Error("Failed to update habit log in MongoDB");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["habitLogs", user?.uid, variables.date] });
      queryClient.invalidateQueries({ queryKey: ["habitLogsRange", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["streaks", user?.uid] });
    },
  });
}

// 8. Health Profile Hooks (MongoDB Atlas Connected)
export function useHealthProfile() {
  const { user } = useAuth();

  return useQuery<HealthProfile>({
    queryKey: ["healthProfile", user?.uid],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_user_profile");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            return {
              gender: parsed.gender || "Female",
              age: parsed.age || "24 Years",
              weight: parsed.weight || "68 kg",
            };
          } catch {}
        }
        return { gender: "Not Set", age: "Not Set", weight: "Not Set" };
      }
      if (!user) return { gender: "Not Set", age: "Not Set", weight: "Not Set" };

      // Fetch from MongoDB Atlas
      const res = await fetch(`/api/goals/health?userId=${user.uid}`);
      if (!res.ok) throw new Error("Failed to fetch health profile");
      const data = await res.json();
      return {
        gender: data.gender || "Not Set",
        age: data.age || "Not Set",
        weight: data.weight || "68 kg",
        height: data.height || "175 cm",
        waterGoal: data.waterGoal || 2500,
      };
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useUpdateHealthProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: HealthProfile) => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_user_profile");
        const parsed = local ? JSON.parse(local) : {};
        localStorage.setItem(
          "invictus_user_profile",
          JSON.stringify({ ...parsed, ...profile })
        );
        return profile;
      }
      if (!user) throw new Error("Unauthenticated");

      // Post to MongoDB Atlas API
      const res = await fetch("/api/goals/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, ...profile }),
      });

      if (!res.ok) throw new Error("Failed to save health profile to MongoDB");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthProfile", user?.uid] });
    },
  });
}

// 9. Water Log Hooks
export function useWaterLog(date: string) {
  const { user } = useAuth();

  return useQuery<WaterLog>({
    queryKey: ["waterLog", user?.uid, date],
    queryFn: async () => {
      if (isGuestMode()) {
        const val = localStorage.getItem(`invictus_water_${date}`);
        return {
          id: date,
          date,
          amount: val ? parseInt(val) : 0,
        };
      }
      if (!user) return { id: date, date, amount: 0 };

      const res = await fetch(`/api/goals/water?userId=${user.uid}&date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch water log from MongoDB");
      const data = await res.json();
      return {
        id: data._id || date,
        date: data.date || date,
        amount: data.amount !== undefined ? data.amount : 0,
      };
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useLogWater() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, amount }: { date: string; amount: number }) => {
      if (isGuestMode()) {
        const val = localStorage.getItem(`invictus_water_${date}`);
        const current = val ? parseInt(val) : 0;
        const next = Math.max(0, current + amount);
        localStorage.setItem(`invictus_water_${date}`, next.toString());
        return { id: date, date, amount: next };
      }
      if (!user) throw new Error("Unauthenticated");

      const res = await fetch("/api/goals/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, date, amount, mode: "add" }),
      });
      if (!res.ok) throw new Error("Failed to update water log in MongoDB");
      const data = await res.json();
      return { id: data._id || date, date: data.date || date, amount: data.amount };
    },
    onSuccess: (_, variables) => {
      if (variables?.date) {
        queryClient.invalidateQueries({ queryKey: ["waterLog", user?.uid, variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ["waterLog", user?.uid] });
    },
  });
}

export function useSetWater() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, amount }: { date: string; amount: number }) => {
      const next = Math.max(0, amount);
      if (isGuestMode()) {
        localStorage.setItem(`invictus_water_${date}`, next.toString());
        return { id: date, date, amount: next };
      }
      if (!user) throw new Error("Unauthenticated");

      const res = await fetch("/api/goals/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, date, amount: next, mode: "set" }),
      });
      if (!res.ok) throw new Error("Failed to set water intake in MongoDB");
      const data = await res.json();
      return { id: data._id || date, date: data.date || date, amount: data.amount };
    },
    onSuccess: (_, variables) => {
      if (variables?.date) {
        queryClient.invalidateQueries({ queryKey: ["waterLog", user?.uid, variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ["waterLog", user?.uid] });
    },
  });
}

// 10. Workout Hooks (MongoDB Atlas)
export function useWorkouts(date: string) {
  const { user } = useAuth();

  return useQuery<Workout[]>({
    queryKey: ["workouts", user?.uid, date],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem(`invictus_workouts_${date}`);
        return local ? JSON.parse(local) : [];
      }
      if (!user) return [];
      const res = await fetch(`/api/goals/workouts?userId=${user.uid}&date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch workouts from MongoDB");
      return res.json();
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useAddWorkout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, name, details }: { date: string; name: string; details: string }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newW: Workout = { id, name, details, completed: false, date };

      if (isGuestMode()) {
        const local = localStorage.getItem(`invictus_workouts_${date}`);
        const list = local ? JSON.parse(local) : [];
        list.push(newW);
        localStorage.setItem(`invictus_workouts_${date}`, JSON.stringify(list));
        return newW;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/goals/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, date, name, details }),
      });
      if (!res.ok) throw new Error("Failed to add workout to MongoDB");
      return res.json();
    },
    onSuccess: (_, variables) => {
      if (variables?.date) {
        queryClient.invalidateQueries({ queryKey: ["workouts", user?.uid, variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ["workouts", user?.uid] });
    },
  });
}

export function useToggleWorkout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, id, completed }: { date: string; id: string; completed: boolean }) => {
      if (isGuestMode()) {
        const local = localStorage.getItem(`invictus_workouts_${date}`);
        const list = local ? JSON.parse(local) : [];
        const idx = list.findIndex((w: any) => w.id === id);
        if (idx > -1) {
          list[idx].completed = completed;
          localStorage.setItem(`invictus_workouts_${date}`, JSON.stringify(list));
        }
        return;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/goals/workouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user.uid, completed }),
      });
      if (!res.ok) throw new Error("Failed to toggle workout in MongoDB");
      return res.json();
    },
    onSuccess: (_, variables) => {
      if (variables?.date) {
        queryClient.invalidateQueries({ queryKey: ["workouts", user?.uid, variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ["workouts", user?.uid] });
    },
  });
}

export function useUpdateWorkout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workout: Partial<Workout> & { id: string; date: string }) => {
      const { date, id, name, details, completed } = workout;
      if (isGuestMode()) {
        const local = localStorage.getItem(`invictus_workouts_${date}`);
        const list = local ? JSON.parse(local) : [];
        const idx = list.findIndex((w: any) => w.id === id);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...workout };
          localStorage.setItem(`invictus_workouts_${date}`, JSON.stringify(list));
        }
        return workout;
      }
      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/goals/workouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user.uid, name, details, completed }),
      });
      if (!res.ok) throw new Error("Failed to update workout in MongoDB");
      return res.json();
    },
    onSuccess: (_, variables) => {
      if (variables?.date) {
        queryClient.invalidateQueries({ queryKey: ["workouts", user?.uid, variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ["workouts", user?.uid] });
    },
  });
}

export function useDeleteWorkout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, id }: { date: string; id: string }) => {
      if (isGuestMode()) {
        const local = localStorage.getItem(`invictus_workouts_${date}`);
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((w: any) => w.id !== id);
        localStorage.setItem(`invictus_workouts_${date}`, JSON.stringify(filtered));
        return { date, id };
      }
      if (!user) throw new Error("Unauthenticated");
      const res = await fetch(`/api/goals/workouts?id=${id}&userId=${user.uid}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete workout from MongoDB");
      return { date, id };
    },
    onSuccess: (_, variables) => {
      if (variables?.date) {
        queryClient.invalidateQueries({ queryKey: ["workouts", user?.uid, variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ["workouts", user?.uid] });
    },
  });
}

// 11. Macronutrients Hooks (MongoDB Atlas)
export function useMacros(date: string) {
  const { user } = useAuth();

  return useQuery<Macros>({
    queryKey: ["macros", user?.uid, date],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem(`invictus_macros_${date}`);
        if (local) return JSON.parse(local);
        const defaults = { id: date, date, protein: 0, carbs: 0, fat: 0 };
        localStorage.setItem(`invictus_macros_${date}`, JSON.stringify(defaults));
        return defaults;
      }
      if (!user) return { id: date, date, protein: 0, carbs: 0, fat: 0 };
      const res = await fetch(`/api/goals/macros?userId=${user.uid}&date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch macros from MongoDB");
      return res.json();
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useUpdateMacros() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (macrosData: Macros) => {
      const { date, protein, carbs, fat } = macrosData;
      if (isGuestMode()) {
        localStorage.setItem(`invictus_macros_${date}`, JSON.stringify(macrosData));
        return macrosData;
      }
      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/goals/macros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, date, protein, carbs, fat }),
      });
      if (!res.ok) throw new Error("Failed to update macros in MongoDB");
      return res.json();
    },
    onSuccess: (_, variables) => {
      if (variables?.date) {
        queryClient.invalidateQueries({ queryKey: ["macros", user?.uid, variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ["macros", user?.uid] });
    },
  });
}

// 12. Diet Hooks (MongoDB Atlas)
export function useDiet(date: string) {
  const { user } = useAuth();

  return useQuery<Diet[]>({
    queryKey: ["diet", user?.uid, date],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem(`invictus_diet_${date}`);
        return local ? JSON.parse(local) : [];
      }
      if (!user) return [];
      const res = await fetch(`/api/goals/diets?userId=${user.uid}&date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch diets from MongoDB");
      return res.json();
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useAddDiet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, name, details }: { date: string; name: string; details: string }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newD: Diet = { id, name, details, completed: false, date };

      if (isGuestMode()) {
        const local = localStorage.getItem(`invictus_diet_${date}`);
        const list = local ? JSON.parse(local) : [];
        list.push(newD);
        localStorage.setItem(`invictus_diet_${date}`, JSON.stringify(list));
        return newD;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/goals/diets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, date, name, details }),
      });
      if (!res.ok) throw new Error("Failed to add diet log to MongoDB");
      return res.json();
    },
    onSuccess: (_, variables) => {
      if (variables?.date) {
        queryClient.invalidateQueries({ queryKey: ["diet", user?.uid, variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ["diet", user?.uid] });
    },
  });
}

export function useToggleDiet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, id, completed }: { date: string; id: string; completed: boolean }) => {
      if (isGuestMode()) {
        const local = localStorage.getItem(`invictus_diet_${date}`);
        const list = local ? JSON.parse(local) : [];
        const idx = list.findIndex((d: any) => d.id === id);
        if (idx > -1) {
          list[idx].completed = completed;
          localStorage.setItem(`invictus_diet_${date}`, JSON.stringify(list));
        }
        return;
      }

      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/goals/diets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user.uid, completed }),
      });
      if (!res.ok) throw new Error("Failed to toggle diet log in MongoDB");
      return res.json();
    },
    onSuccess: (_, variables) => {
      if (variables?.date) {
        queryClient.invalidateQueries({ queryKey: ["diet", user?.uid, variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ["diet", user?.uid] });
    },
  });
}

export function useUpdateDiet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dietItem: Partial<Diet> & { id: string; date: string }) => {
      const { date, id, name, details, completed } = dietItem;
      if (isGuestMode()) {
        const local = localStorage.getItem(`invictus_diet_${date}`);
        const list = local ? JSON.parse(local) : [];
        const idx = list.findIndex((d: any) => d.id === id);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...dietItem };
          localStorage.setItem(`invictus_diet_${date}`, JSON.stringify(list));
        }
        return dietItem;
      }
      if (!user) throw new Error("Unauthenticated");
      const res = await fetch("/api/goals/diets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user.uid, name, details, completed }),
      });
      if (!res.ok) throw new Error("Failed to update diet log in MongoDB");
      return res.json();
    },
    onSuccess: (_, variables) => {
      if (variables?.date) {
        queryClient.invalidateQueries({ queryKey: ["diet", user?.uid, variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ["diet", user?.uid] });
    },
  });
}

export function useDeleteDiet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, id }: { date: string; id: string }) => {
      if (isGuestMode()) {
        const local = localStorage.getItem(`invictus_diet_${date}`);
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((d: any) => d.id !== id);
        localStorage.setItem(`invictus_diet_${date}`, JSON.stringify(filtered));
        return { date, id };
      }
      if (!user) throw new Error("Unauthenticated");
      const res = await fetch(`/api/goals/diets?id=${id}&userId=${user.uid}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete diet log from MongoDB");
      return { date, id };
    },
    onSuccess: (_, variables) => {
      if (variables?.date) {
        queryClient.invalidateQueries({ queryKey: ["diet", user?.uid, variables.date] });
      }
      queryClient.invalidateQueries({ queryKey: ["diet", user?.uid] });
    },
  });
}

// 13. Mood & Journal Log Hooks (MongoDB Connected)
export function useMoodLog(date: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["moodLog", user?.uid, date],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem(`invictus_mood_${date}`);
        return local ? JSON.parse(local) : null;
      }
      if (!user) return null;

      const res = await fetch(`/api/goals/mood?userId=${user.uid}&date=${date}`);
      if (!res.ok) return null;
      const list = await res.json();
      return list && list.length > 0 ? list[0] : null;
    },
    enabled: !!user || isGuestMode(),
  });
}

export function useSaveMoodLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, mood, energy, note }: { date: string; mood: string; energy: number; note: string }) => {
      if (isGuestMode()) {
        const payload = { mood, energy, note, date, updatedAt: new Date().toISOString() };
        localStorage.setItem(`invictus_mood_${date}`, JSON.stringify(payload));
        return payload;
      }
      if (!user) throw new Error("Unauthenticated");

      const res = await fetch("/api/goals/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, date, mood, energy, note }),
      });

      if (!res.ok) throw new Error("Failed to save mood log to MongoDB");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["moodLog", user?.uid, variables.date] });
    },
  });
}

// 18. Fetch Streak Freeze Tokens & Status
export function useStreakFreeze() {
  const { user } = useAuth();
  return useQuery<{
    userId: string;
    tokensAvailable: number;
    lastMonthlyCredit: string;
    frozenDates: string[];
  }>({
    queryKey: ["streakFreeze", user?.uid],
    queryFn: async () => {
      if (isGuestMode()) {
        const local = localStorage.getItem("invictus_streak_freeze");
        return local
          ? JSON.parse(local)
          : { userId: "guest", tokensAvailable: 1, lastMonthlyCredit: format(new Date(), "yyyy-MM"), frozenDates: [] };
      }
      if (!user) return { userId: "guest", tokensAvailable: 1, lastMonthlyCredit: format(new Date(), "yyyy-MM"), frozenDates: [] };
      const res = await fetch(`/api/goals/streak-freeze?userId=${user.uid}`);
      if (!res.ok) return { userId: user.uid, tokensAvailable: 1, lastMonthlyCredit: format(new Date(), "yyyy-MM"), frozenDates: [] };
      const data = await res.json();
      return data.streakFreeze;
    },
    enabled: !!user || isGuestMode(),
  });
}

// 19. Consume Streak Freeze Token
export function useConsumeStreakFreeze() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ frozenDate }: { frozenDate: string }) => {
      if (isGuestMode()) {
        const localStr = localStorage.getItem("invictus_streak_freeze");
        const sf = localStr
          ? JSON.parse(localStr)
          : { userId: "guest", tokensAvailable: 1, lastMonthlyCredit: format(new Date(), "yyyy-MM"), frozenDates: [] };
        if (sf.tokensAvailable <= 0) throw new Error("No Streak Freeze tokens available!");
        if (!sf.frozenDates.includes(frozenDate)) {
          sf.frozenDates.push(frozenDate);
          sf.tokensAvailable = Math.max(0, sf.tokensAvailable - 1);
        }
        localStorage.setItem("invictus_streak_freeze", JSON.stringify(sf));
        return sf;
      }
      if (!user) throw new Error("Unauthenticated");

      const res = await fetch("/api/goals/streak-freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, action: "freeze_date", frozenDate }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to consume streak freeze token");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streakFreeze", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["streaks", user?.uid] });
    },
  });
}
