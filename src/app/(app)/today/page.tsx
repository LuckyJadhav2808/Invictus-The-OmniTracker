"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import { useUIStore } from "@/store/ui-store";
import {
  useHabits,
  useHabitLogs,
  useToggleHabitLog,
  useStreaks,
  useStreakFreeze,
  useMoodLog,
  useSaveMoodLog,
  useWaterLog,
  useLogWater,
  useHealthProfile,
} from "@/lib/queries/goals";
import { soundFX } from "@/components/shared/SoundFX";
import { useTransactions, useCategories, useAddTransaction, useBudgetPreferences, useUpdateBudgetPreferences } from "@/lib/queries/money";
import { useTasks, useUpdateTask, useCreateTask } from "@/lib/queries/tasks";
import { computeMonthlyBudgetStats } from "@/lib/utils/budget-rollover";
import { toast, strobiToast } from "@/lib/utils/toasts";
import { Shield, SunMedium, Clock, Moon, Droplet, Plus, FileText, ArrowUpRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  format,
  parseISO,
  addDays,
  subDays,
  isToday as checkIsToday,
} from "date-fns";

// 5-Slot Architecture Components
import { MobileAppBar } from "@/components/mobile/MobileAppBar";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SegmentedSubNav, type SubNavTab } from "@/components/mobile/SegmentedSubNav";
import { TodayHeroPager } from "@/components/today/TodayHeroPager";
import { HorizonWeekStrip } from "@/components/today/HorizonWeekStrip";
import { TodayDoorTileRow } from "@/components/today/TodayDoorTileRow";
import { TodayChronologicalAgenda } from "@/components/today/TodayChronologicalAgenda";
import { TodayTopHabitsMomentum } from "@/components/today/TodayTopHabitsMomentum";
import { TelemetryMarquee } from "@/components/ui/telemetry-marquee";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { WaterTracker } from "@/components/goals/WaterTracker";
import { computeDailyConquestScore } from "@/components/today/useTodayCockpitViewModel";
import { useSyncNativeQuickLogs } from "@/lib/native/useSyncNativeQuickLogs";
import type { StrobiState } from "@/components/mascot/StrobiCompanion";

// Dynamic imports for heavy drawers and modals to optimize initial bundle
const TodayQuickExpenseModal = dynamic(
  () => import("@/components/today/TodayQuickExpenseModal").then((m) => m.TodayQuickExpenseModal),
  { ssr: false }
);
const RetroStickyScratchpadDrawer = dynamic(
  () => import("@/components/today/RetroStickyScratchpadDrawer").then((m) => m.RetroStickyScratchpadDrawer),
  { ssr: false }
);
const EveningCloseoutDrawer = dynamic(
  () => import("@/components/today/EveningCloseoutDrawer").then((m) => m.EveningCloseoutDrawer),
  { ssr: false }
);
const AllowanceSettingsModal = dynamic(
  () => import("@/components/money/modals/AllowanceSettingsModal").then((m) => m.AllowanceSettingsModal),
  { ssr: false }
);
const NewTaskModal = dynamic(
  () => import("@/components/tasks/NewTaskModal").then((m) => m.NewTaskModal),
  { ssr: false }
);
const ConfettiCelebration = dynamic(
  () => import("@/components/common/ConfettiCelebration").then((m) => m.ConfettiCelebration),
  { ssr: false }
);

const TODAY_DESKTOP_SUB_NAV_TABS: SubNavTab[] = [
  { id: "overview", label: "Overview", shortLabel: "Agenda", icon: SunMedium },
  { id: "timeline", label: "Timeline", shortLabel: "Timeline", icon: Clock },
  { id: "review", label: "Review", shortLabel: "Review", icon: Moon },
];

