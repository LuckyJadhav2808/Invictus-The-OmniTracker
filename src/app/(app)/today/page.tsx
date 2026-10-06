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
import { useTransactions, useCategories, useAddTransaction } from "@/lib/queries/money";
import { useTasks, useUpdateTask } from "@/lib/queries/tasks";
import { computeMonthlyBudgetStats, computeDailyBudgetStats } from "@/lib/utils/budget-rollover";
import { useWidgetSync } from "@/lib/hooks/useWidgetSync";
import { toast } from "sonner";
import {
  format,
  parseISO,
  addDays,
  subDays,
  isToday as checkIsToday,
} from "date-fns";

// Modular Today Cockpit & Mascot Components
import { TodayGreetingHero } from "@/components/today/TodayGreetingHero";
import { QuickActionDock } from "@/components/today/QuickActionDock";
import { HabitMomentumCard } from "@/components/today/HabitMomentumCard";
import { StudySprintWidget } from "@/components/today/StudySprintWidget";
import { SafeToSpendGauge } from "@/components/today/SafeToSpendGauge";
import { TaskBattleQueue } from "@/components/today/TaskBattleQueue";
import { EveningReflectionCard } from "@/components/today/EveningReflectionCard";
import { ConfettiCelebration } from "@/components/common/ConfettiCelebration";

export default function TodayPage() {
  const { user } = useAuth();
  const { selectedDate, setSelectedDate } = useUIStore();

  // Queries
  const { data: habits = [] } = useHabits();
  const { data: logs = [] } = useHabitLogs(selectedDate);
  const { data: streaks = {} } = useStreaks();
  const { data: streakFreeze = { tokensAvailable: 1, frozenDates: [] } } = useStreakFreeze();
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
    toast.success(`Logged +${amount}ml water! Stay hydrated 🌊`);
  };

  const { syncToWidget } = useWidgetSync();

  // Celebration state
  const [showConfetti, setShowConfetti] = useState(false);
  const previousConqueredRef = useRef(false);

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

  // Trigger confetti when hitting 100% completion
  useEffect(() => {
    if (allHabitsConquered && !previousConqueredRef.current) {
      setShowConfetti(true);
      toast.success("🔥 VICTORY! All daily habits conquered. Vix salutes you!");
    }
    previousConqueredRef.current = allHabitsConquered;
  }, [allHabitsConquered]);

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

  const budgetStats = useMemo(() => {
    const currentMonthKey = format(currentDateObj, "yyyy-MM");
    return computeMonthlyBudgetStats({
      transactions,
      categories,
      targetMonthKey: currentMonthKey,
      baseUpiBudget: 10000,
      baseCashBudget: 3000,
      enableRollover: true,
      currencySymbol,
    });
  }, [transactions, categories, currentDateObj, currencySymbol]);

  const dailyBudgetStats = useMemo(() => {
    return computeDailyBudgetStats({
      transactions,
      monthlyStats: budgetStats,
      customDailyBudget: null,
    });
  }, [transactions, budgetStats]);

  // Sync to widget
  useEffect(() => {
    if (!transactions.length && !categories.length) return;
    try {
      syncToWidget({
        safeToSpendDaily: budgetStats.dailySafeToSpend,
        remainingUpiBudget: budgetStats.remainingUpiBudget,
        remainingCashBudget: budgetStats.remainingCashBudget,
        totalAvailableUpiBudget: budgetStats.totalAvailableUpiBudget,
        totalAvailableCashBudget: budgetStats.totalAvailableCashBudget,
        currencySymbol,
        daysRemainingInMonth: budgetStats.daysRemainingInMonth,
        targetMonthLabel: budgetStats.targetMonthLabel.split(" ")[0],
        hasCashBudget: budgetStats.baseCashBudget > 0 || budgetStats.totalAvailableCashBudget > 0,
        todayExpense: dailyBudgetStats.todayExpense,
        todayRemaining: dailyBudgetStats.todayRemaining,
        dailyBudgetTarget: dailyBudgetStats.dailyBudgetTarget,
        isOverDailyBudget: dailyBudgetStats.isOverDailyBudget,
        overDailyAmount: dailyBudgetStats.overDailyAmount,
      });
    } catch {}
  }, [transactions, categories, budgetStats, dailyBudgetStats, currencySymbol, syncToWidget]);

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

  // Smooth scroll helper for quick dock
  const scrollToHabits = () => {
    const el = document.getElementById("habits-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-6 py-4 px-3 sm:px-6 max-w-5xl mx-auto">
      {/* Milestone Confetti Explosion */}
      <ConfettiCelebration active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* 1. Dynamic Greeting Hero & Vix the Gladiator Bot Cockpit */}
      <TodayGreetingHero
        currentDateObj={currentDateObj}
        isToday={isCurrentDayToday}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onJumpToToday={handleJumpToToday}
        streakDays={streakDays}
        streakFreezeTokens={streakFreeze.tokensAvailable || 0}
        completedHabitsCount={completedHabitsCount}
        totalHabitsCount={totalHabitsCount}
        studyMinutesToday={todayStudyMinutes}
        isStudyingActive={isTimerRunning}
        allHabitsConquered={allHabitsConquered}
      />

      {/* 2. Ergonomic Quick Action Dock (44px Touch Targets) */}
      <QuickActionDock
        isTimerRunning={isTimerRunning}
        onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
        onOpenExpenseModal={() => setIsQuickExpenseOpen(true)}
        onScrollToHabits={scrollToHabits}
      />

      {/* 3. Bento Row 1: Habit Momentum Ring & Study Focus Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Habit Momentum Card (7 Cols) */}
        <div className="lg:col-span-7">
          <HabitMomentumCard
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
        <div className="lg:col-span-5">
          <StudySprintWidget
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

      {/* 4. Bento Row 2: Financial Safe-to-Spend Gauge & Priority Battle Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Safe-to-Spend Financial Gauge (6 Cols) */}
        <div className="lg:col-span-6">
          <SafeToSpendGauge
            spentToday={spentToday}
            dailySafeToSpend={budgetStats.dailySafeToSpend}
            currencySymbol={currencySymbol}
            transactions={todayTransactions}
            categories={categories}
            isQuickExpenseOpen={isQuickExpenseOpen}
            onToggleQuickExpense={() => setIsQuickExpenseOpen(!isQuickExpenseOpen)}
            onAddExpense={handleAddExpense}
            isSavingExpense={isSavingExpense}
          />
        </div>

        {/* Priority Battle Queue (6 Cols) */}
        <div className="lg:col-span-6">
          <TaskBattleQueue
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

      {/* 5. Bento Row 3: Daily Reflection & Mindset */}
      <EveningReflectionCard
        currentMood={currentMood}
        reflectionNote={reflectionNote}
        onChangeNote={setReflectionNote}
        onSaveMood={handleSaveMood}
        isSaving={isSavingMood}
      />
    </div>
  );
}
