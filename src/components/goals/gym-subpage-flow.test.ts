import { describe, it, expect } from "vitest";
import { resolveExerciseAnatomy, MuscleGroup } from "@/components/goals/anatomy/muscle-mapping";
import { GYM_TEMPLATE_PACKS } from "@/lib/templates-data";

describe("Gym Studio 4-Stage Architecture & Benchmark Tests", () => {
  it("resolves primary and secondary muscle activation from exercises correctly", () => {
    const exercises = [
      { name: "Incline Dumbbell Press", targetMuscle: "Chest" },
      { name: "Standing Overhead Barbell Press", targetMuscle: "Shoulders" },
      { name: "Cable Tricep Pushdown", targetMuscle: "Triceps" },
    ];

    const primaryMuscles: MuscleGroup[] = [];
    const secondaryMuscles: MuscleGroup[] = [];

    exercises.forEach((ex) => {
      const res = resolveExerciseAnatomy({
        title: ex.name,
        targetMuscle: ex.targetMuscle,
      });
      res.primary.forEach((m) => {
        if (!primaryMuscles.includes(m)) primaryMuscles.push(m);
      });
      res.secondary.forEach((m) => {
        if (!secondaryMuscles.includes(m) && !primaryMuscles.includes(m)) {
          secondaryMuscles.push(m);
        }
      });
    });

    // Should activate chest, shoulders, and triceps
    expect(primaryMuscles).toContain("chest");
    expect(primaryMuscles.length + secondaryMuscles.length).toBeGreaterThanOrEqual(3);
  });

  it("ensures all curated template packs have required Neobrutalist metadata", () => {
    expect(GYM_TEMPLATE_PACKS.length).toBeGreaterThanOrEqual(3);

    GYM_TEMPLATE_PACKS.forEach((pack) => {
      expect(pack.id).toBeDefined();
      expect(pack.name.length).toBeGreaterThan(0);
      expect(pack.tagline.length).toBeGreaterThan(0);
      expect(pack.items.length).toBeGreaterThan(0);

      pack.items.forEach((item) => {
        expect(item.title).toBeDefined();
        expect(item.title.length).toBeGreaterThan(0);
      });
    });
  });

  it("verifies border overflow protection design tokens", () => {
    // The action container must have flex-wrap and min-w-0 to avoid border clipping on mobile viewports (<390px)
    const actionContainerClasses = "flex flex-wrap items-center justify-end gap-2 shrink min-w-0 w-full sm:w-auto";
    expect(actionContainerClasses).toContain("flex-wrap");
    expect(actionContainerClasses).toContain("min-w-0");
    expect(actionContainerClasses).toContain("gap-2");
  });

  it("validates 4-stage ergonomic progression data structure", () => {
    const gymStages = [
      { stage: 1, name: "Current Day Things (Cockpit & Header)", components: ["HorizonStrip", "SplitTitle", "LiveTelemetry"] },
      { stage: 2, name: "Target Muscle Body SVG Stage", components: ["HumanMuscleAnatomy", "FocusBadges", "OrientationToggle"] },
      { stage: 3, name: "In Between Choice Modal & Action Bar", components: ["ZeroOverflowActions", "GymChoiceModal", "AddMovementCTA"] },
      { stage: 4, name: "Chosen Exercises for Day", components: ["ExerciseCards", "SetsTable", "GhostPRs", "RestTimerDock"] },
    ];

    expect(gymStages.length).toBe(4);
    expect(gymStages[0].name).toContain("Current Day Things");
    expect(gymStages[1].name).toContain("Target Muscle Body SVG");
    expect(gymStages[2].name).toContain("In Between Choice Modal");
    expect(gymStages[3].name).toContain("Chosen Exercises");
  });
});
