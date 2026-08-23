import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface GymExerciseItem {
  id: string;
  title: string;
  desc: string;
  instructions?: string[];
  type: string;
  bodyPart: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  equipment: string;
  level: string;
  rating?: string;
  mechanic?: string;
  force?: string;
  images?: string[];
  gifUrl?: string;
  isStaple?: boolean;
}

// Everyday essential staple exercises that every lifter searches for daily with full instructions & images
const EVERYDAY_STAPLE_EXERCISES: GymExerciseItem[] = [
  {
    id: "staple-bench-press",
    title: "Barbell Flat Bench Press",
    desc: "The premier compound chest exercise for building pectoral mass, front deltoids, and tricep pressing power.",
    instructions: [
      "Lie back on a flat bench with eyes directly under the racked bar. Plant feet flat on the floor.",
      "Grip the bar slightly wider than shoulder-width with wrists straight. Retract shoulder blades and arch lower back slightly.",
      "Unrack the bar and hold it directly over your chest with arms locked.",
      "Inhale and lower the bar in a controlled diagonal bar path until it lightly touches your mid-chest.",
      "Drive your feet into the ground and press the barbell up forcefully, locking arms at the top and squeezing your pecs."
    ],
    type: "Strength",
    bodyPart: "Chest",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["shoulders", "triceps"],
    equipment: "Barbell",
    level: "Intermediate",
    mechanic: "compound",
    images: [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Bench_Press_-_Medium_Grip/1.jpg"
    ],
    gifUrl: "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
    rating: "9.8",
    isStaple: true,
  },
  {
    id: "staple-incline-db-press",
    title: "Incline Dumbbell Chest Press",
    desc: "Upper chest hypertrophy compound press performed on a 30-45 degree inclined bench.",
    instructions: [
      "Set an adjustable bench to a 30-45 degree incline. Sit back holding dumbbells on your thighs.",
      "Kick the dumbbells up one at a time to shoulder height as you lie back onto the bench.",
      "Press the dumbbells overhead with palms facing forward until arms are extended.",
      "Lower the dumbbells slowly until you feel a deep stretch across your clavicular upper chest.",
      "Press back up in a slight arc, bringing dumbbells close together without clanking them."
    ],
    type: "Strength",
    bodyPart: "Chest",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["shoulders", "triceps"],
    equipment: "Dumbbell",
    level: "Intermediate",
    mechanic: "compound",
    images: [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Press/1.jpg"
    ],
    gifUrl: "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Press/0.jpg",
    rating: "9.5",
    isStaple: true,
  },
  {
    id: "staple-pec-fly",
    title: "Pec Deck Fly (Machine Chest Fly)",
    desc: "Strict isolation chest movement using the pec fly machine for maximum pectoral contraction and chest stretch.",
    instructions: [
      "Sit on the machine with your back flat against the pad. Adjust the seat so the handles align with mid-chest.",
      "Grip the handles or place forearms on the pads with elbows slightly bent.",
      "Squeeze your pecs to bring your hands together in front of your chest in a smooth clapping motion.",
      "Hold the peak contraction for 1 second at the center, then reverse slowly for a full 3-second stretch."
    ],
    type: "Strength",
    bodyPart: "Chest",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["shoulders"],
    equipment: "Machine",
    level: "Beginner",
    mechanic: "isolation",
    images: [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Butterfly/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Butterfly/1.jpg"
    ],
    gifUrl: "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Butterfly/0.jpg",
    rating: "9.5",
    isStaple: true,
  },
  {
    id: "staple-lat-pulldown",
    title: "Lat Pulldown (Wide Grip)",
    desc: "Staple vertical pulling back exercise pulling a wide bar down to the upper chest to build upper lat width and V-taper.",
    instructions: [
      "Sit on the lat pulldown machine and adjust thigh pads firmly against your thighs.",
      "Grip the bar slightly wider than shoulder width with palms facing forward (pronated).",
      "Lean back slightly (10-15 degrees) and pull the bar smoothly down to your upper clavicle/chest.",
      "Squeeze your shoulder blades together and drive your elbows down towards your hips.",
      "Slowly extend arms overhead to feel the lats stretch at the top."
    ],
    type: "Strength",
    bodyPart: "Lats",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "middle back"],
    equipment: "Cable",
    level: "Beginner",
    mechanic: "compound",
    images: [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Wide-Grip_Lat_Pulldown/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Wide-Grip_Lat_Pulldown/1.jpg"
    ],
    gifUrl: "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Wide-Grip_Lat_Pulldown/0.jpg",
    rating: "9.6",
    isStaple: true,
  },
  {
    id: "staple-cable-seated-row",
    title: "Seated Cable Row (Close Grip)",
    desc: "Horizontal pulling back exercise targeting middle back thickness, rhomboids, and lats.",
    instructions: [
      "Sit at the low cable row station with feet braced and knees slightly bent.",
      "Grip the V-bar handle and sit upright with a flat back and shoulders relaxed.",
      "Pull the handle towards your lower abdomen while driving elbows back and retracting scapulae.",
      "Hold the squeeze for 1 second, then slowly let arms extend back without rounding the lower spine."
    ],
    type: "Strength",
    bodyPart: "Back",
    primaryMuscles: ["middle back", "lats"],
    secondaryMuscles: ["biceps", "forearms"],
    equipment: "Cable",
    level: "Beginner",
    mechanic: "compound",
    images: [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Cable_Rows/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Cable_Rows/1.jpg"
    ],
    gifUrl: "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Cable_Rows/0.jpg",
    rating: "9.5",
    isStaple: true,
  },
  {
    id: "staple-preacher-curl",
    title: "EZ-Bar Preacher Curl",
    desc: "Strict bicep isolation curl performed on a preacher bench to eliminate momentum and target the short head.",
    instructions: [
      "Sit on the preacher bench with armpits snug against the top of the angled pad.",
      "Grip the inner cambered handles of the EZ-bar with palms up.",
      "Curl the bar upwards towards your shoulders, keeping upper arms glued to the pad.",
      "Squeeze biceps hard at the peak, then lower under control until arms are almost fully extended."
    ],
    type: "Strength",
    bodyPart: "Biceps",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    equipment: "E-Z Curl Bar",
    level: "Beginner",
    mechanic: "isolation",
    images: [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Preacher_Curl/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Preacher_Curl/1.jpg"
    ],
    gifUrl: "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Preacher_Curl/0.jpg",
    rating: "9.4",
    isStaple: true,
  },
  {
    id: "staple-tricep-rope",
    title: "Tricep Cable Rope Pushdown",
    desc: "Staple tricep isolation movement extending the cable rope downwards with an outward flare.",
    instructions: [
      "Attach a rope attachment to a high pulley. Stand with a slight forward hip hinge.",
      "Tuck your elbows tightly against your ribcage and grip the rope handles.",
      "Push the rope down towards your hips, flaring the rope ends outward at the bottom of the movement.",
      "Lock out triceps for a hard squeeze, then control the return up to chest height."
    ],
    type: "Strength",
    bodyPart: "Triceps",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    equipment: "Cable",
    level: "Beginner",
    mechanic: "isolation",
    images: [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Triceps_Pushdown_-_Rope_Attachment/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Triceps_Pushdown_-_Rope_Attachment/1.jpg"
    ],
    gifUrl: "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Triceps_Pushdown_-_Rope_Attachment/0.jpg",
    rating: "9.5",
    isStaple: true,
  },
  {
    id: "staple-db-lateral-raise",
    title: "Dumbbell Lateral Raise (Side Delts)",
    desc: "Essential shoulder hypertrophy exercise targeting the lateral deltoid head for wider shoulders.",
    instructions: [
      "Stand holding dumbbells at your sides with a slight forward torso lean (5-10 degrees).",
      "Raise arms out to the sides leading with your elbows until parallel with the floor.",
      "Pour the pitcher slightly at the top to emphasize side delts, avoid shrugging traps.",
      "Lower slowly over 2-3 seconds back to sides."
    ],
    type: "Strength",
    bodyPart: "Shoulders",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["traps"],
    equipment: "Dumbbell",
    level: "Beginner",
    mechanic: "isolation",
    images: [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Side_Lateral_Raise/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Side_Lateral_Raise/1.jpg"
    ],
    gifUrl: "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Side_Lateral_Raise/0.jpg",
    rating: "9.6",
    isStaple: true,
  },
  {
    id: "staple-squat",
    title: "Barbell Back Squat",
    desc: "The king of lower body compound exercises building massive quadriceps, glutes, and core strength.",
    instructions: [
      "Rest the bar securely on your upper traps. Stand with feet slightly wider than shoulder width.",
      "Take a deep diaphragmatic breath, brace core, and break at hips and knees simultaneously.",
      "Descend until thighs are parallel or below parallel to the floor, keeping chest proud and knees tracking over toes.",
      "Drive through mid-foot to stand back up powerfully."
    ],
    type: "Strength",
    bodyPart: "Quadriceps",
    primaryMuscles: ["quadriceps"],
    secondaryMuscles: ["glutes", "hamstrings", "calves"],
    equipment: "Barbell",
    level: "Intermediate",
    mechanic: "compound",
    images: [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Full_Squat/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Full_Squat/1.jpg"
    ],
    gifUrl: "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Full_Squat/0.jpg",
    rating: "9.9",
    isStaple: true,
  },
  {
    id: "staple-rdl",
    title: "Romanian Deadlift (Barbell / Dumbbell RDL)",
    desc: "Posterior chain builder focusing on hamstring stretch, glute development, and lower back stability.",
    instructions: [
      "Hold the barbell at hip height with an overhand grip, feet hip-width apart.",
      "Keep knees slightly soft (not locked) and push hips straight backwards as if touching a wall.",
      "Lower the bar directly along your shins until you feel a deep hamstring stretch.",
      "Drive hips forward and squeeze glutes to return to standing lockout."
    ],
    type: "Strength",
    bodyPart: "Hamstrings",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["glutes", "lower back"],
    equipment: "Barbell",
    level: "Intermediate",
    mechanic: "compound",
    images: [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Romanian_Deadlift/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Romanian_Deadlift/1.jpg"
    ],
    gifUrl: "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Romanian_Deadlift/0.jpg",
    rating: "9.7",
    isStaple: true,
  },
  {
    id: "staple-leg-press",
    title: "Incline Leg Press",
    desc: "Heavy quad and glute overload machine exercise allowing high volume with reduced spinal loading.",
    instructions: [
      "Sit back on the 45-degree leg press machine with feet shoulder-width in the middle of the platform.",
      "Release safety bars and lower the sled towards your chest until knees reach 90 degrees.",
      "Do not allow lower back/glutes to round off the seat.",
      "Press the sled back up forcefully through heels without hyperextending or locking knees."
    ],
    type: "Strength",
    bodyPart: "Quadriceps",
    primaryMuscles: ["quadriceps"],
    secondaryMuscles: ["glutes", "hamstrings"],
    equipment: "Machine",
    level: "Beginner",
    mechanic: "compound",
    images: [
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Press/0.jpg",
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Press/1.jpg"
    ],
    gifUrl: "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Press/0.jpg",
    rating: "9.5",
    isStaple: true,
  },
];

