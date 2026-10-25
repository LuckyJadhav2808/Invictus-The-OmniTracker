import { MuscleGroup, AnatomyOrientation, MuscleHighlightMap, MuscleMetadata } from "./types";
export type { MuscleGroup, AnatomyOrientation, MuscleHighlightMap, MuscleMetadata };

export const MUSCLE_REGISTRY: Record<MuscleGroup, MuscleMetadata> = {
  chest: {
    id: "chest",
    name: "Chest",
    latinName: "Pectoralis Major",
    defaultOrientation: "front",
    commonExercises: ["Bench Press", "Push-ups", "Pec Deck Fly", "Dips"],
  },
  "upper-chest": {
    id: "upper-chest",
    name: "Upper Chest",
    latinName: "Clavicular Pectoralis",
    defaultOrientation: "front",
    commonExercises: ["Incline Dumbbell Press", "Incline Bench Press", "Low-to-High Cable Fly"],
  },
  shoulders: {
    id: "shoulders",
    name: "Shoulders",
    latinName: "Deltoideus Anterior & Lateral",
    defaultOrientation: "front",
    commonExercises: ["Overhead Press", "Lateral Raises", "Arnold Press", "Front Raises"],
  },
  "rear-delts": {
    id: "rear-delts",
    name: "Rear Deltoids",
    latinName: "Posterior Deltoid",
    defaultOrientation: "back",
    commonExercises: ["Face Pulls", "Reverse Pec Deck", "Bent-over Lateral Raises"],
  },
  biceps: {
    id: "biceps",
    name: "Biceps",
    latinName: "Biceps Brachii",
    defaultOrientation: "front",
    commonExercises: ["Barbell Curls", "Hammer Curls", "Preacher Curls", "Chin-ups"],
  },
  triceps: {
    id: "triceps",
    name: "Triceps",
    latinName: "Triceps Brachii",
    defaultOrientation: "back",
    commonExercises: ["Triceps Pushdown", "Skullcrushers", "Close-grip Bench Press", "Dips"],
  },
  forearms: {
    id: "forearms",
    name: "Forearms",
    latinName: "Brachioradialis & Flexors",
    defaultOrientation: "front",
    commonExercises: ["Wrist Curls", "Farmer's Walk", "Reverse Curls"],
  },
  abs: {
    id: "abs",
    name: "Abdominals",
    latinName: "Rectus Abdominis",
    defaultOrientation: "front",
    commonExercises: ["Hanging Leg Raises", "Cable Crunches", "Plank", "Ab Wheel Rollout"],
  },
  obliques: {
    id: "obliques",
    name: "Obliques",
    latinName: "External & Internal Obliques",
    defaultOrientation: "front",
    commonExercises: ["Russian Twists", "Side Planks", "Woodchoppers"],
  },
  quads: {
    id: "quads",
    name: "Quadriceps",
    latinName: "Quadriceps Femoris",
    defaultOrientation: "front",
    commonExercises: ["Barbell Back Squat", "Leg Press", "Leg Extensions", "Lunges"],
  },
  hamstrings: {
    id: "hamstrings",
    name: "Hamstrings",
    latinName: "Biceps Femoris & Semitendinosus",
    defaultOrientation: "back",
    commonExercises: ["Romanian Deadlift", "Lying Leg Curls", "Good Mornings"],
  },
  glutes: {
    id: "glutes",
    name: "Glutes",
    latinName: "Gluteus Maximus & Medius",
    defaultOrientation: "back",
    commonExercises: ["Barbell Hip Thrust", "Bulgarian Split Squats", "Glute Bridges"],
  },
  calves: {
    id: "calves",
    name: "Calves",
    latinName: "Gastrocnemius & Soleus",
    defaultOrientation: "back",
    commonExercises: ["Standing Calf Raises", "Seated Calf Raises", "Donkey Calf Raises"],
  },
  lats: {
    id: "lats",
    name: "Lats",
    latinName: "Latissimus Dorsi",
    defaultOrientation: "back",
    commonExercises: ["Lat Pulldown", "Pull-ups", "Barbell Rows", "Dumbbell Rows"],
  },
  traps: {
    id: "traps",
    name: "Trapezius",
    latinName: "Trapezius & Upper Back",
    defaultOrientation: "back",
    commonExercises: ["Barbell Shrugs", "Dumbbell Shrugs", "Rack Pulls"],
  },
  "lower-back": {
    id: "lower-back",
    name: "Lower Back",
    latinName: "Erector Spinae",
    defaultOrientation: "back",
    commonExercises: ["Conventional Deadlift", "Hyperextensions", "Good Mornings"],
  },
  neck: {
    id: "neck",
    name: "Neck",
    latinName: "Sternocleidomastoid",
    defaultOrientation: "front",
    commonExercises: ["Neck Curls", "Neck Extensions"],
  },
};

