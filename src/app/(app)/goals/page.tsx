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
import { WeeklyOverviewWidget } from "@/components/goals/WeeklyOverviewWidget";
import { WeeklyVelocityAndHabitMatrix } from "@/components/goals/WeeklyVelocityAndHabitMatrix";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { InvictusLoadingScreen } from "@/components/shared/InvictusLoadingScreen";
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

      toast.custom(
        () => (
          <div className="bg-[#FAF8F5] border-2 border-[#161514] p-3.5 rounded-xl shadow-[3px_3px_0px_0px_#161514] flex items-center gap-3 w-full max-w-sm">
            <div className="size-9 rounded-lg bg-[#03D26F] border-2 border-[#161514] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#161514]">
              <ShieldCheck className="size-5 text-[#161514] stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-xs text-[#161514] uppercase tracking-wide">
                  Streak Shield Deployed!
                </span>
                <span className="bg-[#CEF431] text-[#161514] font-black text-[9px] px-1.5 py-0.5 rounded border border-[#161514]">
                  SAVED
                </span>
              </div>
              <p className="text-[11px] text-[#161514]/80 font-medium leading-tight mt-0.5">
                Protected {datesList} while you were away. Flame preserved! ({streakFreeze.tokensAvailable}/2 tokens left)
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
      toast.success("Health stats updated! 🎯");
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
    toast.success(`Applied '${pack.name}' protocol! 🚀`);
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
      toast.success(`Added '${preset.title}' to routines! ✨`);
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
      toast.success(`Created habit '${custom.title}'! 🎯`);
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
      toast.success(completed ? "Checked! Good job! 🎉" : "Removed check");
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
      <div className="bg-white border-2 border-[#161514] rounded-2xl p-5 shadow-[4px_4px_0px_0px_#161514] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-heading font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border-2 border-[#161514] bg-[#03D26F] text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]">
              Habits & Wellness
            </span>
            <span className="text-[10px] font-heading font-black text-[#161514]/70">
              Lvl {achievements.userLevel} • {achievements.totalXP} XP
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-black text-[#161514] tracking-tight">
            Habits & Routines
          </h1>
          <p className="text-xs font-medium text-[#161514]/70 max-w-lg">
            Build daily consistency, conquer streaks, and maintain holistic vitality.
          </p>
        </div>

        {/* Quick Metrics & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3 py-2 rounded-xl border-2 border-[#161514] bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] text-center min-w-[70px]">
            <span className="text-[9px] font-heading font-black uppercase text-[#161514]/60 block leading-tight">Habits</span>
            <span className="text-sm font-heading font-black text-[#161514]">{totalHabits}</span>
          </div>
          <div className="px-3 py-2 rounded-xl border-2 border-[#161514] bg-amber-50 shadow-[2px_2px_0px_0px_#161514] text-center min-w-[70px]">
            <span className="text-[9px] font-heading font-black uppercase text-amber-700 block leading-tight">Best Streak</span>
            <span className="text-sm font-heading font-black text-[#161514] flex items-center justify-center gap-1">
              <Flame className="size-3.5 fill-rose-500 text-rose-500" />
              {longestStreakValue}d
            </span>
          </div>

          {/* Tactile Audio Mute Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextMuted = soundFX.toggleMute();
              setSoundMuted(nextMuted);
              toast.info(nextMuted ? "Tactile audio muted" : "Tactile audio active 🔊");
            }}
            className="size-10 rounded-xl border-2 border-[#161514] bg-white hover:bg-[#FFF9EA] text-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center cursor-pointer shrink-0"
            title={soundMuted ? "Unmute tactile sounds" : "Mute tactile sounds"}
            aria-label="Toggle sound"
          >
            {soundMuted ? <VolumeX className="size-4 stroke-[2.5]" /> : <Volume2 className="size-4 stroke-[2.5]" />}
          </button>

          <Button
            onClick={() => {
              soundFX.playPop();
              setIsChoiceOpen(true);
            }}
            className="bg-[#CEF431] hover:bg-[#D8F74E] text-[#161514] font-heading font-black text-xs px-3.5 py-2.5 h-auto rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center gap-1.5 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <Plus className="size-4 stroke-[3]" />
            <span>New Habit</span>
          </Button>

          {/* Interactive Fitness Vix Companion */}
          <VixPixelCompanion
            gear="fitness"
            state={isAllDueCompleted || longestStreakValue >= 3 ? "fire" : "idle"}
            size={42}
            onClick={() => {
              soundFX.playPop();
              setIsChoiceOpen(true);
            }}
            title={isAllDueCompleted ? "Vix: All daily habits conquered today! 🏆" : "Vix: Fitness Companion (Click for Habit Vault)"}
          />
        </div>
      </div>

      {/* 2. Proactive Reminder Banner */}
      <ProactiveReminderBanner space="goals" />

      {/* 3. Autonomous Streak Freeze Shield Card */}
      <div
        onClick={() => setIsShieldInfoOpen(true)}
        className="bg-white rounded-xl p-3 border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] flex items-center justify-between gap-2.5 cursor-pointer hover:bg-[#FAF8F5] transition-colors group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "size-8 shrink-0 rounded-lg border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1px_1px_0px_0px_#161514] transition-transform group-hover:scale-105",
              streakFreeze.tokensAvailable > 0 ? "bg-[#03D26F]" : "bg-amber-100"
            )}
          >
            {streakFreeze.tokensAvailable > 0 ? (
              <ShieldCheck className="size-4 stroke-[2.5]" />
            ) : (
              <ShieldAlert className="size-4 stroke-[2.5]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-heading font-black text-xs text-[#161514] uppercase tracking-tight truncate">
                Autonomous Streak Shield
              </h4>
              <span
                className={cn(
                  "text-[#161514] font-heading font-black text-[9px] px-1.5 py-0.5 rounded-md border border-[#161514] shrink-0",
                  streakFreeze.tokensAvailable > 0 ? "bg-[#CEF431]" : "bg-amber-200"
                )}
              >
                {streakFreeze.tokensAvailable > 0
                  ? `${streakFreeze.tokensAvailable}/2 Armed`
                  : "0/2 Depleted"}
              </span>
              {streakFreeze.frozenDates && streakFreeze.frozenDates.length > 0 && (
                <span className="bg-cyan-100 text-[#161514] font-heading font-bold text-[8.5px] px-1.5 py-0.5 rounded-md border border-[#161514] shrink-0 hidden sm:inline-block">
                  {streakFreeze.frozenDates.length} Shielded
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#161514]/70 font-medium truncate pt-0.5">
              {streakFreeze.tokensAvailable > 0
                ? "Auto-deploys if you miss a scheduled day. Flame preserved."
                : "0 shields remaining. Refills automatically on the 1st."}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <span className="text-[10px] font-heading font-black text-[#161514] bg-[#FAF8F5] group-hover:bg-[#CEF431] px-2 py-1 rounded-lg border border-[#161514] flex items-center gap-1 shadow-[1px_1px_0px_0px_#161514] transition-colors">
            <Info className="size-3 stroke-[2.5]" />
            <span className="hidden sm:inline">Details</span>
          </span>
        </div>
      </div>

      {/* 4. Weekly Overview Widget */}
      <WeeklyOverviewWidget />

      {/* 5. Weekly Velocity & Activity Matrix */}
      <WeeklyVelocityAndHabitMatrix />

      {/* 6. Responsive 2-Column Grid: Habits Checklist + Hydration & Health Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-4">
        {/* Left Column (2 cols on lg): Habits Checklist */}
        <div id="habits-section" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5" style={{ fontFamily: "var(--font-heading)" }}>
              <Sparkles className="size-3.5 text-[#03D26F]" />
              <span>Active Habit Streaks</span>
              <span className="bg-[#CEF431] text-[#161514] text-[10px] px-2 py-0.5 rounded-full border-2 border-[#161514] font-black shadow-[1px_1px_0px_0px_#161514]">
                {habits.length}
              </span>
            </h3>
            <button
              type="button"
              onClick={() => setIsChoiceOpen(true)}
              className="text-[10px] font-black uppercase tracking-wider text-[#161514] bg-[#CEF431] border-2 border-[#161514] px-2.5 py-1 rounded-xl shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              + New Habit
            </button>
          </div>

          {/* Daily Victory Celebration HUD */}
          {isAllDueCompleted && habits.length > 0 && (
            <div className="bg-[#CEF431] border-2 border-[#161514] rounded-2xl p-4 shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-white border-2 border-[#161514] flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_#161514] shrink-0">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#161514]" style={{ fontFamily: "var(--font-heading)" }}>
                      Daily Conquered! 100% Complete
                    </span>
                    <span className="bg-[#161514] text-[#CEF431] text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                      All Due Done
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-[#161514]/80 mt-0.5">
                    Vix is ecstatic! Every single habit scheduled for today has been checked off. Take a bow.
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex shrink-0">
                <VixPixelCompanion gear="fitness" state="celebrate" size={48} title="Daily Conquered!" />
              </div>
            </div>
          )}

          {/* Quick Filter Bar */}
          {habits.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white border-2 border-[#161514] rounded-2xl p-2.5 shadow-[3px_3px_0px_0px_#161514]">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                <button
                  type="button"
                  onClick={() => setHabitStatusFilter("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 border-[#161514] transition-all cursor-pointer",
                    habitStatusFilter === "all"
                      ? "bg-[#161514] text-white shadow-[2px_2px_0px_0px_#CEF431]"
                      : "bg-[#FAF8F5] text-[#161514] hover:bg-amber-100 shadow-[1px_1px_0px_0px_#161514]"
                  )}
                >
                  All ({habits.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHabitStatusFilter("pending")}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 border-[#161514] transition-all cursor-pointer flex items-center gap-1",
                    habitStatusFilter === "pending"
                      ? "bg-[#161514] text-white shadow-[2px_2px_0px_0px_#CEF431]"
                      : "bg-[#FAF8F5] text-[#161514] hover:bg-amber-100 shadow-[1px_1px_0px_0px_#161514]"
                  )}
                >
                  <span>Due Today</span>
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[9px] font-black border",
                    pendingTodayHabits.length > 0 ? "bg-amber-300 text-[#161514] border-[#161514]" : "bg-zinc-200 text-zinc-600 border-zinc-400"
                  )}>
                    {pendingTodayHabits.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setHabitStatusFilter("completed")}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 border-[#161514] transition-all cursor-pointer flex items-center gap-1",
                    habitStatusFilter === "completed"
                      ? "bg-[#161514] text-white shadow-[2px_2px_0px_0px_#03D26F]"
                      : "bg-[#FAF8F5] text-[#161514] hover:bg-emerald-50 shadow-[1px_1px_0px_0px_#161514]"
                  )}
                >
                  <span>Completed</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black border bg-[#03D26F] text-[#161514] border-[#161514]">
                    {completedTodayHabits.length}
                  </span>
                </button>
              </div>

              {/* Daily Momentum Progress Pill */}
              <div className="flex items-center gap-2 px-2.5 py-1 bg-[#FAF8F5] border-2 border-[#161514] rounded-xl text-[10px] font-black text-[#161514]">
                <span className="text-[9px] uppercase tracking-wider text-[#161514]/70">Today</span>
                <div className="w-16 h-2 bg-zinc-200 rounded-full border border-[#161514] overflow-hidden">
                  <div
                    className="h-full bg-[#03D26F] transition-all duration-300"
                    style={{ width: `${dailyCompletionPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-[#161514]">{dailyCompletionPercent}%</span>
              </div>
            </div>
          )}

          {habitsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border-2 border-[#161514] p-4 h-16 animate-pulse shadow-[3px_3px_0px_0px_#161514]" />
              ))}
            </div>
          ) : habits.length === 0 ? (
            <EmptyState
              title="Ready to build a new habit?"
              description="Habits help you build daily routines and streaks. Pick a suggestion below or click 'Create a Habit'!"
              Icon={Target}
              ctaText="Create a Habit"
              onCtaClick={() => setIsChoiceOpen(true)}
            />
          ) : displayedHabits.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-[#161514] p-8 text-center space-y-2 shadow-[3px_3px_0px_0px_#161514]">
              <div className="text-2xl">🎯</div>
              <h4 className="text-sm font-black text-[#161514]">
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
                  className="text-[11px] font-black uppercase text-[#161514] underline cursor-pointer"
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
                        "bg-white rounded-2xl p-3 border-2 border-[#161514] flex items-center justify-between transition-all cursor-pointer shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5",
                        isDone && "bg-emerald-50/70 opacity-90",
                        isRest && "bg-zinc-50 border-dashed opacity-80"
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
                            "h-8 w-8 rounded-xl border-2 border-[#161514] flex items-center justify-center font-black text-sm transition-all cursor-pointer shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
                            isDone ? "bg-[#03D26F] text-[#161514]" : "bg-white hover:bg-amber-100"
                          )}
                        >
                          {isDone ? "✓" : ""}
                        </button>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className={cn("font-black text-xs text-[#161514]", isDone && "line-through text-[#161514]/50")}>
                              {habit.title}
                            </h4>
                            {isRest && (
                              <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded border border-[#161514] bg-zinc-200 text-zinc-700">
                                💤 Rest
                              </span>
                            )}
                          </div>
                          {habitStreak?.currentStreak ? (
                            <span className="text-[9px] font-black text-amber-700 flex items-center gap-0.5 mt-0.5">
                              🔥 {habitStreak.currentStreak} day streak
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {habit.reminderTime && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-lg border border-[#161514] bg-white text-[#161514]">
                            ⏰ {habit.reminderTime}
                          </span>
                        )}
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border-2 border-[#161514] bg-amber-300 text-[#161514] shadow-[1px_1px_0px_0px_#161514]">
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

          {/* Suggestions Carousel */}
          <div className="space-y-2 pt-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70" style={{ fontFamily: "var(--font-heading)" }}>Suggested Routines</h4>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none select-none -mx-4 px-4 md:-mx-0 md:px-0">
              {SUGGESTED_HABITS.map((suggested) => (
                <div
                  key={suggested.title}
                  className="flex-shrink-0 w-[200px] bg-white rounded-2xl p-3 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex items-center justify-between gap-2 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-[#161514] block truncate">{suggested.title}</span>
                    <span className="text-[8px] text-[#161514]/70 font-bold block truncate">{suggested.desc}</span>
                  </div>
                  <button
                    onClick={() => handleAddSuggested(suggested)}
                    className="bg-amber-400 hover:bg-amber-500 text-[#161514] p-1.5 rounded-xl border-2 border-[#161514] cursor-pointer transition-all shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none outline-none flex-shrink-0"
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

          {/* Health & Weight Profile Card */}
          <div className="bg-white rounded-2xl p-5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#161514] flex items-center gap-1.5" style={{ fontFamily: "var(--font-heading)" }}>
                <Activity className="size-3.5 text-emerald-600" />
                <span>Body & Health Stats</span>
              </h4>
              <button
                type="button"
                onClick={updateProfileStat}
                className="px-2.5 py-1 rounded-xl bg-[#CEF431] hover:bg-[#bce023] text-[#161514] border-2 border-[#161514] font-black text-[10px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1"
              >
                <Edit3 className="size-3" />
                <span>Edit Stats</span>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-[#FAF8F5] p-2 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] text-center">
                <span className="text-[8px] font-black uppercase text-[#161514]/60 block">Weight</span>
                <span className="text-xs font-black text-[#161514] block mt-0.5">{userProfile.weight || "68 kg"}</span>
              </div>
              <div className="bg-[#FAF8F5] p-2 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] text-center">
                <span className="text-[8px] font-black uppercase text-[#161514]/60 block">Age</span>
                <span className="text-xs font-black text-[#161514] block mt-0.5">{userProfile.age || "24 Yrs"}</span>
              </div>
              <div className="bg-[#FAF8F5] p-2 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] text-center">
                <span className="text-[8px] font-black uppercase text-[#161514]/60 block">Gender</span>
                <span className="text-xs font-black text-[#161514] block mt-0.5">{userProfile.gender || "Female"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Sleep, Energy & Mood Journal Section */}
      <div id="mood-section" className="space-y-4 pt-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5" style={{ fontFamily: "var(--font-heading)" }}>
          <Moon className="size-3.5 text-indigo-600" />
          <span>Sleep, Energy & Mood Journal</span>
        </h3>
        <SleepAndActiveWidgets />
        <MoodJournalWidget dateStr={selectedDate} />
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
            <label className="text-xs font-heading font-black uppercase tracking-wider text-[#161514]">Gender</label>
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
                    "min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-heading font-black border-2 border-[#161514] transition-all cursor-pointer",
                    profileForm.gender === g
                      ? "bg-[#CEF431] text-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                      : "bg-[#FAF8F5] text-[#161514]/70 hover:bg-white"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-black uppercase tracking-wider text-[#161514]">Age (Years)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={ageVal}
              onChange={(e) => setAgeVal(e.target.value)}
              className="w-full bg-white rounded-xl border-2 border-[#161514] px-4 py-2.5 text-base font-bold text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:ring-2 focus:ring-[#161514]"
              placeholder="Enter your age"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-black uppercase tracking-wider text-[#161514]">Current Weight</label>
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
                className="flex-1 bg-white rounded-xl border-2 border-[#161514] px-4 py-2.5 text-base font-bold text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:ring-2 focus:ring-[#161514]"
                placeholder="Enter weight"
                required
              />
              <div className="flex rounded-xl border-2 border-[#161514] overflow-hidden shadow-[2px_2px_0px_0px_#161514]">
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
                        ? "bg-[#CEF431] text-[#161514]"
                        : "bg-[#FAF8F5] text-[#161514]/70 hover:bg-white"
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
            className="w-full min-h-[48px] bg-[#CEF431] hover:bg-[#bce023] text-[#161514] font-heading font-black rounded-xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer transition-all uppercase tracking-wider"
          >
            Save Profile Stats
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
              toast.success("Habit updated! 🌟");
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
            <label className="text-xs font-heading font-black uppercase tracking-wider text-[#161514]">
              Habit Title *
            </label>
            <input
              type="text"
              value={editHabitTitle}
              onChange={(e) => setEditHabitTitle(e.target.value)}
              className="w-full bg-white rounded-xl border-2 border-[#161514] px-4 py-2.5 text-base font-bold text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:ring-2 focus:ring-[#161514]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-heading font-black uppercase tracking-wider text-[#161514]">
              Reminder Time
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { label: "🌅 Morning", time: "08:00 AM" },
                { label: "☀️ Noon", time: "12:00 PM" },
                { label: "🌆 Evening", time: "07:00 PM" },
                { label: "🌙 Night", time: "10:00 PM" },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setEditHabitDesc(preset.time);
                  }}
                  className={cn(
                    "min-h-[38px] py-1.5 px-2 rounded-xl text-xs font-bold border-2 border-[#161514] transition-all cursor-pointer flex items-center justify-center text-center",
                    editHabitDesc === preset.time
                      ? "bg-[#CEF431] text-[#161514] font-black shadow-[2px_2px_0px_0px_#161514]"
                      : "bg-white hover:bg-slate-50 text-[#161514]/80 shadow-[1px_1px_0px_0px_#161514]"
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
              className="w-full bg-white rounded-xl border-2 border-[#161514] px-4 py-2 text-base font-bold text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:ring-2 focus:ring-[#161514] mt-1"
            />
          </div>

          <Button
            type="submit"
            disabled={updateHabitMutation.isPending}
            className="w-full min-h-[48px] bg-[#03D26F] hover:bg-[#02b861] text-[#161514] font-heading font-black rounded-xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer transition-all uppercase tracking-wider"
          >
            {updateHabitMutation.isPending ? "Saving…" : "Save Changes"}
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
          <div className="p-3.5 rounded-xl border-2 border-[#161514] bg-[#FAF8F5] shadow-[2px_2px_0px_#161514] flex items-start gap-3">
            <div className="size-10 rounded-lg bg-[#03D26F] border-2 border-[#161514] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#161514]">
              <ShieldCheck className="size-5 text-[#161514] stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h5 className="font-heading font-black text-sm text-[#161514]">
                  Inventory: {streakFreeze.tokensAvailable} / 2 Shields
                </h5>
                <span className="bg-[#CEF431] text-[#161514] font-black text-[9px] px-2 py-0.5 rounded-md border border-[#161514]">
                  {streakFreeze.tokensAvailable > 0 ? "SHIELD ARMED" : "REFILLS 1ST"}
                </span>
              </div>
              <p className="text-xs text-[#161514]/80 mt-1 leading-relaxed">
                Autonomous monitoring ensures your hard-earned flame never gets wiped out by a single missed day.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <h6 className="font-heading font-black text-xs text-[#161514] uppercase tracking-wider">
              How The Shield Works
            </h6>
            <div className="space-y-2 text-xs text-[#161514]/85">
              <div className="p-2.5 rounded-lg border border-[#161514] bg-white flex items-start gap-2.5">
                <span className="text-base">🤖</span>
                <div>
                  <strong className="text-[#161514] font-heading font-bold block">Autonomous Activation</strong>
                  If you miss a scheduled habit, the system automatically detects it, consumes 1 shield token, and freezes the date. No manual toggle required.
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-[#161514] bg-white flex items-start gap-2.5">
                <span className="text-base">🔥</span>
                <div>
                  <strong className="text-[#161514] font-heading font-bold block">Continuous Flame Calculation</strong>
                  Streak algorithms fold frozen days into your active streak history, bridging the gap so your count continues uninterrupted.
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-[#161514] bg-white flex items-start gap-2.5">
                <span className="text-base">🌿</span>
                <div>
                  <strong className="text-[#161514] font-heading font-bold block">Zero-Penalty Rest Days</strong>
                  Custom-scheduled habits (e.g. 3 days/week) recognize rest days naturally — they never break your streak or consume freeze tokens.
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-[#161514] bg-white flex items-start gap-2.5">
                <span className="text-base">🔄</span>
                <div>
                  <strong className="text-[#161514] font-heading font-bold block">Monthly Auto-Refill</strong>
                  Every month on the 1st, 1 free streak shield is granted to your inventory (maximum capacity: 2).
                </div>
              </div>
            </div>
          </div>

          {/* Frozen Dates Ledger */}
          {streakFreeze.frozenDates && streakFreeze.frozenDates.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-[#161514]/15">
              <h6 className="font-heading font-black text-xs text-[#161514] uppercase tracking-wider">
                Protected Dates History ({streakFreeze.frozenDates.length})
              </h6>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                {streakFreeze.frozenDates.map((dateStr) => (
                  <span
                    key={dateStr}
                    className="bg-cyan-100 text-[#161514] font-mono font-bold text-xs px-2.5 py-1 rounded-md border border-[#161514] flex items-center gap-1 shadow-[1px_1px_0px_#161514]"
                  >
                    <span>🛡️</span>
                    <span>{dateStr}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => setIsShieldInfoOpen(false)}
            className="w-full bg-[#161514] hover:bg-[#161514]/90 text-white font-heading font-black text-xs py-2.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_#161514]"
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
    <Suspense fallback={<InvictusLoadingScreen message="Loading Life & Goals…" />}>
      <GoalsPageContent />
    </Suspense>
  );
}
