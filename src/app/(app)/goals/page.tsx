"use client";

import { useState, useEffect, Suspense } from "react";
import {
  useHabits,
  useAddHabit,
  useUpdateHabit,
  useDeleteHabit,
  useToggleHabitLog,
  useHabitLogs,
  useMonthHabitLogs,
  useStreaks,
  useStreakFreeze,
  useHealthProfile,
  useUpdateHealthProfile,
  useWaterLog,
  useLogWater,
  useSetWater,
} from "@/lib/queries/goals";
import { useUserAchievements } from "@/lib/queries/achievements";
import { HabitCard } from "@/components/goals/HabitCard";
import { NewHabitForm } from "@/components/goals/NewHabitForm";
import { MoodJournalWidget } from "@/components/goals/MoodJournalWidget";
import { SleepAndActiveWidgets } from "@/components/goals/SleepAndActiveWidgets";
import { GymRoutineTracker } from "@/components/goals/GymRoutineTracker";
import { MealTracker } from "@/components/goals/MealTracker";
import { WeeklyOverviewWidget } from "@/components/goals/WeeklyOverviewWidget";
import { WeeklyVelocityAndHabitMatrix } from "@/components/goals/WeeklyVelocityAndHabitMatrix";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { HABIT_TEMPLATE_PACKS } from "@/lib/templates-data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Plus, Flame, Award, BarChart2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, subWeeks } from "date-fns";
import { toast } from "sonner";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { SpaceHeroBanner } from "@/components/shared/SpaceHeroBanner";
import { ProactiveReminderBanner } from "@/components/shared/ProactiveReminderBanner";
import { useSearchParams, useRouter } from "next/navigation";