/**
 * Normalizes raw muscle string aliases into standard MuscleGroup keys
 */
export function normalizeMuscleString(raw: string): MuscleGroup | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "");

  // Chest aliases
  if (s.includes("upper chest") || s.includes("incline chest") || s.includes("clavicular")) return "upper-chest";
  if (s.includes("chest") || s.includes("pectoral") || s.includes("pecs") || s.includes("serratus")) return "chest";

  // Rear delts
  if (s.includes("rear delt") || s.includes("posterior delt") || s.includes("rear shoulder")) return "rear-delts";

  // General shoulders
  if (s.includes("shoulder") || s.includes("delt") || s.includes("rotator")) return "shoulders";

  // Arms
  if (s.includes("bicep") || s.includes("brachialis")) return "biceps";
  if (s.includes("tricep")) return "triceps";
  if (s.includes("forearm") || s.includes("wrist") || s.includes("grip")) return "forearms";

  // Core & Abs
  if (s.includes("oblique")) return "obliques";
  if (s.includes("ab") || s.includes("core") || s.includes("rectus abdominis")) return "abs";

  // Legs & Hips
  if (s.includes("quad") || s.includes("adductor") || s.includes("abductor") || s.includes("inner thigh") || s.includes("hip flexor")) return "quads";
  if (s.includes("hamstring")) return "hamstrings";
  if (s.includes("glute") || s.includes("butt") || s.includes("hip")) return "glutes";
  if (s.includes("calf") || s.includes("calves") || s.includes("soleus") || s.includes("gastrocnemius") || s.includes("shin")) return "calves";

  // Back & Traps
  if (s.includes("lat") || s.includes("latissimus")) return "lats";
  if (s.includes("trap") || s.includes("trapezius") || s.includes("rhomboid") || s.includes("levator")) return "traps";
  if (s.includes("lower back") || s.includes("spine") || s.includes("erector")) return "lower-back";
  if (s.includes("middle back") || s.includes("upper back") || s.includes("back")) return "lats";

  if (s.includes("neck")) return "neck";

  return null;
}

export interface ResolvedExerciseAnatomy {
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
  defaultOrientation: AnatomyOrientation;
  dominantMuscle: MuscleGroup;
  dominantName: string;
}

/**
 * Resolves an exercise's metadata into full anatomical activation groups and default camera view
 */
