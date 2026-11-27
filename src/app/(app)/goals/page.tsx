"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
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
  useAddWorkout,
} from "@/lib/queries/goals";
import { useAddMealPlan } from "@/lib/queries/gym";
import { useUserAchievements } from "@/lib/queries/achievements";
import { HabitListRow } from "@/components/goals/HabitListRow";
import { HabitsHeroPager } from "@/components/goals/HabitsHeroPager";
import { HabitsDateStrip } from "@/components/goals/HabitsDateStrip";
import { DoorTileRow } from "@/components/goals/DoorTileRow";
import { WaterTracker } from "@/components/goals/WaterTracker";
import { SleepAndActiveWidgets } from "@/components/goals/SleepAndActiveWidgets";
import { MobileAppBar } from "@/components/mobile/MobileAppBar";
import { SegmentedSubNav } from "@/components/mobile/SegmentedSubNav";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { HabitsCockpitSkeleton, HabitsListSkeleton } from "@/components/shared/NeobrutalistSkeleton";
import { soundFX } from "@/components/shared/SoundFX";
import { TemplatePack } from "@/components/shared/TemplateSelectionModal";
import type { AtomicHabitPreset } from "@/components/goals/HabitChoiceModal";
import { Button } from "@/components/ui/button";
import { HabitCompanionSprite } from "@/components/mascot/HabitCompanionSprite";
import { EmptyState } from "@/components/shared/EmptyState";

