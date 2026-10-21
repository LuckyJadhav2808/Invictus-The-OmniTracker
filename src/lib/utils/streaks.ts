import { differenceInCalendarDays, parseISO, format, subDays } from "date-fns";

export interface StreakCalculationOptions {
  referenceDateStr?: string;
  frozenDates?: string[];
  isRestDay?: (dateStr: string) => boolean;
}

/**
 * Calculates current and longest streak from a list of completed dates.
 * Dates are expected in "yyyy-MM-dd" format.
 * Fully supports frozen dates (Streak Freeze shield) and custom scheduled rest days.
 */
export function calculateStreak(
  completedDates: string[], // e.g. ["2026-07-19", "2026-07-18", "2026-07-16"]
  referenceDateOrOptions?: string | StreakCalculationOptions,
  legacyFrozenDates: string[] = [] // e.g. ["2026-08-14"] (Streak Freeze protected dates)
): { currentStreak: number; longestStreak: number } {
  let refDateStr: string;
  let frozenDates: string[];
  let isRestDay: ((dateStr: string) => boolean) | undefined;

  if (typeof referenceDateOrOptions === "object" && referenceDateOrOptions !== null) {
    refDateStr = referenceDateOrOptions.referenceDateStr || format(new Date(), "yyyy-MM-dd");
    frozenDates = referenceDateOrOptions.frozenDates || [];
    isRestDay = referenceDateOrOptions.isRestDay;
  } else {
    refDateStr = referenceDateOrOptions || format(new Date(), "yyyy-MM-dd");
    frozenDates = legacyFrozenDates || [];
  }

  const allValidDates = [...completedDates, ...frozenDates];
  if (allValidDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Deduplicate and sort dates descending (newest first)
  const uniqueDates = Array.from(new Set(allValidDates)).sort(
    (a, b) => b.localeCompare(a)
  );

  const refDate = parseISO(refDateStr);

  // 1. Calculate Current Streak
  let currentStreak = 0;

  const hasRefDate = uniqueDates.includes(refDateStr);
  const isRefRestDay = isRestDay ? isRestDay(refDateStr) : false;

  let checkDate: Date;
  if (hasRefDate) {
    // Streak includes reference date (e.g. today completed or frozen)
    checkDate = refDate;
  } else if (isRefRestDay) {
    // Reference date is a scheduled rest day; check backwards from yesterday
    checkDate = subDays(refDate, 1);
  } else {
    // Reference date is uncompleted; check backwards from yesterday
    checkDate = subDays(refDate, 1);
  }

  let foundAnyValidDay = false;
  // Safety bound: up to 3650 days (10 years)
  for (let i = 0; i < 3650; i++) {
    const checkStr = format(checkDate, "yyyy-MM-dd");
    const isValid = uniqueDates.includes(checkStr);
    const isRest = isRestDay ? isRestDay(checkStr) : false;

    if (isValid) {
      currentStreak++;
      foundAnyValidDay = true;
      checkDate = subDays(checkDate, 1);
    } else if (isRest) {
      // Rest day: does not break streak, but does not artificially count as completion
      checkDate = subDays(checkDate, 1);
    } else {
      // Non-rest, uncompleted day -> streak boundary
      break;
    }
  }

  if (!hasRefDate && !foundAnyValidDay) {
    currentStreak = 0;
  }

  // 2. Calculate Longest Streak in history
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  // Sort ascending for easier forward scanning
  const sortedAsc = [...uniqueDates].sort(
    (a, b) => a.localeCompare(b)
  );

  for (const dateStr of sortedAsc) {
    const currentDate = parseISO(dateStr);
    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const diff = differenceInCalendarDays(currentDate, prevDate);
      if (diff === 1) {
        tempStreak++;
      } else if (diff > 1) {
        let allGapsAreRest = false;
        if (isRestDay) {
          allGapsAreRest = true;
          for (let d = 1; d < diff; d++) {
            const gapDateStr = format(subDays(currentDate, diff - d), "yyyy-MM-dd");
            if (!isRestDay(gapDateStr)) {
              allGapsAreRest = false;
              break;
            }
          }
        }

        if (allGapsAreRest) {
          tempStreak++;
        } else {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 1;
        }
      }
    }
    prevDate = currentDate;
  }

  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
}

/**
 * Checks whether a habit is scheduled on a given date.
 * If frequency is 'customDays', checks against daysOfWeek (0=Sun, 1=Mon, ..., 6=Sat).
 * Otherwise defaults to true (daily/weekly).
 */
export function isHabitScheduledOnDate(
  habit: {
    frequency?: {
      type?: "daily" | "weekly" | "custom" | "customDays" | string;
      daysOfWeek?: number[];
    };
  },
  dateStr: string
): boolean {
  if (!habit || !habit.frequency) return true;
  const { type, daysOfWeek } = habit.frequency;
  if (type === "customDays" && Array.isArray(daysOfWeek) && daysOfWeek.length > 0) {
    const d = parseISO(dateStr);
    const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ...
    return daysOfWeek.includes(dayOfWeek);
  }
  return true;
}

