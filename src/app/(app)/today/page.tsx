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
import { useStudySessions, useSubjects, useAllTopics, useAddStudySession } from "@/lib/queries/study";
import { useTransactions, useCategories, useAddTransaction, useBudgetPreferences, useUpdateBudgetPreferences } from "@/lib/queries/money";
import { useTasks, useUpdateTask, useCreateTask } from "@/lib/queries/tasks";
import { computeMonthlyBudgetStats, computeDailyBudgetStats } from "@/lib/utils/budget-rollover";
import { AllowanceSettingsModal } from "@/components/money/modals/AllowanceSettingsModal";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import {
  format,
  parseISO,
  addDays,
  subDays,
  isToday as checkIsToday,
} from "date-fns";

// Modular Today Cockpit Architecture (Candidate Coliseum)
import { MasterTodayHero } from "@/components/today/MasterTodayHero";
import { HabitMomentumCard } from "@/components/today/HabitMomentumCard";
import { StudySprintWidget } from "@/components/today/StudySprintWidget";
import { SafeToSpendGauge } from "@/components/today/SafeToSpendGauge";
import { TaskBattleQueue } from "@/components/today/TaskBattleQueue";
import { RetroStickyScratchpadDrawer } from "@/components/today/RetroStickyScratchpadDrawer";
import { EveningCloseoutDrawer } from "@/components/today/EveningCloseoutDrawer";
import { StickyIslandMiniCockpit } from "@/components/today/StickyIslandMiniCockpit";
import { ConfettiCelebration } from "@/components/common/ConfettiCelebration";
import { FirstRunQuickStartDeck } from "@/components/today/FirstRunQuickStartDeck";
import { useTodayCockpitViewModel, computeDailyConquestScore } from "@/components/today/useTodayCockpitViewModel";

