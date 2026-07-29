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
}

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
    if (!fs.existsSync(filePath)) {
      console.warn("megaGymDataset.csv not found at:", filePath);
      return [];
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split(/\r?\n/);
    if (lines.length <= 1) return [];

    const items: GymExerciseItem[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;

      const cols = parseCSVLine(line);
      // Header: ,Title,Desc,Type,BodyPart,Equipment,Level,Rating,RatingDesc
      const indexStr = cols[0] || String(i);
      const title = cols[1] || "";
      const desc = cols[2] || "";
      const type = cols[3] || "Strength";
      const bodyPart = cols[4] || "Full Body";
      const equipment = cols[5] || "Other";
      const level = cols[6] || "Intermediate";
      const rating = cols[7] || "";

      if (title) {
        items.push({
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

    cachedExercises = items;
    return items;
  } catch (err) {
    console.error("Error loading megaGymDataset.csv:", err);
    return [];
  }
}

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
      filtered = filtered.filter(
        (ex) =>
          ex.title.toLowerCase().includes(query) ||
          ex.bodyPart.toLowerCase().includes(query) ||
          ex.equipment.toLowerCase().includes(query) ||
          ex.desc.toLowerCase().includes(query)
      );
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

    // Return unique muscle groups and equipment lists alongside results for easy filtering
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