let cachedExercises: GymExerciseItem[] | null = null;

function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function loadExercises(): GymExerciseItem[] {
  if (cachedExercises) return cachedExercises;

  try {
    const jsonPath = path.join(process.cwd(), "src", "lib", "data", "exercises-db.json");
    if (fs.existsSync(jsonPath)) {
      const rawData = fs.readFileSync(jsonPath, "utf-8");
      const parsed = JSON.parse(rawData);

      const dbItems: GymExerciseItem[] = parsed.map((item: any) => {
        const primary = item.primaryMuscles || [];
        const bodyPart = primary[0] ? capitalize(primary[0]) : capitalize(item.category || "General");
        const images = (item.images || []).map(
          (img: string) => `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/${img}`
        );

        return {
          id: item.id || `ex-${item.name?.replace(/\s+/g, "-").toLowerCase()}`,
          title: item.name,
          desc: item.instructions?.join(" ") || "",
          instructions: item.instructions || [],
          type: capitalize(item.category || "Strength"),
          bodyPart,
          primaryMuscles: primary,
          secondaryMuscles: item.secondaryMuscles || [],
          equipment: capitalize(item.equipment || "Other"),
          level: capitalize(item.level || "Intermediate"),
          mechanic: item.mechanic || "compound",
          force: item.force || "",
          images,
          gifUrl: images[0] || "",
          rating: "9.0",
        };
      });

      // Merge staple exercises at the top
      const titleSet = new Set(EVERYDAY_STAPLE_EXERCISES.map((e) => e.title.toLowerCase()));
      const filteredDb = dbItems.filter((e) => !titleSet.has(e.title.toLowerCase()));

      cachedExercises = [...EVERYDAY_STAPLE_EXERCISES, ...filteredDb];
      return cachedExercises;
    }
  } catch (err) {
    console.error("Error loading exercises-db.json:", err);
  }

  cachedExercises = EVERYDAY_STAPLE_EXERCISES;
  return cachedExercises;
}