export default function TodayPage() {
  const { user } = useAuth();
  const { selectedDate, setSelectedDate } = useUIStore();

  // Queries
  const { data: habits = [] } = useHabits();
  const { data: logs = [] } = useHabitLogs(selectedDate);
  const { data: streaks = {} } = useStreaks();
  const { data: streakFreeze = { userId: "", tokensAvailable: 1, lastMonthlyCredit: "", frozenDates: [], autoShieldEvent: null } } = useStreakFreeze();
  const toggleHabitMutation = useToggleHabitLog();

  const { data: studySessions = [] } = useStudySessions();
  const { data: subjects = [] } = useSubjects();
  const { data: allTopics = [] } = useAllTopics();
  const addStudySessionMutation = useAddStudySession();

  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const addTransactionMutation = useAddTransaction();

  const { data: tasks = [] } = useTasks();
  const updateTaskMutation = useUpdateTask();
  const createTaskMutation = useCreateTask();
  const { daypartMode, setDaypartMode, effectiveDaypart } = useTodayCockpitViewModel();

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
    toast.success(`Logged +${amount}ml water`);
  };

  // User Cloud Budget Preferences
  const { data: cloudBudgetPrefs } = useBudgetPreferences();
  const updateBudgetMutation = useUpdateBudgetPreferences();
  const [isDailyLimitModalOpen, setIsDailyLimitModalOpen] = useState(false);
  const [isCloseoutDrawerOpen, setIsCloseoutDrawerOpen] = useState(false);
  const [isScratchpadDrawerOpen, setIsScratchpadDrawerOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
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
      toast.success("All daily habits completed");
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

  // Study metrics
  const todayStudySessions = useMemo(
    () => studySessions.filter((s) => s.date === selectedDate),
    [studySessions, selectedDate]
  );
  const todayStudyMinutes = useMemo(
    () => todayStudySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0),
    [todayStudySessions]
  );
  const todayStudyHours = (todayStudyMinutes / 60).toFixed(1);
  const studyTargetHours = 4.0;
  const studyCompletionPercent = Math.min(
    100,
    Math.round(((todayStudyMinutes / 60) / studyTargetHours) * 100)
  );

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

  // Derived Daily Conquest Telemetry
  const conquestMetrics = useMemo(() => {
    return computeDailyConquestScore({
      completedHabitsCount,
      totalHabitsCount,
      studyMinutesToday: todayStudyMinutes,
      studyTargetHours: 4.0,
      spentToday,
      dailySafeToSpend: budgetStats.dailySafeToSpend,
      currencySymbol,
    });
  }, [
    completedHabitsCount,
    totalHabitsCount,
    todayStudyMinutes,
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

  // Active Stopwatch State
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleSaveTimerSession = async () => {
    if (stopwatchSeconds < 60) {
      toast.error("Sessions must be at least 1 minute to save.");
      return;
    }
    const durationMinutes = Math.max(1, Math.round(stopwatchSeconds / 60));
    try {
      await addStudySessionMutation.mutateAsync({
        subjectId: selectedSubjectId || (subjects[0]?.id || "general"),
        topicId: selectedTopicId || "general",
        durationMinutes,
        date: selectedDate,
        type: "practice",
        notes: `Focus sprint recorded on ${selectedDate}`,
      });
      toast.success(`Logged ${durationMinutes}m focus session!`);
      setStopwatchSeconds(0);
      setIsTimerRunning(false);
    } catch {
      toast.error("Could not save session.");
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
        categoryId: categoryId || (categories[0]?.id || "cat-food"),
        date: selectedDate,
        paymentMethod: "upi",
        note: note.trim() || "Quick expense",
        isRecurring: false,
      });
      toast.success(`Recorded ${currencySymbol}${amount}!`);
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
      toast.success("Mindset reflection saved!");
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

  // Smooth scroll helpers
  const scrollToHabits = () => {
    const el = document.getElementById("habits-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToStudy = () => {
    const el = document.getElementById("study-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToMoney = () => {
    const el = document.getElementById("money-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };
  const handleOpenExpenseModal = () => {
    setIsQuickExpenseOpen(true);
    scrollToMoney();
  };
  const scrollToTop = () => {
    const mainContainer = document.getElementById("main-scroll-container");
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Sticky Mini Island Sentinel & Visibility (IntersectionObserver)
  const heroSentinelRef = useRef<HTMLDivElement>(null);
  const [isStickyIslandVisible, setIsStickyIslandVisible] = useState(false);

  useEffect(() => {
    const sentinel = heroSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStickyIslandVisible(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "-20px 0px 0px 0px",
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-6 py-4 px-3 sm:px-6 max-w-5xl mx-auto relative pb-12">
      {/* 0. Sticky Island Mini-Cockpit on Scroll (Apple Dynamic Island & Spotify Benchmark) */}
      <StickyIslandMiniCockpit
        metrics={conquestMetrics}
        currentDateObj={currentDateObj}
        isTimerRunning={isTimerRunning}
        stopwatchSeconds={stopwatchSeconds}
        onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
        onOpenExpenseModal={handleOpenExpenseModal}
        onScrollToTop={scrollToTop}
        visible={isStickyIslandVisible}
      />

      {/* Top Sentinel for Sticky Island trigger */}
      <div ref={heroSentinelRef} className="h-0 w-full" aria-hidden="true" />

      {/* Milestone Confetti Celebration */}
      <ConfettiCelebration active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* ZONE 1: TRUE GLADIATOR HERO SECTION (MasterTodayHero) */}
      <MasterTodayHero
        userName={user?.displayName}
        currentDateObj={currentDateObj}
        selectedDate={selectedDate}
        isToday={isCurrentDayToday}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onJumpToToday={handleJumpToToday}
        onSelectDate={setSelectedDate}
        streakDays={streakDays}
        streakFreezeTokens={streakFreeze.tokensAvailable || 0}
        completedHabitsCount={completedHabitsCount}
        totalHabitsCount={totalHabitsCount}
        studyMinutesToday={todayStudyMinutes}
        isStudyingActive={isTimerRunning}
        allHabitsConquered={allHabitsConquered}
        daypartMode={daypartMode}
        effectiveDaypart={effectiveDaypart}
        onSelectDaypartMode={setDaypartMode}
        metrics={conquestMetrics}
        onScrollToHabits={scrollToHabits}
        onScrollToStudy={scrollToStudy}
        onScrollToMoney={scrollToMoney}
        onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
        onOpenExpenseModal={handleOpenExpenseModal}
        onOpenCloseoutDrawer={() => setIsCloseoutDrawerOpen(true)}
        onOpenScratchpad={() => setIsScratchpadDrawerOpen(true)}
      />

      {/* Guided First-Run Quick Start Deck (Disappears upon dismissal or completion) */}
      <FirstRunQuickStartDeck
        totalHabitsCount={totalHabitsCount}
        completedHabitsCount={completedHabitsCount}
        hasBudgetOrExpenses={transactions.length > 0 || (Boolean(cloudBudgetPrefs?.customDailyBudget) && (cloudBudgetPrefs?.customDailyBudget ?? 0) > 0)}
        hasStudySessions={studySessions.length > 0 || todayStudyMinutes > 0}
        onOpenDailyLimitModal={() => setIsDailyLimitModalOpen(true)}
        onStartStudySprint={() => {
          scrollToStudy();
          setIsTimerRunning(true);
        }}
      />

      {/* ZONE 2: DAILY CORE HUB (Bento Row 1 - Habits & Study Focus - Locked Baseline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Habit Momentum Card (7 Cols) */}
        <div id="habits-section" className="lg:col-span-7 h-full">
          <HabitMomentumCard
            className="h-full flex flex-col justify-between"
            habits={habits}
            logs={logs}
            streaks={streaks}
            selectedDate={selectedDate}
            waterAmount={waterAmount}
            waterTarget={waterTarget}
            onQuickLogWater={() => handleQuickLogWater(250)}
            onToggleHabit={(habitId, completed) => {
              toggleHabitMutation.mutate({
                habitId,
                date: selectedDate,
                completed,
              });
            }}
          />
        </div>

        {/* Study Sprint Stopwatch Widget (5 Cols) */}
        <div id="study-section" className="lg:col-span-5 h-full">
          <StudySprintWidget
            className="h-full flex flex-col justify-between"
            stopwatchSeconds={stopwatchSeconds}
            isTimerRunning={isTimerRunning}
            onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
            onResetTimer={() => {
              setIsTimerRunning(false);
              setStopwatchSeconds(0);
            }}
            onSaveSession={handleSaveTimerSession}
            selectedSubjectId={selectedSubjectId}
            onChangeSubject={setSelectedSubjectId}
            selectedTopicId={selectedTopicId}
            onChangeTopic={setSelectedTopicId}
            subjects={subjects}
            allTopics={allTopics}
            todayStudyHours={todayStudyHours}
            studyCompletionPercent={studyCompletionPercent}
          />
        </div>
      </div>

      {/* ZONE 3: OPERATIONS HUB (Bento Row 2 - Money & Tasks - Locked Baseline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Safe-to-Spend Financial Gauge (6 Cols) */}
        <div id="money-section" className="lg:col-span-6 h-full">
          <SafeToSpendGauge
            className="h-full flex flex-col justify-between"
            spentToday={spentToday}
            dailySafeToSpend={budgetStats.dailySafeToSpend}
            customDailyBudget={customDailyBudget}
            currencySymbol={currencySymbol}
            transactions={todayTransactions}
            categories={categories}
            isQuickExpenseOpen={isQuickExpenseOpen}
            onToggleQuickExpense={() => setIsQuickExpenseOpen(!isQuickExpenseOpen)}
            onAddExpense={handleAddExpense}
            isSavingExpense={isSavingExpense}
            onOpenSetDailyLimit={() => setIsDailyLimitModalOpen(true)}
          />
        </div>

        {/* Priority Battle Queue (6 Cols) */}
        <div id="tasks-section" className="lg:col-span-6 h-full">
          <TaskBattleQueue
            className="h-full flex flex-col justify-between"
            tasks={tasks}
            selectedDate={selectedDate}
            onCompleteTask={(taskId, title) => {
              updateTaskMutation.mutate({
                id: taskId,
                updates: { status: "completed" },
              });
              toast.success(`Conquered: ${title}`);
            }}
          />
        </div>
      </div>

      {/* ZONE 4: ON-DEMAND SLIDE-OVER DESK SCRATCHPAD & FLOATING ACTION DOCK */}
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

      {/* ZONE 5: CONTEXTUAL EVENING CLOSEOUT DRAWER (Bottom Sheet Triggered at Night / on Demand) */}
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

      {/* Note: The global footer is rendered once at the application root layout level (layout.tsx) */}

      {/* Daily Spending Limit & Allowances Modal */}
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
    </div>
  );
}
