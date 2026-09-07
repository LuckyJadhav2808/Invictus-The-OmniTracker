/**
 * Gym Routine Automatic Weekly Rollover Utilities
 *
 * Ensures workout split checklists are automatically refreshed every new week
 * (e.g., Monday -> next Monday) without erasing saved weights, reps, or custom exercises.
 */

/**
 * Returns standard ISO Week identifier: "YYYY-Www" (e.g. "2026-W37")
 */
export function getCurrentISOWeekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7; // Sunday is 7 in ISO
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Formats a friendly human label for the week (e.g. "Week 37, 2026")
 */
export function getFriendlyWeekLabel(d: Date = new Date()): string {
  const weekKey = getCurrentISOWeekKey(d);
  const [year, weekPart] = weekKey.split("-W");
  return `Week ${parseInt(weekPart, 10)}, ${year}`;
}

/**
 * Determines whether a routine was last active in an older week and requires rollover
 */
export function shouldRoutineRollover(
  routine: { lastActiveWeek?: string; updatedAt?: Date | string | null },
  currentWeekKey: string = getCurrentISOWeekKey()
): boolean {
  if (routine.lastActiveWeek) {
    return routine.lastActiveWeek !== currentWeekKey;
  }
  if (routine.updatedAt) {
    const updatedWeek = getCurrentISOWeekKey(new Date(routine.updatedAt));
    return updatedWeek !== currentWeekKey;
  }
  return false;
}

/**
 * Resets all set completion ticks to false, while strictly preserving:
 * - Exercise name, equipment, and target muscle
 * - Weight (kg) and Reps (progressive overload benchmark)
 * - Form guides, GIFs, notes, and custom cues
 */
export function resetRoutineCheckmarks<T extends { sets?: any[] }>(exercises: T[]): T[] {
  return (exercises || []).map((ex) => ({
    ...ex,
    sets: (ex.sets || []).map((st: any) => ({
      ...st,
      completed: false,
    })),
  }));
}
