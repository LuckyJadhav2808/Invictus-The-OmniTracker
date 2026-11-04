"use client";

import { useState, useEffect, Suspense } from "react";
import {
  useHabits,
  useAddHabit,
  useUpdateHabit,
  useDeleteHabit,
  useToggleHabitLog,
  useHabitLogs,
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
import { WaterTracker } from "@/components/goals/WaterTracker";
import { MoodJournalWidget } from "@/components/goals/MoodJournalWidget";
import { SleepAndActiveWidgets } from "@/components/goals/SleepAndActiveWidgets";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { HabitsCockpitSkeleton, HabitsListSkeleton } from "@/components/shared/NeobrutalistSkeleton";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { soundFX } from "@/components/shared/SoundFX";
import { TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { HabitChoiceModal, AtomicHabitPreset } from "@/components/goals/HabitChoiceModal";
import { HABIT_TEMPLATE_PACKS } from "@/lib/templates-data";
import { HabitCompanionSprite } from "@/components/mascot/HabitCompanionSprite";
import { VixPixelCompanion } from "@/components/mascot/VixPixelCompanion";
import { Button } from "@/components/ui/button";
import {
  Target,
  Plus,
  Flame,
  Sparkles,
  Activity,
  Edit3,
  Moon,
  ShieldCheck,
  ShieldAlert,
  Info,
  Volume2,
  VolumeX,
  Trophy,
  Clock,
  Check,
  Bot,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { format, getDay } from "date-fns";
import { toast } from "sonner";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { ProactiveReminderBanner } from "@/components/shared/ProactiveReminderBanner";
import { useSearchParams, useRouter } from "next/navigation";

function GoalsPageContent() {
  const { selectedDate } = useUIStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");

  // Graceful backward compatibility redirect for legacy ?tab= queries
  useEffect(() => {
    if (tabParam === "gym") {
      router.replace("/goals/gym");
    } else if (tabParam === "nutrition") {
      router.replace("/goals/nutrition");
    } else if (tabParam === "calendar" || tabParam === "analytics") {
      router.replace("/goals/analytics");
    }
  }, [tabParam, router]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(soundFX.isMuted());
  const [showRecovery, setShowRecovery] = useState(false);

  // Health Profile & Habits Database Query hooks
  const { data: userProfile = { gender: "Female", age: "24 Years", weight: "68 kg" } } = useHealthProfile();
  const updateProfileMutation = useUpdateHealthProfile();

  const { data: waterLog = { id: selectedDate, date: selectedDate, amount: 0 } } = useWaterLog(selectedDate);
  const logWaterMutation = useLogWater();
  const waterLogged = waterLog.amount;

  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: streaks = {} } = useStreaks();
  const { data: streakFreeze = { userId: "", tokensAvailable: 1, lastMonthlyCredit: "", frozenDates: [], autoShieldEvent: null } } = useStreakFreeze();
  const { data: logs = [] } = useHabitLogs(selectedDate);
  const achievements = useUserAchievements();
  const { habitLayoutStyle } = useUIStore();

  const addHabitMutation = useAddHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const toggleLogMutation = useToggleHabitLog();
  const setWaterMutation = useSetWater();

  // States for Health Profile Modal
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ gender: "", age: "", weight: "" });

  // 🛡️ Autonomous Streak Freeze Shield State & Notification
  const [isShieldInfoOpen, setIsShieldInfoOpen] = useState(false);

  useEffect(() => {
    if (streakFreeze?.autoShieldEvent?.shielded && streakFreeze.autoShieldEvent.newlyFrozenDates?.length) {
      const datesList = streakFreeze.autoShieldEvent.newlyFrozenDates.join(", ");
      const toastKey = `invictus_streak_shield_alert_${datesList}`;
      if (typeof window !== "undefined" && sessionStorage.getItem(toastKey)) return;
      if (typeof window !== "undefined") sessionStorage.setItem(toastKey, "true");

      try {
        soundFX.playCompleteChime();
        soundFX.playBotChirp("salute");
      } catch {}

      // 🛡️ Harmonized Streak Shield Toast
      toast.custom(
        () => (
          <div className="bg-white dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] p-3.5 rounded-xl shadow-md flex items-center gap-3 w-full max-w-sm">
            <div className="size-8 rounded-lg bg-[#DCFAE5] dark:bg-[#03D26F]/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-4 text-[#047857] dark:text-[#03D26F] stroke-[1.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-[#161514] dark:text-[#FAF8F5]">
                  Streak Shield Protected
                </span>
                <span className="bg-[#DCFAE5] dark:bg-[#03D26F]/20 text-[#04250e] dark:text-[#03D26F] font-medium text-xs px-1.5 py-0.5 rounded">
                  Saved
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] leading-tight mt-0.5">
                Protected {datesList} while you were away ({streakFreeze.tokensAvailable}/2 tokens left).
              </p>
            </div>
          </div>
        ),
        { duration: 6000 }
      );
    }
  }, [streakFreeze]);

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
      toast.success("Health stats updated");
      setIsProfileOpen(false);
    } catch {
      toast.error("Failed to update profile stats");
    }
  };

  const logWater = async (amount: number) => {
    try {
      soundFX.playSplash();
      await logWaterMutation.mutateAsync({ date: selectedDate, amount });
    } catch {
      toast.error("Failed to log water");
    }
  };

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
      toast.success(`Added habit: ${suggested.title}`);
    } catch {
      toast.error("Failed to add suggested habit");
    }
  };

  const handleAddHabit = async (data: any) => {
    try {
      await addHabitMutation.mutateAsync(data);
      toast.success("Habit created");
      setIsAddOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create habit");
    }
  };

  const handleToggleLog = async (habitId: string, completed: boolean) => {
    try {
      await toggleLogMutation.mutateAsync({
        habitId,
        date: selectedDate,
        completed,
      });
      toast.success(completed ? "Habit checked" : "Removed check");
    } catch {
      toast.error("Failed to update habit log");
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

  // Filtered habits list based on active filter
  const displayedHabits = habits.filter((habit) => {
    const isDone = isCompletedToday(habit.id);
    const isRest = isHabitRestDay(habit);
    if (habitStatusFilter === "pending") return !isDone && !isRest;
    if (habitStatusFilter === "completed") return isDone;
    return true;
  });

  const totalHabits = habits.length;
  const longestStreakValue = Object.values(streaks).reduce((max, s) => Math.max(max, s.longestStreak), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Habits & Wellness Cockpit Header Card */}
      <div className="bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[#F1EFEA] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531]">
              Habits & Wellness
            </span>
            <span className="text-xs font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
              Lvl {achievements.userLevel} • {achievements.totalXP} XP
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight">
            Habits & Routines
          </h1>
          <p className="text-xs font-normal text-[#6B6B6B] dark:text-[#A8A29E] max-w-lg">
            Build daily consistency, conquer streaks, and maintain holistic vitality.
          </p>
        </div>

        {/* Quick Metrics & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setIsShieldInfoOpen(true)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531] text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer",
              streakFreeze.tokensAvailable > 0
                ? "bg-[#F1EFEA] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] hover:bg-[#E8E5DF] dark:hover:bg-[#2e2b28]"
                : "bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 hover:bg-amber-100"
            )}
            title="Streak shield protection details"
          >
            <ShieldCheck className="size-3.5 stroke-[1.5] text-[#161514] dark:text-[#FAF8F5]" />
            <span>
              {streakFreeze.tokensAvailable > 0
                ? `${streakFreeze.tokensAvailable}/2 Shielded`
                : "0/2 Shields"}
            </span>
          </button>

          <div className="px-2.5 py-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#78350F]/40 bg-[#FFFBEB] dark:bg-[#78350F]/20 text-[#92400E] dark:text-[#FDE68A] text-center flex items-center gap-1.5">
            <Flame className="size-3.5 fill-orange-500 text-orange-500" />
            <span className="text-xs font-mono font-medium tabular-nums">
              {longestStreakValue}d streak
            </span>
          </div>

          {/* Tactile Audio Mute Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextMuted = soundFX.toggleMute();
              setSoundMuted(nextMuted);
              toast.info(nextMuted ? "Tactile audio muted" : "Tactile audio active");
            }}
            className="size-9 rounded-lg border border-[#E8E5DF] dark:border-[#383531] bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] transition-colors flex items-center justify-center cursor-pointer shrink-0"
            title={soundMuted ? "Unmute tactile sounds" : "Mute tactile sounds"}
            aria-label="Toggle sound"
          >
            {soundMuted ? <VolumeX className="size-3.5 stroke-[1.5]" /> : <Volume2 className="size-3.5 stroke-[1.5]" />}
          </button>

          <Button
            onClick={() => {
              soundFX.playPop();
              setIsChoiceOpen(true);
            }}
            className="bg-[#161514] dark:bg-[#CEF431] hover:bg-[#2A2826] dark:hover:bg-[#d6f64d] text-white dark:text-[#161514] font-medium text-xs px-3.5 py-2 h-auto rounded-lg border border-[#161514] dark:border-[#CEF431] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="size-3.5 stroke-[2]" />
            <span>New Habit</span>
          </Button>

          {/* Interactive Fitness Vix Companion */}
          <VixPixelCompanion
            gear="fitness"
            state={isAllDueCompleted || longestStreakValue >= 3 ? "fire" : "idle"}
            size={36}
            onClick={() => {
              soundFX.playPop();
              setIsChoiceOpen(true);
            }}
            title={isAllDueCompleted ? "Vix: All daily habits conquered today!" : "Vix: Fitness companion (Click for Habit Vault)"}
          />
        </div>
      </div>

      {/* 2. Proactive Reminder Banner */}
      <ProactiveReminderBanner space="goals" />

      {/* 3. Primary Hero Workspace: Habits Checklist + Hydration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-4">
        {/* Left Column (2 cols on lg): Habits Checklist */}
        <div id="habits-section" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-2">
              <Sparkles className="size-3.5 text-[#03D26F]" />
              <span>Active habit streaks</span>
              <span className="bg-[#F1EFEA] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] text-xs px-2 py-0.5 rounded-md border border-[#E8E5DF] dark:border-[#383531] font-mono font-medium">
                {habits.length}
              </span>
            </h3>
            <button
              type="button"
              onClick={() => setIsChoiceOpen(true)}
              className="text-xs font-medium text-[#161514] dark:text-[#FAF8F5] bg-white dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              + New habit
            </button>
          </div>

          {/* Daily Victory Celebration HUD */}
          {isAllDueCompleted && habits.length > 0 && (
            <div className="bg-[#DCFAE5] dark:bg-[#03D26F]/20 border border-[#03D26F]/30 rounded-xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-white dark:bg-[#1C1A18] border border-[#03D26F]/40 flex items-center justify-center text-[#047857] dark:text-[#03D26F] shrink-0">
                  <Trophy className="size-4.5 stroke-[1.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-tight text-[#04250e] dark:text-[#DCFAE5]">
                      Daily conquered • 100% complete
                    </span>
                    <span className="bg-[#03D26F] text-white text-[10px] font-mono font-medium px-2 py-0.5 rounded-full">
                      All due done
                    </span>
                  </div>
                  <p className="text-xs text-[#047857] dark:text-[#A7F3D0] mt-0.5">
                    Vix is ecstatic! Every single habit scheduled for today has been checked off. Take a bow.
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex shrink-0">
                <VixPixelCompanion gear="fitness" state="celebrate" size={40} title="Daily conquered!" />
              </div>
            </div>
          )}

          {/* Quick Filter Bar */}
          {habits.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] rounded-xl p-2.5">
              <div className="flex items-center gap-1 p-0.5 bg-[#F1EFEA] dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#383531] rounded-lg">
                <button
                  type="button"
                  onClick={() => setHabitStatusFilter("all")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded capitalize transition-colors cursor-pointer",
                    habitStatusFilter === "all"
                      ? "bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] shadow-sm font-semibold"
                      : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
                  )}
                >
                  All ({habits.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHabitStatusFilter("pending")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded capitalize transition-colors cursor-pointer flex items-center gap-1",
                    habitStatusFilter === "pending"
                      ? "bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] shadow-sm font-semibold"
                      : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
                  )}
                >
                  <span>Due today</span>
                  <span className={cn(
                    "px-1.5 py-0.2 rounded text-[10px] font-mono font-medium",
                    pendingTodayHabits.length > 0 ? "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  )}>
                    {pendingTodayHabits.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setHabitStatusFilter("completed")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded capitalize transition-colors cursor-pointer flex items-center gap-1",
                    habitStatusFilter === "completed"
                      ? "bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] shadow-sm font-semibold"
                      : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
                  )}
                >
                  <span>Completed</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-[#DCFAE5] dark:bg-[#03D26F]/20 text-[#04250e] dark:text-[#03D26F]">
                    {completedTodayHabits.length}
                  </span>
                </button>
              </div>

              {/* Daily Momentum Progress Pill */}
              <div className="flex items-center gap-2 px-2.5 py-1 bg-[#F1EFEA] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] rounded-lg text-xs font-medium text-[#161514] dark:text-[#FAF8F5]">
                <span className="text-xs text-[#6B6B6B] dark:text-[#A8A29E]">Today</span>
                <div className="w-16 h-1.5 bg-[#E8E5DF] dark:bg-[#383531] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#03D26F] transition-all duration-300"
                    style={{ width: `${dailyCompletionPercent}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-medium tabular-nums">{dailyCompletionPercent}%</span>
              </div>
            </div>
          )}

          {habitsLoading ? (
            <HabitsListSkeleton count={3} />
          ) : habits.length === 0 ? (
            <EmptyState
              title="Ready to build a new habit?"
              description="Habits help you build daily routines and streaks. Pick a suggestion below or click 'Create a Habit'!"
              Icon={Target}
              ctaText="Create a Habit"
              onCtaClick={() => setIsChoiceOpen(true)}
            />
          ) : displayedHabits.length === 0 ? (
            <div className="bg-white dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#383531] p-8 text-center space-y-2">
              <Target className="size-8 text-[#6B6B6B]/40 dark:text-[#A8A29E]/40 stroke-[1.5] mx-auto" />
              <h4 className="text-sm font-sans font-semibold text-[#161514] dark:text-[#FAF8F5]">
                {habitStatusFilter === "pending"
                  ? "No habits left due today! You're all caught up."
                  : habitStatusFilter === "completed"
                  ? "No habits completed yet today. Let's tackle one!"
                  : "No habits found."}
              </h4>
              {habitStatusFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setHabitStatusFilter("all")}
                  className="text-xs font-medium text-[#161514] dark:text-[#FAF8F5] underline cursor-pointer hover:text-[#03D26F]"
                >
                  Show all habits
                </button>
              )}
            </div>
          ) : (
            <div className={cn("space-y-3", habitLayoutStyle === "compact" && "space-y-2")}>
              {displayedHabits.map((habit) => {
                const isDone = isCompletedToday(habit.id);
                const isRest = isHabitRestDay(habit);
                const habitStreak = streaks[habit.id];

                if (habitLayoutStyle === "compact") {
                  return (
                    <div
                      key={habit.id}
                      className={cn(
                        "bg-white dark:bg-[#1C1A18] rounded-xl p-3 border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-between transition-colors cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#252321]",
                        isDone && "bg-[#F9FAF9] dark:bg-[#181615] opacity-80",
                        isRest && "bg-[#FAF8F5] dark:bg-[#181615] border-dashed opacity-80"
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
                            "size-7 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer",
                            isDone ? "bg-[#03D26F] border-[#03D26F] text-white" : "bg-white dark:bg-[#252321] border-[#D1D5DB] dark:border-[#4B5563] hover:bg-[#F1EFEA] dark:hover:bg-[#2e2b28]"
                          )}
                        >
                          {isDone ? <Check className="size-3.5 stroke-[2.5]" /> : null}
                        </button>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className={cn("font-sans font-medium text-xs text-[#161514] dark:text-[#FAF8F5]", isDone && "line-through text-[#6B6B6B] dark:text-[#A8A29E]")}>
                              {habit.title}
                            </h4>
                            {isRest && (
                              <span className="text-[9px] font-medium px-1.5 py-0.2 rounded border border-[#E8E5DF] dark:border-[#383531] bg-[#F1EFEA] dark:bg-[#252321] text-[#6B6B6B] dark:text-[#A8A29E] flex items-center gap-0.5">
                                <Moon className="size-2 stroke-[1.5]" />
                                <span>Rest</span>
                              </span>
                            )}
                          </div>
                          {habitStreak?.currentStreak ? (
                            <span className="text-[10px] font-mono text-[#92400E] dark:text-[#FDE68A] flex items-center gap-1 mt-0.5">
                              <Flame className="size-2.5 fill-orange-500 text-orange-500" />
                              <span>{habitStreak.currentStreak}d streak</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {habit.reminderTime && (
                          <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] px-1.5 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531] bg-white dark:bg-[#252321] flex items-center gap-1">
                            <Clock className="size-2.5 stroke-[1.5]" />
                            <span>{habit.reminderTime}</span>
                          </span>
                        )}
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-[#E8E5DF] dark:border-[#383531] bg-[#F1EFEA] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5]">
                          {habit.frequency?.type || "Daily"}
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
                    isRestDay={isRest}
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

          {/* Suggestions Carousel: Only shown as onboarding guide when user has no active habits */}
          {habits.length === 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-sans font-semibold text-[#161514] dark:text-[#FAF8F5]">Suggested routines</h4>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none select-none -mx-4 px-4 md:-mx-0 md:px-0">
                {SUGGESTED_HABITS.map((suggested) => (
                  <div
                    key={suggested.title}
                    className="flex-shrink-0 w-[200px] bg-white dark:bg-[#1C1A18] rounded-xl p-3 border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-between gap-2 hover:bg-[#FAF8F5] dark:hover:bg-[#252321] transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-sans font-medium text-[#161514] dark:text-[#FAF8F5] block truncate">{suggested.title}</span>
                      <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] block truncate">{suggested.desc}</span>
                    </div>
                    <button
                      onClick={() => handleAddSuggested(suggested)}
                      className="size-7 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                    >
                      <Plus className="size-3.5 stroke-[2]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 col on lg): Hydration & Health Stats */}
        <div className="space-y-4">
          {/* Neobrutalist Living Hydro-Tumbler */}
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

          {/* Health & Weight Telemetry Capsule */}
          <div className="bg-white dark:bg-[#1C1A18] rounded-xl p-3.5 border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] flex items-center justify-center text-[#161514] dark:text-[#FAF8F5] shrink-0">
                <Activity className="size-4 text-[#047857] dark:text-[#03D26F] stroke-[1.5]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-medium text-[#6B6B6B] dark:text-[#A8A29E] block leading-tight">Body profile</span>
                <span className="text-xs font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] font-mono tabular-nums truncate block">
                  {userProfile.weight || "68 kg"} • {userProfile.age || "24 Yrs"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={updateProfileStat}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Edit3 className="size-3 stroke-[1.5]" />
              <span>Edit stats</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Evening Recovery & Reflections (Collapsible to keep daytime focus clean) */}
      <div id="mood-section" className="border border-[#E8E5DF] dark:border-[#383531] rounded-2xl bg-white dark:bg-[#1C1A18] overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            setShowRecovery((prev) => !prev);
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-[#FAF8F5] dark:hover:bg-[#252321] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Moon className="size-4 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wide">
                Evening Recovery &amp; Reflections
              </h3>
              <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E]">
                Sleep duration, active burn, and daily mood journal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-[#F1EFEA] dark:bg-[#252321] text-[#6B6B6B] dark:text-[#A8A29E] border border-[#E8E5DF] dark:border-[#383531]">
              {showRecovery ? "Collapse" : "Open"}
            </span>
            <ChevronDown className={cn("size-4 text-[#8C8882] transition-transform duration-200", showRecovery && "rotate-180")} />
          </div>
        </button>

        {showRecovery && (
          <div className="p-4 pt-0 space-y-4 border-t border-[#E8E5DF] dark:border-[#383531] mt-1 animate-in fade-in duration-200">
            <SleepAndActiveWidgets />
            <MoodJournalWidget dateStr={selectedDate} />
          </div>
        )}
      </div>

      {/* Immersive Habit Choice Modal (Atomic Presets, Custom Architect, Protocol Packs) */}
      <HabitChoiceModal
        open={isChoiceOpen}
        onOpenChange={setIsChoiceOpen}
        onSelectPreset={handleSelectPreset}
        onAddCustomHabit={handleAddCustomHabit}
        onApplyPresetPack={handleApplyHabitPack}
        isPending={addHabitMutation.isPending}
      />

      {/* Add Habit Adaptive Drawer Dialog */}
      <AdaptiveDrawerDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Create a Habit"
        description="Build consistency with a new daily or weekly routine"
      >
        <NewHabitForm onSubmit={handleAddHabit} loading={addHabitMutation.isPending} />
      </AdaptiveDrawerDialog>

      {/* Edit Health Profile Adaptive Drawer Dialog */}
      <AdaptiveDrawerDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        title="Edit Health Stats"
        description="Update your gender, age, and weight information"
      >
        <form onSubmit={handleProfileSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">Gender</label>
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
                    "min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-heading font-black border transition-all cursor-pointer shadow-xs",
                    profileForm.gender === g
                      ? "bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] border-[#161514] dark:border-[#FAF8F5]"
                      : "bg-white dark:bg-[#1C1A18] text-[#161514]/70 dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#FAF8F5] dark:hover:bg-[#252321]"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">Age (Years)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={ageVal}
              onChange={(e) => setAgeVal(e.target.value)}
              className="w-full bg-white dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-4 py-2.5 text-base font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5]"
              placeholder="Enter your age"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">Current Weight</label>
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
                className="flex-1 bg-white dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-4 py-2.5 text-base font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5]"
                placeholder="Enter weight"
                required
              />
              <div className="flex rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] overflow-hidden shadow-xs">
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
                      "min-w-[44px] min-h-[44px] px-4 py-2.5 text-xs font-heading font-black transition-all cursor-pointer flex items-center justify-center",
                      weightUnit === u
                        ? "bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514]"
                        : "bg-white dark:bg-[#1C1A18] text-[#161514]/70 dark:text-[#A8A29E] hover:bg-[#FAF8F5] dark:hover:bg-[#252321]"
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
      </AdaptiveDrawerDialog>

      {/* Edit Habit Adaptive Drawer Dialog */}
      <AdaptiveDrawerDialog
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
              toast.success("Habit updated");
              setEditingHabit(null);
            }
          }}
          className="space-y-4 pt-1"
        >
          {/* Companion guidance sprite in Edit mode */}
          <HabitCompanionSprite
            iconName={editingHabit?.icon || "Target"}
            habitTitle={editHabitTitle}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
              Habit Title *
            </label>
            <input
              type="text"
              value={editHabitTitle}
              onChange={(e) => setEditHabitTitle(e.target.value)}
              className="w-full bg-white dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-4 py-2.5 text-base font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]">
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
                      : "bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] text-[#161514]/80 dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#2A2724]"
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
              className="w-full bg-white dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-4 py-2 text-base font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] mt-1"
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
      </AdaptiveDrawerDialog>

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

      {/* Adaptive Modal for Streak Shield Intelligence */}
      <AdaptiveDrawerDialog
        open={isShieldInfoOpen}
        onOpenChange={setIsShieldInfoOpen}
        title="Autonomous Streak Freeze Shield"
        description="Streaks & Habitica Benchmark Protection Subsystem"
      >
        <div className="p-4 sm:p-5 space-y-4">
          <div className="p-3.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs flex items-start gap-3">
            <div className="size-10 rounded-lg bg-[#DCFAE5] dark:bg-[#03D26F]/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5 text-[#047857] dark:text-[#03D26F] stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h5 className="font-heading font-black text-sm text-[#161514] dark:text-[#FAF8F5]">
                  Inventory: {streakFreeze.tokensAvailable} / 2 Shields
                </h5>
                <span className="bg-[#DCFAE5] dark:bg-[#03D26F]/20 text-[#04250e] dark:text-[#03D26F] font-bold text-[9px] px-2 py-0.5 rounded-md">
                  {streakFreeze.tokensAvailable > 0 ? "Shield armed" : "Refills 1st"}
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] mt-1 leading-relaxed">
                Autonomous monitoring ensures your hard-earned flame never gets wiped out by a single missed day.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <h6 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5]">
              How the shield works
            </h6>
            <div className="space-y-2 text-xs text-[#6B6B6B] dark:text-[#A8A29E]">
              <div className="p-2.5 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#161514] flex items-start gap-2.5">
                <div className="size-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <Bot className="size-3.5 text-[#161514] dark:text-[#FAF8F5] stroke-[2.5]" />
                </div>
                <div>
                  <strong className="text-[#161514] dark:text-[#FAF8F5] font-heading font-bold block">Autonomous Activation</strong>
                  If you miss a scheduled habit, the system automatically detects it, consumes 1 shield token, and freezes the date. No manual toggle required.
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#161514] flex items-start gap-2.5">
                <div className="size-6 rounded-md bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                  <Flame className="size-3.5 text-rose-600 dark:text-rose-400 fill-rose-600 dark:fill-rose-400" />
                </div>
                <div>
                  <strong className="text-[#161514] dark:text-[#FAF8F5] font-heading font-bold block">Continuous Flame Calculation</strong>
                  Streak algorithms fold frozen days into your active streak history, bridging the gap so your count continues uninterrupted.
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#161514] flex items-start gap-2.5">
                <div className="size-6 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <Moon className="size-3.5 text-emerald-700 dark:text-emerald-400 stroke-[2.5]" />
                </div>
                <div>
                  <strong className="text-[#161514] dark:text-[#FAF8F5] font-heading font-bold block">Zero-Penalty Rest Days</strong>
                  Custom-scheduled habits (e.g. 3 days/week) recognize rest days naturally: they never break your streak or consume freeze tokens.
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#161514] flex items-start gap-2.5">
                <div className="size-6 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <RefreshCw className="size-3.5 text-amber-700 dark:text-amber-400 stroke-[2.5]" />
                </div>
                <div>
                  <strong className="text-[#161514] dark:text-[#FAF8F5] font-heading font-bold block">Monthly Auto-Refill</strong>
                  Every month on the 1st, 1 free streak shield is granted to your inventory (maximum capacity: 2).
                </div>
              </div>
            </div>
          </div>

          {/* Frozen Dates Ledger */}
          {streakFreeze.frozenDates && streakFreeze.frozenDates.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-[#E8E5DF] dark:border-[#2A2724]">
              <h6 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5]">
                Protected dates history ({streakFreeze.frozenDates.length})
              </h6>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                {streakFreeze.frozenDates.map((dateStr) => (
                  <span
                    key={dateStr}
                    className="bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] font-mono font-bold text-xs px-2.5 py-1 rounded-md border border-[#E8E5DF] dark:border-[#2A2724] flex items-center gap-1 shadow-xs"
                  >
                    <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                    <span>{dateStr}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => setIsShieldInfoOpen(false)}
            className="w-full bg-[#161514] hover:bg-[#252321] dark:bg-[#FAF8F5] dark:hover:bg-[#E8E5DF] text-white dark:text-[#161514] font-heading font-black text-xs py-2.5 rounded-xl shadow-xs transition-all"
          >
            Got It
          </Button>
        </div>
      </AdaptiveDrawerDialog>
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