export interface AutonomousShieldInput {
  habits: Array<{
    id: string;
    title?: string;
    frequency?: {
      type?: "daily" | "weekly" | "custom" | "customDays" | string;
      daysOfWeek?: number[];
    };
    allowGraceSkip?: boolean;
    archived?: boolean;
  }>;
  completedLogs: Array<{
    habitId: string;
    date: string;
    completed: boolean;
  }>;
  streakFreeze: {
    tokensAvailable: number;
    frozenDates: string[];
  };
  referenceDateStr?: string; // defaults to today "yyyy-MM-dd"
}

export interface AutonomousShieldResult {
  shielded: boolean;
  tokensConsumed: number;
  newTokensAvailable: number;
  newFrozenDates: string[];
  newlyFrozenDates: string[];
  affectedHabitIds: string[];
  message?: string;
}

/**
 * Autonomous Streak Freeze Shield Engine (Duolingo & Streaks Benchmark)
 *
 * When a user misses an uncompleted scheduled day and holds a freeze token in inventory,
 * this function automatically:
 * 1. Verifies that the habit had an active streak prior to the missed day.
 * 2. Checks that the missed day was scheduled (not a rest day).
 * 3. Consumes 1 freeze token per missed date (up to available tokens).
 * 4. Freezes the date in frozenDates, preserving the flame unbroken.
 * 5. Returns a structured alert payload for instant user notification.
 */
export function evaluateAutonomousStreakFreeze(
  input: AutonomousShieldInput
): AutonomousShieldResult {
  const { habits, completedLogs, streakFreeze } = input;
  const refDateStr = input.referenceDateStr || format(new Date(), "yyyy-MM-dd");
  const refDate = parseISO(refDateStr);

  let currentTokens = streakFreeze.tokensAvailable ?? 0;
  const currentFrozenDates = [...(streakFreeze.frozenDates || [])];
  const newlyFrozenDates: string[] = [];
  const affectedHabitIds = new Set<string>();

  const activeHabits = habits.filter((h) => !h.archived);
  if (activeHabits.length === 0 || currentTokens <= 0) {
    return {
      shielded: false,
      tokensConsumed: 0,
      newTokensAvailable: currentTokens,
      newFrozenDates: currentFrozenDates,
      newlyFrozenDates: [],
      affectedHabitIds: [],
    };
  }

  // Pre-organize completed logs by habitId
  const logsByHabit: Record<string, Set<string>> = {};
  for (const log of completedLogs) {
    if (log.completed) {
      if (!logsByHabit[log.habitId]) logsByHabit[log.habitId] = new Set();
      logsByHabit[log.habitId].add(log.date);
    }
  }

  // Look back up to min(currentTokens, 2) days for missed scheduled days:
  // e.g. if today is Wednesday, candidate dates are Monday (T-2) and Tuesday (T-1) in chronological order
  const lookbackDays = Math.min(2, Math.max(1, currentTokens));
  const candidateDates: string[] = [];
  for (let i = lookbackDays; i >= 1; i--) {
    candidateDates.push(format(subDays(refDate, i), "yyyy-MM-dd"));
  }

  for (const candidateDate of candidateDates) {
    if (currentTokens <= 0) break;
    if (currentFrozenDates.includes(candidateDate)) continue;

    let dayNeedsFreeze = false;

    for (const habit of activeHabits) {
      const isScheduled = isHabitScheduledOnDate(habit, candidateDate);
      if (!isScheduled) continue; // Rest day -> no penalty, no freeze needed

      const habitCompletedDates = logsByHabit[habit.id] || new Set();
      const completedOnDate = habitCompletedDates.has(candidateDate);
      if (completedOnDate) continue; // Habit was completed -> no freeze needed

      // Check if habit had an active streak coming into candidateDate
      const datesBeforeCandidate = Array.from(habitCompletedDates).filter(
        (d) => d < candidateDate
      );

      // Prior streak evaluation at candidateDate
      const isRestDayForHabit = (dStr: string) => !isHabitScheduledOnDate(habit, dStr);
      const priorStreak = calculateStreak(datesBeforeCandidate, {
        referenceDateStr: candidateDate,
        frozenDates: currentFrozenDates,
        isRestDay: isRestDayForHabit,
      });

      if (priorStreak.currentStreak > 0) {
        dayNeedsFreeze = true;
        affectedHabitIds.add(habit.id);
      }
    }

    if (dayNeedsFreeze && currentTokens > 0) {
      currentTokens -= 1;
      currentFrozenDates.push(candidateDate);
      newlyFrozenDates.push(candidateDate);
    }
  }

  const tokensConsumed = streakFreeze.tokensAvailable - currentTokens;
  const shielded = tokensConsumed > 0;

  return {
    shielded,
    tokensConsumed,
    newTokensAvailable: currentTokens,
    newFrozenDates: currentFrozenDates,
    newlyFrozenDates,
    affectedHabitIds: Array.from(affectedHabitIds),
    message: shielded
      ? `Autonomous Streak Freeze Shield deployed! Protected ${newlyFrozenDates.join(", ")}. Flame preserved.`
      : undefined,
  };
}
