import { describe, it, expect, beforeEach } from "vitest";
import {
  initializeExerciseIndex,
  searchExercisesClient,
  extractMuscleHighlights,
} from "./exercise-search-index";

const sampleExercises = [
  {
    id: "ex-bench-press",
    title: "Barbell Flat Bench Press",
    bodyPart: "Chest",
    equipment: "Barbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["shoulders", "triceps"],
  },
  {
    id: "ex-incline-db-press",
    title: "Incline Dumbbell Chest Press",
    bodyPart: "Chest",
    equipment: "Dumbbell",
    primaryMuscles: ["upper-chest"],
    secondaryMuscles: ["shoulders", "triceps"],
  },
  {
    id: "ex-lat-pulldown",
    title: "Wide-Grip Lat Pulldown",
    bodyPart: "Back",
    equipment: "Cable",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "middle-back"],
  },
  {
    id: "ex-barbell-squat",
    title: "Barbell Back Squat",
    bodyPart: "Legs",
    equipment: "Barbell",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes", "hamstrings", "calves"],
  },
];

describe("Client-Side Exercise Search Index (minisearch)", () => {
  beforeEach(() => {
    initializeExerciseIndex(sampleExercises);
  });

  it("performs fast prefix and exact search", () => {
    const results = searchExercisesClient("bench");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe("Barbell Flat Bench Press");
  });

  it("handles typo tolerance (fuzzy matching)", () => {
    // "bnch" -> "bench"
    const results = searchExercisesClient("bnch");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain("Bench");
  });

  it("filters cleanly by equipment and body part", () => {
    const chestDumbbell = searchExercisesClient("chest", { equipment: "Dumbbell" });
    expect(chestDumbbell.length).toBe(1);
    expect(chestDumbbell[0].equipment).toBe("Dumbbell");
  });

  it("extracts primary and secondary muscle highlights for HumanMuscleAnatomy", () => {
    const highlights = extractMuscleHighlights({
      primaryMuscles: ["chest"],
      secondaryMuscles: ["shoulders", "triceps"],
    });

    expect(highlights.primary).toContain("chest");
    expect(highlights.secondary).toContain("shoulders");
    expect(highlights.secondary).toContain("triceps");
  });
});
