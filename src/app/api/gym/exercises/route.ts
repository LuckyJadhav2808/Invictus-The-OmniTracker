import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface GymExerciseItem {
  id: string;
  title: string;
  desc: string;
  type: string;
  bodyPart: string;
  equipment: string;
  level: string;
  rating: string;
  isStaple?: boolean;
}

// Everyday essential staple exercises that every lifter searches for daily
const EVERYDAY_STAPLE_EXERCISES: GymExerciseItem[] = [
  {
    id: "staple-pec-fly",
    title: "Pec Deck Fly (Machine Chest Fly)",
    desc: "Isolation chest movement using the pec fly machine for maximum pectoral contraction and chest stretch.",
    type: "Strength",
    bodyPart: "Chest",
    equipment: "Machine",
    level: "Beginner",
    rating: "9.5",
    isStaple: true,
  },
  {
    id: "staple-preacher-curl",
    title: "EZ-Bar Preacher Curl",
    desc: "Strict bicep isolation curl performed on a preacher bench to eliminate momentum and target the short head.",
    type: "Strength",
    bodyPart: "Biceps",
    equipment: "E-Z Curl Bar",
    level: "Beginner",
    rating: "9.4",
    isStaple: true,
  },
  {
    id: "staple-lat-pulldown",
    title: "Lat Pulldown (Wide Grip)",
    desc: "Staple back exercise pulling a wide bar down to the upper chest to build upper lat width and V-taper.",
    type: "Strength",
    bodyPart: "Lats",
    equipment: "Cable",
    level: "Beginner",
    rating: "9.6",
    isStaple: true,
  },
  {
    id: "staple-bench-press",
    title: "Barbell Flat Bench Press",
    desc: "The primary compound upper-body pushing exercise targeting chest, front delts, and triceps.",
    type: "Strength",
    bodyPart: "Chest",
    equipment: "Barbell",
    level: "Intermediate",
    rating: "9.8",
    isStaple: true,
  },
  {
    id: "staple-incline-db-press",
    title: "Incline Dumbbell Chest Press",
    desc: "Upper chest hypertrophy compound press performed on a 30-45 degree inclined bench.",
    type: "Strength",
    bodyPart: "Chest",
    equipment: "Dumbbell",
    level: "Intermediate",
    rating: "9.5",
    isStaple: true,
  },
  {
    id: "staple-cable-crossover",
    title: "Cable Chest Fly / Crossover",
    desc: "Constant-tension chest fly exercise using high or low cables for lower and mid chest sculpting.",
    type: "Strength",
    bodyPart: "Chest",
    equipment: "Cable",
    level: "Intermediate",
    rating: "9.2",
    isStaple: true,
  },
  {
    id: "staple-tricep-rope",
    title: "Tricep Cable Rope Pushdown",
    desc: "Staple tricep isolation movement extending the cable rope downwards with an outward flare.",
    type: "Strength",
    bodyPart: "Triceps",
    equipment: "Cable",
    level: "Beginner",
    rating: "9.5",
    isStaple: true,
  },
  {
    id: "staple-skullcrushers",
    title: "Skullcrushers (Lying Tricep Extension)",
    desc: "Lying EZ-bar tricep extension behind or towards the forehead targeting the long head of the tricep.",
    type: "Strength",
    bodyPart: "Triceps",
    equipment: "E-Z Curl Bar",
    level: "Intermediate",
    rating: "9.3",
    isStaple: true,
  },
  {
    id: "staple-lateral-raise",
    title: "Dumbbell Lateral Raises",
    desc: "Side delt isolation exercise raising dumbbells laterally to shoulder height for wider shoulders.",
    type: "Strength",
    bodyPart: "Shoulders",
    equipment: "Dumbbell",
    level: "Beginner",
    rating: "9.6",
    isStaple: true,
  },
  {
    id: "staple-face-pulls",
    title: "Cable Face Pulls (Rear Delt)",
    desc: "Postural shoulder exercise pulling cable rope to eye level for rear delts, traps, and rotator cuff health.",
    type: "Strength",
    bodyPart: "Shoulders",
    equipment: "Cable",
    level: "Beginner",
    rating: "9.4",
    isStaple: true,
  },
  {
    id: "staple-hammer-curls",
    title: "Dumbbell Hammer Curls",
    desc: "Neutral-grip curl targeting the brachialis and brachioradialis for forearm and bicep thickness.",
    type: "Strength",
    bodyPart: "Biceps",
    equipment: "Dumbbell",
    level: "Beginner",
    rating: "9.3",
    isStaple: true,
  },
  {
    id: "staple-seated-cable-row",
    title: "Seated Cable Row",
    desc: "Horizontal rowing cable exercise pulling handle to waist for mid-back thickness and rhomboids.",
    type: "Strength",
    bodyPart: "Middle Back",
    equipment: "Cable",
    level: "Beginner",
    rating: "9.5",
    isStaple: true,
  },
  {
    id: "staple-leg-press",
    title: "Leg Press (45-Degree Machine)",
    desc: "Heavy compound lower body press machine targeting quad hypertrophy with lower back support.",
    type: "Strength",
    bodyPart: "Quadriceps",
    equipment: "Machine",
    level: "Beginner",
    rating: "9.6",
    isStaple: true,
  },
  {
    id: "staple-rdl",
    title: "Romanian Deadlift (RDL)",
    desc: "Hinge movement targeting hamstrings and glutes through an eccentric stretch with slight knee bend.",
    type: "Strength",
    bodyPart: "Hamstrings",
    equipment: "Barbell",
    level: "Intermediate",
    rating: "9.7",
    isStaple: true,
  },
  {
    id: "staple-leg-extension",
    title: "Seated Leg Extension Machine",
    desc: "Quad isolation exercise extending lower legs upward on machine for rectus femoris pump.",
    type: "Strength",
    bodyPart: "Quadriceps",
    equipment: "Machine",
    level: "Beginner",
    rating: "9.2",
    isStaple: true,
  },
  {
    id: "staple-lying-leg-curl",
    title: "Lying Hamstring Leg Curl",
    desc: "Machine hamstring curl flexed at the knee for total hamstring hypertrophy.",
    type: "Strength",
    bodyPart: "Hamstrings",
    equipment: "Machine",
    level: "Beginner",
    rating: "9.1",
    isStaple: true,
  },
  {
    id: "staple-shoulder-press",
    title: "Seated Dumbbell Shoulder Press",
    desc: "Overhead dumbbell press compound movement for front delts and overall shoulder mass.",
    type: "Strength",
    bodyPart: "Shoulders",
    equipment: "Dumbbell",
    level: "Intermediate",
    rating: "9.4",
    isStaple: true,
  },
];