// Lazy-Loaded Heavy Modals (Zero TBT & Fast Initial Paint)
const HabitChoiceModal = dynamic(
  () => import("@/components/goals/HabitChoiceModal").then((m) => m.HabitChoiceModal),
  { ssr: false }
);
const NewHabitForm = dynamic(
  () => import("@/components/goals/NewHabitForm").then((m) => m.NewHabitForm),
  { ssr: false }
);
const DeleteConfirmationModal = dynamic(
  () => import("@/components/shared/DeleteConfirmationModal").then((m) => m.DeleteConfirmationModal),
  { ssr: false }
);
const QuickWaterModal = dynamic(
  () => import("@/components/goals/QuickWaterModal").then((m) => m.QuickWaterModal),
  { ssr: false }
);
const QuickMealModal = dynamic(
  () => import("@/components/goals/QuickMealModal").then((m) => m.QuickMealModal),
  { ssr: false }
);
const QuickWorkoutModal = dynamic(
  () => import("@/components/goals/QuickWorkoutModal").then((m) => m.QuickWorkoutModal),
  { ssr: false }
);
import {
  Target,
  ShieldCheck,
  Bot,
  Flame,
  Moon,
  RefreshCw,
  Bell,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";
import { format, getDay, startOfWeek, addDays, isSameDay } from "date-fns";
import { toast, strobiToast } from "@/lib/utils/toasts";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";

function GoalsPageContent() {
  const { selectedDate, setSelectedDate } = useUIStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");

  // Auto-snap habit cockpit to current day when entering habits space
  useEffect(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (selectedDate !== todayStr) {
      setSelectedDate(todayStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subtab & deep-link action handlers
  const actionParam = searchParams.get("action");
  useEffect(() => {
    if (tabParam === "gym") {
      router.replace("/goals/gym");
    } else if (tabParam === "nutrition") {
      router.replace("/goals/nutrition");
    } else if (tabParam === "calendar" || tabParam === "analytics") {
      router.replace("/goals/analytics");
    }
  }, [tabParam, router]);

  useEffect(() => {
    if (actionParam === "new-habit") setIsChoiceOpen(true);
    else if (actionParam === "quick-meal") setIsQuickMealOpen(true);
    else if (actionParam === "quick-workout") setIsQuickWorkoutOpen(true);
    else if (actionParam === "water") setIsQuickWaterOpen(true);
  }, [actionParam]);

  // Modal / Sheet visibility states
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isWaterSheetOpen, setIsWaterSheetOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRemindersSheetOpen, setIsRemindersSheetOpen] = useState(false);
  const [isRecoverySheetOpen, setIsRecoverySheetOpen] = useState(false);
  const [isShieldInfoOpen, setIsShieldInfoOpen] = useState(false);
  const [isQuickWaterOpen, setIsQuickWaterOpen] = useState(false);
  const [isQuickMealOpen, setIsQuickMealOpen] = useState(false);
  const [isQuickWorkoutOpen, setIsQuickWorkoutOpen] = useState(false);
  const [showAllHabits, setShowAllHabits] = useState(false);

  useEffect(() => {
    const handleOpenReflectionEvent = () => {
      soundFX.playPop();
      soundFX.vibrate(15);
      setIsRecoverySheetOpen(true);
    };
    window.addEventListener("invictus:goals-open-reflection", handleOpenReflectionEvent);
    return () => {
      window.removeEventListener("invictus:goals-open-reflection", handleOpenReflectionEvent);
    };
  }, []);

  // Health Profile & Habits Database Query hooks
  const { data: userProfile = { gender: "Female", age: "24 Years", weight: "68 kg" } } = useHealthProfile();
  const updateProfileMutation = useUpdateHealthProfile();

  const { data: waterLog = { id: selectedDate, date: selectedDate, amount: 0 } } = useWaterLog(selectedDate);
  const logWaterMutation = useLogWater();
  const setWaterMutation = useSetWater();
  const waterLogged = waterLog.amount;

  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: streaks = {} } = useStreaks();
  const { data: streakFreeze = { userId: "", tokensAvailable: 1, lastMonthlyCredit: "", frozenDates: [], autoShieldEvent: null } } = useStreakFreeze();
  const { data: logs = [] } = useHabitLogs(selectedDate);

  // Active 7-Day Window Range & Logs
  const weekRange = useMemo(() => {
    const baseDate = new Date(selectedDate);
    const validBase = isNaN(baseDate.getTime()) ? new Date() : baseDate;
    const start = startOfWeek(validBase, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    return {
      startStr: format(start, "yyyy-MM-dd"),
      endStr: format(end, "yyyy-MM-dd"),
      start,
    };
  }, [selectedDate]);

  const { data: weekLogs = [] } = useMonthHabitLogs(weekRange.startStr, weekRange.endStr);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(weekRange.start, i);
      const dateStr = format(d, "yyyy-MM-dd");
      return {
        date: d,
        dateStr,
        dayLabel: format(d, "EEE"),
        dayNum: format(d, "d"),
        isToday: isSameDay(d, new Date()),
        isSelected: dateStr === selectedDate,
      };
    });
  }, [weekRange, selectedDate]);

  const achievements = useUserAchievements();

  const addHabitMutation = useAddHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const toggleLogMutation = useToggleHabitLog();
  const addMealPlanMutation = useAddMealPlan();
  const addWorkoutMutation = useAddWorkout();

  // Habit Edit/Delete states
  const [editingHabit, setEditingHabit] = useState<any | null>(null);
  const [editHabitTitle, setEditHabitTitle] = useState("");
  const [editHabitDesc, setEditHabitDesc] = useState("");
  const [deleteHabitId, setDeleteHabitId] = useState<string | null>(null);

  // Health Profile Form state
  const [profileForm, setProfileForm] = useState({ gender: "", age: "", weight: "" });
  const [weightVal, setWeightVal] = useState("68");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [ageVal, setAgeVal] = useState("");

  const openProfileSheet = () => {
    const rawWeight = userProfile.weight && userProfile.weight !== "Not Set" ? userProfile.weight : "68 kg";
    const unitMatch = rawWeight.match(/(lbs|kg)/i);
    const unit = unitMatch ? unitMatch[0].toLowerCase() : "kg";
    const num = rawWeight.replace(/[^0-9.]/g, "") || "68";

    setWeightVal(num);
    setWeightUnit(unit);
    const rawAge = userProfile.age && userProfile.age !== "Not Set" ? userProfile.age.replace(/[^0-9]/g, "") : "24";
    setAgeVal(rawAge);
    setProfileForm({
      gender: userProfile.gender || "Female",
      age: userProfile.age || "24 Years",
      weight: userProfile.weight || "68 kg",
    });
    setIsProfileOpen(true);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playPop();
    const formattedAge = ageVal ? `${ageVal} Years` : profileForm.age;
    const formattedWeight = weightVal ? `${weightVal} ${weightUnit}` : profileForm.weight;

    try {
      await updateProfileMutation.mutateAsync({
        ...profileForm,
        age: formattedAge,
        weight: formattedWeight,
      });
      toast.success(`Health profile calibrated! Weight: ${formattedWeight}kg • Age: ${formattedAge}`);
      setIsProfileOpen(false);
    } catch {
      toast.error("Failed to update profile stats");
    }
  };

  const logWater = useCallback(async (amount: number) => {
    try {
      soundFX.playSplash();
      await logWaterMutation.mutateAsync({ date: selectedDate, amount });
    } catch {
      toast.error("Failed to log water");
    }
  }, [logWaterMutation, selectedDate]);

  // Global listeners for contextual docked FAB actions
  useEffect(() => {
    const handleOpenNewHabit = () => {
      soundFX.playPop();
      setIsChoiceOpen(true);
    };
    const handleQuickWater = (e: any) => {
      const amt = e?.detail?.amount || 250;
      logWater(amt);
    };
    const handleOpenWaterModal = () => {
      soundFX.playPop();
      setIsQuickWaterOpen(true);
    };
    const handleOpenQuickMeal = () => {
      soundFX.playPop();
      setIsQuickMealOpen(true);
    };
    const handleOpenQuickWorkout = () => {
      soundFX.playPop();
      setIsQuickWorkoutOpen(true);
    };

    window.addEventListener("invictus:open-new-habit", handleOpenNewHabit);
    window.addEventListener("invictus:quick-log-water", handleQuickWater);
    window.addEventListener("invictus:open-water-modal", handleOpenWaterModal);
    window.addEventListener("invictus:open-quick-meal", handleOpenQuickMeal);
    window.addEventListener("invictus:open-quick-workout", handleOpenQuickWorkout);

    return () => {
      window.removeEventListener("invictus:open-new-habit", handleOpenNewHabit);
      window.removeEventListener("invictus:quick-log-water", handleQuickWater);
      window.removeEventListener("invictus:open-water-modal", handleOpenWaterModal);
      window.removeEventListener("invictus:open-quick-meal", handleOpenQuickMeal);
      window.removeEventListener("invictus:open-quick-workout", handleOpenQuickWorkout);
    };
  }, [logWater]);

  const handleApplyHabitPack = (pack: TemplatePack) => {
    pack.items.forEach((item) => {
      addHabitMutation.mutate({
        title: item.title,
        icon: "Target",
        color: "amber",
        frequency: { type: "daily", targetPerDay: 1 },
        allowGraceSkip: false,
        isGoalStyle: false,
        reminderTime: item.desc || "",
      });
    });
    toast.success(`Applied '${pack.name}' protocol`);
    setIsChoiceOpen(false);
  };

  const handleSelectPreset = async (preset: AtomicHabitPreset) => {
    try {
      await addHabitMutation.mutateAsync({
        title: preset.title,
        icon: preset.icon,
        color: preset.color,
        frequency: { type: preset.frequencyType, targetPerDay: 1 },
        reminderTime: preset.reminderTime || "",
        allowGraceSkip: false,
        isGoalStyle: !!preset.goalTarget,
        goalTarget: preset.goalTarget,
        goalUnit: preset.goalUnit,
      });
      toast.success(`Added '${preset.title}' to routines`);
    } catch {
      toast.error("Failed to add preset habit");
    }
  };

  const handleAddCustomHabit = async (custom: any) => {
    try {
      await addHabitMutation.mutateAsync({
        title: custom.title,
        icon: custom.icon,
        color: custom.color,
        frequency: custom.frequency,
        reminderTime: custom.reminderTime || "",
        allowGraceSkip: custom.allowGraceSkip,
        isGoalStyle: !!custom.goalTarget,
        goalTarget: custom.goalTarget,
        goalUnit: custom.goalUnit,
      });
      toast.success(`Created habit '${custom.title}'`);
    } catch {
      toast.error("Failed to create habit");
    }
  };

  const handleAddHabit = async (data: any) => {
    try {
      await addHabitMutation.mutateAsync(data);
      toast.success(`Habit "${data.title}" added to daily routines! 🔥`);
      setIsAddOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create habit");
    }
  };

  const handleToggleLog = async (habitId: string, completed: boolean, dateStr: string = selectedDate) => {
    const targetHabit = habits.find((h) => h.id === habitId);
    const title = targetHabit ? targetHabit.title : "Habit";

    try {
      await toggleLogMutation.mutateAsync({
        habitId,
        date: dateStr,
        completed,
      });
      if (completed) {
        strobiToast.habits(`Logged "${title}"! 🔥`, {
          quip: "Discipline compounds daily. Streak glowing!",
          description: targetHabit ? `Frequency: ${targetHabit.frequency}` : undefined,
        });
      } else {
        toast.info(`Unchecked "${title}" for today`);
      }
    } catch {
      toast.error(`Failed to update log for "${title}"`);
    }
  };

  const [habitStatusFilter, setHabitStatusFilter] = useState<"all" | "pending" | "completed">("all");

  const isCompletedToday = (habitId: string) => {
    return logs.some((l) => l.habitId === habitId && l.completed);
  };

  const isHabitRestDay = (habit: any, dateStr: string = selectedDate) => {
    if (
      habit.frequency?.type === "customDays" &&
      Array.isArray(habit.frequency.daysOfWeek) &&
      habit.frequency.daysOfWeek.length > 0
    ) {
      try {
        const dayOfWeek = getDay(new Date(dateStr));
        return !habit.frequency.daysOfWeek.includes(dayOfWeek);
      } catch {
        return false;
      }
    }
    return false;
  };

  // Habits breakdown for the active day
  const dueTodayHabits = habits.filter((h) => !isHabitRestDay(h));
  const completedTodayHabits = habits.filter((h) => isCompletedToday(h.id));
  const pendingTodayHabits = habits.filter((h) => !isCompletedToday(h.id) && !isHabitRestDay(h));
  const dailyCompletionPercent = dueTodayHabits.length > 0
    ? Math.round((completedTodayHabits.filter((h) => !isHabitRestDay(h)).length / dueTodayHabits.length) * 100)
    : habits.length > 0 && completedTodayHabits.length === habits.length
    ? 100
    : 0;
  const isAllDueCompleted = dueTodayHabits.length > 0 && pendingTodayHabits.length === 0;

  // 1-Tap Bulk Check / Reset Habits for active day (Shift+⌘A)
  const handleCheckAllDue = useCallback(async () => {
    soundFX.playPop();
    soundFX.vibrate(25);

    if (isAllDueCompleted) {
      try {
        await Promise.all(
          completedTodayHabits.map((h) =>
            toggleLogMutation.mutateAsync({
              habitId: h.id,
              date: selectedDate,
              completed: false,
            })
          )
        );
        toast.info(`Reset ${completedTodayHabits.length} routines for today`);
      } catch {
        toast.error("Failed to reset routines");
      }
      return;
    }

    try {
      await Promise.all(
        pendingTodayHabits.map((h) =>
          toggleLogMutation.mutateAsync({
            habitId: h.id,
            date: selectedDate,
            completed: true,
          })
        )
      );
      soundFX.playCompleteChime();
      soundFX.vibrate([40, 60, 100]);
      toast.success(`⚡ All ${dueTodayHabits.length} habits completed today! Outstanding consistency. 🏆`);
    } catch {
      toast.error("Failed to check all habits");
    }
  }, [
    isAllDueCompleted,
    completedTodayHabits,
    pendingTodayHabits,
    selectedDate,
    dueTodayHabits.length,
    toggleLogMutation,
  ]);

  // Global Keyboard Shortcut: Shift+Meta+A to Check All Due
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (
        (e.shiftKey && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") ||
        (e.altKey && e.key.toLowerCase() === "a")
      ) {
        e.preventDefault();
        handleCheckAllDue();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCheckAllDue]);

  // Filtered habits list based on active filter
  const displayedHabits = habits.filter((habit) => {
    const isDone = isCompletedToday(habit.id);
    const isRest = isHabitRestDay(habit);
    if (habitStatusFilter === "pending") return !isDone && !isRest;
    if (habitStatusFilter === "completed") return isDone;
    return true;
  });

  // Limit visible rows to 6 when not expanded to ensure <= 1.5 screen viewports
  const visibleHabits =
    !showAllHabits && displayedHabits.length > 6
      ? displayedHabits.slice(0, 6)
      : displayedHabits;

  const longestStreakValue = Object.values(streaks).reduce((max, s) => Math.max(max, s.longestStreak), 0);
  const weeklyAveragePercent =
    dueTodayHabits.length > 0 && weekLogs.length > 0
      ? Math.min(100, Math.round((weekLogs.length / Math.max(1, habits.length * 7)) * 100))
      : dailyCompletionPercent;

  return (
    <div className="w-full max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto pb-6 sm:pb-8 select-none space-y-3 sm:space-y-4 px-1 sm:px-3">
      {/* ================= SLOT 1: UNIFIED TOP APP BAR ================= */}
      <MobileAppBar
        title="Habits"
        onCheckAllDue={handleCheckAllDue}
        isAllDueCompleted={isAllDueCompleted}
        dueCount={dueTodayHabits.length}
        showDynamicIsland={true}
      />

      <div className="px-3.5 space-y-2">
        {/* ================= SLOT 3: ONE HERO CAROUSEL SLOT (~175px) ================= */}
        <HabitsHeroPager
          dailyCompletionPercent={dailyCompletionPercent}
          weeklyAveragePercent={weeklyAveragePercent}
          longestStreakValue={longestStreakValue}
          streakFreeze={streakFreeze}
          completedCount={completedTodayHabits.filter((h) => !isHabitRestDay(h)).length}
          dueCount={dueTodayHabits.length}
          userLevel={achievements.userLevel}
          totalXP={achievements.totalXP}
          onOpenShieldInfo={() => setIsShieldInfoOpen(true)}
        />

        {/* ================= SLOT 4a: 7-DAY ROUTINE HORIZON SCRUBBER ================= */}
        <HabitsDateStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* ================= SLOT 4b: FILTER CHIP STRIP ================= */}
        {habits.length > 0 && (
          <div className="flex items-center justify-between gap-2 pt-0.5 pb-1">
            {/* Filter Chips: All, Due, Done */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setHabitStatusFilter("all");
                }}
                className={cn(
                  "px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1",
                  habitStatusFilter === "all"
                    ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] font-black shadow-2xs"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <span>All</span>
                <span className="opacity-80">({habits.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setHabitStatusFilter("pending");
                }}
                className={cn(
                  "px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1",
                  habitStatusFilter === "pending"
                    ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] font-black shadow-2xs"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <span>Due</span>
                <span className="opacity-80">({pendingTodayHabits.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setHabitStatusFilter("completed");
                }}
                className={cn(
                  "px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1",
                  habitStatusFilter === "completed"
                    ? "bg-[#161514] text-[#03D26F] dark:bg-[#03D26F] dark:text-[#161514] font-black shadow-2xs"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <span>Done</span>
                <span className="opacity-80">({completedTodayHabits.length})</span>
              </button>
            </div>

            {/* Reps Ratio Telemetry */}
            <span className="text-[11px] font-mono font-bold text-muted-foreground pr-1">
              {completedTodayHabits.length}/{dueTodayHabits.length} Reps
            </span>
          </div>
        )}

        {/* ================= SLOT 4c: DOOR TILE ROW (MAX 4 DOORS TO L2) ================= */}
        <div className="py-1">
          <DoorTileRow
            waterAmount={waterLogged}
            waterTarget={(waterLog as any)?.waterGoal || 2000}
            bodyWeight={userProfile.weight || "68 kg"}
            bodyAge={userProfile.age || "24y"}
            onOpenNewHabit={() => setIsChoiceOpen(true)}
            onOpenGym={() => router.push("/goals/gym")}
            onOpenNutrition={() => router.push("/goals/nutrition")}
            onOpenStats={() => router.push("/goals/analytics")}
            onOpenWater={() => setIsWaterSheetOpen(true)}
            onOpenBodyProfile={openProfileSheet}
            onOpenReminders={() => setIsRemindersSheetOpen(true)}
            onOpenRecovery={() => setIsRecoverySheetOpen(true)}
          />
        </div>

        {/* ================= SLOT 5: PRIMARY HABIT LIST ================= */}
        <div id="habits-section" className="space-y-1">
          {habitsLoading ? (
            <HabitsListSkeleton count={3} />
          ) : habits.length === 0 ? (
            <EmptyState
              showMascot={true}
              mascotGear="fitness"
              mascotQuip="Discipline turns into identity! Pick your first daily habit to start your streak."
              title="Build Your Daily Discipline"
              description="Habits turn consistency into compounding results. Explore 50+ curated atomic routines or craft your custom protocol."
              ctaText="Explore Vault (50+ Presets)"
              onCtaClick={() => {
                soundFX.playPop();
                setIsChoiceOpen(true);
              }}
            />
          ) : displayedHabits.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-6 text-center space-y-2">
              <Target className="size-6 text-muted-foreground/40 stroke-[1.5] mx-auto" />
              <h4 className="text-xs font-heading font-bold text-foreground">
                {habitStatusFilter === "pending"
                  ? "All caught up! Zero habits left due today."
                  : habitStatusFilter === "completed"
                  ? "No habits completed yet today. Let's tackle one!"
                  : "No habits found."}
              </h4>
              {habitStatusFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setHabitStatusFilter("all")}
                  className="text-xs font-mono font-bold text-muted-foreground underline cursor-pointer hover:text-foreground"
                >
                  Show all habits
                </button>
              )}
            </div>
          ) : (
            /* Default Compact 56-64px List Rows (Responsive Bento on Laptop) */
            <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/60 shadow-xs lg:bg-transparent lg:border-0 lg:divide-y-0 lg:shadow-none lg:grid lg:grid-cols-2 lg:gap-3">
              {visibleHabits.map((habit) => {
                const isDone = isCompletedToday(habit.id);
                const isRest = isHabitRestDay(habit);
                const habitStreak = streaks[habit.id];

                const habitWeekDays = weekDays.map((d) => ({
                  ...d,
                  isCompleted:
                    d.dateStr === selectedDate
                      ? isDone
                      : weekLogs.some((l) => l.habitId === habit.id && l.date === d.dateStr),
                }));

                return (
                  <div
                    key={habit.id}
                    className="lg:bg-card lg:border lg:border-border lg:rounded-2xl lg:shadow-xs lg:overflow-hidden hover:lg:border-[#161514]/40 dark:hover:lg:border-white/30 transition-all"
                  >
                    <HabitListRow
                      habit={habit}
                      streak={habitStreak}
                      isCompletedToday={isDone}
                      isRestDay={isRest}
                      onToggle={() => handleToggleLog(habit.id, !isDone)}
                      weekDays={habitWeekDays}
                      onToggleDate={(dateStr) => {
                        const isDayDone =
                          dateStr === selectedDate
                            ? isDone
                            : weekLogs.some((l) => l.habitId === habit.id && l.date === dateStr);
                        handleToggleLog(habit.id, !isDayDone, dateStr);
                      }}
                      onEdit={() => {
                        setEditingHabit(habit);
                        setEditHabitTitle(habit.title);
                        setEditHabitDesc(habit.reminderTime || "");
                      }}
                      onDelete={() => setDeleteHabitId(habit.id)}
                      onSkip={() => handleToggleLog(habit.id, false)}
                      onViewDetail={() => router.push(`/goals/${habit.id}`)}
                    />
                  </div>
                );
              })}

              {/* Progressive disclosure toggle if list has > 6 items */}
              {displayedHabits.length > 6 && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setShowAllHabits((prev) => !prev);
                  }}
                  className="w-full py-2.5 px-3 bg-secondary/50 hover:bg-secondary text-xs font-mono font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer lg:col-span-2 rounded-xl border border-dashed border-border"
                >
                  {showAllHabits ? (
                    <>
                      <ChevronUp className="size-3.5" />
                      <span>Show Less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3.5" />
                      <span>See all {displayedHabits.length} habits</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>


      </div>

      {/* ================= L2/L3 BOTTOM SHEETS ================= */}

      {/* 1. Water Tracker Bottom Sheet */}
      <BottomSheet
        open={isWaterSheetOpen}
        onOpenChange={setIsWaterSheetOpen}
        title="Daily Hydration"
        description="Fast vessel logging & target management"
      >
        <div className="py-2">
          <WaterTracker
            amount={waterLogged}
            targetAmount={(waterLog as any)?.waterGoal || 2000}
            onLogWater={logWater}
            onSetWater={async (amt, target) => {
              await setWaterMutation.mutateAsync({
                date: selectedDate,
                amount: amt,
                ...(target ? { waterGoal: target } : {}),
              });
            }}
          />
        </div>
      </BottomSheet>

      {/* 2. Health & Body Stats Bottom Sheet */}
      <BottomSheet
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        title="Body Profile & Health"
        description="Physical metrics and progressive telemetry"
      >
        <form onSubmit={handleProfileSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-heading font-black text-foreground">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {["Female", "Male", "Non-binary", "Prefer not to say"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setProfileForm({ ...profileForm, gender: g });
                  }}
                  className={cn(
                    "min-h-[44px] py-2 px-3 rounded-xl text-xs font-heading font-black border transition-all cursor-pointer shadow-xs",
                    profileForm.gender === g
                      ? "bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] border-[#161514] dark:border-[#FAF8F5]"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-black text-foreground">Age (Years)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={ageVal}
              onChange={(e) => setAgeVal(e.target.value)}
              className="w-full bg-card rounded-xl border border-border px-4 py-2.5 text-base font-bold text-foreground shadow-xs outline-none focus:border-foreground"
              placeholder="Enter your age"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-black text-foreground">Current Weight</label>
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
                className="flex-1 bg-card rounded-xl border border-border px-4 py-2.5 text-base font-bold text-foreground shadow-xs outline-none focus:border-foreground"
                placeholder="Enter weight"
                required
              />
              <div className="flex rounded-xl border border-border overflow-hidden shadow-xs">
                {["kg", "lbs"].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setWeightUnit(u);
                      setProfileForm({ ...profileForm, weight: `${weightVal} ${u}` });
                    }}
                    className={cn(
                      "min-w-[44px] min-h-[44px] px-3.5 py-2 text-xs font-heading font-black transition-all cursor-pointer flex items-center justify-center",
                      weightUnit === u
                        ? "bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514]"
                        : "bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full min-h-[48px] bg-[#161514] hover:bg-[#252321] dark:bg-[#FAF8F5] dark:hover:bg-[#E8E5DF] text-white dark:text-[#161514] font-heading font-black rounded-xl py-3 mt-2 shadow-xs cursor-pointer transition-all"
          >
            Save profile stats
          </Button>
        </form>
      </BottomSheet>

      {/* 3. Reminders Bottom Sheet */}
      <BottomSheet
        open={isRemindersSheetOpen}
        onOpenChange={setIsRemindersSheetOpen}
        title="Discipline Alerts"
        description="Daily reminders and habitica triggers"
      >
        <div className="space-y-3 py-1">
          <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border space-y-1.5">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-amber-500" />
              <h5 className="font-heading font-bold text-xs text-foreground">
                Push Notifications
              </h5>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Timely nudges for scheduled routines. Configurable per-habit or global reminders.
            </p>
          </div>

          <div className="space-y-2">
            <h6 className="font-heading font-black text-xs text-foreground uppercase tracking-wider">
              Active Habit Reminders
            </h6>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {habits
                .filter((h) => h.reminderTime)
                .map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-between text-xs"
                  >
                    <span className="font-heading font-bold text-foreground leading-snug break-words line-clamp-1 flex-1 pr-2">
                      {h.title}
                    </span>
                    <span className="font-mono text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="size-3" />
                      <span>{h.reminderTime}</span>
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* 4. Evening Recovery & Sleep Bottom Sheet */}
      <BottomSheet
        open={isRecoverySheetOpen}
        onOpenChange={setIsRecoverySheetOpen}
        title="Evening Recovery & Sleep"
        description="Sleep duration, rest tracking, and active movement"
      >
        <div className="space-y-4 py-1">
          <SleepAndActiveWidgets />
        </div>
      </BottomSheet>

      {/* 5. Autonomous Streak Shield Bottom Sheet */}
      <BottomSheet
        open={isShieldInfoOpen}
        onOpenChange={setIsShieldInfoOpen}
        title="Autonomous Streak Freeze Shield"
        description="Streaks & Habitica Benchmark Protection Subsystem"
      >
        <div className="space-y-3.5 py-1">
          <div className="p-3 rounded-2xl border border-border bg-secondary/50 flex items-start gap-3">
            <div className="size-9 rounded-xl bg-[#DCFAE5] dark:bg-[#03D26F]/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5 text-[#047857] dark:text-[#03D26F] stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h5 className="font-heading font-black text-xs text-foreground">
                  Inventory: {streakFreeze.tokensAvailable} / 2 Shields
                </h5>
                <span className="bg-[#DCFAE5] dark:bg-[#03D26F]/20 text-[#04250e] dark:text-[#03D26F] font-bold text-[9px] px-2 py-0.5 rounded-md">
                  {streakFreeze.tokensAvailable > 0 ? "Armed" : "Refills 1st"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Autonomous monitoring ensures your hard-earned flame never gets wiped out by a missed day.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="p-2.5 rounded-xl border border-border bg-card flex items-start gap-2.5">
              <Bot className="size-4 text-foreground shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground font-heading font-bold block">Autonomous Activation</strong>
                Detects missed days and automatically freezes them without manual action.
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-border bg-card flex items-start gap-2.5">
              <Flame className="size-4 text-rose-500 fill-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground font-heading font-bold block">Continuous Flame Calculation</strong>
                Preserves active streak count unbroken across shielded dates.
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-border bg-card flex items-start gap-2.5">
              <Moon className="size-4 text-emerald-600 dark:text-[#03D26F] shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground font-heading font-bold block">Zero-Penalty Rest Days</strong>
                Scheduled rest days never consume tokens or break streaks.
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-border bg-card flex items-start gap-2.5">
              <RefreshCw className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground font-heading font-bold block">Monthly Auto-Refill</strong>
                1 free shield granted on the 1st of every month (max 2).
              </div>
            </div>
          </div>

          {/* Frozen Dates Ledger */}
          {streakFreeze.frozenDates && streakFreeze.frozenDates.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-border">
              <h6 className="font-heading font-black text-xs text-foreground">
                Protected dates history ({streakFreeze.frozenDates.length})
              </h6>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                {streakFreeze.frozenDates.map((dateStr) => (
                  <span
                    key={dateStr}
                    className="bg-secondary text-foreground font-mono font-bold text-[11px] px-2 py-0.5 rounded-md border border-border flex items-center gap-1 shadow-2xs"
                  >
                    <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
                    <span>{dateStr}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => setIsShieldInfoOpen(false)}
            className="w-full bg-[#161514] hover:bg-[#252321] dark:bg-[#FAF8F5] dark:hover:bg-[#E8E5DF] text-white dark:text-[#161514] font-heading font-black text-xs py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Got It
          </Button>
        </div>
      </BottomSheet>

      {/* 6. Immersive Habit Choice Modal (Presets, Custom, Protocol Packs) */}
      <HabitChoiceModal
        open={isChoiceOpen}
        onOpenChange={setIsChoiceOpen}
        onSelectPreset={handleSelectPreset}
        onAddCustomHabit={handleAddCustomHabit}
        onApplyPresetPack={handleApplyHabitPack}
        isPending={addHabitMutation.isPending}
      />

      {/* 6a. Quick Water Vessel Picker Modal (Flower Menu → 1-tap) */}
      <QuickWaterModal
        open={isQuickWaterOpen}
        onOpenChange={setIsQuickWaterOpen}
        currentAmount={waterLogged}
        targetAmount={(waterLog as any)?.waterGoal || 1000}
        onLogWater={logWater}
        onSetTarget={async (newTarget) => {
          try {
            await setWaterMutation.mutateAsync({
              date: selectedDate,
              amount: waterLogged,
              waterGoal: newTarget,
            });
          } catch {
            toast.error("Failed to update water goal");
          }
        }}
      />

      {/* 6b. Quick Meal Logger Modal (Flower Menu → inline) */}
      <QuickMealModal
        open={isQuickMealOpen}
        onOpenChange={setIsQuickMealOpen}
        onAddMeal={async (meal) => {
          try {
            await addMealPlanMutation.mutateAsync(meal);
          } catch {
            toast.error("Failed to log meal");
          }
        }}
        isPending={addMealPlanMutation.isPending}
      />

      {/* 6c. Quick Workout & Routine Cockpit (Flower Menu → inline) */}
      <QuickWorkoutModal
        open={isQuickWorkoutOpen}
        onOpenChange={setIsQuickWorkoutOpen}
        selectedDate={selectedDate}
      />

      {/* 7. Create Custom Habit Bottom Sheet */}
      <BottomSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Create a Habit"
        description="Build consistency with a new daily or weekly routine"
      >
        <NewHabitForm onSubmit={handleAddHabit} loading={addHabitMutation.isPending} />
      </BottomSheet>

      {/* 8. Edit Habit Bottom Sheet */}
      <BottomSheet
        open={editingHabit !== null}
        onOpenChange={(open) => {
          if (!open) setEditingHabit(null);
        }}
        title="Edit Habit Goal"
        description="Update your habit details and reminder schedule"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingHabit) {
              soundFX.playCompleteChime();
              updateHabitMutation.mutate({
                id: editingHabit.id,
                title: editHabitTitle,
                reminderTime: editHabitDesc,
              });
              toast.success(`Updated habit "${editHabitTitle}"! ✨`);
              setEditingHabit(null);
            }
          }}
          className="space-y-4 pt-1"
        >
          <HabitCompanionSprite
            iconName={editingHabit?.icon || "Target"}
            habitTitle={editHabitTitle}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-black text-foreground">
              Habit Title *
            </label>
            <input
              type="text"
              value={editHabitTitle}
              onChange={(e) => setEditHabitTitle(e.target.value)}
              className="w-full bg-card rounded-xl border border-border px-4 py-2.5 text-base font-bold text-foreground shadow-xs outline-none focus:border-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-heading font-black text-foreground">
              Reminder Time
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { label: "Morning", time: "08:00 AM" },
                { label: "Noon", time: "12:00 PM" },
                { label: "Evening", time: "07:00 PM" },
                { label: "Night", time: "10:00 PM" },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setEditHabitDesc(preset.time);
                  }}
                  className={cn(
                    "min-h-[38px] py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center text-center shadow-xs",
                    editHabitDesc === preset.time
                      ? "bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] font-black border-[#161514] dark:border-[#FAF8F5]"
                      : "bg-card hover:bg-muted text-muted-foreground border-border"
                  )}
                >
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or custom: e.g. 08:00 AM"
              value={editHabitDesc}
              onChange={(e) => setEditHabitDesc(e.target.value)}
              className="w-full bg-card rounded-xl border border-border px-4 py-2 text-base font-bold text-foreground shadow-xs outline-none focus:border-foreground mt-1"
            />
          </div>

          <Button
            type="submit"
            disabled={updateHabitMutation.isPending}
            className="w-full min-h-[48px] bg-[#161514] hover:bg-[#252321] dark:bg-[#FAF8F5] dark:hover:bg-[#E8E5DF] text-white dark:text-[#161514] font-heading font-black rounded-xl py-3 mt-2 shadow-xs cursor-pointer transition-all"
          >
            {updateHabitMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </BottomSheet>

      {/* 9. Delete Confirmation (Centered modal for destructive action) */}
      <DeleteConfirmationModal
        open={deleteHabitId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteHabitId(null);
        }}
        onConfirm={async () => {
          if (deleteHabitId) {
            const targetHabit = habits.find((h) => h.id === deleteHabitId);
            const title = targetHabit ? targetHabit.title : "Habit";
            try {
              await deleteHabitMutation.mutateAsync(deleteHabitId);
              toast.info(`Removed habit "${title}" from routines`);
            } catch {
              toast.error(`Failed to delete "${title}"`);
            }
            setDeleteHabitId(null);
          }
        }}
        title="Delete Habit"
        description="Are you sure you want to delete this habit goal? This will archive your routine."
      />
    </div>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<HabitsCockpitSkeleton />}>
      <GoalsPageContent />
    </Suspense>
  );
}
