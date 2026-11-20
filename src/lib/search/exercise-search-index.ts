import MiniSearch from "minisearch";
import { MuscleGroup } from "@/components/goals/anatomy/types";
import { mapBodyPartToMuscleGroup } from "@/components/goals/anatomy/muscle-mapping";

export interface IndexedExercise {
  id: string;
  title: string;
  bodyPart: string;
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  primaryMusclesText: string;
  secondaryMusclesText: string;
  instructions?: string[];
  images?: string[];
  gifUrl?: string;
  mechanic?: string;
  level?: string;
  rating?: string;
  isStaple?: boolean;
}

export interface ExerciseSearchResult extends IndexedExercise {
  score: number;
  match: Record<string, string[]>;
  highlightedMuscles: {
    primary: MuscleGroup[];
    secondary: MuscleGroup[];
  };
}

let miniSearchInstance: MiniSearch<IndexedExercise> | null = null;
let rawExercisesCache: IndexedExercise[] = [];

/**
 * Creates and configures the MiniSearch index for exercises
 */
function createIndex(): MiniSearch<IndexedExercise> {
  return new MiniSearch<IndexedExercise>({
    fields: ["title", "bodyPart", "equipment", "primaryMusclesText", "secondaryMusclesText"],
    storeFields: [
      "id",
      "title",
      "bodyPart",
      "equipment",
      "primaryMuscles",
      "secondaryMuscles",
      "instructions",
      "images",
      "gifUrl",
      "mechanic",
      "level",
      "rating",
      "isStaple",
    ],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: {
        title: 4,
        primaryMusclesText: 2.5,
        bodyPart: 2,
      },
    },
  });
}

/**
 * Normalizes raw exercise items into indexed documents
 */
export function normalizeExerciseItem(item: any): IndexedExercise {
  const primary = Array.isArray(item.primaryMuscles) ? item.primaryMuscles : [item.bodyPart || "chest"];
  const secondary = Array.isArray(item.secondaryMuscles) ? item.secondaryMuscles : [];

  return {
    id: item.id || `ex-${(item.title || item.name || "").replace(/\s+/g, "-").toLowerCase()}`,
    title: item.title || item.name || "Exercise",
    bodyPart: item.bodyPart || "Chest",
    equipment: item.equipment || "Free Weights",
    primaryMuscles: primary,
    secondaryMuscles: secondary,
    primaryMusclesText: primary.join(" "),
    secondaryMusclesText: secondary.join(" "),
    instructions: item.instructions || (item.desc ? [item.desc] : []),
    images: item.images || (item.gifUrl ? [item.gifUrl] : []),
    gifUrl: item.gifUrl || item.images?.[0] || "",
    mechanic: item.mechanic || "compound",
    level: item.level || "Intermediate",
    rating: item.rating || "9.0",
    isStaple: Boolean(item.isStaple),
  };
}

/**
 * Initializes the MiniSearch index with an array of exercises
 */
export function initializeExerciseIndex(exercises: any[]): void {
  const normalized = exercises.map(normalizeExerciseItem);
  rawExercisesCache = normalized;
  const index = createIndex();
  index.addAll(normalized);
  miniSearchInstance = index;
}

/**
 * Maps raw muscle strings from the database into strict MuscleGroup enum for HumanMuscleAnatomy
 */
export function extractMuscleHighlights(exercise: {
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  bodyPart?: string;
}): { primary: MuscleGroup[]; secondary: MuscleGroup[] } {
  const primary: MuscleGroup[] = [];
  const secondary: MuscleGroup[] = [];

  const mapList = (list?: string[]): MuscleGroup[] => {
    if (!list || list.length === 0) return [];
    const result: MuscleGroup[] = [];
    for (const m of list) {
      const mapped = mapBodyPartToMuscleGroup(m);
      if (mapped && !result.includes(mapped)) {
        result.push(mapped);
      }
    }
    return result;
  };

  if (exercise.primaryMuscles && exercise.primaryMuscles.length > 0) {
    primary.push(...mapList(exercise.primaryMuscles));
  } else if (exercise.bodyPart) {
    const mapped = mapBodyPartToMuscleGroup(exercise.bodyPart);
    if (mapped) primary.push(mapped);
  }

  if (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) {
    secondary.push(...mapList(exercise.secondaryMuscles));
  }

  return { primary, secondary };
}

/**
 * Performs sub-millisecond client-side fuzzy search across indexed exercises
 */
export function searchExercisesClient(
  query: string,
  options: {
    bodyPart?: string;
    equipment?: string;
    limit?: number;
  } = {}
): ExerciseSearchResult[] {
  const { bodyPart = "all", equipment = "all", limit = 50 } = options;
  const cleanQuery = query.trim();

  // If index is not initialized yet or empty, search raw cache or return empty
  if (!miniSearchInstance) {
    if (rawExercisesCache.length === 0) return [];
    let filtered = rawExercisesCache;
    if (cleanQuery) {
      const q = cleanQuery.toLowerCase();
      filtered = filtered.filter((e) => e.title.toLowerCase().includes(q) || e.bodyPart.toLowerCase().includes(q));
    }
    if (bodyPart !== "all") {
      filtered = filtered.filter((e) => e.bodyPart.toLowerCase() === bodyPart.toLowerCase());
    }
    if (equipment !== "all") {
      filtered = filtered.filter((e) => e.equipment.toLowerCase() === equipment.toLowerCase());
    }
    return filtered.slice(0, limit).map((e) => ({
      ...e,
      score: 1,
      match: {},
      highlightedMuscles: extractMuscleHighlights(e),
    }));
  }

  // If query is blank, return first items filtered by bodyPart/equipment
  if (!cleanQuery) {
    let list = rawExercisesCache;
    if (bodyPart !== "all") {
      list = list.filter((e) => e.bodyPart.toLowerCase() === bodyPart.toLowerCase());
    }
    if (equipment !== "all") {
      list = list.filter((e) => e.equipment.toLowerCase() === equipment.toLowerCase());
    }
    return list.slice(0, limit).map((e) => ({
      ...e,
      score: 1,
      match: {},
      highlightedMuscles: extractMuscleHighlights(e),
    }));
  }

  // Execute MiniSearch with typo tolerance
  const results = miniSearchInstance.search(cleanQuery, {
    filter: (doc) => {
      if (bodyPart !== "all" && doc.bodyPart.toLowerCase() !== bodyPart.toLowerCase()) {
        return false;
      }
      if (equipment !== "all" && doc.equipment.toLowerCase() !== equipment.toLowerCase()) {
        return false;
      }
      return true;
    },
  });

  return results.slice(0, limit).map((r: any) => ({
    ...r,
    highlightedMuscles: extractMuscleHighlights(r),
  }));
}
