"use client";

import { useAuth } from "@/components/shared/AuthProvider";
import { CalendarStrip } from "@/components/shared/CalendarStrip";
import { StatTile } from "@/components/shared/StatTile";
import { InsightCard } from "@/components/shared/InsightCard";
import { FAB } from "@/components/shared/FAB";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format, startOfWeek, addDays, isSameDay, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { BookOpen, Wallet, CheckSquare, Sparkles, Clock, LogOut, ArrowRight, Play, Square, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { useHabits, useHabitLogs, useStreaks } from "@/lib/queries/goals";
import { useStudySessions, useSubjects, useAllTopics } from "@/lib/queries/study";
import { useTransactions, useCategories } from "@/lib/queries/money";
import { useUIStore } from "@/store/ui-store";
import { SpaceHeroBanner } from "@/components/shared/SpaceHeroBanner";
import { LiquidPillBarChart } from "@/components/shared/LiquidPillBarChart";
import { DraggableDashboardGrid } from "@/components/shared/DraggableDashboardGrid";
import { QuickThoughtsWidget } from "@/components/shared/QuickThoughtsWidget";
import { GymRoutineTracker } from "@/components/goals/GymRoutineTracker";
import { MealTracker } from "@/components/goals/MealTracker";
import { MoodJournalWidget } from "@/components/goals/MoodJournalWidget";
import { SleepAndActiveWidgets } from "@/components/goals/SleepAndActiveWidgets";
import { ExamSyllabusTracker } from "@/components/study/ExamSyllabusTracker";
import { StudySessionLogger } from "@/components/study/StudySessionLogger";
import { MoneyQuickActionsAndCards } from "@/components/money/MoneyQuickActionsAndCards";
import { SubscriptionsTracker } from "@/components/money/SubscriptionsTracker";
import { SavingsGoals } from "@/components/money/SavingsGoals";
import { generateInsights, type Insight } from "@/lib/utils/insights";
import { cn } from "@/lib/utils";

export default function TodayPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { selectedDate, setSelectedDate } = useUIStore();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [chartViewMode, setChartViewMode] = useState<"week" | "month">("week");

  // Profile preferences
  const [currency, setCurrency] = useState("INR");

  // Dismissed insights list
  const [dismissedInsightIds, setDismissedInsightIds] = useState<string[]>([]);

  // Active Session states
  const [activeStopwatch, setActiveStopwatch] = useState<{
    start: string;
    subjectId: string;
    topicId: string;
    topicTitle: string;
  } | null>(null);

  const { data: habits = [] } = useHabits();
  const { data: logs = [] } = useHabitLogs(selectedDate);
  const { data: streaks = {} } = useStreaks();
  const { data: studySessions = [] } = useStudySessions();
  const { data: subjects = [] } = useSubjects();
  const { data: allTopics = [] } = useAllTopics();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();

  // Load user profile details for currency & load dismissed insights / active stopwatches
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const isGuestMode = localStorage.getItem("invictus_guest_mode") === "true";
      if (isGuestMode) {
        const profileStr = localStorage.getItem("invictus_user_profile");
        if (profileStr) {
          const profile = JSON.parse(profileStr);
          if (profile.currency) setCurrency(profile.currency);
        }
      } else if (user.currency) {
        setCurrency(user.currency);
      }
    };
    loadProfile();

    // Dismissed insights
    const dismissed = localStorage.getItem("invictus_dismissed_insights");
    if (dismissed) {
      setDismissedInsightIds(JSON.parse(dismissed));
    }

    // Active stopwatch check
    const checkStopwatch = () => {
      const start = localStorage.getItem("invictus_stopwatch_start");
      const subId = localStorage.getItem("invictus_stopwatch_subject_id");
      const topId = localStorage.getItem("invictus_stopwatch_topic_id");
      const title = localStorage.getItem("invictus_stopwatch_topic_title");
      if (start && subId && topId && title) {
        setActiveStopwatch({
          start,
          subjectId: subId,
          topicId: topId,
          topicTitle: title,
        });
      } else {
        setActiveStopwatch(null);
      }
    };
    checkStopwatch();
    const interval = setInterval(checkStopwatch, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const currencySymbol = (() => {
    switch (currency) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "JPY": return "¥";
      default: return "₹";
    }
  })();

  // Compute habit completed stats
  const activeHabits = habits.filter((h) => !h.archived);
  const activeHabitIds = new Set(activeHabits.map((h) => h.id));
  const completedLogs = logs.filter((l) => activeHabitIds.has(l.habitId) && l.completed);
  const totalHabitsCount = activeHabits.length;
  const completedHabitsCount = completedLogs.length;

  const needsSatisfaction =
    totalHabitsCount > 0
      ? Math.round((completedHabitsCount / totalHabitsCount) * 100)
      : 0;

  // Compute study stats
  const studyMinutesToday = studySessions
    .filter((s) => s.date === selectedDate)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const studyHoursToday = (studyMinutesToday / 60).toFixed(1);
  const studyPercentage = Math.min(100, Math.round((studyMinutesToday / 240) * 100)); // 4h target

  // Compute money stats
  const spentToday = transactions
    .filter((t) => t.date === selectedDate && t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const activeExpenseCats = categories.filter((c) => c.type === "expense" && !c.archived);
  const totalMonthlyBudget = activeExpenseCats.reduce((sum, c) => sum + (c.monthlyBudget || 0), 0);
  const dailyBudget = totalMonthlyBudget > 0 ? totalMonthlyBudget / 30 : 500;
  const moneyPercentage = Math.min(100, Math.round((spentToday / dailyBudget) * 100));

  // Generate dynamic client-side insights
  const allInsights = generateInsights({
    habits,
    streaks,
    categories,
    transactions,
    studySessions,
  });

  const activeInsights = allInsights.filter((ins) => !dismissedInsightIds.includes(ins.id));

  const handleDismissInsight = (id: string) => {
    const nextDismissed = [...dismissedInsightIds, id];
    setDismissedInsightIds(nextDismissed);
    localStorage.setItem("invictus_dismissed_insights", JSON.stringify(nextDismissed));
  };

  // Filter logs for lists
  const habitsDone = habits.filter((h) => {
    const log = logs.find((l) => l.habitId === h.id);
    return log?.completed && !h.archived;
  });

  const studyToday = studySessions.filter((s) => s.date === selectedDate);
  const txsToday = transactions.filter((t) => t.date === selectedDate);

  const hasAnyLogs = habitsDone.length > 0 || studyToday.length > 0 || txsToday.length > 0;

  return (
    <div className="min-h-screen bg-cream-bg p-4 md:p-8 pb-28 lg:pb-12 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Space Hero Banner */}
        <SpaceHeroBanner
          space="today"
          badgeText="Daily Overview"
          title={`Welcome back, ${user?.displayName || "Champion"}! 👋`}
          subtitle="Here's a snapshot of your daily habits, study hours, and financial tracking for today."
          stats={[
            { label: "Habits Done", value: `${completedHabitsCount}/${totalHabitsCount}`, icon: "🌱" },
            { label: "Study Today", value: `${studyHoursToday}h`, icon: "📚" },
            { label: "Spent Today", value: `${currencySymbol}${spentToday}`, icon: "💰" },
          ]}
          actionButton={{
            label: "Quick Log Habits",
            onClick: () => router.push("/goals"),
          }}
        />

        {/* Draggable Today Dashboard Grid with Pinning Support from Goals, Study & Money Spaces */}
        <DraggableDashboardGrid
          storageKey="today"
          widgets={[
            {
              id: "pillbar-chart",
              title: "📊 Liquid Pill Bar Chart & Calendar Strip",
              category: "today",
              component: (
                <div className="space-y-4">
                  <CalendarStrip activityDays={{}} />
                  {(() => {
                    const todayDate = new Date();
                    if (chartViewMode === "month") {
                      const monthlyBars = Array.from({ length: 6 }, (_, i) => {
                        const monthDate = subMonths(todayDate, 5 - i);
                        const mStart = format(startOfMonth(monthDate), "yyyy-MM-dd");
                        const mEnd = format(endOfMonth(monthDate), "yyyy-MM-dd");
                        const isCurrentMonth = i === 5;
                        const habitsInMonth = logs.filter((l) => l.date >= mStart && l.date <= mEnd && l.completed).length;
                        const studySecsInMonth = studySessions
                          .filter((s) => s.date >= mStart && s.date <= mEnd)
                          .reduce((acc, curr) => acc + ((curr.durationMinutes || 0) * 60), 0);
                        const scorePct = Math.min(100, Math.round((habitsInMonth * 10) + ((studySecsInMonth / 3600) * 15)));
                        return {
                          label: format(monthDate, "MMM"),
                          percentage: Math.max(10, scorePct),
                          value: scorePct > 0 ? `${scorePct}%` : "0%",
                          highlighted: isCurrentMonth,
                          color: isCurrentMonth ? "#FB7185" : "#38BDF8",
                        };
                      });

                      return (
                        <LiquidPillBarChart
                          title="Monthly Performance & Tracker Flow"
                          totalValue={`${logs.filter((l) => l.completed).length} Total Habits | ${(studySessions.reduce((a, c) => a + (c.durationMinutes || 0), 0) / 60).toFixed(1)}h Total Study`}
                          data={monthlyBars}
                          onCalendarClick={() => {
                            setSelectedDate(format(todayDate, "yyyy-MM-dd"));
                            toast.success("Jumped to Today 📅");
                          }}
                          onViewModeToggle={(nextMode) => setChartViewMode(nextMode)}
                          className="my-4"
                        />
                      );
                    }

                    const mondayDate = startOfWeek(todayDate, { weekStartsOn: 1 });
                    const weeklyBars = Array.from({ length: 7 }, (_, i) => {
                      const day = addDays(mondayDate, i);
                      const dayStr = format(day, "yyyy-MM-dd");
                      const isToday = isSameDay(day, todayDate);
                      const habitsDoneOnDay = logs.filter((l) => l.date === dayStr && l.completed).length;
                      const studySecsOnDay = studySessions
                        .filter((s) => s.date === dayStr)
                        .reduce((acc, curr) => acc + ((curr.durationMinutes || 0) * 60), 0);
                      const habitPct = totalHabitsCount > 0 ? (habitsDoneOnDay / totalHabitsCount) * 50 : 0;
                      const studyPct = Math.min(50, (studySecsOnDay / 3600) * 25);
                      const scorePct = Math.min(100, Math.round(habitPct + studyPct));

                      return {
                        label: format(day, "eee"),
                        percentage: Math.max(8, scorePct),
                        value: scorePct > 0 ? `${scorePct}%` : "0%",
                        highlighted: isToday,
                        color: isToday ? "#FB7185" : "#38BDF8",
                      };
                    });

                    return (
                      <LiquidPillBarChart
                        title="Weekly Consistency & Tracker Flow"
                        totalValue={`${completedHabitsCount} Habits | ${studyHoursToday}h Study`}
                        data={weeklyBars}
                        onCalendarClick={() => {
                          setSelectedDate(format(todayDate, "yyyy-MM-dd"));
                          toast.success("Jumped to Today 📅");
                        }}
                        onViewModeToggle={(nextMode) => setChartViewMode(nextMode)}
                        className="my-4"
                      />
                    );
                  })()}
                </div>
              ),
            },
          ]}
          availableWidgets={[
            {
              id: "gym-section",
              title: "🏋️ Gym Splits & Workout Routines",
              category: "goals",
              component: <GymRoutineTracker />,
            },
            {
              id: "nutrition-section",
              title: "🥗 Nutrition & Meal Tracker",
              category: "goals",
              component: <MealTracker />,
            },
            {
              id: "mood-section",
              title: "😴 Sleep, Energy & Mood Journal",
              category: "goals",
              component: (
                <div className="space-y-4">
                  <SleepAndActiveWidgets />
                  <MoodJournalWidget dateStr={selectedDate} />
                </div>
              ),
            },
            {
              id: "syllabus-tracker",
              title: "📚 Exam Syllabus & Revision Tracker",
              category: "study",
              component: (
                <ExamSyllabusTracker
                  subjects={subjects}
                  allTopics={allTopics}
                />
              ),
            },
            {
              id: "session-logger",
              title: "✍️ Study Session Logger & Focus Meter",
              category: "study",
              component: (
                <StudySessionLogger
                  topics={allTopics}
                  onLogSession={(data) => {
                    toast.success(`Logged ${data.durationMinutes} min study session! 📚`);
                  }}
                />
              ),
            },
            {
              id: "category-wallets",
              title: "💳 Category Wallets & Accounts",
              category: "money",
              component: (
                <MoneyQuickActionsAndCards
                  mainBalance={0}
                  currencySymbol={currencySymbol}
                  categories={categories.map((c) => ({
                    id: c.id,
                    name: c.name,
                    amount: transactions
                      .filter((t) => t.categoryId === c.id && t.type === "expense")
                      .reduce((sum, t) => sum + t.amount, 0),
                    color: c.color,
                    icon: c.icon || "💳",
                    type: c.type,
                    monthlyBudget: c.monthlyBudget,
                  }))}
                  onAddTransaction={() => router.push("/money")}
                />
              ),
            },
            {
              id: "subscriptions",
              title: "🔁 Active Subscriptions",
              category: "money",
              component: <SubscriptionsTracker />,
            },
            {
              id: "savings-goals",
              title: "🐷 Savings Goals & Piggy Bank",
              category: "money",
              component: <SavingsGoals />,
            },
          ]}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile
            label="Needs Satisfaction"
            value={`${needsSatisfaction}%`}
            percentage={needsSatisfaction}
            bgClass="bg-amber-500"
            textColorClass="text-navy-900"
            ringColorClass="stroke-navy-900"
            onClick={() => router.push("/goals")}
          />
          <StatTile
            label="Habits Done"
            value={`${completedHabitsCount} / ${totalHabitsCount}`}
            percentage={totalHabitsCount > 0 ? (completedHabitsCount / totalHabitsCount) * 100 : 0}
            bgClass="bg-mint-400"
            textColorClass="text-navy-900"
            ringColorClass="stroke-navy-900"
            onClick={() => router.push("/goals")}
          />
          <StatTile
            label="Study Time"
            value={`${studyHoursToday}h`}
            percentage={studyPercentage}
            bgClass="bg-orange-500"
            textColorClass="text-white"
            ringColorClass="stroke-white"
            onClick={() => router.push("/study")}
          />
          <StatTile
            label="Money Spent"
            value={`${currencySymbol}${spentToday}`}
            percentage={moneyPercentage}
            bgClass="bg-lavender-400"
            textColorClass="text-navy-900"
            ringColorClass="stroke-navy-900"
            onClick={() => router.push("/money")}
          />
        </div>

        {/* Active stopwatch session banner */}
        {activeStopwatch && (
          <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-[0_8px_24px_rgba(31,36,48,0.06)] border-l-4 border-mint-600 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-mint-600/10 flex items-center justify-center text-mint-600 animate-pulse">
                <Play className="h-5 w-5 fill-mint-600" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-navy-900">Active Study Session</h4>
                <p className="text-xs text-navy-600 mt-0.5">Currently tracking topic: "{activeStopwatch.topicTitle}"</p>
              </div>
            </div>
            <Button
              onClick={() => router.push(`/study/${activeStopwatch.subjectId}/${activeStopwatch.topicId}`)}
              className="bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-full py-1.5 px-4 shadow-sm text-xs border-none cursor-pointer flex items-center gap-1"
            >
              Stop & Log <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Quick Thoughts & Scratchpad Widget */}
        <QuickThoughtsWidget />

        {/* Daily Log summaries */}
        <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[0_8px_24px_rgba(31,36,48,0.06)] space-y-4 border">
          <h3 className="font-bold text-xs uppercase tracking-wider text-navy-600" style={{ fontFamily: "var(--font-heading)" }}>
            Tracking summary for {selectedDate}
          </h3>

          {!hasAnyLogs ? (
            <p className="text-center text-xs text-navy-600 py-6 leading-relaxed">
              No habits completed, study logs, or money transactions tracked on this day yet. 
              Tap the floating button below to track your day!
            </p>
          ) : (
            <div className="space-y-4">
              {/* Habits Completed today list */}
              {habitsDone.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-mint-600" /> Habits Completed
                  </h4>
                  <div className="flex flex-wrap gap-2 pl-5.5">
                    {habitsDone.map((h) => (
                      <span key={h.id} className="text-xs font-bold text-navy-900 bg-cream-bg/40 border rounded-full px-3 py-1 flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-amber-500" /> {h.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Study sessions logged today list */}
              {studyToday.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-orange-500" /> Study Sessions
                  </h4>
                  <div className="space-y-1.5 pl-5.5">
                    {studyToday.map((s) => (
                      <div key={s.id} className="text-xs font-semibold text-navy-600 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-navy-600" />
                        <span>Studied for <strong className="text-navy-900 font-bold">{s.durationMinutes}m</strong> {s.notes && `(${s.notes})`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions logged today list */}
              {txsToday.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                    <Wallet className="h-4 w-4 text-lavender-600" /> Transactions Logged
                  </h4>
                  <div className="space-y-1.5 pl-5.5">
                    {txsToday.map((t) => {
                      const category = categories.find((c) => c.id === t.categoryId);
                      return (
                        <div key={t.id} className="text-xs font-semibold text-navy-600 flex items-center justify-between">
                          <span>{category?.name || "Uncategorized"} {t.note && `(${t.note})`}</span>
                          <span className={cn("font-bold", t.type === "income" ? "text-mint-600" : "text-navy-900")}>
                            {t.type === "income" ? "+" : "-"}{currencySymbol}{t.amount}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Insights Section */}
        {activeInsights.length > 0 && (
          <InsightCard
            insights={activeInsights.map((ins) => ({
              id: ins.id,
              module: ins.module,
              text: ins.text,
            }))}
            onDismiss={handleDismissInsight}
          />
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <FAB onClick={() => setIsQuickAddOpen(true)} />

      {/* Quick Add Form Container */}
      <ResponsiveFormContainer
        open={isQuickAddOpen}
        onOpenChange={setIsQuickAddOpen}
        title="Quick Log"
        description="Select an action to track your day"
      >
        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={() => {
              setIsQuickAddOpen(false);
              router.push("/goals");
            }}
            className="w-full rounded-[var(--radius-md)] border border-input py-6 text-sm font-bold hover:bg-cream-bg/30 bg-white text-navy-900 flex items-center justify-start gap-3 shadow-none cursor-pointer"
          >
            <div className="bg-amber-500/15 text-amber-600 rounded-[var(--radius-sm)] p-2">
              <CheckSquare className="h-5 w-5" />
            </div>
            <span>Check Off Habits</span>
          </Button>

          <Button
            onClick={() => {
              setIsQuickAddOpen(false);
              router.push("/study");
            }}
            className="w-full rounded-[var(--radius-md)] border border-input py-6 text-sm font-bold hover:bg-cream-bg/30 bg-white text-navy-900 flex items-center justify-start gap-3 shadow-none cursor-pointer"
          >
            <div className="bg-orange-500/15 text-orange-500 rounded-[var(--radius-sm)] p-2">
              <BookOpen className="h-5 w-5" />
            </div>
            <span>Log Study Session</span>
          </Button>

          <Button
            onClick={() => {
              setIsQuickAddOpen(false);
              router.push("/money");
            }}
            className="w-full rounded-[var(--radius-md)] border border-input py-6 text-sm font-bold hover:bg-cream-bg/30 bg-white text-navy-900 flex items-center justify-start gap-3 shadow-none cursor-pointer"
          >
            <div className="bg-mint-600/15 text-mint-600 rounded-[var(--radius-sm)] p-2">
              <Wallet className="h-5 w-5" />
            </div>
            <span>Log Money Transaction</span>
          </Button>
        </div>
      </ResponsiveFormContainer>
    </div>
  );
}