// Synonym/Alias Map for smart fuzzy searching
const SEARCH_ALIASES: Record<string, string[]> = {
  "pec": ["butterfly", "chest fly", "pec deck", "machine fly"],
  "pec deck": ["butterfly", "chest fly", "pec deck", "machine fly"],
  "pec fly": ["butterfly", "chest fly", "cable fly", "dumbbell fly"],
  "chest fly": ["butterfly", "flat bench cable flyes", "dumbbell flyes", "pec deck"],
  "bench press": ["barbell flat bench press", "barbell bench press", "chest press"],
  "incline bench": ["incline dumbbell chest press", "incline barbell bench press", "incline bench"],
  "incline dumbbell": ["incline dumbbell chest press", "incline dumbbell press"],
  "preacher": ["ez-bar preacher curl", "cable preacher curl", "bicep curl"],
  "preacher curl": ["ez-bar preacher curl", "cable preacher curl", "hammer curl"],
  "lat": ["wide-grip lat pulldown", "close-grip front lat pulldown", "lat pulldown", "pullup", "row"],
  "lat pulldown": ["wide-grip lat pulldown", "close-grip front lat pulldown", "lat pulldown"],
  "pulldown": ["wide-grip lat pulldown", "close-grip front lat pulldown", "lat pulldown"],
  "seated row": ["seated cable row", "seated cable rows", "cable row"],
  "cable row": ["seated cable row", "seated cable rows", "low pulley row"],
  "bench": ["barbell flat bench press", "barbell bench press", "dumbbell bench press"],
  "tricep": ["triceps pushdown", "rope pushdown", "skullcrushers", "lying triceps extension"],
  "tricep pushdown": ["triceps pushdown - rope attachment", "triceps pushdown", "rope pushdown"],
  "triceps pushdown": ["triceps pushdown - rope attachment", "triceps pushdown"],
  "tricep extension": ["cable lying triceps extension", "lying triceps extension", "triceps pushdown"],
  "bicep": ["dumbbell alternate bicep curl", "bicep curl", "hammer curl", "ez-bar preacher curl"],
  "bicep curl": ["dumbbell alternate bicep curl", "biceps curl", "barbell curl"],
  "biceps curl": ["dumbbell alternate bicep curl", "biceps curl", "barbell curl"],
  "hammer curl": ["hammer curls", "dumbbell hammer curl", "bicep curl"],
  "lateral": ["dumbbell lateral raise", "side lateral raise", "shoulder raise"],
  "lateral raise": ["dumbbell lateral raise", "side lateral raise"],
  "side raise": ["dumbbell lateral raise", "side lateral raise"],
  "shoulder press": ["standing military press", "overhead barbell press", "dumbbell shoulder press"],
  "overhead press": ["standing military press", "overhead barbell press"],
  "military press": ["standing military press", "overhead barbell press"],
  "rdl": ["romanian deadlift", "deadlift", "hamstring"],
  "deadlift": ["axle deadlift", "barbell deadlift", "romanian deadlift"],
  "squat": ["barbell back squat", "barbell full squat", "squat", "leg press"],
  "leg press": ["incline leg press", "leg press"],
  "leg extension": ["leg extensions", "leg extension"],
  "leg curl": ["lying leg curls", "seated leg curl", "hamstring curl"],
  "hamstring curl": ["lying leg curls", "seated leg curl"],
  "calf raise": ["standing calf raises", "seated calf raise"],
  "face pull": ["face pull", "cable rear delt"],
  "skull crusher": ["cable lying triceps extension", "lying triceps extension"],
  "skull crushers": ["cable lying triceps extension", "lying triceps extension"],
};

