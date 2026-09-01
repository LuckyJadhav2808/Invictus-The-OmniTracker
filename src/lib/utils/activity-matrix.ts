import { format, subDays, startOfWeek, addDays, isSameDay, isToday as checkIsToday, parseISO, differenceInDays } from "date-fns";
import { HabitLog } from "@/lib/schemas/goals";
import { StudySession } from "@/lib/schemas/study";
import { Transaction } from "@/lib/schemas/money";

export type MatrixFilterType = "all" | "habits" | "study" | "money";
export type MatrixRangeType = "3m" | "6m" | "1y";

export interface ActivityDayDetail {
  date: Date;
  dateStr: string; // "yyyy-MM-dd"
  dayOfWeek: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  monthName: string; // "Jan", "Feb"
  dayNum: string; // "25"
  shortDate: string; // "Aug 25, 2026"
  isToday: boolean;
  isFuture: boolean;

  // Counts
  habitCount: number;
  studyMinutes: number;
  studySessionCount: number;
  transactionCount: number;
  totalScore: number;
  intensity: 0 | 1 | 2 | 3 | 4;

  // Log breakdown labels
  habitTitles: string[];
  studyTopics: string[];
  transactionSummaries: string[];
}

export interface ActivityWeek {
  weekIndex: number;
  days: ActivityDayDetail[];
  monthLabel?: string; // Appears on top of the first week of a month
}

export interface MatrixSummaryStats {
  totalActions: number;
  activeDaysCount: number;
  totalDays: number;
  activePercentage: number;
  currentStreak: number;
  longestStreak: number;
  peakDayName: string;
  peakDayCount: number;
  totalStudyMinutes: number;
  totalHabitsCompleted: number;
  totalTransactions: number;
}

export interface YearlyMatrixResult {
  weeks: ActivityWeek[];
  stats: MatrixSummaryStats;
  maxScore: number;
}

/**
 * Aggregates logs across Habits, Study, and Money for the given date range (default: 365 days / 52 weeks)
 */
