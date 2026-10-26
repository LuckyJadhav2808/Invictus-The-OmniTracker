import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/shared/AuthProvider";
import { type Habit, type HabitLog, type Streak, type HealthProfile, type WaterLog, type Workout, type Macros, type Diet } from "@/types";
import { calculateStreak, evaluateAutonomousStreakFreeze, isHabitScheduledOnDate, type AutonomousShieldResult } from "@/lib/utils/streaks";
import { format } from "date-fns";
import { executeOfflineMutation } from "@/lib/offline/offline-mutation";

const isGuestMode = (user?: any) => {
  if (user?.uid && user.uid !== "guest-user") return false;
  if (typeof window === "undefined") return false;
  return localStorage.getItem("invictus_guest_mode") === "true";
};

// 1. Fetch Habits (MongoDB Atlas Connected)
export function useHabits() {
  const { user } = useAuth();

  return useQuery<Habit[]>({
    queryKey: ["habits", user?.uid],
    queryFn: async () => {
      if (isGuestMode(user)) {
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
    enabled: !!user || isGuestMode(user),
  });
}

// 2. Add Habit (MongoDB Atlas Connected)
export function useAddHabit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habit: Omit<Habit, "id" | "archived" | "createdAt" | "updatedAt">) => {
      if (isGuestMode(user)) {
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
      const newHabitObj = { id: habitId, userId: user.uid, ...habit };

      return executeOfflineMutation(newHabitObj, {
        endpoint: "/api/goals/habits",
        method: "POST",
        type: "goals",
        label: `Create Habit: ${habit.title}`,
        getOptimisticResult: () => newHabitObj,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habitLogs"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
    },
  });
}

// 3. Update Habit
export function useUpdateHabit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habit: Partial<Habit> & { id: string }) => {
      if (isGuestMode(user)) {
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
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
    },
  });
}

// 4. Delete/Archive Habit
export function useDeleteHabit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      if (isGuestMode(user)) {
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
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habitLogs"] });
      queryClient.invalidateQueries({ queryKey: ["habitLogsRange"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
    },
  });
}

