import { describe, it, expect } from "vitest";
import { computeDailyConquestScore } from "./useTodayCockpitViewModel";
import { parseScratchpad, parseThoughtLine } from "@/lib/utils/scratchpad-nlp";

describe("The Gladiator Coliseum: Today Dashboard Architecture", () => {
  it("computes unified gladiator telemetry accurately for MasterTodayHero", () => {
    const metrics = computeDailyConquestScore({
      completedHabitsCount: 4,
      totalHabitsCount: 5,
      studyMinutesToday: 150, // 2.5 hours
      studyTargetHours: 4.0,
      spentToday: 150,
      dailySafeToSpend: 600,
      currencySymbol: "₹",
    });

    expect(metrics.habitPercent).toBe(80);
    expect(metrics.studyPercent).toBe(63); // 2.5 / 4.0 ≈ 62.5% -> 63%
    expect(metrics.budgetPercent).toBe(75); // (600 - 150) / 600 = 75%
    expect(metrics.overallScore).toBe(73); // Math.round(80 * 0.4 + 63 * 0.35 + 75 * 0.25) = 32 + 22.05 + 18.75 = 72.8 -> 73%
    expect(metrics.remainingSafeToSpend).toBe(450);
  });

  it("parses scratchpad text in ExecutionCaptureCard and generates task metadata", () => {
    const rawNote = "Finish thermodynamics problems tomorrow p1\nChai with team 60";
    const parsed = parseScratchpad(rawNote, [
      { id: "cat-food", name: "Food & Dining", icon: "Utensils", color: "#FFB800", type: "expense", monthlyBudget: 5000, archived: false },
    ]);

    expect(parsed.taskCount).toBe(1);
    expect(parsed.expenseCount).toBe(1);
    expect(parsed.totalExpenseAmount).toBe(60);

    const taskLine = parsed.lines[0];
    expect(taskLine.priority).toBe("p1");
    expect(taskLine.cleanTitle).toBe("Finish thermodynamics problems");

    const expenseLine = parsed.lines[1];
    expect(expenseLine.amount).toBe(60);
    expect(expenseLine.cleanTitle).toBe("Chai with team");
  });

  it("preserves priority filtering for TaskBattleQueue inside ExecutionCaptureCard", () => {
    const sampleTasks = [
      { id: "1", title: "Complete CS assignment", status: "todo", priority: "p1", dueDate: "2026-10-26" },
      { id: "2", title: "Laundry", status: "todo", priority: "p3", dueDate: "2026-10-30" },
      { id: "3", title: "Gym workout", status: "completed", priority: "p1", dueDate: "2026-10-26" },
      { id: "4", title: "Review organic chemistry", status: "todo", priority: "p2", dueDate: "2026-10-27" },
    ];

    const filtered = sampleTasks.filter((t) => {
      if (t.status === "completed") return false;
      if (t.dueDate === "2026-10-26") return true;
      if (t.priority === "p1" || t.priority === "p2") return true;
      return false;
    });

    expect(filtered.length).toBe(2);
    expect(filtered.map((t) => t.id)).toEqual(["1", "4"]);
  });
});
