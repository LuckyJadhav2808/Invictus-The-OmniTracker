import { describe, it, expect } from "vitest";
import { normalizeMuscleString, resolveExerciseAnatomy, MUSCLE_REGISTRY } from "./muscle-mapping";

describe("Anatomy: Muscle String Normalizer", () => {
  it("normalizes chest variations", () => {
    expect(normalizeMuscleString("Chest")).toBe("chest");
    expect(normalizeMuscleString("pectorals")).toBe("chest");
    expect(normalizeMuscleString("Pecs")).toBe("chest");
    expect(normalizeMuscleString("Upper Chest")).toBe("upper-chest");
    expect(normalizeMuscleString("clavicular head")).toBe("upper-chest");
  });

  it("normalizes shoulder and rear delt variations", () => {
    expect(normalizeMuscleString("shoulders")).toBe("shoulders");
    expect(normalizeMuscleString("deltoids")).toBe("shoulders");
    expect(normalizeMuscleString("delts")).toBe("shoulders");
    expect(normalizeMuscleString("rear delts")).toBe("rear-delts");
    expect(normalizeMuscleString("posterior deltoid")).toBe("rear-delts");
  });

  it("normalizes arm variations", () => {
    expect(normalizeMuscleString("biceps")).toBe("biceps");
    expect(normalizeMuscleString("biceps brachii")).toBe("biceps");
    expect(normalizeMuscleString("triceps")).toBe("triceps");
    expect(normalizeMuscleString("forearms")).toBe("forearms");
    expect(normalizeMuscleString("wrist flexors")).toBe("forearms");
  });

  it("normalizes back, traps and lower back", () => {
    expect(normalizeMuscleString("lats")).toBe("lats");
    expect(normalizeMuscleString("latissimus dorsi")).toBe("lats");
    expect(normalizeMuscleString("traps")).toBe("traps");
    expect(normalizeMuscleString("trapezius")).toBe("traps");
    expect(normalizeMuscleString("lower back")).toBe("lower-back");
    expect(normalizeMuscleString("erector spinae")).toBe("lower-back");
  });

  it("normalizes legs and hips", () => {
    expect(normalizeMuscleString("quadriceps")).toBe("quads");
    expect(normalizeMuscleString("quads")).toBe("quads");
    expect(normalizeMuscleString("hamstrings")).toBe("hamstrings");
    expect(normalizeMuscleString("glutes")).toBe("glutes");
    expect(normalizeMuscleString("calves")).toBe("calves");
    expect(normalizeMuscleString("soleus")).toBe("calves");
  });
});

describe("Anatomy: Exercise Anatomy Resolver", () => {
  it("resolves Barbell Bench Press to Front view with Chest primary, Triceps & Shoulders secondary", () => {
    const res = resolveExerciseAnatomy({
      title: "Barbell Flat Bench Press",
      bodyPart: "Chest",
      primaryMuscles: ["chest"],
      secondaryMuscles: ["shoulders", "triceps"],
    });

    expect(res.primary).toContain("chest");
    expect(res.secondary).toContain("shoulders");
    expect(res.secondary).toContain("triceps");
    expect(res.defaultOrientation).toBe("front");
    expect(res.dominantName).toBe("Chest");
  });

  it("resolves Lat Pulldown to Back view with Lats primary, Biceps & Traps secondary", () => {
    const res = resolveExerciseAnatomy({
      title: "Wide-Grip Lat Pulldown",
      bodyPart: "Back",
      primaryMuscles: ["lats"],
      secondaryMuscles: ["biceps", "middle back"],
    });

    expect(res.primary).toContain("lats");
    expect(res.secondary).toContain("biceps");
    expect(res.defaultOrientation).toBe("back");
    expect(res.dominantName).toBe("Lats");
  });

  it("resolves Romanian Deadlift to Back view with Hamstrings and Lower Back", () => {
    const res = resolveExerciseAnatomy({
      title: "Romanian Deadlift",
      bodyPart: "Hamstrings",
      primaryMuscles: ["hamstrings", "lower back"],
      secondaryMuscles: ["glutes", "forearms"],
    });

    expect(res.primary).toContain("hamstrings");
    expect(res.primary).toContain("lower-back");
    expect(res.secondary).toContain("glutes");
    expect(res.defaultOrientation).toBe("back");
  });

  it("resolves Barbell Squat to Front view with Quads primary and Glutes secondary", () => {
    const res = resolveExerciseAnatomy({
      title: "Barbell Back Squat",
      bodyPart: "Quadriceps",
      primaryMuscles: ["quadriceps"],
      secondaryMuscles: ["glutes", "hamstrings", "calves"],
    });

    expect(res.primary).toContain("quads");
    expect(res.secondary).toContain("glutes");
    expect(res.defaultOrientation).toBe("front");
  });

  it("falls back to title deduction when primaryMuscles is empty", () => {
    const res = resolveExerciseAnatomy({
      title: "Incline Dumbbell Bicep Curl",
    });

    expect(res.primary).toContain("biceps");
    expect(res.defaultOrientation).toBe("front");
  });
});