// 5. Fetch Habit Logs for Today/Date
export function useHabitLogs(date: string) {
  const { user } = useAuth();

  return useQuery<HabitLog[]>({
    queryKey: ["habitLogs", user?.uid, date],
    queryFn: async () => {
      if (isGuestMode(user)) {
        const local = localStorage.getItem("invictus_habit_logs");
        const logs = local ? JSON.parse(local) : [];
        return logs.filter((l: any) => l.date === date);
      }
      if (!user) return [];
      const res = await fetch(`/api/goals/logs?userId=${user.uid}&date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch habit logs from MongoDB");
      return res.json();
    },
    enabled: !!user || isGuestMode(user),
  });
}

// 5b. Fetch Habit Logs for a Date Range (for heatmap & analytics)
export function useMonthHabitLogs(startDate: string, endDate: string) {
  const { user } = useAuth();

  return useQuery<HabitLog[]>({
    queryKey: ["habitLogsRange", user?.uid, startDate, endDate],
    queryFn: async () => {
      if (isGuestMode(user)) {
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
    enabled: !!user || isGuestMode(user),
  });
}

// 6. Fetch Streaks for All Habits
export function useStreaks() {
  const { user } = useAuth();

  return useQuery<Record<string, Streak>>({
    queryKey: ["streaks", user?.uid],
    queryFn: async () => {
      let habitsList: Habit[] = [];
      let logs: HabitLog[] = [];
      let frozenDates: string[] = [];

      if (isGuestMode(user)) {
        const localStreaks = localStorage.getItem("invictus_streaks");
        if (localStreaks) {
          try {
            return JSON.parse(localStreaks);
          } catch {}
        }
        const localHabits = localStorage.getItem("invictus_habits");
        habitsList = localHabits ? JSON.parse(localHabits) : [];
        const localLogs = localStorage.getItem("invictus_habit_logs");
        logs = localLogs ? JSON.parse(localLogs) : [];
        const localFreeze = localStorage.getItem("invictus_streak_freeze");
        if (localFreeze) {
          try {
            frozenDates = JSON.parse(localFreeze).frozenDates || [];
          } catch {}
        }
      } else {
        if (!user) return {};
        const [logsRes, habitsRes, freezeRes] = await Promise.all([
          fetch(`/api/goals/logs?userId=${user.uid}`).catch(() => null),
          fetch(`/api/goals/habits?userId=${user.uid}`).catch(() => null),
          fetch(`/api/goals/streak-freeze?userId=${user.uid}`).catch(() => null),
        ]);

        if (logsRes && logsRes.ok) {
          logs = await logsRes.json();
        }
        if (habitsRes && habitsRes.ok) {
          habitsList = await habitsRes.json();
        }
        if (freezeRes && freezeRes.ok) {
          const freezeData = await freezeRes.json();
          frozenDates = freezeData.streakFreeze?.frozenDates || [];
        }
      }

      const streaks: Record<string, Streak> = {};
      const habitGroup: Record<string, string[]> = {};
      
      logs.filter((l) => l.completed).forEach((l) => {
        if (!habitGroup[l.habitId]) habitGroup[l.habitId] = [];
        habitGroup[l.habitId].push(l.date);
      });

      const todayStr = format(new Date(), "yyyy-MM-dd");
      const habitsMap = new Map(habitsList.map((h: any) => [h.id || h._id, h]));
      const allHabitIds = new Set([...Object.keys(habitGroup), ...habitsList.map((h: any) => h.id || h._id)]);

      allHabitIds.forEach((habitId) => {
        const completedDates = habitGroup[habitId] || [];
        const habit = habitsMap.get(habitId);
        const isRestDay = habit ? (dStr: string) => !isHabitScheduledOnDate(habit, dStr) : undefined;

        const { currentStreak, longestStreak } = calculateStreak(completedDates, {
          referenceDateStr: todayStr,
          frozenDates,
          isRestDay,
        });

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
    enabled: !!user || isGuestMode(user),
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
      if (isGuestMode(user)) {
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

      const logPayload = {
        userId: user.uid,
        habitId,
        date,
        completed,
        value: countLogged,
        note,
        quickTags,
      };

      return executeOfflineMutation(logPayload, {
        endpoint: "/api/goals/logs",
        method: "POST",
        type: "goals",
        label: completed ? "Check off Habit" : "Uncheck Habit",
        getOptimisticResult: () => ({ success: true, ...logPayload }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["habitLogs"] });
      queryClient.invalidateQueries({ queryKey: ["habitLogsRange"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
      queryClient.invalidateQueries({ queryKey: ["todayMetrics"] });
    },
  });
}

// 8. Health Profile Hooks (MongoDB Atlas Connected)
export function useHealthProfile() {
  const { user } = useAuth();

  return useQuery<HealthProfile>({
    queryKey: ["healthProfile", user?.uid],
    queryFn: async () => {
      if (isGuestMode(user)) {
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
    enabled: !!user || isGuestMode(user),
  });
}

export function useUpdateHealthProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: HealthProfile) => {
      if (isGuestMode(user)) {
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
      if (isGuestMode(user)) {
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
    enabled: !!user || isGuestMode(user),
  });
}

export function useLogWater() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, amount }: { date: string; amount: number }) => {
      if (isGuestMode(user)) {
        const val = localStorage.getItem(`invictus_water_${date}`);
        const current = val ? parseInt(val) : 0;
        const next = Math.max(0, current + amount);
        localStorage.setItem(`invictus_water_${date}`, next.toString());
        return { id: date, date, amount: next };
      }
      if (!user) throw new Error("Unauthenticated");

      return executeOfflineMutation(
        { userId: user.uid, date, amount, mode: "add" },
        {
          endpoint: "/api/goals/water",
          method: "POST",
          type: "goals",
          label: `Log Water (+${amount}ml)`,
          getOptimisticResult: () => ({ id: date, date, amount }),
        }
      );
    },
    onMutate: async ({ date, amount }) => {
      await queryClient.cancelQueries({ queryKey: ["waterLog", user?.uid, date] });
      const prevData = queryClient.getQueryData<any>(["waterLog", user?.uid, date]);
      const current = prevData?.amount !== undefined ? prevData.amount : 0;
      const next = Math.max(0, current + amount);
      queryClient.setQueryData(["waterLog", user?.uid, date], {
        ...prevData,
        id: date,
        date,
        amount: next,
      });
      return { prevData };
    },
    onError: (err, variables, context: any) => {
      if (context?.prevData) {
        queryClient.setQueryData(["waterLog", user?.uid, variables.date], context.prevData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waterLog"] });
      queryClient.invalidateQueries({ queryKey: ["healthProfile"] });
    },
  });
}

export function useSetWater() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, amount, waterGoal }: { date: string; amount: number; waterGoal?: number }) => {
      const next = Math.max(0, amount);
      if (isGuestMode(user)) {
        localStorage.setItem(`invictus_water_${date}`, next.toString());
        if (waterGoal) {
          localStorage.setItem("invictus_water_goal", waterGoal.toString());
        }
        return { id: date, date, amount: next, waterGoal };
      }
      if (!user) throw new Error("Unauthenticated");

      return executeOfflineMutation(
        { userId: user.uid, date, amount: next, waterGoal, mode: "set" },
        {
          endpoint: "/api/goals/water",
          method: "POST",
          type: "goals",
          label: `Set Water (${next}ml)`,
          getOptimisticResult: () => ({ id: date, date, amount: next, waterGoal }),
        }
      );
    },
    onMutate: async ({ date, amount, waterGoal }) => {
      await queryClient.cancelQueries({ queryKey: ["waterLog", user?.uid, date] });
      const prevData = queryClient.getQueryData<any>(["waterLog", user?.uid, date]);
      const next = Math.max(0, amount);
      queryClient.setQueryData(["waterLog", user?.uid, date], {
        ...prevData,
        id: date,
        date,
        amount: next,
        ...(waterGoal ? { waterGoal } : {}),
      });
      return { prevData };
    },
    onError: (err, variables, context: any) => {
      if (context?.prevData) {
        queryClient.setQueryData(["waterLog", user?.uid, variables.date], context.prevData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waterLog"] });
      queryClient.invalidateQueries({ queryKey: ["healthProfile"] });
    },
  });
}

// 10. Workout Hooks (MongoDB Atlas)
export function useWorkouts(date: string) {
  const { user } = useAuth();

  return useQuery<Workout[]>({
    queryKey: ["workouts", user?.uid, date],
    queryFn: async () => {
      if (isGuestMode(user)) {
        const local = localStorage.getItem(`invictus_workouts_${date}`);
        return local ? JSON.parse(local) : [];
      }
      if (!user) return [];
      const res = await fetch(`/api/goals/workouts?userId=${user.uid}&date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch workouts from MongoDB");
      return res.json();
    },
    enabled: !!user || isGuestMode(user),
  });
}

export function useAddWorkout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, name, details }: { date: string; name: string; details: string }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newW: Workout = { id, name, details, completed: false, date };

      if (isGuestMode(user)) {
        const local = localStorage.getItem(`invictus_workouts_${date}`);
        const list = local ? JSON.parse(local) : [];
        list.push(newW);
        localStorage.setItem(`invictus_workouts_${date}`, JSON.stringify(list));
        return newW;
      }

      if (!user) throw new Error("Unauthenticated");

      return executeOfflineMutation(
        { userId: user.uid, date, name, details },
        {
          endpoint: "/api/goals/workouts",
          method: "POST",
          type: "gym",
          label: `Log Workout: ${name}`,
          getOptimisticResult: () => ({ id: date, date, name, details, completed: false }),
        }
      );
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
      if (isGuestMode(user)) {
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
      if (isGuestMode(user)) {
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
      if (isGuestMode(user)) {
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
      if (isGuestMode(user)) {
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
    enabled: !!user || isGuestMode(user),
  });
}

export function useUpdateMacros() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (macrosData: Macros) => {
      const { date, protein, carbs, fat } = macrosData;
      if (isGuestMode(user)) {
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
      if (isGuestMode(user)) {
        const local = localStorage.getItem(`invictus_diet_${date}`);
        return local ? JSON.parse(local) : [];
      }
      if (!user) return [];
      const res = await fetch(`/api/goals/diets?userId=${user.uid}&date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch diets from MongoDB");
      return res.json();
    },
    enabled: !!user || isGuestMode(user),
  });
}

export function useAddDiet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, name, details }: { date: string; name: string; details: string }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newD: Diet = { id, name, details, completed: false, date };

      if (isGuestMode(user)) {
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
      if (isGuestMode(user)) {
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
      if (isGuestMode(user)) {
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
      if (isGuestMode(user)) {
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
      if (isGuestMode(user)) {
        const local = localStorage.getItem(`invictus_mood_${date}`);
        return local ? JSON.parse(local) : null;
      }
      if (!user) return null;

      const res = await fetch(`/api/goals/mood?userId=${user.uid}&date=${date}`);
      if (!res.ok) return null;
      const list = await res.json();
      return list && list.length > 0 ? list[0] : null;
    },
    enabled: !!user || isGuestMode(user),
  });
}

export function useSaveMoodLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, mood, energy, note }: { date: string; mood: string; energy: number; note: string }) => {
      if (isGuestMode(user)) {
        const payload = { mood, energy, note, date, updatedAt: new Date().toISOString() };
        localStorage.setItem(`invictus_mood_${date}`, JSON.stringify(payload));
        return payload;
      }
      if (!user) throw new Error("Unauthenticated");

      const moodPayload = { userId: user.uid, date, mood, energy, note };

      return executeOfflineMutation(moodPayload, {
        endpoint: "/api/goals/mood",
        method: "POST",
        type: "goals",
        label: `Log Mood: ${mood}`,
        getOptimisticResult: () => ({ success: true, ...moodPayload }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["moodLog", user?.uid, variables.date] });
    },
  });
}

export interface StreakFreezeData {
  userId: string;
  tokensAvailable: number;
  lastMonthlyCredit: string;
  frozenDates: string[];
  autoShieldEvent?: {
    shielded: boolean;
    tokensConsumed: number;
    newlyFrozenDates: string[];
    affectedHabitIds: string[];
    message?: string;
  } | null;
}

// 18. Fetch Streak Freeze Tokens & Status (with Autonomous Shield Evaluation)
export function useStreakFreeze() {
  const { user } = useAuth();
  return useQuery<StreakFreezeData>({
    queryKey: ["streakFreeze", user?.uid],
    queryFn: async () => {
      if (isGuestMode(user)) {
        const local = localStorage.getItem("invictus_streak_freeze");
        let sf: StreakFreezeData = local
          ? JSON.parse(local)
          : { userId: "guest", tokensAvailable: 1, lastMonthlyCredit: format(new Date(), "yyyy-MM"), frozenDates: [], autoShieldEvent: null };

        // Monthly Token Auto-Credit Check for guest
        const currentMonthStr = format(new Date(), "yyyy-MM");
        if (sf.lastMonthlyCredit !== currentMonthStr) {
          sf.tokensAvailable = Math.min(2, sf.tokensAvailable + 1);
          sf.lastMonthlyCredit = currentMonthStr;
        }

        // Evaluate Autonomous Streak Freeze for guest
        let autoShieldEvent = null;
        if (sf.tokensAvailable > 0) {
          try {
            const localHabitsStr = localStorage.getItem("invictus_habits");
            const localLogsStr = localStorage.getItem("invictus_habit_logs");
            const habits = localHabitsStr ? JSON.parse(localHabitsStr) : [];
            const logs = localLogsStr ? JSON.parse(localLogsStr) : [];

            const shieldResult = evaluateAutonomousStreakFreeze({
              habits,
              completedLogs: logs.filter((l: any) => l.completed),
              streakFreeze: {
                tokensAvailable: sf.tokensAvailable,
                frozenDates: sf.frozenDates || [],
              },
              referenceDateStr: format(new Date(), "yyyy-MM-dd"),
            });

            if (shieldResult.shielded) {
              sf.tokensAvailable = shieldResult.newTokensAvailable;
              sf.frozenDates = shieldResult.newFrozenDates;
              autoShieldEvent = {
                shielded: true,
                tokensConsumed: shieldResult.tokensConsumed,
                newlyFrozenDates: shieldResult.newlyFrozenDates,
                affectedHabitIds: shieldResult.affectedHabitIds,
                message: shieldResult.message,
              };
            }
          } catch {}
        }

        localStorage.setItem("invictus_streak_freeze", JSON.stringify(sf));
        return { ...sf, autoShieldEvent };
      }

      if (!user) {
        return { userId: "guest", tokensAvailable: 1, lastMonthlyCredit: format(new Date(), "yyyy-MM"), frozenDates: [], autoShieldEvent: null };
      }

      const res = await fetch(`/api/goals/streak-freeze?userId=${user.uid}`);
      if (!res.ok) {
        return { userId: user.uid, tokensAvailable: 1, lastMonthlyCredit: format(new Date(), "yyyy-MM"), frozenDates: [], autoShieldEvent: null };
      }
      const data = await res.json();
      return {
        ...data.streakFreeze,
        autoShieldEvent: data.autoShieldEvent || null,
      };
    },
    enabled: !!user || isGuestMode(user),
  });
}

// 19. Consume Streak Freeze Token
export function useConsumeStreakFreeze() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ frozenDate }: { frozenDate: string }) => {
      if (isGuestMode(user)) {
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