export function generateYearlyMatrixData(
  habitLogs: HabitLog[] = [],
  studySessions: StudySession[] = [],
  transactions: Transaction[] = [],
  filter: MatrixFilterType = "all",
  range: MatrixRangeType = "1y",
  habitsMap: Record<string, string> = {},
  categoriesMap: Record<string, string> = {},
  subjectsMap: Record<string, string> = {}
): YearlyMatrixResult {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const daysBack = range === "3m" ? 90 : range === "6m" ? 180 : 365;
  const rawStartDate = subDays(today, daysBack - 1);
  // Snap start date to preceding Monday so week columns align neatly (Mon = 1)
  const startDate = startOfWeek(rawStartDate, { weekStartsOn: 1 });

  // Pre-index logs by date string YYYY-MM-DD
  const habitMap: Record<string, { count: number; titles: string[] }> = {};
  habitLogs.forEach((l) => {
    if (!l.completed || !l.date) return;
    const d = l.date.slice(0, 10);
    if (!habitMap[d]) habitMap[d] = { count: 0, titles: [] };
    habitMap[d].count += 1;
    const title = habitsMap[l.habitId] || "Habit Completed";
    habitMap[d].titles.push(title);
  });

  const studyMap: Record<string, { minutes: number; sessionCount: number; topics: string[] }> = {};
  studySessions.forEach((s) => {
    if (!s.date) return;
    const d = s.date.slice(0, 10);
    if (!studyMap[d]) studyMap[d] = { minutes: 0, sessionCount: 0, topics: [] };
    studyMap[d].minutes += s.durationMinutes || 0;
    studyMap[d].sessionCount += 1;
    const subjectName = subjectsMap[s.subjectId] || "Study Focus";
    const typeLabel = s.type ? s.type.charAt(0).toUpperCase() + s.type.slice(1) : "Focus";
    studyMap[d].topics.push(`${subjectName} (${typeLabel}, ${s.durationMinutes}m)`);
  });

  const moneyMap: Record<string, { count: number; summaries: string[] }> = {};
  transactions.forEach((t) => {
    if (!t.date) return;
    const d = t.date.slice(0, 10);
    if (!moneyMap[d]) moneyMap[d] = { count: 0, summaries: [] };
    moneyMap[d].count += 1;
    const categoryName = categoriesMap[t.categoryId] || (t.type === "expense" ? "Expense" : "Income");
    moneyMap[d].summaries.push(`${t.type === "expense" ? "-" : "+"}₹${t.amount} (${categoryName})`);
  });

  // Generate continuous list of days from startDate up to today
  const totalDays = differenceInDays(today, startDate) + 1;
  const allDays: ActivityDayDetail[] = [];

  for (let i = 0; i < totalDays; i++) {
    const current = addDays(startDate, i);
    const dateStr = format(current, "yyyy-MM-dd");
    const isFuture = current > today;

    const hData = habitMap[dateStr] || { count: 0, titles: [] };
    const sData = studyMap[dateStr] || { minutes: 0, sessionCount: 0, topics: [] };
    const mData = moneyMap[dateStr] || { count: 0, summaries: [] };

    let totalScore = 0;
    if (filter === "all") {
      // Habits count as 1, each 30 mins of study as 1, transactions as 1
      totalScore = hData.count + Math.round(sData.minutes / 30) + mData.count;
    } else if (filter === "habits") {
      totalScore = hData.count;
    } else if (filter === "study") {
      // 1 point per 30 minutes of study
      totalScore = Math.round(sData.minutes / 30);
    } else if (filter === "money") {
      totalScore = mData.count;
    }

    allDays.push({
      date: current,
      dateStr,
      dayOfWeek: current.getDay(),
      monthName: format(current, "MMM"),
      dayNum: format(current, "d"),
      shortDate: format(current, "EEE, MMM d, yyyy"),
      isToday: checkIsToday(current),
      isFuture,
      habitCount: hData.count,
      studyMinutes: sData.minutes,
      studySessionCount: sData.sessionCount,
      transactionCount: mData.count,
      totalScore,
      intensity: 0, // Computed below
      habitTitles: hData.titles,
      studyTopics: sData.topics,
      transactionSummaries: mData.summaries,
    });
  }

  // Calculate maximum score for dynamic intensity buckets
  const maxScore = allDays.reduce((max, d) => Math.max(max, d.totalScore), 0);

  // Assign 0-4 intensity
  allDays.forEach((d) => {
    if (d.totalScore === 0) {
      d.intensity = 0;
    } else if (filter === "study") {
      if (d.studyMinutes >= 180) d.intensity = 4; // 3h+
      else if (d.studyMinutes >= 120) d.intensity = 3; // 2h+
      else if (d.studyMinutes >= 60) d.intensity = 2; // 1h+
      else d.intensity = 1; // 15-45m
    } else {
      if (d.totalScore >= 6) d.intensity = 4;
      else if (d.totalScore >= 4) d.intensity = 3;
      else if (d.totalScore >= 2) d.intensity = 2;
      else d.intensity = 1;
    }
  });

  // Group into columns of 7 days (Monday = row 0 ... Sunday = row 6)
  const weeks: ActivityWeek[] = [];
  let currentWeek: ActivityDayDetail[] = [];
  let lastMonthSeen = "";

  allDays.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === allDays.length - 1) {
      // Determine if this week starts a new month
      const firstDayOfMonthInWeek = currentWeek.find((d) => d.dayNum === "1" || d.dayNum === "2" || d.dayNum === "3");
      let monthLabel: string | undefined = undefined;

      if (firstDayOfMonthInWeek && firstDayOfMonthInWeek.monthName !== lastMonthSeen) {
        monthLabel = firstDayOfMonthInWeek.monthName;
        lastMonthSeen = firstDayOfMonthInWeek.monthName;
      } else if (index < 7 && !lastMonthSeen) {
        monthLabel = currentWeek[0].monthName;
        lastMonthSeen = currentWeek[0].monthName;
      }

      weeks.push({
        weekIndex: weeks.length,
        days: currentWeek,
        monthLabel,
      });
      currentWeek = [];
    }
  });

  // --- COMPUTE SUMMARY STATS ---
  let totalActions = 0;
  let activeDaysCount = 0;
  let totalStudyMinutes = 0;
  let totalHabitsCompleted = 0;
  let totalTransactions = 0;

  // Day of week distribution (Mon = 1, Sun = 0)
  const weekdayTotals: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let streakCountingActive = true;

  // Loop backwards from today for current streak
  for (let i = allDays.length - 1; i >= 0; i--) {
    const d = allDays[i];
    if (d.isFuture) continue;

    if (d.totalScore > 0) {
      if (streakCountingActive) currentStreak += 1;
    } else {
      // If today is empty, allow streak to continue from yesterday
      if (d.isToday) {
        // don't break current streak yet
      } else {
        streakCountingActive = false;
      }
    }
  }

  // Calculate longest streak & lifetime counts
  allDays.forEach((d) => {
    if (d.isFuture) return;

    totalActions += d.totalScore;
    totalStudyMinutes += d.studyMinutes;
    totalHabitsCompleted += d.habitCount;
    totalTransactions += d.transactionCount;

    if (d.totalScore > 0) {
      activeDaysCount += 1;
      tempStreak += 1;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      weekdayTotals[d.dayOfWeek] = (weekdayTotals[d.dayOfWeek] || 0) + d.totalScore;
    } else {
      tempStreak = 0;
    }
  });

  // Find Peak Day of the Week
  let peakDayName = "Monday";
  let peakDayCount = 0;
  Object.entries(weekdayTotals).forEach(([dayNum, count]) => {
    if (count > peakDayCount) {
      peakDayCount = count;
      peakDayName = weekdayNames[parseInt(dayNum, 10)];
    }
  });

  const countedDays = allDays.filter((d) => !d.isFuture).length || 1;
  const activePercentage = Math.round((activeDaysCount / countedDays) * 100);

  return {
    weeks,
    maxScore,
    stats: {
      totalActions,
      activeDaysCount,
      totalDays: countedDays,
      activePercentage,
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      peakDayName,
      peakDayCount,
      totalStudyMinutes,
      totalHabitsCompleted,
      totalTransactions,
    },
  };
}
