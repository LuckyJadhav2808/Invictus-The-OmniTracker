"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import {
  useHabits,
  useAddHabit,
  useUpdateHabit,
  useDeleteHabit,
  useToggleHabitLog,
  useHabitLogs,
  useMonthHabitLogs,
  useStreaks,
  useHealthProfile,
  useUpdateHealthProfile,
  useWaterLog,
  useLogWater,
  useSetWater,
  useWorkouts,
  useAddWorkout,
  useToggleWorkout,
  useUpdateWorkout,
  useDeleteWorkout,
  useMacros,
  useUpdateMacros,
  useDiet,
  useAddDiet,
  useToggleDiet,
  useUpdateDiet,
  useDeleteDiet,
} from "@/lib/queries/goals";
import { useUserAchievements } from "@/lib/queries/achievements";
import { useMealPlans } from "@/lib/queries/gym";
import { HabitCard } from "@/components/goals/HabitCard";
import { NewHabitForm } from "@/components/goals/NewHabitForm";
import { MoodJournalWidget } from "@/components/goals/MoodJournalWidget";
import { SleepAndActiveWidgets } from "@/components/goals/SleepAndActiveWidgets";
import { GymRoutineTracker } from "@/components/goals/GymRoutineTracker";
import { MealTracker } from "@/components/goals/MealTracker";
import { WeeklyOverviewWidget } from "@/components/goals/WeeklyOverviewWidget";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { Edit3 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { HABIT_TEMPLATE_PACKS } from "@/lib/templates-data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Plus, Calendar as CalendarIcon, BarChart2, Flame, Award, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, subWeeks } from "date-fns";
import { toast } from "sonner";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { SpaceHeroBanner } from "@/components/shared/SpaceHeroBanner";
import { useSearchParams, useRouter } from "next/navigation";

function GoalsPageContent() {
  const { selectedDate } = useUIStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "list");
  const [timeFilter, setTimeFilter] = useState<"daily" | "weekly" | "monthly">("daily");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);

  const handleApplyHabitPack = (pack: TemplatePack) => {
    pack.items.forEach((item) => {
      addHabitMutation.mutate({
        title: item.title,
        icon: "🌱",
        color: "amber",
        frequency: { type: "daily", targetPerDay: 1 },
        allowGraceSkip: false,
        isGoalStyle: false,
        reminderTime: item.desc || "",
      });
    });
  };

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // States for Custom Logging Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ gender: "", age: "", weight: "" });
  
  const [isWorkoutOpen, setIsWorkoutOpen] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({ name: "", details: "" });

  const [isMacrosOpen, setIsMacrosOpen] = useState(false);
  const [macrosForm, setMacrosForm] = useState({ protein: 54, carbs: 32, fat: 7 });

  const [isDietOpen, setIsDietOpen] = useState(false);
  const [dietForm, setDietForm] = useState({ name: "", details: "" });

  // Health Profile & Habits Enhancements via Database Query hooks
  const { data: userProfile = { gender: "Female", age: "24 Years", weight: "68 kg" } } = useHealthProfile();
  const updateProfileMutation = useUpdateHealthProfile();

  const { data: waterLog = { id: selectedDate, date: selectedDate, amount: 0 } } = useWaterLog(selectedDate);
  const logWaterMutation = useLogWater();
  const waterLogged = waterLog.amount;

  const { data: workouts = [] } = useWorkouts(selectedDate);
  const addWorkoutMutation = useAddWorkout();
  const toggleWorkoutMutation = useToggleWorkout();

  const { data: macros = { id: selectedDate, date: selectedDate, protein: 54, carbs: 32, fat: 7 } } = useMacros(selectedDate);
  const updateMacrosMutation = useUpdateMacros();

  const { data: loggedMealPlans = [] } = useMealPlans(selectedDate);

  // Live total macros calculated from logged meals
  const liveMealTotals = useMemo(() => {
    const calories = loggedMealPlans.reduce((sum: number, m: any) => sum + (m.calories || 0), 0);
    const protein = loggedMealPlans.reduce((sum: number, m: any) => sum + (m.protein || 0), 0);
    const carbs = loggedMealPlans.reduce((sum: number, m: any) => sum + (m.carbs || 0), 0);
    const fat = loggedMealPlans.reduce((sum: number, m: any) => sum + (m.fat || 0), 0);
    return { calories, protein, carbs, fat };
  }, [loggedMealPlans]);

  const displayProtein = liveMealTotals.protein > 0 ? liveMealTotals.protein : macros.protein;
  const displayCarbs = liveMealTotals.carbs > 0 ? liveMealTotals.carbs : macros.carbs;
  const displayFat = liveMealTotals.fat > 0 ? liveMealTotals.fat : macros.fat;
  const displayCalories = liveMealTotals.calories > 0
    ? liveMealTotals.calories
    : (displayProtein * 4 + displayCarbs * 4 + displayFat * 9);

  const { data: diet = [] } = useDiet(selectedDate);
  const addDietMutation = useAddDiet();
  const toggleDietMutation = useToggleDiet();

  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: streaks = {} } = useStreaks();
  const { data: logs = [] } = useHabitLogs(selectedDate);
  const achievements = useUserAchievements();
  const { habitLayoutStyle } = useUIStore();

  // Fetch habit logs for the entire month (heatmap) and past 4 weeks (analytics)
  const heatmapMonthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const heatmapMonthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const analyticsStart = format(subWeeks(new Date(), 4), "yyyy-MM-dd");
  const { data: monthLogs = [] } = useMonthHabitLogs(heatmapMonthStart, heatmapMonthEnd);
  const { data: fourWeekLogs = [] } = useMonthHabitLogs(analyticsStart, heatmapMonthEnd);

  const addHabitMutation = useAddHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const toggleLogMutation = useToggleHabitLog();

  const setWaterMutation = useSetWater();
  const updateWorkoutMutation = useUpdateWorkout();
  const deleteWorkoutMutation = useDeleteWorkout();
  const updateDietMutation = useUpdateDiet();
  const deleteDietMutation = useDeleteDiet();

  // Water edit states
  const [isWaterEditOpen, setIsWaterEditOpen] = useState(false);
  const [customWaterAmount, setCustomWaterAmount] = useState("");

  // Workout Edit/Delete states
  const [editingWorkout, setEditingWorkout] = useState<any | null>(null);
  const [editWorkoutName, setEditWorkoutName] = useState("");
  const [editWorkoutDetails, setEditWorkoutDetails] = useState("");
  const [deleteWorkoutId, setDeleteWorkoutId] = useState<string | null>(null);

  // Habit Edit/Delete states
  const [editingHabit, setEditingHabit] = useState<any | null>(null);
  const [editHabitTitle, setEditHabitTitle] = useState("");
  const [editHabitDesc, setEditHabitDesc] = useState("");
  const [deleteHabitId, setDeleteHabitId] = useState<string | null>(null);

  // Diet Edit/Delete states
  const [editingDiet, setEditingDiet] = useState<any | null>(null);
  const [editDietName, setEditDietName] = useState("");
  const [editDietDetails, setEditDietDetails] = useState("");
  const [deleteDietId, setDeleteDietId] = useState<string | null>(null);

  const [weightVal, setWeightVal] = useState("68");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [ageVal, setAgeVal] = useState("");

  const updateProfileStat = () => {
    const rawWeight = userProfile.weight && userProfile.weight !== "Not Set" ? userProfile.weight : "68 kg";
    const unitMatch = rawWeight.match(/(lbs|kg)/i);
    const unit = unitMatch ? unitMatch[0].toLowerCase() : "kg";
    const num = rawWeight.replace(/[^0-9.]/g, "") || "68";

    const rawAge = userProfile.age && userProfile.age !== "Not Set" ? userProfile.age : "";
    const ageNum = rawAge.replace(/[^0-9]/g, "");

    setWeightVal(num);
    setWeightUnit(unit);
    setAgeVal(ageNum);
    setProfileForm({
      gender: userProfile.gender && userProfile.gender !== "Not Set" ? userProfile.gender : "Female",
      age: ageNum ? `${ageNum} Years` : "",
      weight: `${num} ${unit}`,
    });
    setIsProfileOpen(true);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalForm = {
      ...profileForm,
      age: ageVal ? `${ageVal} Years` : "Not Set",
    };
    updateProfileMutation.mutate(finalForm);
    toast.success("Health stats updated! 🌟");
    setIsProfileOpen(false);
  };

  const logWater = (amount: number) => {
    logWaterMutation.mutate({ date: selectedDate, amount });
  };

  const toggleWorkout = (id: string, completed: boolean) => {
    toggleWorkoutMutation.mutate({ date: selectedDate, id, completed });
  };

  const addWorkout = () => {
    setWorkoutForm({ name: "", details: "" });
    setIsWorkoutOpen(true);
  };

  const handleWorkoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutForm.name) return;
    addWorkoutMutation.mutate({
      date: selectedDate,
      name: workoutForm.name,
      details: workoutForm.details,
    });
    toast.success("Exercise added! 🏋️");
    setIsWorkoutOpen(false);
  };

  const updateMacro = () => {
    setMacrosForm({
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
    });
    setIsMacrosOpen(true);
  };

  const handleMacrosSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMacrosMutation.mutate({
      ...macros,
      protein: Number(macrosForm.protein),
      carbs: Number(macrosForm.carbs),
      fat: Number(macrosForm.fat),
    });
    toast.success("Macros updated! 🥗");
    setIsMacrosOpen(false);
  };

  const toggleDiet = (id: string, completed: boolean) => {
    toggleDietMutation.mutate({ date: selectedDate, id, completed });
  };

  const addDiet = () => {
    setDietForm({ name: "", details: "" });
    setIsDietOpen(true);
  };

  const handleDietSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dietForm.name) return;
    addDietMutation.mutate({
      date: selectedDate,
      name: dietForm.name,
      details: dietForm.details,
    });
    toast.success("Meal added! 🍎");
    setIsDietOpen(false);
  };

  const handleWaterEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customWaterAmount);
    if (isNaN(parsed) || parsed < 0) return;
    try {
      await setWaterMutation.mutateAsync({ date: selectedDate, amount: parsed });
      toast.success("Water intake updated!");
      setIsWaterEditOpen(false);
    } catch {
      toast.error("Failed to update water intake");
    }
  };

  const handleWorkoutUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkout || !editWorkoutName.trim()) return;
    try {
      await updateWorkoutMutation.mutateAsync({
        id: editingWorkout.id,
        date: selectedDate,
        name: editWorkoutName,
        details: editWorkoutDetails,
      });
      toast.success("Exercise updated!");
      setEditingWorkout(null);
    } catch {
      toast.error("Failed to update exercise");
    }
  };

  const handleDietUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiet || !editDietName.trim()) return;
    try {
      await updateDietMutation.mutateAsync({
        id: editingDiet.id,
        date: selectedDate,
        name: editDietName,
        details: editDietDetails,
      });
      toast.success("Meal updated!");
      setEditingDiet(null);
    } catch {
      toast.error("Failed to update meal");
    }
  };

  const SUGGESTED_HABITS = [
    { title: "Start Exercising", color: "rose", frequency: "daily" as const, desc: "30 min activity" },
    { title: "Low Carb Day", color: "emerald", frequency: "daily" as const, desc: "Healthy diet" },
    { title: "Avoid Fast Food", color: "orange", frequency: "weekly" as const, desc: "Clean eating" },
    { title: "Drink 2L Water", color: "sky", frequency: "daily" as const, desc: "Hydration" },
    { title: "Read 10 Pages", color: "indigo", frequency: "daily" as const, desc: "Growth" },
  ];

  const handleAddSuggested = async (suggested: typeof SUGGESTED_HABITS[0]) => {
    try {
      await addHabitMutation.mutateAsync({
        title: suggested.title,
        color: suggested.color,
        icon: "Target",
        frequency: {
          type: suggested.frequency,
          targetPerDay: 1,
        },
        allowGraceSkip: false,
        isGoalStyle: false,
      });
      toast.success(`Added habit: ${suggested.title}! 🎉`);
    } catch {
      toast.error("Failed to add suggested habit");
    }
  };

  const handleAddHabit = async (data: any) => {
    try {
      await addHabitMutation.mutateAsync(data);
      toast.success("Habit created! Let's get to work 💪");
      setIsAddOpen(false);
    } catch {
      toast.error("Failed to create habit");
    }
  };

  const handleToggleLog = async (habitId: string, completed: boolean) => {
    try {
      await toggleLogMutation.mutateAsync({
        habitId,
        date: selectedDate,
        completed,
      });
      toast.success(completed ? "Checked! Good job! 🎉" : "Removed check");
    } catch {
      toast.error("Failed to update habit log");
    }
  };

  const isCompletedToday = (habitId: string) => {
    return logs.some((l) => l.habitId === habitId && l.completed);
  };

  // Calendar Heatmap Logic
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday etc.

  // Real Calendar/Heatmap completion percentages
  const getCompletionPercentage = (dateStr: string) => {
    if (totalHabits === 0) return 0;
    const completedOnDay = monthLogs.filter((l) => l.date === dateStr).length;
    return Math.round((completedOnDay / totalHabits) * 100);
  };

  // Analytics Calculations
  const totalHabits = habits.length;
  const activeStreaksList = Object.values(streaks).filter((s) => s.currentStreak > 0);
  const longestStreakValue = Object.values(streaks).reduce((max, s) => Math.max(max, s.longestStreak), 0);

  // Real completion rate: total completed logs vs total possible over tracked days
  const trackedDays = new Set(fourWeekLogs.map((l) => l.date)).size || 1;
  const overallCompletionRate = totalHabits > 0
    ? Math.round((fourWeekLogs.length / (totalHabits * trackedDays)) * 100)
    : 0;

  // Real bar chart: completion rate by day of week from past 4 weeks
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const barChartData = (() => {
    if (totalHabits === 0) return dayNames.map((name) => ({ name, rate: 0 }));
    // Count completed logs per day-of-week and total days per day-of-week
    const dayCounts: Record<number, { completed: number; totalDays: number }> = {};
    for (let i = 0; i < 7; i++) dayCounts[i] = { completed: 0, totalDays: 0 };
    // Count how many of each weekday exist in the 4-week window
    const fourWeekStart = subWeeks(new Date(), 4);
    const windowDays = eachDayOfInterval({ start: fourWeekStart, end: new Date() });
    for (const day of windowDays) {
      dayCounts[getDay(day)].totalDays++;
    }
    // Count completed logs per day-of-week
    for (const log of fourWeekLogs) {
      const dow = getDay(new Date(log.date));
      dayCounts[dow].completed++;
    }
    return dayNames.map((name, i) => {
      const { completed, totalDays } = dayCounts[i];
      const possibleCompletions = totalDays * totalHabits;
      const rate = possibleCompletions > 0 ? Math.round((completed / possibleCompletions) * 100) : 0;
      return { name, rate };
    });
  })();

  return (
    <div className="min-h-screen bg-cream-bg p-4 md:p-8 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Space Hero Banner */}
        <SpaceHeroBanner
          space="life"
          badgeText="🌱 Life & Habits Space"
          title="Build Routines. Track Wellness."
          subtitle={`Today is ${format(new Date(selectedDate), "EEEE, MMM d, yyyy")}. Keep your streaks glowing!`}
          stats={[
            { label: "Total Habits", value: `${totalHabits}`, icon: "🌱" },
            { label: "Longest Streak", value: `${longestStreakValue}d`, icon: "🔥" },
            { label: "Level & XP", value: `Lvl ${achievements.userLevel} (${achievements.totalXP} XP)`, icon: "⭐" },
          ]}
          actionButton={{
            label: "+ New Habit",
            onClick: () => setIsChoiceOpen(true),
          }}
        />

        {/* Tab Controls */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white rounded-full p-1 border border-border shadow-sm flex w-full max-w-[500px] mb-6">
            <TabsTrigger value="list" className="flex-1 rounded-full text-xs font-bold py-2 data-state=active:bg-navy-900 data-state=active:text-white transition-all cursor-pointer">
              List
            </TabsTrigger>
            <TabsTrigger value="gym" className="flex-1 rounded-full text-xs font-bold py-2 data-state=active:bg-navy-900 data-state=active:text-white transition-all cursor-pointer">
              Gym & Meals
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1 rounded-full text-xs font-bold py-2 data-state=active:bg-navy-900 data-state=active:text-white transition-all cursor-pointer">
              Calendar
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 rounded-full text-xs font-bold py-2 data-state=active:bg-navy-900 data-state=active:text-white transition-all cursor-pointer">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Gym & Meals Tab */}
          <TabsContent value="gym" className="space-y-6 outline-none">
            <GymRoutineTracker />
            <MealTracker />
          </TabsContent>

          {/* List Tab */}
          <TabsContent value="list" className="space-y-6 outline-none">
            {/* Neubrutalism Weekly Overview Widget (Top) */}
            <WeeklyOverviewWidget />

            {/* Dashboard Grid (Habits Checklist, Water Intake, Macros, Training & Diet) - FRONT & CENTER AT TOP */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-4">
              {/* Column 1: Habits Checklist */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-navy-950">
                  🌱 Habits & Routines
                </h3>
                {habitsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white rounded-2xl border-2 border-navy-950 p-4 h-16 animate-pulse shadow-[3px_3px_0px_0px_rgba(31,36,48,1)]" />
                    ))}
                  </div>
                ) : habits.length === 0 ? (
                  <EmptyState
                    title="Ready to build a new habit? 🚀"
                    description="Habits help you build daily routines and streaks. Pick a suggestion below or click 'Create a Habit'!"
                    Icon={Target}
                    ctaText="Create a Habit"
                    onCtaClick={() => setIsChoiceOpen(true)}
                  />
                ) : (
                  <div className={cn("space-y-3", habitLayoutStyle === "compact" && "space-y-2")}>
                    {habits.map((habit) => {
                      const isDone = isCompletedToday(habit.id);
                      const habitStreak = streaks[habit.id];

                      if (habitLayoutStyle === "compact") {
                        return (
                          <div
                            key={habit.id}
                            className={cn(
                              "bg-white rounded-2xl p-3 border-2 border-navy-950 flex items-center justify-between transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5",
                              isDone && "bg-emerald-50/70 opacity-90"
                            )}
                            onClick={() => router.push(`/goals/${habit.id}`)}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLog(habit.id, !isDone);
                                }}
                                className={cn(
                                  "h-8 w-8 rounded-xl border-2 border-navy-950 flex items-center justify-center font-black text-sm transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]",
                                  isDone ? "bg-emerald-400 text-navy-950" : "bg-white hover:bg-amber-100"
                                )}
                              >
                                {isDone ? "✓" : ""}
                              </button>
                              <div>
                                <h4 className={cn("font-black text-xs text-navy-950", isDone && "line-through text-navy-600")}>
                                  {habit.title}
                                </h4>
                                {habitStreak?.currentStreak ? (
                                  <span className="text-[9px] font-black text-amber-600 flex items-center gap-0.5 mt-0.5">
                                    🔥 {habitStreak.currentStreak} day streak
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-navy-950 bg-amber-400 text-navy-950">
                                {habit.frequency?.type || "DAILY"}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          streak={habitStreak}
                          isCompletedToday={isDone}
                          onToggle={() => handleToggleLog(habit.id, !isDone)}
                          onEdit={() => {
                            setEditingHabit(habit);
                            setEditHabitTitle(habit.title);
                            setEditHabitDesc(habit.reminderTime || "");
                          }}
                          onDelete={() => setDeleteHabitId(habit.id)}
                          onClick={() => router.push(`/goals/${habit.id}`)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Column 2: Water Log & Workouts */}
              <div className="space-y-6">
                {/* Water Log */}
                <div className="bg-white rounded-3xl p-5 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-navy-950">💧 Water Intake</h4>
                  <div className="flex gap-4 items-center">
                    <div
                      onClick={() => {
                        setCustomWaterAmount(String(waterLogged));
                        setIsWaterEditOpen(true);
                      }}
                      className="relative w-16 h-36 border-2 border-navy-950 rounded-2xl overflow-hidden flex items-end bg-sky-50 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] cursor-pointer hover:border-sky-600 transition-colors"
                    >
                      <div className="absolute inset-x-0 bottom-[25%] border-b border-dashed border-navy-950/20" />
                      <div className="absolute inset-x-0 bottom-[50%] border-b border-dashed border-navy-950/25" />
                      <div className="absolute inset-x-0 bottom-[75%] border-b border-dashed border-navy-950/30" />
                      <div
                        className="w-full bg-sky-400 transition-all duration-500 ease-out"
                        style={{ height: `${Math.min(100, (waterLogged / 1000) * 100)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-black text-navy-950 bg-white/90 px-1.5 py-0.5 rounded-xl border border-navy-950">
                          {waterLogged} ml ({ (waterLogged / 1000).toFixed(1) } L)
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <span className="text-[9px] font-black text-navy-700 block">Daily Target: 1000 ml (1 Ltr)</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => logWater(250)}
                          className="bg-sky-200 hover:bg-sky-300 border-2 border-navy-950 text-navy-950 text-[10px] font-black py-1.5 rounded-xl cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                        >
                          +250ml
                        </button>
                        <button
                          onClick={() => logWater(500)}
                          className="bg-sky-300 hover:bg-sky-400 border-2 border-navy-950 text-navy-950 text-[10px] font-black py-1.5 rounded-xl cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                        >
                          +500ml
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => logWater(-250)}
                          className="flex-1 bg-amber-100 hover:bg-amber-200 text-navy-950 text-[9px] font-black py-1 rounded-xl cursor-pointer border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] transition-all"
                        >
                          Remove 250ml
                        </button>
                        <button
                          onClick={() => {
                            setCustomWaterAmount(String(waterLogged));
                            setIsWaterEditOpen(true);
                          }}
                          className="bg-sky-200 hover:bg-sky-300 text-navy-950 text-[9px] font-black px-3 py-1 rounded-xl cursor-pointer border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] transition-all"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workout Tracker */}
                <div className="bg-white rounded-3xl p-5 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-navy-950">🏋️ Today's Training</h4>
                    <button
                      onClick={addWorkout}
                      className="text-[10px] font-black uppercase tracking-wider text-navy-950 bg-amber-300 border-2 border-navy-950 px-2.5 py-1 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                    >
                      + Exercise
                    </button>
                  </div>
                  {workouts.length === 0 ? (
                    <div className="text-center py-6 px-4 bg-amber-50/60 border-2 border-dashed border-navy-950 rounded-2xl shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
                      <p className="text-[10px] font-black text-navy-950 uppercase tracking-wider block">No exercises today</p>
                      <span className="text-[9px] text-navy-700 font-bold block mt-0.5">Click "+ Exercise" above to log custom training</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {workouts.map((w) => (
                        <div
                          key={w.id}
                          onClick={() => toggleWorkout(w.id, !w.completed)}
                          className={cn(
                            "p-3 rounded-2xl border-2 border-navy-950 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]",
                            w.completed ? "bg-amber-300 text-navy-950" : "bg-white text-navy-950 hover:bg-amber-50"
                          )}
                        >
                          <div className="min-w-0">
                            <span className={cn("text-xs font-black text-navy-950 block", w.completed && "line-through opacity-70")}>
                              {w.name}
                            </span>
                            {w.details && (
                              <span className="text-[9px] text-navy-800 font-bold block">{w.details}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingWorkout(w);
                                setEditWorkoutName(w.name);
                                setEditWorkoutDetails(w.details || "");
                              }}
                              className="text-navy-950 hover:scale-110 p-1 cursor-pointer border-none bg-transparent"
                              title="Edit exercise"
                            >
                              <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteWorkoutId(w.id);
                              }}
                              className="text-rose-600 hover:scale-110 p-1 cursor-pointer border-none bg-transparent"
                              title="Delete exercise"
                            >
                              <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                            </button>
                            <div className={cn(
                              "h-5 w-5 rounded-lg border-2 border-navy-950 flex items-center justify-center transition-all shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]",
                              w.completed ? "bg-navy-950 text-white" : "bg-white"
                            )}>
                              {w.completed && <span className="text-[10px] font-black">✓</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: Macronutrients & Diet */}
              <div className="space-y-6">
                {/* Today's Macro Count Card */}
                <div className="bg-white rounded-3xl p-5 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-navy-950">🧁 Today's Macro Count</h4>
                      <p className="text-sm font-black text-navy-950 mt-0.5">
                        {displayCalories} <span className="font-extrabold text-navy-700 text-[10px]">kcal total {liveMealTotals.calories > 0 ? "(From Logged Meals)" : ""}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={updateMacro}
                      className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-navy-950 font-black text-[11px] border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                    >
                      ✏️ Edit Target
                    </button>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] font-black mb-1">
                        <span className="text-sky-800">Protein: {displayProtein}g</span>
                        <span className="text-navy-700 font-bold">{Math.round(displayProtein * 4)} kcal</span>
                      </div>
                      <div className="h-3 w-full bg-white rounded-full overflow-hidden border-2 border-navy-950 p-0.5 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]">
                        <div className="h-full bg-sky-400 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (displayProtein / 150) * 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-black mb-1">
                        <span className="text-rose-800">Carbs: {displayCarbs}g</span>
                        <span className="text-navy-700 font-bold">{Math.round(displayCarbs * 4)} kcal</span>
                      </div>
                      <div className="h-3 w-full bg-white rounded-full overflow-hidden border-2 border-navy-950 p-0.5 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]">
                        <div className="h-full bg-rose-400 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (displayCarbs / 200) * 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-black mb-1">
                        <span className="text-emerald-800">Fat: {displayFat}g</span>
                        <span className="text-navy-700 font-bold">{Math.round(displayFat * 9)} kcal</span>
                      </div>
                      <div className="h-3 w-full bg-white rounded-full overflow-hidden border-2 border-navy-950 p-0.5 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]">
                        <div className="h-full bg-emerald-400 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (displayFat / 70) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diet Checklist */}
                <div className="bg-white rounded-3xl p-5 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-navy-950">🥗 Today's Diet</h4>
                    <button
                      onClick={addDiet}
                      className="text-[10px] font-black uppercase tracking-wider text-navy-950 bg-amber-300 border-2 border-navy-950 px-2.5 py-1 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                    >
                      + Meal
                    </button>
                  </div>
                  {diet.length === 0 ? (
                    <div className="text-center py-6 px-4 bg-amber-50/60 border-2 border-dashed border-navy-950 rounded-2xl shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
                      <p className="text-[10px] font-black text-navy-950 uppercase tracking-wider block">No meals logged today</p>
                      <span className="text-[9px] text-navy-700 font-bold block mt-0.5">Click "+ Meal" above to log food intake</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {diet.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => toggleDiet(d.id, !d.completed)}
                          className={cn(
                            "p-3 rounded-2xl border-2 border-navy-950 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]",
                            d.completed ? "bg-emerald-300 text-navy-950" : "bg-white text-navy-950 hover:bg-amber-50"
                          )}
                        >
                          <div className="min-w-0">
                            <span className={cn("text-xs font-black text-navy-950 block", d.completed && "line-through opacity-70")}>
                              {d.name}
                            </span>
                            {d.details && (
                              <span className="text-[9px] text-navy-800 font-bold block">{d.details}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingDiet(d);
                                setEditDietName(d.name);
                                setEditDietDetails(d.details || "");
                              }}
                              className="text-navy-950 hover:scale-110 p-1 cursor-pointer border-none bg-transparent"
                              title="Edit meal"
                            >
                              <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteDietId(d.id);
                              }}
                              className="text-rose-600 hover:scale-110 p-1 cursor-pointer border-none bg-transparent"
                              title="Delete meal"
                            >
                              <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                            </button>
                            <div className={cn(
                              "h-5 w-5 rounded-lg border-2 border-navy-950 flex items-center justify-center transition-all shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]",
                              d.completed ? "bg-navy-950 text-white" : "bg-white"
                            )}>
                              {d.completed && <span className="text-[10px] font-black">✓</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Health Profile Stats Bar */}
            {/* Health & Weight Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] border-2 border-navy-950 flex items-center justify-between gap-3 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <div>
                  <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest block">⚖️ Current Weight</span>
                  <span className="text-xl font-black text-navy-950 block mt-0.5">{userProfile.weight || "68 kg"}</span>
                </div>
                <button
                  type="button"
                  onClick={updateProfileStat}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-navy-950 border-2 border-navy-950 font-black text-xs transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] active:translate-x-0.5 active:translate-y-0.5"
                >
                  ✏️ Edit Weight
                </button>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] border-2 border-navy-950 flex items-center justify-between gap-3 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <div>
                  <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest block">🎂 Age</span>
                  <span className="text-sm font-black text-navy-950 block mt-0.5">{userProfile.age || "24 Years"}</span>
                </div>
                <button type="button" onClick={updateProfileStat} className="text-xs text-navy-950 font-black hover:underline cursor-pointer">Edit</button>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] border-2 border-navy-950 flex items-center justify-between gap-3 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <div>
                  <span className="text-[10px] font-black text-navy-700 uppercase tracking-widest block">👤 Gender</span>
                  <span className="text-sm font-black text-navy-950 block mt-0.5">{userProfile.gender || "Female"}</span>
                </div>
                <button type="button" onClick={updateProfileStat} className="text-xs text-navy-950 font-black hover:underline cursor-pointer">Edit</button>
              </div>
            </div>

            {/* Suggestions Carousel */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-navy-700">Suggested Goals</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none select-none -mx-4 px-4 md:-mx-0 md:px-0">
                {SUGGESTED_HABITS.map((suggested) => (
                  <div
                    key={suggested.title}
                    className="flex-shrink-0 w-[200px] bg-white rounded-2xl p-3 border-2 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] flex items-center justify-between gap-2 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-navy-950 block truncate">{suggested.title}</span>
                      <span className="text-[8px] text-navy-700 font-bold block truncate">{suggested.desc}</span>
                    </div>
                    <button
                      onClick={() => handleAddSuggested(suggested)}
                      className="bg-amber-400 hover:bg-amber-500 text-navy-950 p-1.5 rounded-xl border-2 border-navy-950 cursor-pointer transition-all shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] active:translate-x-0.5 active:translate-y-0.5 outline-none flex-shrink-0"
                    >
                      <Plus className="h-3 w-3 stroke-[3]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sleep & Active Time Widgets */}
            <SleepAndActiveWidgets />

            {/* Gym Routine & Machines Tracker (Full CRUD) */}
            <GymRoutineTracker />

            {/* Daily Meal Routine & Nutrition Tracker (Full CRUD) */}
            <MealTracker />

            {/* Daily Mood & Energy Journaling Widget */}
            <MoodJournalWidget dateStr={selectedDate} />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[0_8px_24px_rgba(31,36,48,0.06)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
                  {format(today, "MMMM yyyy")} Heatmap
                </h3>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-navy-600 uppercase tracking-wider">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Grid items */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty placeholders for offset */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Days in Month */}
                {daysInMonth.map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const completion = getCompletionPercentage(dayStr);
                  const isCurrent = isSameDay(day, today);

                  let bgClass = "bg-cream-bg/30 border-transparent text-navy-900/50";
                  if (completion === 100) bgClass = "bg-amber-500 border-amber-500 text-navy-900";
                  else if (completion >= 50) bgClass = "bg-amber-500/50 border-amber-500/20 text-navy-900";
                  else if (completion >= 20) bgClass = "bg-amber-500/20 border-amber-500/10 text-navy-900";

                  return (
                    <div
                      key={dayStr}
                      className={cn(
                        "aspect-square rounded-[var(--radius-sm)] border flex items-center justify-center text-[11px] font-bold transition-all relative",
                        bgClass,
                        isCurrent && "border-2 border-navy-900"
                      )}
                      title={`${format(day, "MMM d")}: ${completion}% complete`}
                    >
                      {format(day, "d")}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t text-[10px] font-semibold text-navy-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded bg-cream-bg/30 border" /> Not Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded bg-amber-500/20 border" /> Some Habits Done
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded bg-amber-500/50 border" /> Most Habits Done
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded bg-amber-500 border" /> Fully Completed
                </span>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Leaderboard Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-[0_8px_24px_rgba(31,36,48,0.04)] flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Active Streaks</h5>
                    <p className="text-xl font-extrabold text-navy-900 mt-0.5">{activeStreaksList.length}</p>
                  </div>
                </div>

                <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-[0_8px_24px_rgba(31,36,48,0.04)] flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Best Streak</h5>
                    <p className="text-xl font-extrabold text-navy-900 mt-0.5">{longestStreakValue} days</p>
                  </div>
                </div>

                <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-[0_8px_24px_rgba(31,36,48,0.04)] flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-mint-600/10 flex items-center justify-center text-mint-600">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Completion Rate</h5>
                    <p className="text-xl font-extrabold text-navy-900 mt-0.5">{overallCompletionRate}%</p>
                  </div>
                </div>
              </div>

              {/* Completion Rate Chart */}
              <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[0_8px_24px_rgba(31,36,48,0.06)] space-y-4">
                <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
                  Completion Rate by Day of Week
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                      <YAxis stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                      <Tooltip formatter={(v) => [`${v}%`, "Completion Rate"]} contentStyle={{ borderRadius: "12px", fontFamily: "var(--font-sans)", fontSize: "12px" }} />
                      <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                        {barChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.rate >= 75 ? "#7CC3A2" : entry.rate >= 50 ? "#F5B942" : "#F2A6A0"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Habit Template Choice Modal */}
      <TemplateSelectionModal
        open={isChoiceOpen}
        onOpenChange={setIsChoiceOpen}
        title="ADD HABIT"
        subtitle="START FROM SCRATCH OR APPLY A READY-MADE ROUTINE PACK."
        blankLabel="BLANK HABIT"
        blankDesc="CUSTOM NAME, COLOR, CATEGORY"
        templatesLabel="TEMPLATE PACKS"
        templatesDesc="MONK MODE, REDDIT ESSENTIALS, ATHLETIC..."
        templatePacks={HABIT_TEMPLATE_PACKS}
        onSelectBlank={() => setIsAddOpen(true)}
        onApplyTemplatePack={handleApplyHabitPack}
      />

      {/* Add Habit Responsive Form */}
      <ResponsiveFormContainer
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Create a Habit"
        description="Build consistency with a new daily or weekly routine"
      >
        <NewHabitForm onSubmit={handleAddHabit} loading={addHabitMutation.isPending} />
      </ResponsiveFormContainer>

      {/* Edit Health Profile Modal */}
      <ResponsiveFormContainer
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        title="Edit Health Stats"
        description="Update your gender, age, and weight information"
      >
        <form onSubmit={handleProfileSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {["Female", "Male", "Non-binary", "Prefer not to say"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setProfileForm({ ...profileForm, gender: g })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    profileForm.gender === g
                      ? "bg-amber-500 border-amber-500 text-navy-900 shadow-sm"
                      : "bg-cream-bg border-border/85 text-navy-600 hover:border-amber-300 hover:bg-amber-50"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Age (Years)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={ageVal}
              onChange={(e) => setAgeVal(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="Enter your age"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Current Weight</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                min={1}
                max={500}
                value={weightVal}
                onChange={(e) => {
                  setWeightVal(e.target.value);
                  setProfileForm({ ...profileForm, weight: `${e.target.value} ${weightUnit}` });
                }}
                className="flex-1 bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
                placeholder="Enter weight"
                required
              />
              <div className="flex rounded-xl border border-border/85 overflow-hidden">
                {["kg", "lbs"].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      setWeightUnit(u);
                      setProfileForm({ ...profileForm, weight: `${weightVal} ${u}` });
                    }}
                    className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      weightUnit === u
                        ? "bg-amber-500 text-navy-900"
                        : "bg-cream-bg text-navy-600 hover:bg-amber-50"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
          >
            Save Profile Stats
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Add Workout Modal */}
      <ResponsiveFormContainer
        open={isWorkoutOpen}
        onOpenChange={setIsWorkoutOpen}
        title="Add Exercise"
        description="Add a physical workout routine to complete today"
      >
        <form onSubmit={handleWorkoutSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Exercise Name</label>
            <input
              type="text"
              value={workoutForm.name}
              onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="e.g. Sit and Wait"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Details</label>
            <input
              type="text"
              value={workoutForm.details}
              onChange={(e) => setWorkoutForm({ ...workoutForm, details: e.target.value })}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="e.g. 10 min 5 approaches"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
          >
            Add Exercise
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Edit Macros Modal */}
      <ResponsiveFormContainer
        open={isMacrosOpen}
        onOpenChange={setIsMacrosOpen}
        title="Edit Macronutrients"
        description="Update your goal macro ratios in grams"
      >
        <form onSubmit={handleMacrosSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Protein (g)</label>
            <input
              type="number"
              value={macrosForm.protein}
              onChange={(e) => setMacrosForm({ ...macrosForm, protein: Number(e.target.value) })}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="e.g. 54"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Carbs (g)</label>
            <input
              type="number"
              value={macrosForm.carbs}
              onChange={(e) => setMacrosForm({ ...macrosForm, carbs: Number(e.target.value) })}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="e.g. 32"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Fat (g)</label>
            <input
              type="number"
              value={macrosForm.fat}
              onChange={(e) => setMacrosForm({ ...macrosForm, fat: Number(e.target.value) })}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="e.g. 7"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
          >
            Save Macros
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Add Diet Modal */}
      <ResponsiveFormContainer
        open={isDietOpen}
        onOpenChange={setIsDietOpen}
        title="Add Meal"
        description="Log food intake item details"
      >
        <form onSubmit={handleDietSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Meal / Food</label>
            <input
              type="text"
              value={dietForm.name}
              onChange={(e) => setDietForm({ ...dietForm, name: e.target.value })}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="e.g. Morning: Dry food"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Details</label>
            <input
              type="text"
              value={dietForm.details}
              onChange={(e) => setDietForm({ ...dietForm, details: e.target.value })}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="e.g. 100 g"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
          >
            Log Meal
          </Button>
        </form>
      </ResponsiveFormContainer>
      {/* Edit Water Intake Modal */}
      <ResponsiveFormContainer
        open={isWaterEditOpen}
        onOpenChange={setIsWaterEditOpen}
        title="Edit Water Intake"
        description="Set custom water consumption volume in ml"
      >
        <form onSubmit={handleWaterEditSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Total Volume (ml)</label>
            <input
              type="number"
              value={customWaterAmount}
              onChange={(e) => setCustomWaterAmount(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="e.g. 2000"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={setWaterMutation.isPending}
            className="w-full bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
          >
            {setWaterMutation.isPending ? "Saving…" : "Save Intake"}
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Edit Workout Modal */}
      <ResponsiveFormContainer
        open={editingWorkout !== null}
        onOpenChange={(open) => {
          if (!open) setEditingWorkout(null);
        }}
        title="Edit Exercise"
        description="Update exercise details"
      >
        <form onSubmit={handleWorkoutUpdateSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Exercise Name</label>
            <input
              type="text"
              value={editWorkoutName}
              onChange={(e) => setEditWorkoutName(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Details</label>
            <input
              type="text"
              value={editWorkoutDetails}
              onChange={(e) => setEditWorkoutDetails(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
          <Button
            type="submit"
            disabled={updateWorkoutMutation.isPending}
            className="w-full bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
          >
            {updateWorkoutMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Delete Workout Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteWorkoutId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteWorkoutId(null);
        }}
        onConfirm={async () => {
          if (deleteWorkoutId) {
            try {
              await deleteWorkoutMutation.mutateAsync({ date: selectedDate, id: deleteWorkoutId });
              toast.success("Exercise removed");
            } catch {
              toast.error("Failed to delete exercise");
            }
            setDeleteWorkoutId(null);
          }
        }}
        title="Delete Exercise"
        description="Are you sure you want to delete this workout log? This cannot be undone."
      />

      {/* Edit Diet Modal */}
      <ResponsiveFormContainer
        open={editingDiet !== null}
        onOpenChange={(open) => {
          if (!open) setEditingDiet(null);
        }}
        title="Edit Meal"
        description="Update food details"
      >
        <form onSubmit={handleDietUpdateSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Meal / Food</label>
            <input
              type="text"
              value={editDietName}
              onChange={(e) => setEditDietName(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Details</label>
            <input
              type="text"
              value={editDietDetails}
              onChange={(e) => setEditDietDetails(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
          <Button
            type="submit"
            disabled={updateDietMutation.isPending}
            className="w-full bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
          >
            {updateDietMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Edit Habit Modal */}
      <ResponsiveFormContainer
        open={editingHabit !== null}
        onOpenChange={(open) => {
          if (!open) setEditingHabit(null);
        }}
        title="Edit Habit Goal"
        description="Update your habit details"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingHabit) {
              updateHabitMutation.mutate({
                id: editingHabit.id,
                title: editHabitTitle,
                reminderTime: editHabitDesc,
              });
              toast.success("Habit updated!");
              setEditingHabit(null);
            }
          }}
          className="space-y-4 pt-2"
        >
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Habit Title</label>
            <input
              type="text"
              value={editHabitTitle}
              onChange={(e) => setEditHabitTitle(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Reminder Time (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 08:00 AM"
              value={editHabitDesc}
              onChange={(e) => setEditHabitDesc(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
          <Button
            type="submit"
            disabled={updateHabitMutation.isPending}
            className="w-full bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
          >
            {updateHabitMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Delete Habit Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteHabitId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteHabitId(null);
        }}
        onConfirm={async () => {
          if (deleteHabitId) {
            try {
              await deleteHabitMutation.mutateAsync(deleteHabitId);
              toast.success("Habit deleted");
            } catch {
              toast.error("Failed to delete habit");
            }
            setDeleteHabitId(null);
          }
        }}
        title="Delete Habit"
        description="Are you sure you want to delete this habit goal? This will archive your goal."
      />

      {/* Delete Diet Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteDietId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteDietId(null);
        }}
        onConfirm={async () => {
          if (deleteDietId) {
            try {
              await deleteDietMutation.mutateAsync({ date: selectedDate, id: deleteDietId });
              toast.success("Meal removed");
            } catch {
              toast.error("Failed to delete meal");
            }
            setDeleteDietId(null);
          }
        }}
        title="Delete Meal"
        description="Are you sure you want to delete this food log? This cannot be undone."
      />
    </div>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream-bg">
        <div className="h-8 w-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
      </div>
    }>
      <GoalsPageContent />
    </Suspense>
  );
}
