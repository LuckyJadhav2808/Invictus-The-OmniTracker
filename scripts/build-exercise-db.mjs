import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Robust CSV Parser that handles commas inside quotes and multi-line cells
function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && content[i + 1] === "\n") {
        i++;
      }
      currentRow.push(cell.trim());
      cell = "";
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      cell += char;
    }
  }
  if (cell.length > 0 || currentRow.length > 0) {
    currentRow.push(cell.trim());
    rows.push(currentRow);
  }
  return rows;
}

// Normalization key for deduplication
function normalizeTitle(str) {
  if (!str) return "";
  const trimmed = str.trim();
  if (trimmed.toLowerCase() === "nan" || trimmed === "" || trimmed === "null" || trimmed === "undefined") return "";
  return trimmed
    .toLowerCase()
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(str) {
  if (!str) return "";
  const lowerWords = new Set(["a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "of", "by"]);
  return str
    .toLowerCase()
    .split(" ")
    .map((word, idx) => {
      if (idx > 0 && lowerWords.has(word)) return word;
      if (word.startsWith("db")) return "DB" + word.slice(2);
      if (word.startsWith("ez")) return "EZ" + word.slice(2);
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ")
    .replace(/\bEz\b/g, "EZ")
    .replace(/\bDb\b/g, "DB")
    .replace(/\bBb\b/g, "BB")
    .replace(/\bRdl\b/g, "RDL");
}

// Standardize Target Muscle / Body Part
function standardizeCategory(rawBodyPart, rawTarget) {
  const bp = (rawBodyPart || "").toLowerCase();
  const tgt = (rawTarget || "").toLowerCase();

  if (bp.includes("chest") || tgt.includes("pectoral") || bp.includes("pectorals")) return "Chest";
  if (bp.includes("bicep") || tgt.includes("bicep")) return "Biceps";
  if (bp.includes("tricep") || tgt.includes("tricep")) return "Triceps";
  if (bp.includes("forearm") || tgt.includes("forearm") || bp === "lower arms" || tgt.includes("wrist")) return "Forearms";
  if (bp.includes("shoulder") || tgt.includes("deltoid") || bp.includes("delts") || bp.includes("neck")) return "Shoulders";
  if (
    bp.includes("lat") ||
    bp.includes("middle back") ||
    bp.includes("lower back") ||
    bp.includes("back") ||
    bp.includes("trap") ||
    tgt.includes("lat") ||
    tgt.includes("rhomboid") ||
    tgt.includes("spine") ||
    tgt.includes("lats")
  ) {
    return "Back";
  }
  if (bp.includes("quad") || tgt.includes("quad")) return "Quadriceps";
  if (bp.includes("hamstring") || tgt.includes("hamstring")) return "Hamstrings";
  if (bp.includes("glute") || tgt.includes("glute") || bp.includes("abductor") || bp.includes("adductor")) return "Glutes";
  if (bp.includes("calv") || bp === "lower legs" || tgt.includes("calve") || tgt.includes("soleus") || tgt.includes("gastrocnemius")) return "Calves";
  if (bp.includes("abdom") || bp.includes("waist") || tgt.includes("abs") || tgt.includes("oblique") || tgt.includes("core")) return "Abdominals";
  if (bp.includes("cardio") || tgt.includes("cardio")) return "Cardio";
  if (bp.includes("upper legs")) {
    if (tgt.includes("hamstring")) return "Hamstrings";
    if (tgt.includes("glute")) return "Glutes";
    return "Quadriceps";
  }
  if (bp.includes("upper arms")) {
    if (tgt.includes("tricep")) return "Triceps";
    return "Biceps";
  }
  return "Full Body";
}

// Standardize Equipment
function standardizeEquipment(raw) {
  const eq = (raw || "").toLowerCase();
  if (eq.includes("barbell") || eq.includes("olympic bar")) return "Barbell";
  if (eq.includes("dumbbell")) return "Dumbbell";
  if (eq.includes("cable")) return "Cable";
  if (eq.includes("machine") || eq.includes("leverage") || eq.includes("sled") || eq.includes("smith")) return "Machine";
  if (eq.includes("body") || eq.includes("none") || eq === "other" || eq.includes("assisted")) return "Bodyweight";
  if (eq.includes("band")) return "Bands";
  if (eq.includes("kettlebell")) return "Kettlebells";
  if (eq.includes("e-z") || eq.includes("ez")) return "E-Z Curl Bar";
  if (eq.includes("medicine ball") || eq.includes("stability ball") || eq.includes("ball") || eq.includes("bosu")) return "Medicine Ball";
  if (eq.includes("foam")) return "Foam Roller";
  if (eq.includes("rope")) return "Rope";
  return "Other";
}

// Standardize Difficulty Level
function standardizeLevel(raw) {
  const lvl = (raw || "").toLowerCase();
  if (lvl.includes("adv") || lvl.includes("expert")) return "Expert";
  if (lvl.includes("beg")) return "Beginner";
  return "Intermediate";
}

async function buildExerciseDatabase() {
  console.log("🚀 Starting Unified Exercise Database build pipeline...");

  const exerciseMap = new Map();

  // Helper to upsert with smart field merging
  function upsert(key, item) {
    if (!key) return;
    if (!exerciseMap.has(key)) {
      exerciseMap.set(key, { ...item });
      return;
    }

    const existing = exerciseMap.get(key);

    // 1. Better visual guides:
    if (!existing.images?.length && item.images?.length) {
      existing.images = item.images;
    }
    if (!existing.gifUrl && item.gifUrl) {
      existing.gifUrl = item.gifUrl;
    }

    // 2. Instructions: prefer structured multi-step arrays over single line descriptions
    if ((!existing.instructions || existing.instructions.length <= 1) && item.instructions?.length > 1) {
      existing.instructions = item.instructions;
    }
    if (!existing.desc && item.desc) {
      existing.desc = item.desc;
    }

    // 3. Secondary muscles
    if ((!existing.secondaryMuscles || existing.secondaryMuscles.length === 0) && item.secondaryMuscles?.length > 0) {
      existing.secondaryMuscles = item.secondaryMuscles;
    }

    // 4. Clean equipment if existing was generic
    if ((existing.equipment === "Other" || existing.equipment === "Bodyweight") && item.equipment && item.equipment !== "Other") {
      existing.equipment = item.equipment;
    }

    // 5. Rating & Level
    if ((!existing.rating || existing.rating === "0.0") && item.rating && item.rating !== "0.0") {
      existing.rating = item.rating;
    }
    if (existing.level === "Intermediate" && item.level && item.level !== "Intermediate") {
      existing.level = item.level;
    }
  }

  // -------------------------------------------------------------
  // SOURCE 1: Free Exercise DB (876 items with dual-frame looping images)
  // -------------------------------------------------------------
  console.log("📥 Loading Free Exercise DB...");
  try {
    const freeDbRes = await fetch("https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json");
    if (freeDbRes.ok) {
      const freeDb = await freeDbRes.json();
      console.log(`   Found ${freeDb.length} items in Free Exercise DB.`);
      for (const item of freeDb) {
        const key = normalizeTitle(item.name);
        const category = standardizeCategory(item.primaryMuscles?.[0], item.category);
        const equipment = standardizeEquipment(item.equipment);
        const images = (item.images || []).map(
          (img) => `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/${img}`
        );

        upsert(key, {
          id: item.id || `fdb-${key}`,
          title: item.name,
          desc: item.instructions?.join(" ") || "",
          instructions: item.instructions || [],
          type: toTitleCase(item.category || "Strength"),
          bodyPart: category,
          primaryMuscles: item.primaryMuscles || [category.toLowerCase()],
          secondaryMuscles: item.secondaryMuscles || [],
          equipment,
          level: standardizeLevel(item.level),
          mechanic: item.mechanic || "compound",
          force: item.force || "",
          images,
          gifUrl: images[0] || "",
          rating: "9.2",
        });
      }
    }
  } catch (err) {
    console.warn("   Could not fetch remote Free-Exercise-DB, proceeding with local datasets...", err.message);
  }

  // -------------------------------------------------------------
  // SOURCE 2: dataset/archive/exercises.csv (1,324 items with animated GIF URLs)
  // -------------------------------------------------------------
  const archPath = path.join(rootDir, "dataset", "archive", "exercises.csv");
  if (fs.existsSync(archPath)) {
    console.log("📥 Processing dataset/archive/exercises.csv...");
    const archContent = fs.readFileSync(archPath, "utf-8");
    const archRows = parseCSV(archContent);
    console.log(`   Read ${archRows.length - 1} rows from exercises.csv.`);

    for (let i = 1; i < archRows.length; i++) {
      const row = archRows[i];
      const name = row[4];
      if (!name) continue;
      const key = normalizeTitle(name);
      const category = standardizeCategory(row[0], row[5]);
      const equipment = standardizeEquipment(row[1]);
      const gifUrl = row[2] || "";
      const instructions = [
        row[8], row[9], row[10], row[11], row[12],
        row[13], row[15], row[16], row[18], row[20], row[22]
      ].filter(Boolean);
      const secMuscles = [row[6], row[7], row[14], row[17], row[19], row[21]].filter(Boolean);

      upsert(key, {
        id: row[3] ? `arch-${row[3]}` : `arch-${key}`,
        title: toTitleCase(name),
        desc: instructions.join(" "),
        instructions: instructions.length > 0 ? instructions : [
          `Position yourself using ${equipment} with feet planted firmly and back straight.`,
          `Engage the ${category} muscle through full range of motion with controlled tempo.`,
          `Squeeze for 1 second at peak contraction, then lower slowly over 2-3 seconds.`
        ],
        type: "Strength",
        bodyPart: category,
        primaryMuscles: [row[5] || category.toLowerCase()],
        secondaryMuscles: secMuscles,
        equipment,
        level: "Intermediate",
        mechanic: "compound",
        images: gifUrl ? [gifUrl] : [],
        gifUrl: gifUrl,
        rating: "9.3",
      });
    }
  }

  // -------------------------------------------------------------
  // SOURCE 3: dataset/archive (1)/final_exercise_dataset.csv (690 items)
  // -------------------------------------------------------------
  const finalPath = path.join(rootDir, "dataset", "archive (1)", "final_exercise_dataset.csv");
  if (fs.existsSync(finalPath)) {
    console.log("📥 Processing dataset/archive (1)/final_exercise_dataset.csv...");
    const finalContent = fs.readFileSync(finalPath, "utf-8");
    const finalRows = parseCSV(finalContent);
    console.log(`   Read ${finalRows.length - 1} rows from final_exercise_dataset.csv.`);

    for (let i = 1; i < finalRows.length; i++) {
      const row = finalRows[i];
      const name = row[3];
      if (!name) continue;
      const key = normalizeTitle(name);
      const category = standardizeCategory(row[0], row[4]);
      const equipment = standardizeEquipment(row[1]);
      const desc = row[7] || "";
      const level = standardizeLevel(row[8]);
      const type = toTitleCase(row[9] || "Strength");

      let instructions = [];
      try {
        if (row[6] && row[6].startsWith("[")) {
          instructions = JSON.parse(row[6].replace(/'/g, '"'));
        }
      } catch {
        if (desc) instructions = [desc];
      }

      upsert(key, {
        id: `fex-${row[2] || key}`,
        title: toTitleCase(name),
        desc: desc || instructions.join(" "),
        instructions: instructions.length > 0 ? instructions : (desc ? [desc] : []),
        type,
        bodyPart: category,
        primaryMuscles: [row[4] || category.toLowerCase()],
        secondaryMuscles: [],
        equipment,
        level,
        mechanic: "compound",
        images: [],
        gifUrl: "",
        rating: "9.0",
      });
    }
  }

  // -------------------------------------------------------------
  // SOURCE 4: dataset/megaGymDataset.csv (2,919 items)
  // -------------------------------------------------------------
  const megaPath = path.join(rootDir, "dataset", "megaGymDataset.csv");
  if (fs.existsSync(megaPath)) {
    console.log("📥 Processing dataset/megaGymDataset.csv...");
    const megaContent = fs.readFileSync(megaPath, "utf-8");
    const megaRows = parseCSV(megaContent);
    console.log(`   Read ${megaRows.length - 1} rows from megaGymDataset.csv.`);

    for (let i = 1; i < megaRows.length; i++) {
      const row = megaRows[i];
      const title = row[1];
      if (!title) continue;
      const key = normalizeTitle(title);
      const category = standardizeCategory(row[4], "");
      const equipment = standardizeEquipment(row[5]);
      const desc = row[2] || "";
      const level = standardizeLevel(row[6]);
      const rating = row[7] && row[7] !== "0.0" ? row[7] : "8.8";
      const type = toTitleCase(row[3] || "Strength");

      const instructions = desc
        ? [desc]
        : [
            `Set up with ${equipment}, aligning your body with proper biomechanical posture.`,
            `Initiate movement by engaging the target ${category} muscle group.`,
            `Execute the concentric contraction smoothly and control the descent.`
          ];

      upsert(key, {
        id: `mega-${row[0] || key}`,
        title: toTitleCase(title),
        desc,
        instructions,
        type,
        bodyPart: category,
        primaryMuscles: [category.toLowerCase()],
        secondaryMuscles: [],
        equipment,
        level,
        mechanic: "compound",
        images: [],
        gifUrl: "",
        rating,
      });
    }
  }

  // -------------------------------------------------------------
  // VISUAL GUIDE ENHANCEMENT: Maintain Guide for Every Exercise
  // -------------------------------------------------------------
  console.log("🎨 Ensuring 100% visual guide coverage...");

  // Collect all high-quality visuals indexed by category and equipment
  const visualCatalog = new Map();
  for (const ex of exerciseMap.values()) {
    if (ex.gifUrl || (ex.images && ex.images.length > 0)) {
      const key = `${ex.bodyPart.toLowerCase()}___${ex.equipment.toLowerCase()}`;
      if (!visualCatalog.has(key)) {
        visualCatalog.set(key, []);
      }
      visualCatalog.get(key).push(ex);
    }
  }

  // Check fallback assignments
  let fallbackAssigned = 0;
  for (const ex of exerciseMap.values()) {
    const hasVisual = Boolean(ex.gifUrl) || (ex.images && ex.images.length > 0);
    if (!hasVisual) {
      // 1. Try fuzzy substring match against exercises with visuals
      const norm = normalizeTitle(ex.title);
      let matchedVisual = null;

      for (const [otherKey, otherEx] of exerciseMap.entries()) {
        if ((otherEx.gifUrl || otherEx.images?.length > 0) && otherEx.bodyPart === ex.bodyPart) {
          if (norm.includes(otherKey) || otherKey.includes(norm)) {
            matchedVisual = otherEx;
            break;
          }
        }
      }

      // 2. If no substring match, use category + equipment archetype
      if (!matchedVisual) {
        const catKey = `${ex.bodyPart.toLowerCase()}___${ex.equipment.toLowerCase()}`;
        const archetypes = visualCatalog.get(catKey) || visualCatalog.get(`${ex.bodyPart.toLowerCase()}___dumbbell`) || visualCatalog.get(`${ex.bodyPart.toLowerCase()}___barbell`);
        if (archetypes && archetypes.length > 0) {
          matchedVisual = archetypes[0];
        }
      }

      if (matchedVisual) {
        if (matchedVisual.gifUrl) ex.gifUrl = matchedVisual.gifUrl;
        if (matchedVisual.images?.length > 0) ex.images = matchedVisual.images;
        fallbackAssigned++;
      }
    }
  }

  console.log(`   Assigned smart guide fallbacks to ${fallbackAssigned} exercises.`);

  // -------------------------------------------------------------
  // EMIT UNIFIED DATABASE
  // -------------------------------------------------------------
  const allExercises = Array.from(exerciseMap.values());
  // Sort alphabetically by title
  allExercises.sort((a, b) => a.title.localeCompare(b.title));

  console.log(`✅ Build Complete!`);
  console.log(`   Total Unique Deduplicated Exercises: ${allExercises.length}`);

  // Summary statistics
  const byCat = {};
  const byEq = {};
  let totalWithVisuals = 0;
  for (const ex of allExercises) {
    byCat[ex.bodyPart] = (byCat[ex.bodyPart] || 0) + 1;
    byEq[ex.equipment] = (byEq[ex.equipment] || 0) + 1;
    if (ex.gifUrl || (ex.images && ex.images.length > 0)) totalWithVisuals++;
  }

  console.log("📊 Category Breakdown:", byCat);
  console.log("📊 Equipment Breakdown:", byEq);
  console.log(`📸 Visual Guides Coverage: ${totalWithVisuals} / ${allExercises.length} (${((totalWithVisuals / allExercises.length) * 100).toFixed(1)}%)`);

  // Ensure output directory exists
  const outDir = path.join(rootDir, "src", "lib", "data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "exercises-db.json");
  fs.writeFileSync(outPath, JSON.stringify(allExercises, null, 2), "utf-8");
  const stats = fs.statSync(outPath);
  console.log(`💾 Saved database to: ${outPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

buildExerciseDatabase().catch((err) => {
  console.error("❌ Fatal error building exercise database:", err);
  process.exit(1);
});
