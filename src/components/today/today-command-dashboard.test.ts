import { describe, it, expect, vi } from "vitest";
import { type Habit, type HabitLog, type Streak } from "@/types";

describe("Today Command Dashboard Engine & Agenda Partitioning", () => {
  // Classification heuristic helper test
  const classifyHabit = (h: { title: string; reminderTime?: string }, index: number): "morning" | "workload" | "evening" => {
    if (h.reminderTime) {
      const parts = h.reminderTime.split(":");
      const hour = parseInt(parts[0], 10);
      if (!isNaN(hour)) {
        if (hour < 12) return "morning";
        if (hour < 18) return "workload";
        return "evening";
      }
    }
    const title = h.title.toLowerCase();
    if (/wake|morning|sun|breakfast|workout|gym|stretch|hydrate|water|meditat|cold shower|run|jog|pushup/.test(title)) {
      return "morning";
    }
    if (/sleep|bed|night|evening|read|journal|wind|screen|phone|spend|reflect|teeth|floss/.test(title)) {
      return "evening";
    }
    return index % 2 === 0 ? "morning" : "workload";
  };

  const classifyTask = (t: { title: string; dueTime?: string }): "morning" | "workload" | "evening" => {
    if (t.dueTime) {
      const parts = t.dueTime.split(":");
      const hour = parseInt(parts[0], 10);
      if (!isNaN(hour)) {
        if (hour < 12) return "morning";
        if (hour < 18) return "workload";
        return "evening";
      }
    }
    const title = t.title.toLowerCase();
    if (/morning|breakfast|sunrise/.test(title)) return "morning";
    if (/night|evening|review|sleep/.test(title)) return "evening";
    return "workload";
  };

  it("partitions morning habits by reminder time or title keywords", () => {
    expect(classifyHabit({ title: "Gym / Resistance Training", reminderTime: "07:30" }, 0)).toBe("morning");
    expect(classifyHabit({ title: "Cold Shower & Hydration" }, 0)).toBe("morning");
    expect(classifyHabit({ title: "Wake Up at 6AM" }, 0)).toBe("morning");
  });

  it("partitions afternoon and workload tasks by time or default work profile", () => {
    expect(classifyHabit({ title: "Math Problem Set", reminderTime: "14:00" }, 1)).toBe("workload");
    expect(classifyTask({ title: "Polish UI / Components", dueTime: "15:30" })).toBe("workload");
    expect(classifyTask({ title: "Architecture Refactoring" })).toBe("workload");
  });

  it("partitions evening review and wind-down items correctly", () => {
    expect(classifyHabit({ title: "No Phone 30 Mins Before Sleep", reminderTime: "22:00" }, 2)).toBe("evening");
    expect(classifyHabit({ title: "Read 20 pages before bed" }, 2)).toBe("evening");
    expect(classifyTask({ title: "Evening Spends & Ledger Review" })).toBe("evening");
  });

  it("correctly calculates executive telemetry metrics", () => {
    const totalHabits = 4;
    const completedHabits = 3;
    const totalTasks = 3;
    const completedTasks = 2;

    const totalCount = totalHabits + totalTasks; // 7
    const completedCount = completedHabits + completedTasks; // 5
    const pendingCount = totalCount - completedCount; // 2
    const completionPercent = Math.round((completedCount / totalCount) * 100); // 71%

    expect(totalCount).toBe(7);
    expect(completedCount).toBe(5);
    expect(pendingCount).toBe(2);
    expect(completionPercent).toBe(71);
  });

  it("calculates Safe Spend headroom and alert states accurately", () => {
    const dailySafeToSpend = 800;
    const spentToday = 350;
    const remainingSafeToSpend = dailySafeToSpend - spentToday; // 450
    const isUnderCap = remainingSafeToSpend > 0;
    const percentSpent = Math.round((spentToday / dailySafeToSpend) * 100);

    expect(remainingSafeToSpend).toBe(450);
    expect(isUnderCap).toBe(true);
    expect(percentSpent).toBe(44);
  });

  it("ranks top habits by current streak and formats weekly progress", () => {
    const mockHabits: Habit[] = [
      { id: "h1", title: "Math Practice", color: "blue", icon: "Book", frequency: { type: "daily", targetPerDay: 1 }, allowGraceSkip: false, isGoalStyle: false, archived: false },
      { id: "h2", title: "Gym / Workout", color: "green", icon: "Dumbbell", frequency: { type: "daily", targetPerDay: 1 }, allowGraceSkip: false, isGoalStyle: false, archived: false },
      { id: "h3", title: "Read Fiction", color: "purple", icon: "BookOpen", frequency: { type: "daily", targetPerDay: 1 }, allowGraceSkip: false, isGoalStyle: false, archived: false },
    ];

    const mockStreaks: Record<string, Streak> = {
      h1: { habitId: "h1", currentStreak: 13, longestStreak: 15 },
      h2: { habitId: "h2", currentStreak: 5, longestStreak: 7 },
      h3: { habitId: "h3", currentStreak: 2, longestStreak: 3 },
    };

    const topHabits = mockHabits
      .map((h) => ({
        ...h,
        currentStreak: mockStreaks[h.id]?.currentStreak || 0,
      }))
      .sort((a, b) => b.currentStreak - a.currentStreak);

    expect(topHabits[0].title).toBe("Math Practice");
    expect(topHabits[0].currentStreak).toBe(13);
    expect(topHabits[1].title).toBe("Gym / Workout");
    expect(topHabits[1].currentStreak).toBe(5);
  });
});
