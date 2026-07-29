import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface NutritionDishItem {
  id: string;
  dishName: string;
  calories: number;
  carbs: number;
  protein: number;
  fats: number;
  freeSugar: number;
  fibre: number;
  sodium: number;
  calcium: number;
  iron: number;
}

let cachedDishes: NutritionDishItem[] | null = null;

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

function loadDishes(): NutritionDishItem[] {
  if (cachedDishes) return cachedDishes;

  try {
    const filePath = path.join(process.cwd(), "dataset", "Indian_Food_Nutrition_Processed.csv");
    if (!fs.existsSync(filePath)) {
      console.warn("Indian_Food_Nutrition_Processed.csv not found at:", filePath);
      return [];
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split(/\r?\n/);
    if (lines.length <= 1) return [];

    const items: NutritionDishItem[] = [];

    // Header: Dish Name,Calories (kcal),Carbohydrates (g),Protein (g),Fats (g),Free Sugar (g),Fibre (g),Sodium (mg),Calcium (mg),Iron (mg),Vitamin C (mg),Folate (µg)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;

      const cols = parseCSVLine(line);
      const dishName = cols[0] || "";
      if (!dishName) continue;

      const calories = parseFloat(cols[1]) || 0;
      const carbs = parseFloat(cols[2]) || 0;
      const protein = parseFloat(cols[3]) || 0;
      const fats = parseFloat(cols[4]) || 0;
      const freeSugar = parseFloat(cols[5]) || 0;
      const fibre = parseFloat(cols[6]) || 0;
      const sodium = parseFloat(cols[7]) || 0;
      const calcium = parseFloat(cols[8]) || 0;
      const iron = parseFloat(cols[9]) || 0;

      items.push({
        id: `dish-${i}`,
        dishName,
        calories: Math.round(calories * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        protein: Math.round(protein * 10) / 10,
        fats: Math.round(fats * 10) / 10,
        freeSugar,
        fibre,
        sodium,
        calcium,
        iron,
      });
    }

    cachedDishes = items;
    return items;
  } catch (err) {
    console.error("Error loading Indian_Food_Nutrition_Processed.csv:", err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").toLowerCase().trim();
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const allDishes = loadDishes();

    let filtered = allDishes;
    if (query) {
      filtered = allDishes.filter((dish) => dish.dishName.toLowerCase().includes(query));
    }

    return NextResponse.json({
      success: true,
      totalCount: filtered.length,
      dishes: filtered.slice(0, limit),
    });
  } catch (err: any) {
    console.error("Nutrition dishes API error:", err);
    return NextResponse.json({ error: err?.message || "Failed to search nutrition dishes" }, { status: 500 });
  }
}