export function resolveExerciseAnatomy(exercise: {
  title?: string;
  name?: string;
  bodyPart?: string;
  targetMuscle?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
}): ResolvedExerciseAnatomy {
  const primarySet = new Set<MuscleGroup>();
  const secondarySet = new Set<MuscleGroup>();

  // 1. Process explicit primary muscles list
  if (exercise.primaryMuscles && exercise.primaryMuscles.length > 0) {
    exercise.primaryMuscles.forEach((m) => {
      const normalized = normalizeMuscleString(m);
      if (normalized) primarySet.add(normalized);
    });
  }

  // 2. Process bodyPart or targetMuscle
  const rawTarget = exercise.targetMuscle || exercise.bodyPart || "";
  const targetNormalized = normalizeMuscleString(rawTarget);
  if (targetNormalized) {
    primarySet.add(targetNormalized);
  }

  // 3. Fallback to title keywords if primarySet is still empty
  if (primarySet.size === 0) {
    const title = (exercise.title || exercise.name || "").toLowerCase();
    if (title.includes("bench press") || title.includes("chest press") || title.includes("push-up") || title.includes("push up") || title.includes("fly")) {
      primarySet.add("chest");
      secondarySet.add("triceps");
      secondarySet.add("shoulders");
    } else if (title.includes("deadlift") || title.includes("rdl")) {
      primarySet.add("hamstrings");
      primarySet.add("lower-back");
      secondarySet.add("glutes");
      secondarySet.add("traps");
    } else if (title.includes("squat") || title.includes("leg press")) {
      primarySet.add("quads");
      secondarySet.add("glutes");
    } else if (title.includes("lat pulldown") || title.includes("pull-up") || title.includes("pullup") || title.includes("row")) {
      primarySet.add("lats");
      secondarySet.add("biceps");
      secondarySet.add("traps");
    } else if (title.includes("curl")) {
      primarySet.add("biceps");
      secondarySet.add("forearms");
    } else if (title.includes("shoulder") || title.includes("military") || title.includes("lateral raise")) {
      primarySet.add("shoulders");
      secondarySet.add("traps");
    } else if (title.includes("tricep") || title.includes("skullcrusher") || title.includes("pushdown")) {
      primarySet.add("triceps");
    } else {
      primarySet.add("chest"); // default fallback
    }
  }

  // 4. Process explicit secondary muscles
  if (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) {
    exercise.secondaryMuscles.forEach((m) => {
      const normalized = normalizeMuscleString(m);
      if (normalized && !primarySet.has(normalized)) {
        secondarySet.add(normalized);
      }
    });
  }

  const primary = Array.from(primarySet);
  const secondary = Array.from(secondarySet);
  const dominantMuscle = primary[0] || "chest";
  const dominantInfo = MUSCLE_REGISTRY[dominantMuscle] || MUSCLE_REGISTRY.chest;

  // Determine optimal camera orientation
  // If dominant muscle or majority of primary muscles are posterior, orientation is "back"
  const posteriorMuscles: MuscleGroup[] = ["lats", "traps", "lower-back", "glutes", "hamstrings", "rear-delts", "triceps"];
  const isPosteriorDominant = primary.some((m) => posteriorMuscles.includes(m)) && !["chest", "upper-chest", "abs", "quads", "biceps"].includes(dominantMuscle);

  const defaultOrientation: AnatomyOrientation = isPosteriorDominant || dominantInfo.defaultOrientation === "back" ? "back" : "front";

  return {
    primary,
    secondary,
    defaultOrientation,
    dominantMuscle,
    dominantName: dominantInfo.name,
  };
}

/**
 * Maps an anatomical MuscleGroup key to an everyday database bodyPart category
 */
export function mapMuscleGroupToBodyPart(muscle: MuscleGroup): string {
  switch (muscle) {
    case "chest":
    case "upper-chest":
      return "Chest";
    case "shoulders":
    case "rear-delts":
      return "Shoulders";
    case "biceps":
      return "Biceps";
    case "triceps":
      return "Triceps";
    case "forearms":
      return "Forearms";
    case "abs":
    case "obliques":
      return "Abdominals";
    case "quads":
      return "Quadriceps";
    case "hamstrings":
      return "Hamstrings";
    case "glutes":
      return "Glutes";
    case "calves":
      return "Calves";
    case "lats":
    case "traps":
    case "lower-back":
      return "Back";
    default:
      return "Chest";
  }
}

/**
 * Maps a database bodyPart category to an anatomical MuscleGroup key
 */
export function mapBodyPartToMuscleGroup(bodyPart: string): MuscleGroup | null {
  return normalizeMuscleString(bodyPart);
}