// In-memory cache for fast search queries
let cachedExercises: GymExerciseItem[] | null = null;

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  result.push(cell.trim());
  return result;
}

function loadExercises(): GymExerciseItem[] {
  if (cachedExercises) return cachedExercises;

  try {
    const filePath = path.join(process.cwd(), "dataset", "megaGymDataset.csv");
    const datasetItems: GymExerciseItem[] = [];

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const lines = fileContent.split(/\r?\n/);

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || !line.trim()) continue;

        const cols = parseCSVLine(line);
        const indexStr = cols[0] || String(i);
        const title = cols[1] || "";
        const desc = cols[2] || "";
        const type = cols[3] || "Strength";
        const bodyPart = cols[4] || "Full Body";
        const equipment = cols[5] || "Other";
        const level = cols[6] || "Intermediate";
        const rating = cols[7] || "";

        if (title) {
          datasetItems.push({
            id: `ex-${indexStr}-${i}`,
            title,
            desc,
            type,
            bodyPart,
            equipment,
            level,
            rating,
          });
        }
      }
    }

    // Merge staples at the very top, deduplicating titles
    const titleSet = new Set(EVERYDAY_STAPLE_EXERCISES.map((e) => e.title.toLowerCase()));
    const filteredDataset = datasetItems.filter((e) => !titleSet.has(e.title.toLowerCase()));

    cachedExercises = [...EVERYDAY_STAPLE_EXERCISES, ...filteredDataset];
    return cachedExercises;
  } catch (err) {
    console.error("Error loading megaGymDataset.csv:", err);
    return EVERYDAY_STAPLE_EXERCISES;
  }
}