function normalizeText(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

function findBestGuideExercise(
  allExercises: GymExerciseItem[],
  query: string,
  targetMuscle?: string
): GymExerciseItem | null {
  if (!query) return null;
  const qNorm = normalizeText(query);
  const qWords = qNorm.split(" ").filter((w) => w.length > 2);

  // 1. Direct match
  const directMatch = allExercises.find(
    (e) =>
      normalizeText(e.title) === qNorm ||
      normalizeText(e.id) === qNorm ||
      normalizeText(e.title).includes(qNorm) ||
      qNorm.includes(normalizeText(e.title))
  );
  if (directMatch) return directMatch;

  // 2. Alias dictionary lookup
  for (const [key, list] of Object.entries(SEARCH_ALIASES)) {
    if (qNorm.includes(key) || key.includes(qNorm)) {
      for (const alias of list) {
        const found = allExercises.find((e) => normalizeText(e.title).includes(normalizeText(alias)));
        if (found) return found;
      }
    }
  }

  // 3. Word token stem scoring
  if (qWords.length > 0) {
    const scored = allExercises
      .map((e) => {
        const eNorm = normalizeText(e.title);
        let score = 0;
        for (const w of qWords) {
          const stem = w.replace(/s$/, "").replace(/ing$/, "").replace(/es$/, "");
          if (eNorm.includes(stem)) score += 3;
          if (normalizeText(e.bodyPart).includes(stem)) score += 2;
          if (normalizeText(e.equipment).includes(stem)) score += 1;
        }
        return { e, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) return scored[0].e;
  }

  // 4. Target muscle fallback
  if (targetMuscle) {
    const mNorm = normalizeText(targetMuscle);
    const muscleMatch = allExercises.find(
      (e) =>
        normalizeText(e.bodyPart).includes(mNorm) ||
        mNorm.includes(normalizeText(e.bodyPart)) ||
        (e.primaryMuscles || []).some(
          (m) => normalizeText(m).includes(mNorm) || mNorm.includes(normalizeText(m))
        )
    );
    if (muscleMatch) return muscleMatch;
  }

  return allExercises[0] || null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").toLowerCase().trim();
    const nameLookup = (searchParams.get("name") || "").toLowerCase().trim();
    const bodyPart = (searchParams.get("bodyPart") || searchParams.get("targetMuscle") || "").toLowerCase().trim();
    const equipment = (searchParams.get("equipment") || "").toLowerCase().trim();
    const level = (searchParams.get("level") || "").toLowerCase().trim();
    const limit = parseInt(searchParams.get("limit") || "40", 10);

    const allExercises = loadExercises();

    // 1. Direct Name / Guide Lookup with Smart Fuzzy Matcher
    if (nameLookup) {
      const match = findBestGuideExercise(allExercises, nameLookup, bodyPart);
      if (match) {
        return NextResponse.json({ success: true, exercise: match });
      }
    }

    let filtered = allExercises;

    if (query) {
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
