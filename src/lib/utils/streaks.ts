import { differenceInDays, parseISO, format, subDays } from "date-fns";

/**
 * Calculates current and longest streak from a list of completed dates.
 * Dates are expected in "yyyy-MM-dd" format.
 */
export function calculateStreak(
  completedDates: string[], // e.g. ["2026-07-19", "2026-07-18", "2026-07-16"]
  referenceDateStr?: string // default is today's date "yyyy-MM-dd"
): { currentStreak: number; longestStreak: number } {
  if (completedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Deduplicate and sort dates descending (newest first)
  const uniqueDates = Array.from(new Set(completedDates)).sort(
    (a, b) => b.localeCompare(a)
  );

  const refDateStr = referenceDateStr || format(new Date(), "yyyy-MM-dd");
  const refDate = parseISO(refDateStr);

  // 1. Calculate Current Streak
  let currentStreak = 0;

  // Find if refDate is completed
  const hasRefDate = uniqueDates.includes(refDateStr);
  const yesterdayStr = format(subDays(refDate, 1), "yyyy-MM-dd");
  const hasYesterday = uniqueDates.includes(yesterdayStr);

  if (hasRefDate) {
    // Streak includes today
    currentStreak = 0;
    let checkDate = refDate;
    while (true) {
      const checkStr = format(checkDate, "yyyy-MM-dd");
      if (uniqueDates.includes(checkStr)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
  } else if (hasYesterday) {
    // Streak includes yesterday, today is not checked off yet
    currentStreak = 0;
    let checkDate = subDays(refDate, 1);
    while (true) {
      const checkStr = format(checkDate, "yyyy-MM-dd");
      if (uniqueDates.includes(checkStr)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
  } else {
    // Streak is broken
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
      const diff = differenceInDays(currentDate, prevDate);
      if (diff === 1) {
        tempStreak++;
      } else if (diff > 1) {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 1;
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