export default function TodayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedDate, setSelectedDate } = useUIStore();

  // Queries
  const { data: habits = [] } = useHabits();
  const { data: logs = [] } = useHabitLogs(selectedDate);
  const { data: streaks = {} } = useStreaks();
  const { data: streakFreeze = { userId: "", tokensAvailable: 1, lastMonthlyCredit: "", frozenDates: [], autoShieldEvent: null } } = useStreakFreeze();
  const toggleHabitMutation = useToggleHabitLog();

  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const addTransactionMutation = useAddTransaction();

  const { data: tasks = [] } = useTasks();
  const updateTaskMutation = useUpdateTask();
  const createTaskMutation = useCreateTask();

  const { data: moodLog } = useMoodLog(selectedDate);
  const saveMoodMutation = useSaveMoodLog();

  // Hydration sync
  const { data: waterLog = { id: selectedDate, date: selectedDate, amount: 0 } } = useWaterLog(selectedDate);
  const { data: healthProfile } = useHealthProfile();
  const logWaterMutation = useLogWater();
  const waterTarget = healthProfile?.waterGoal || 2000;
  const waterAmount = waterLog?.amount || 0;

  const handleQuickLogWater = (amount = 250) => {
    soundFX.playSplash();
    soundFX.vibrate(15);
    logWaterMutation.mutate({ date: selectedDate, amount });
    strobiToast.today(`Logged +${amount}ml water! 💧`, { quip: "Vitality recharged! Keep pacing strong." });
  };

  // User Cloud Budget Preferences
  const { data: cloudBudgetPrefs } = useBudgetPreferences();
  const updateBudgetMutation = useUpdateBudgetPreferences();
  const [isDailyLimitModalOpen, setIsDailyLimitModalOpen] = useState(false);
  const [isCloseoutDrawerOpen, setIsCloseoutDrawerOpen] = useState(false);
  const [isScratchpadDrawerOpen, setIsScratchpadDrawerOpen] = useState(false);
  const [isWaterSheetOpen, setIsWaterSheetOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [desktopActiveTab, setDesktopActiveTab] = useState("overview");
  const previousConqueredRef = useRef(false);
  const isInitialMountRef = useRef(true);

  // Currency resolution
  const [currency, setCurrency] = useState("INR");
  useEffect(() => {
    if (user?.currency) setCurrency(user.currency);
    else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("invictus_user_profile");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.currency) setCurrency(parsed.currency);
        } catch {}
      }
    }
  }, [user]);

  // Contextual Event Listeners for Flower Arc FAB
  useEffect(() => {
    const handleOpenReflection = () => {
      soundFX.playPop();
      soundFX.vibrate(15);
      setIsCloseoutDrawerOpen(true);
    };
    const handleNewTask = () => {
      soundFX.playPop();
      soundFX.vibrate(15);
      setIsNewTaskOpen(true);
    };
    const handleNewExpense = () => {
      soundFX.playPop();
      soundFX.vibrate(15);
      setIsQuickExpenseOpen(true);
    };
    const handleQuickWater = (e: any) => {
      const amt = e.detail?.amount || 250;
      handleQuickLogWater(amt);
    };

    window.addEventListener("invictus:today-open-reflection", handleOpenReflection);
    window.addEventListener("invictus:tasks-new-task", handleNewTask);
    window.addEventListener("invictus:money-new-expense", handleNewExpense);
    window.addEventListener("invictus:quick-log-water", handleQuickWater);

    return () => {
      window.removeEventListener("invictus:today-open-reflection", handleOpenReflection);
      window.removeEventListener("invictus:tasks-new-task", handleNewTask);
      window.removeEventListener("invictus:money-new-expense", handleNewExpense);
      window.removeEventListener("invictus:quick-log-water", handleQuickWater);
    };
  }, [handleQuickLogWater]);

  const currencySymbol = useMemo(() => {
    switch (currency) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "JPY": return "¥";
      default: return "₹";
    }
  }, [currency]);

  // 🛡️ Autonomous Streak Freeze Shield Notification
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
          <div className="bg-white dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] p-3.5 rounded-xl shadow-md flex items-center gap-3 w-full max-w-sm">
            <div className="size-8 rounded-lg bg-[#DCFAE5] dark:bg-[#03D26F]/20 flex items-center justify-center shrink-0">
              <Shield className="size-4 text-[#047857] dark:text-[#03D26F] stroke-[1.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-[#161514] dark:text-[#FAF8F5]">
                  Streak Protected
                </span>
                <span className="bg-[#DCFAE5] dark:bg-[#03D26F]/20 text-[#04250e] dark:text-[#03D26F] font-medium text-xs px-1.5 py-0.5 rounded">
                  Saved
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] leading-tight mt-0.5">
                Protected {datesList} ({streakFreeze.tokensAvailable}/2 tokens remaining)
              </p>
            </div>
          </div>
        ),
        { duration: 6000 }
      );
    }
  }, [streakFreeze]);

  // Date Navigation
  const currentDateObj = useMemo(() => {
    try {
      return parseISO(selectedDate);
    } catch {
      return new Date();
    }
  }, [selectedDate]);

  const isCurrentDayToday = checkIsToday(currentDateObj);

  const handlePrevDay = () => {
    const prev = subDays(currentDateObj, 1);
    setSelectedDate(format(prev, "yyyy-MM-dd"));
  };

  const handleNextDay = () => {
    const next = addDays(currentDateObj, 1);
    setSelectedDate(format(next, "yyyy-MM-dd"));
  };

  const handleJumpToToday = () => {
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
  };

  // Habit metrics
  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const activeHabitIds = useMemo(() => new Set(activeHabits.map((h) => h.id)), [activeHabits]);
  const completedHabitLogs = useMemo(
    () => logs.filter((l) => activeHabitIds.has(l.habitId) && l.completed),
    [logs, activeHabitIds]
  );
  const totalHabitsCount = activeHabits.length;
  const completedHabitsCount = completedHabitLogs.length;
  const allHabitsConquered = totalHabitsCount > 0 && completedHabitsCount === totalHabitsCount;

  // Task metrics for Today's Executive Telemetry
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === "completed") {
        return !t.dueDate || t.dueDate === selectedDate;
      }
      return !t.dueDate || t.dueDate === selectedDate || t.priority === "p1";
    });
  }, [tasks, selectedDate]);
  const completedTasksCount = useMemo(() => {
    return todayTasks.filter((t) => t.status === "completed").length;
  }, [todayTasks]);
  const totalTasksCount = todayTasks.length;
  const totalItemsCount = totalHabitsCount + totalTasksCount;
  const completedItemsCount = completedHabitsCount + completedTasksCount;

  const completionPercent = useMemo(() => {
    if (totalItemsCount === 0) return 100;
    return Math.min(100, Math.round((completedItemsCount / totalItemsCount) * 100));
  }, [completedItemsCount, totalItemsCount]);

  // Trigger confetti when hitting 100% completion during active session
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousConqueredRef.current = allHabitsConquered;
      return;
    }

    const celebrationKey = `invictus_celebrated_${selectedDate}`;
    const alreadyCelebrated = typeof window !== "undefined" && sessionStorage.getItem(celebrationKey) === "true";

    if (allHabitsConquered && !previousConqueredRef.current && !alreadyCelebrated) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(celebrationKey, "true");
      }
      setShowConfetti(true);
      strobiToast.habits("All daily habits conquered! 🏆", { quip: "Gladiator mindset! Streak blazing 🔥" });
    }
    previousConqueredRef.current = allHabitsConquered;
  }, [allHabitsConquered, selectedDate]);

  // Streak days max
  const streakDays = useMemo(() => {
    return Object.values(streaks).reduce(
      (max: number, s: any) => Math.max(max, s?.currentStreak || 0),
      0
    );
  }, [streaks]);

  // Money & Safe-to-Spend metrics
  const todayTransactions = useMemo(
    () => transactions.filter((t) => t.date === selectedDate),
    [transactions, selectedDate]
  );
  const spentToday = useMemo(
    () =>
      todayTransactions
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => acc + (t.amount || 0), 0),
    [todayTransactions]
  );

  const localUpiBudget = typeof window !== "undefined" ? Number(localStorage.getItem("invictus_monthly_upi_budget")) : 0;
  const localCashBudget = typeof window !== "undefined" ? Number(localStorage.getItem("invictus_monthly_cash_budget")) : 0;

  const baseUpiBudget = (cloudBudgetPrefs?.upiBudget && cloudBudgetPrefs.upiBudget > 0)
    ? cloudBudgetPrefs.upiBudget
    : (localUpiBudget > 0 ? localUpiBudget : 8000);

  const baseCashBudget = (cloudBudgetPrefs?.cashBudget !== undefined && cloudBudgetPrefs.cashBudget > 0)
    ? cloudBudgetPrefs.cashBudget
    : (localCashBudget > 0 ? localCashBudget : 2000);

  const enableRollover = cloudBudgetPrefs?.enableRollover ?? (typeof window !== "undefined" ? localStorage.getItem("invictus_budget_rollover_enabled") === "true" : false);
  const customDailyBudget = cloudBudgetPrefs?.customDailyBudget ?? (typeof window !== "undefined" && localStorage.getItem("invictus_custom_daily_budget") ? Number(localStorage.getItem("invictus_custom_daily_budget")) : null);

  const budgetStats = useMemo(() => {
    const currentMonthKey = format(currentDateObj, "yyyy-MM");
    return computeMonthlyBudgetStats({
      transactions,
      categories,
      targetMonthKey: currentMonthKey,
      baseUpiBudget,
      baseCashBudget,
      enableRollover,
      currencySymbol,
    });
  }, [transactions, categories, currentDateObj, baseUpiBudget, baseCashBudget, enableRollover, currencySymbol]);

  // ⚡ Bi-Directional Native Android Ambient Quick-Log Sync
  useSyncNativeQuickLogs(budgetStats.dailySafeToSpend);

  // Derived Daily Conquest Telemetry
  const conquestMetrics = useMemo(() => {
    return computeDailyConquestScore({
      completedHabitsCount,
      totalHabitsCount,
      spentToday,
      dailySafeToSpend: budgetStats.dailySafeToSpend,
      currencySymbol,
    });
  }, [
    completedHabitsCount,
    totalHabitsCount,
    spentToday,
    budgetStats.dailySafeToSpend,
    currencySymbol,
  ]);

  const handleSaveDailyLimit = async (payload: {
    upiBudget: number;
    cashBudget: number;
    customDailyBudget: number | null;
    enableRollover: boolean;
  }) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("invictus_monthly_upi_budget", String(payload.upiBudget));
        localStorage.setItem("invictus_monthly_cash_budget", String(payload.cashBudget));
        if (payload.customDailyBudget !== null) {
          localStorage.setItem("invictus_custom_daily_budget", String(payload.customDailyBudget));
        } else {
          localStorage.removeItem("invictus_custom_daily_budget");
        }
        localStorage.setItem("invictus_budget_rollover_enabled", String(payload.enableRollover));
      } catch {}
    }
    try {
      await updateBudgetMutation.mutateAsync({
        upiBudget: payload.upiBudget,
        cashBudget: payload.cashBudget,
        customDailyBudget: payload.customDailyBudget,
        enableRollover: payload.enableRollover,
      });
      toast.success("Daily spending limit saved & synced.");
    } catch {
      toast.success("Daily limit saved locally.");
    }
  };

  // Quick Expense Modal state
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  const handleAddExpense = async (amount: number, categoryId: string, note: string) => {
    setIsSavingExpense(true);
    try {
      await addTransactionMutation.mutateAsync({
        amount,
        type: "expense",
        categoryId: categoryId || (categories.find((c) => c.type === "expense")?.id || "cat-food"),
        date: selectedDate,
        paymentMethod: "upi",
        note: note.trim() || "Quick expense",
        isRecurring: false,
      });
      strobiToast.money(`Recorded ${currencySymbol}${amount}!`, { quip: "Disciplined spend! Wallet in check 💰" });
      setIsQuickExpenseOpen(false);
    } catch {
      toast.error("Could not record expense.");
    } finally {
      setIsSavingExpense(false);
    }
  };

  // Mood and Notes State
  const [currentMood, setCurrentMood] = useState<string>(moodLog?.mood || "good");
  const [reflectionNote, setReflectionNote] = useState<string>(moodLog?.note || "");
  const [isSavingMood, setIsSavingMood] = useState(false);

  useEffect(() => {
    if (moodLog) {
      setCurrentMood(moodLog.mood || "good");
      setReflectionNote(moodLog.note || "");
    }
  }, [moodLog]);

  const handleSaveMood = async (newMood?: string) => {
    const targetMood = newMood || currentMood;
    setIsSavingMood(true);
    try {
      await saveMoodMutation.mutateAsync({
        date: selectedDate,
        mood: targetMood,
        energy: 4,
        note: reflectionNote.trim(),
      });
      strobiToast.today("Mindset reflection saved! 🧠", { quip: "Introspection builds unshakeable clarity." });
    } catch {
      toast.error("Could not save reflection.");
    } finally {
      setIsSavingMood(false);
    }
  };

  // Tomorrow pending tasks preview for night closeout
  const tomorrowDateStr = useMemo(() => format(addDays(currentDateObj, 1), "yyyy-MM-dd"), [currentDateObj]);
  const tomorrowPendingTasksCount = useMemo(() => {
    return tasks.filter((t) => (t.dueDate === tomorrowDateStr || (t as any).date === tomorrowDateStr) && t.status !== "completed").length;
  }, [tasks, tomorrowDateStr]);

  // Strobi state
  const getStrobiState = (): StrobiState => {
    if (allHabitsConquered && totalHabitsCount > 0) return "celebrate";
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 5) return "sleep";
    if (streakDays >= 3) return "fire";
    return "idle";
  };
  const strobiState = getStrobiState();

  const handleDesktopTabChange = (val: string) => {
    soundFX.playPop();
    setDesktopActiveTab(val);
    if (val === "review") {
      setIsCloseoutDrawerOpen(true);
    }
  };

  return (
    <div className="w-full max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto select-none space-y-3 sm:space-y-4 px-1 sm:px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {/* ================= SLOT 1: MOBILE APP BAR (Mobile Only) ================= */}
      <MobileAppBar
        title="Today"
        selectedDate={selectedDate || format(currentDateObj, "yyyy-MM-dd")}
        onSelectDate={setSelectedDate}
        dateShortLabel={isCurrentDayToday ? undefined : format(currentDateObj, "MMM d")}
        calendarTooltip="Jump to Today"
        showDynamicIsland={true}
        customMenuItems={
          <>
            <DropdownMenuItem
              onClick={() => {
                soundFX.playPop();
                setIsScratchpadDrawerOpen(true);
              }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-heading font-black cursor-pointer hover:bg-secondary focus:bg-secondary"
            >
              <span>Desk Notes</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                soundFX.playPop();
                setIsCloseoutDrawerOpen(true);
              }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-heading font-black cursor-pointer hover:bg-secondary focus:bg-secondary"
            >
              <span>Night Closeout</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                soundFX.playPop();
                setIsDailyLimitModalOpen(true);
              }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-heading font-black cursor-pointer hover:bg-secondary focus:bg-secondary"
            >
              <span>Daily Limit</span>
            </DropdownMenuItem>
          </>
        }
      />

      {/* Milestone Confetti Celebration */}
      <ConfettiCelebration active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* ================= UNIFIED 5-SLOT COCKPIT FLOW (Universal Mobile & Desktop) ================= */}
      <div className="px-1.5 sm:px-3.5 space-y-3">
        {/* SLOT 3: ONE BORDERLESS HERO CAROUSEL SLOT */}
        <TodayHeroPager
          userName={user?.displayName}
          completionPercent={completionPercent}
          completedCount={completedItemsCount}
          totalCount={totalItemsCount}
          streakDays={streakDays}
          streakFreezeTokens={streakFreeze.tokensAvailable || 0}
          allHabitsConquered={allHabitsConquered}
          remainingSafeToSpend={budgetStats.dailySafeToSpend - spentToday}
          spentToday={spentToday}
          dailySafeToSpend={budgetStats.dailySafeToSpend}
          currencySymbol={currencySymbol}
          strobiState={strobiState}
          onOpenQuickExpense={() => setIsQuickExpenseOpen(true)}
          onOpenShieldInfo={() => setIsCloseoutDrawerOpen(true)}
        />

        {/* 7-Day Horizon Scrubber (Unboxed hairline strip) */}
        <div className="py-0.5">
          <HorizonWeekStrip
            currentDateObj={currentDateObj}
            selectedDate={selectedDate || format(currentDateObj, "yyyy-MM-dd")}
            isToday={isCurrentDayToday}
            onSelectDate={setSelectedDate}
            onPrevDay={handlePrevDay}
            onNextDay={handleNextDay}
            onJumpToToday={handleJumpToToday}
          />
        </div>

        {/* SLOT 4: ONE DOOR TILE ROW (Max 4 Doorway Cards to L2: Task, Habit, Money, Profile) */}
        <div className="py-1">
          <TodayDoorTileRow
            taskCount={todayTasks.length}
            completedTasksCount={completedTasksCount}
            habitCount={totalHabitsCount}
            completedHabitsCount={completedHabitsCount}
            remainingSafeToSpend={budgetStats.dailySafeToSpend - spentToday}
            dailySafeToSpend={budgetStats.dailySafeToSpend}
            currencySymbol={currencySymbol}
            onOpenTasks={() => router.push("/tasks")}
            onOpenHabits={() => router.push("/goals")}
            onOpenMoney={() => router.push("/money")}
            onOpenProfile={() => router.push("/profile")}
            waterAmount={waterAmount}
            waterTarget={waterTarget}
            onOpenScratchpad={() => setIsScratchpadDrawerOpen(true)}
            onOpenCloseout={() => setIsCloseoutDrawerOpen(true)}
            onOpenWater={() => setIsWaterSheetOpen(true)}
            onOpenDailyLimit={() => setIsDailyLimitModalOpen(true)}
            onQuickLogWater={() => handleQuickLogWater(250)}
          />
        </div>

        {/* Real-time Gladiator Conquest Telemetry Marquee Tape */}
        <div className="py-1">
          <TelemetryMarquee
            items={[
              "⚔️ STOIC CONQUEST TELEMETRY",
              "DISCIPLINE OVER MOTIVATION",
              `${completedItemsCount}/${totalItemsCount} TARGETS CRUSHED (${completionPercent}%)`,
              `HYDRATION: ${waterAmount}/${waterTarget}ML`,
              `CRYO-SHIELDS: ${streakFreeze.tokensAvailable || 0}/2 READY`,
              "SEAL DAY LEDGER BEFORE MIDNIGHT",
            ]}
            className="rounded-xl border-2 border-[#161514] dark:border-[#383531] shadow-2xs"
            speed={26}
          />
        </div>

        {/* SLOT 5: ONE UNIFIED CHRONOLOGICAL DAY AGENDA */}
        <div id="agenda-section">
          <TodayChronologicalAgenda
            habits={habits}
            logs={logs}
            streaks={streaks}
            tasks={tasks}
            selectedDate={selectedDate}
            isToday={isCurrentDayToday}
            onToggleHabit={(habitId, completed) => {
              toggleHabitMutation.mutate({
                habitId,
                date: selectedDate,
                completed,
              });
            }}
            onToggleTask={(taskId, completed) => {
              updateTaskMutation.mutate({
                id: taskId,
                updates: { status: completed ? "completed" : "todo" },
              });
            }}
          />
        </div>
      </div>

      {/* ================= L2/L3 DRAWERS & BOTTOM SHEETS ================= */}

      {/* 1. Daily Hydration Bottom Sheet */}
      <BottomSheet
        open={isWaterSheetOpen}
        onOpenChange={setIsWaterSheetOpen}
        title="Daily Hydration"
        description="Fast vessel logging & target management"
      >
        <div className="py-2">
          <WaterTracker
            amount={waterAmount}
            targetAmount={waterTarget}
            onLogWater={handleQuickLogWater}
            onSetWater={async (amt, target) => {
              await logWaterMutation.mutateAsync({
                date: selectedDate,
                amount: amt,
              });
            }}
          />
        </div>
      </BottomSheet>

      {/* 2. On-Demand Slide-Over Desk Scratchpad Drawer */}
      <RetroStickyScratchpadDrawer
        open={isScratchpadDrawerOpen}
        onOpenChange={setIsScratchpadDrawerOpen}
        categories={categories}
        onConvertToTask={(task) => {
          createTaskMutation.mutate({
            title: task.title,
            priority: task.priority || "p2",
            status: "todo",
            date: task.date || selectedDate,
            category: task.category || "Quick Thought",
            subtasks: [],
          } as any);
        }}
        onConvertToExpense={(expense) => {
          handleAddExpense(
            expense.amount,
            expense.categoryId || "",
            expense.note
          );
        }}
        onBatchConvert={(batchTasks, batchExpenses) => {
          batchTasks.forEach((t) => {
            createTaskMutation.mutate({
              title: t.title,
              priority: t.priority || "p2",
              status: "todo",
              date: t.date || selectedDate,
              category: t.category || "Quick Thought",
              subtasks: [],
            } as any);
          });
          batchExpenses.forEach((e) => {
            handleAddExpense(e.amount, e.categoryId || "", e.note);
          });
        }}
      />

      {/* 3. Contextual Evening Closeout Drawer */}
      <EveningCloseoutDrawer
        open={isCloseoutDrawerOpen}
        onOpenChange={setIsCloseoutDrawerOpen}
        metrics={conquestMetrics}
        selectedDate={selectedDate}
        isToday={isCurrentDayToday}
        onSealComplete={() => setShowConfetti(true)}
        tomorrowPendingTasksCount={tomorrowPendingTasksCount}
        tomorrowSafeToSpend={budgetStats.dailySafeToSpend}
        currencySymbol={currencySymbol}
        currentMood={currentMood}
        reflectionNote={reflectionNote}
        onChangeNote={setReflectionNote}
        onSaveMood={handleSaveMood}
        isSavingMood={isSavingMood}
      />

      {/* 4. Daily Spending Limit & Allowances Modal */}
      <AllowanceSettingsModal
        open={isDailyLimitModalOpen}
        onOpenChange={setIsDailyLimitModalOpen}
        currencySymbol={currencySymbol}
        defaultUpiBudget={baseUpiBudget}
        defaultCashBudget={baseCashBudget}
        defaultCustomDailyBudget={customDailyBudget}
        defaultEnableRollover={enableRollover}
        dailySafeToSpend={budgetStats.dailySafeToSpend}
        onSave={handleSaveDailyLimit}
      />

      {/* 5. 3-Second Quick Expense Modal */}
      <TodayQuickExpenseModal
        open={isQuickExpenseOpen}
        onOpenChange={setIsQuickExpenseOpen}
        currencySymbol={currencySymbol}
        categories={categories}
        onAddExpense={handleAddExpense}
        isSaving={isSavingExpense}
      />

      {/* 6. Quick Task Creation Modal */}
      <NewTaskModal
        open={isNewTaskOpen}
        onOpenChange={setIsNewTaskOpen}
        onSubmit={async (data) => {
          try {
            await createTaskMutation.mutateAsync({
              title: data.title,
              priority: data.priority || "p2",
              status: "todo",
              dueDate: data.dueDate || selectedDate,
              projectTag: data.projectTag || "Life",
              description: data.description,
              subtasks: data.subtasks || [],
            } as any);
            strobiToast.tasks("Task created successfully! ⚡", { quip: "Top priority locked in. Flow state awaits!" });
            setIsNewTaskOpen(false);
          } catch {
            toast.error("Failed to create task");
          }
        }}
      />
    </div>
  );
}