// Synonym/Alias Map for smart fuzzy searching
const SEARCH_ALIASES: Record<string, string[]> = {
  "pec": ["chest", "fly", "pec deck", "butterfly"],
  "pec fly": ["pec deck", "fly", "chest fly", "cable fly", "machine fly"],
  "chest fly": ["pec deck", "cable fly", "dumbbell fly", "pec fly"],
  "preacher": ["ez-bar preacher", "preacher curl", "bicep curl", "arm curl"],
  "preacher curl": ["ez-bar preacher", "bicep curl", "hammer curl"],
  "lat": ["pulldown", "lat pulldown", "lats", "pullup", "row"],
  "lat pulldown": ["pulldown", "lat", "cable down"],
  "pulldown": ["lat pulldown", "lat", "cable down"],
  "bench": ["bench press", "barbell bench", "chest press"],
  "tricep": ["rope pushdown", "pushdown", "skullcrushers", "extension"],
  "bicep": ["bicep curl", "hammer curl", "preacher curl"],
  "lateral": ["lateral raise", "side delt", "shoulder raise"],
  "rdl": ["romanian deadlift", "deadlift", "hamstring"],
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").toLowerCase().trim();
    const bodyPart = (searchParams.get("bodyPart") || "").toLowerCase().trim();
    const equipment = (searchParams.get("equipment") || "").toLowerCase().trim();
    const level = (searchParams.get("level") || "").toLowerCase().trim();
    const limit = parseInt(searchParams.get("limit") || "40", 10);

    const allExercises = loadExercises();

    let filtered = allExercises;

    if (query) {
      // Gather alias keywords
      const aliasTerms = SEARCH_ALIASES[query] || [];
      const searchTerms = [query, ...aliasTerms];

      filtered = filtered.filter((ex) => {
        const titleLower = ex.title.toLowerCase();
        const bodyLower = ex.bodyPart.toLowerCase();
        const equipLower = ex.equipment.toLowerCase();
        const descLower = ex.desc.toLowerCase();

        return searchTerms.some(
          (term) =>
            titleLower.includes(term) ||
            bodyLower.includes(term) ||
            equipLower.includes(term) ||
            descLower.includes(term)
        );
      });

      // Boost exact staple & title matches to top
      filtered.sort((a, b) => {
        if (a.isStaple && !b.isStaple) return -1;
        if (!a.isStaple && b.isStaple) return 1;
        const aTitleMatch = a.title.toLowerCase().startsWith(query);
        const bTitleMatch = b.title.toLowerCase().startsWith(query);
        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;
        return 0;
      });
    }

    if (bodyPart && bodyPart !== "all") {
      filtered = filtered.filter((ex) => ex.bodyPart.toLowerCase() === bodyPart);
    }

    if (equipment && equipment !== "all") {
      filtered = filtered.filter((ex) => ex.equipment.toLowerCase() === equipment);
    }

    if (level && level !== "all") {
      filtered = filtered.filter((ex) => ex.level.toLowerCase() === level);
    }

    const bodyPartsSet = new Set(allExercises.map((e) => e.bodyPart).filter(Boolean));
    const equipmentSet = new Set(allExercises.map((e) => e.equipment).filter(Boolean));

    return NextResponse.json({
      success: true,
      totalCount: filtered.length,
      exercises: filtered.slice(0, limit),
      availableBodyParts: Array.from(bodyPartsSet).sort(),
      availableEquipment: Array.from(equipmentSet).sort(),
    });
  } catch (err: any) {
    console.error("Gym exercises API error:", err);
    return NextResponse.json({ error: err?.message || "Failed to search exercises" }, { status: 500 });
  }
}
