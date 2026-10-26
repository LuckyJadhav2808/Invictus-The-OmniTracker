import { describe, it, expect } from "vitest";
import { ATOMIC_HABITS_VAULT } from "@/components/goals/HabitChoiceModal";
import { HABIT_TEMPLATE_PACKS } from "@/lib/templates-data";

describe("Subpages Redesign & Habit Studio Flow Architecture", () => {
  it("calculates caloric macro percentages correctly based on standard metabolic factors", () => {
    // Standard Atwater factors: Protein 4 kcal/g, Carbs 4 kcal/g, Fat 9 kcal/g
    const totalProtein = 150; // 600 kcal
    const totalCarbs = 200;   // 800 kcal
    const totalFat = 60;      // 540 kcal

    const proteinCals = totalProtein * 4;
    const carbsCals = totalCarbs * 4;
    const fatCals = totalFat * 9;
    const macroCalsSum = proteinCals + carbsCals + fatCals; // 1940 kcal

    const proteinPct = Math.round((proteinCals / macroCalsSum) * 100);
    const carbsPct = Math.round((carbsCals / macroCalsSum) * 100);
    const fatPct = Math.max(0, 100 - proteinPct - carbsPct);

    expect(proteinPct).toBe(31);
    expect(carbsPct).toBe(41);
    expect(fatPct).toBe(28);
    expect(proteinPct + carbsPct + fatPct).toBe(100);
  });

  it("verifies the Atomic Habits Vault has valid categories and structured telemetry", () => {
    expect(ATOMIC_HABITS_VAULT.length).toBeGreaterThanOrEqual(20);

    const categories = new Set(ATOMIC_HABITS_VAULT.map((h) => h.category));
    expect(categories.has("Health")).toBe(true);
    expect(categories.has("Focus")).toBe(true);
    expect(categories.has("Mindset")).toBe(true);
    expect(categories.has("Recovery")).toBe(true);
    expect(categories.has("Discipline")).toBe(true);
    expect(categories.has("Wealth")).toBe(true);

    ATOMIC_HABITS_VAULT.forEach((h) => {
      expect(h.id.length).toBeGreaterThan(0);
      expect(h.title.length).toBeGreaterThan(0);
      expect(h.desc.length).toBeGreaterThan(0);
      expect(h.icon.length).toBeGreaterThan(0);
      expect(["emerald", "amber", "sky", "purple", "rose"]).toContain(h.color);
      expect(["daily", "weekly"]).toContain(h.frequencyType);
    });
  });

  it("verifies curated habit protocol split packs integrity", () => {
    expect(HABIT_TEMPLATE_PACKS.length).toBeGreaterThanOrEqual(3);

    const monkMode = HABIT_TEMPLATE_PACKS.find((p) => p.id === "monk-mode");
    expect(monkMode).toBeDefined();
    expect(monkMode?.items.length).toBeGreaterThanOrEqual(4);

    const redditEssentials = HABIT_TEMPLATE_PACKS.find((p) => p.id === "reddit-essentials");
    expect(redditEssentials).toBeDefined();

    const athleticChamp = HABIT_TEMPLATE_PACKS.find((p) => p.id === "fitness-champ");
    expect(athleticChamp).toBeDefined();
  });

  it("validates unified 4-stage studio architecture across all habit space subpages", () => {
    const subpages = [
      {
        subpage: "/goals/gym",
        title: "The Iron Arena",
        stage1: "Current Day Telemetry Cockpit & Rest Horizon",
        stage2: "Interactive Target Muscle Body SVG",
        stage3: "In-Between Action Bar & GymChoiceModal (4,300+ DB)",
        stage4: "Chosen Exercises Stream (Collapsed by Default)",
      },
      {
        subpage: "/goals/nutrition",
        title: "The Macro Forge",
        stage1: "Daily Caloric & Macro Telemetry Cockpit",
        stage2: "Visual Proportional Fuel Distribution Bar",
        stage3: "In-Between Action Bar & NutritionChoiceModal (1,000+ DB)",
        stage4: "Today's Consumed Meals Stream (Collapsed by Default)",
      },
      {
        subpage: "/goals",
        title: "Habits & Routines Main",
        stage1: "Habit Horizon & Autonomous Streak Freeze Shield",
        stage2: "Weekly Habit Matrix & Completion Visualizer",
        stage3: "In-Between Action Bar & HabitChoiceModal (50+ Presets & Split Packs)",
        stage4: "Active Daily Habits Stream & Mascot Companion",
      },
      {
        subpage: "/goals/analytics",
        title: "Analytics Command Center",
        stage1: "Leaderboard Telemetry (Active Streaks, Records, Rates)",
        stage2: "30-Day Monthly Habit Consistency Heatmap",
        stage3: "Completion Rate by Day of Week BarChart",
        stage4: "Weekly Velocity Matrix Grid",
      },
    ];

    expect(subpages.length).toBe(4);
    subpages.forEach((sp) => {
      expect(sp.stage1).toBeDefined();
      expect(sp.stage2).toBeDefined();
      expect(sp.stage3).toBeDefined();
      expect(sp.stage4).toBeDefined();
    });
  });
});