function GoalsPageContent() {
  const { selectedDate } = useUIStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "list");
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

  // States for Health Profile Modal
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ gender: "", age: "", weight: "" });

  // Health Profile & Habits Database Query hooks
  const { data: userProfile = { gender: "Female", age: "24 Years", weight: "68 kg" } } = useHealthProfile();
  const updateProfileMutation = useUpdateHealthProfile();

  const { data: waterLog = { id: selectedDate, date: selectedDate, amount: 0 } } = useWaterLog(selectedDate);
  const logWaterMutation = useLogWater();
  const waterLogged = waterLog.amount;

  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: streaks = {} } = useStreaks();
  const { data: streakFreeze = { tokensAvailable: 1, frozenDates: [] } } = useStreakFreeze();
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

  // Water edit states
  const [isWaterEditOpen, setIsWaterEditOpen] = useState(false);
  const [customWaterAmount, setCustomWaterAmount] = useState("");

  // Habit Edit/Delete states
  const [editingHabit, setEditingHabit] = useState<any | null>(null);
  const [editHabitTitle, setEditHabitTitle] = useState("");
  const [editHabitDesc, setEditHabitDesc] = useState("");
  const [deleteHabitId, setDeleteHabitId] = useState<string | null>(null);

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
    const dayCounts: Record<number, { completed: number; totalDays: number }> = {};
    for (let i = 0; i < 7; i++) dayCounts[i] = { completed: 0, totalDays: 0 };
    const fourWeekStart = subWeeks(new Date(), 4);
    const windowDays = eachDayOfInterval({ start: fourWeekStart, end: new Date() });
    for (const day of windowDays) {
      dayCounts[getDay(day)].totalDays++;
    }
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

        {/* Proactive Reminder Banner */}
        <ProactiveReminderBanner space="goals" />

        {/* Sleek Ultra-Compact Streak Freeze Pill Banner */}
        <div className="bg-[#FAF8F5] rounded-xl p-3 border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-sky-200 border-2 border-[#161514] flex items-center justify-center text-base shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]">
              🛡️
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-black text-xs text-[#161514] uppercase tracking-tight truncate">
                  Streak Protection
                </h4>
                <span className="bg-sky-400 text-navy-950 font-black text-[9px] px-1.5 py-0.5 rounded-md border border-[#161514] shrink-0">
                  {streakFreeze.tokensAvailable}/2 Active
                </span>
              </div>
              <p className="text-[10px] text-[#161514]/70 font-medium truncate pt-0.5">
                {streakFreeze.tokensAvailable > 0
                  ? "1-day missed log bridge active (travel & sickness protection)"
                  : "0 Tokens available. Refills 1st of month"}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <span className="text-[10px] font-black text-sky-950 bg-sky-200 px-2 py-1 rounded-lg border border-[#161514] flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]">
              <span>🧊</span>
              <span className="hidden xs:inline">Armed</span>
            </span>
          </div>
        </div>

        {/* Tab Controls (Horizontally scrollable on mobile, inline on desktop) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full overflow-x-auto no-scrollbar pb-1 mb-5">
            <TabsList className="bg-[#FAF8F5] rounded-2xl p-1.5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] flex items-center gap-1.5 w-max min-w-full sm:min-w-0 sm:w-auto">
              <TabsTrigger
                value="list"
                className="rounded-xl text-xs font-black py-2 px-3.5 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#CEF431] data-[state=active]:text-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] text-[#161514]/70 hover:text-[#161514] hover:bg-white/50 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>🌱</span>
                <span>Habits & Life</span>
              </TabsTrigger>
              <TabsTrigger
                value="gym"
                className="rounded-xl text-xs font-black py-2 px-3.5 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#CEF431] data-[state=active]:text-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] text-[#161514]/70 hover:text-[#161514] hover:bg-white/50 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>🏋️</span>
                <span>Gym & Meals</span>
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="rounded-xl text-xs font-black py-2 px-3.5 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#CEF431] data-[state=active]:text-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] text-[#161514]/70 hover:text-[#161514] hover:bg-white/50 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>📅</span>
                <span>Calendar</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="rounded-xl text-xs font-black py-2 px-3.5 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#CEF431] data-[state=active]:text-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] text-[#161514]/70 hover:text-[#161514] hover:bg-white/50 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>📊</span>
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 2: Gym & Meals Workspace (Dedicated full-width view) */}
          <TabsContent value="gym" className="space-y-6 outline-none">
            <div id="gym-section">
              <GymRoutineTracker />
            </div>
            <div id="nutrition-section">
              <MealTracker />
            </div>
          </TabsContent>

          {/* Tab 1: Habits & Wellness Workspace */}
          <TabsContent value="list" className="space-y-6 outline-none">
            {/* Neobrutalism Weekly Overview Widget (Top) */}
            <WeeklyOverviewWidget />

            {/* Weekly Velocity & 4-Week Activity Heatmap Matrix */}
            <WeeklyVelocityAndHabitMatrix />

            {/* 2-Column Responsive Layout: Habits Checklist + Hydration & Health Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-4">
              {/* Left Column (2 cols on lg): Habits Checklist */}
              <div id="habits-section" className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-navy-950 flex items-center gap-1.5">
                    <span>🌱 Active Habit Streaks</span>
                    <span className="bg-[#CEF431] text-[#161514] text-[10px] px-2 py-0.5 rounded-full border border-[#161514] font-black">
                      {habits.length}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsChoiceOpen(true)}
                    className="text-[10px] font-black uppercase tracking-wider text-navy-950 bg-[#CEF431] border-2 border-navy-950 px-2.5 py-1 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    + New Habit
                  </button>
                </div>

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

                {/* Suggestions Carousel */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-navy-700">Suggested Routines</h4>
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
              </div>

              {/* Right Column (1 col on lg): Hydration & Health Stats */}
              <div className="space-y-4">
                {/* Water Log */}
                <div className="bg-white rounded-3xl p-5 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-navy-950">💧 Water Intake</h4>
                  <div className="flex gap-4 items-center">
                    <div
                      onClick={() => {
                        setCustomWaterAmount(String(waterLogged));
                        setIsWaterEditOpen(true);
                      }}
                      className="relative w-16 h-36 border-2 border-navy-950 rounded-2xl overflow-hidden flex items-end bg-sky-50 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] cursor-pointer hover:border-sky-600 transition-colors shrink-0"
                    >
                      <div className="absolute inset-x-0 bottom-[25%] border-b border-dashed border-navy-950/20" />
                      <div className="absolute inset-x-0 bottom-[50%] border-b border-dashed border-navy-950/25" />
                      <div className="absolute inset-x-0 bottom-[75%] border-b border-dashed border-navy-950/30" />
                      <div
                        className="w-full bg-sky-400 transition-all duration-500 ease-out"
                        style={{ height: `${Math.min(100, (waterLogged / 1000) * 100)}%` }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                        <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-xl border border-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] text-center">
                          <span className="text-sm sm:text-base font-black text-navy-950 block leading-none">{waterLogged}</span>
                          <span className="text-[8px] font-black uppercase text-sky-700 tracking-wider block mt-0.5">ml</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2.5">
                      <div>
                        <div className="text-xs font-black text-navy-950 uppercase flex items-center justify-between">
                          <span>{waterLogged} ml Logged</span>
                          <span className="text-[10px] text-sky-700 font-black">({(waterLogged / 1000).toFixed(1)} L)</span>
                        </div>
                        <span className="text-[9px] font-bold text-navy-600 block mt-0.5">
                          Target: 1000 ml (1.0 L) • {Math.min(100, Math.round((waterLogged / 1000) * 100))}%
                        </span>
                      </div>
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
                          -250ml
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await setWaterMutation.mutateAsync({ date: selectedDate, amount: 0 });
                              toast.success("Water reset to 0ml for today 💧");
                            } catch {
                              toast.error("Failed to reset water intake");
                            }
                          }}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-950 text-[9px] font-black px-2 py-1 rounded-xl cursor-pointer border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] transition-all"
                          title="Reset water intake to 0ml for selected date"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => {
                            setCustomWaterAmount(String(waterLogged));
                            setIsWaterEditOpen(true);
                          }}
                          className="bg-sky-200 hover:bg-sky-300 text-navy-950 text-[9px] font-black px-2.5 py-1 rounded-xl cursor-pointer border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] transition-all"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Health & Weight Profile Card */}
                <div className="bg-white rounded-3xl p-5 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-navy-950">⚖️ Body & Health Stats</h4>
                    <button
                      type="button"
                      onClick={updateProfileStat}
                      className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-navy-950 border-2 border-navy-950 font-black text-[10px] transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] active:translate-x-0.5 active:translate-y-0.5"
                    >
                      ✏️ Edit Stats
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="bg-[#FAF8F5] p-2 rounded-xl border border-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] text-center">
                      <span className="text-[8px] font-black uppercase text-gray-500 block">Weight</span>
                      <span className="text-xs font-black text-navy-950 block mt-0.5">{userProfile.weight || "68 kg"}</span>
                    </div>
                    <div className="bg-[#FAF8F5] p-2 rounded-xl border border-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] text-center">
                      <span className="text-[8px] font-black uppercase text-gray-500 block">Age</span>
                      <span className="text-xs font-black text-navy-950 block mt-0.5">{userProfile.age || "24 Yrs"}</span>
                    </div>
                    <div className="bg-[#FAF8F5] p-2 rounded-xl border border-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] text-center">
                      <span className="text-[8px] font-black uppercase text-gray-500 block">Gender</span>
                      <span className="text-xs font-black text-navy-950 block mt-0.5">{userProfile.gender || "Female"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sleep, Energy & Mood Journal Section */}
            <div id="mood-section" className="space-y-4 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-navy-950 flex items-center gap-1.5">
                <span>😴 Sleep, Energy & Mood Journal</span>
              </h3>
              <SleepAndActiveWidgets />
              <MoodJournalWidget dateStr={selectedDate} />
            </div>
          </TabsContent>

          {/* Tab 3: Calendar Heatmap */}
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
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

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

          {/* Tab 4: Analytics */}
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
