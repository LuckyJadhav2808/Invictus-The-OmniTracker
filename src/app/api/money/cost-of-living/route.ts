import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface CostOfLivingCountryItem {
  rank: number;
  country: string;
  costOfLivingIndex: number;
  rentIndex: number;
  costOfLivingPlusRentIndex: number;
  groceriesIndex: number;
  restaurantIndex: number;
  purchasingPowerIndex: number;
}

let cachedCountries: CostOfLivingCountryItem[] | null = null;

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

function loadCountries(): CostOfLivingCountryItem[] {
  if (cachedCountries) return cachedCountries;

  try {
    const filePath = path.join(process.cwd(), "dataset", "Cost_of_Living_Index_by_Country_2024.csv");
    if (!fs.existsSync(filePath)) {
      console.warn("Cost_of_Living_Index_by_Country_2024.csv not found at:", filePath);
      return [];
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split(/\r?\n/);
    if (lines.length <= 1) return [];

    const items: CostOfLivingCountryItem[] = [];

    // Header: Rank,Country,Cost of Living Index,Rent Index,Cost of Living Plus Rent Index,Groceries Index,Restaurant Price Index,Local Purchasing Power Index
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;

      const cols = parseCSVLine(line);
      const rank = parseInt(cols[0] || "0", 10);
      const country = cols[1] || "";
      if (!country) continue;

      const costOfLivingIndex = parseFloat(cols[2]) || 0;
      const rentIndex = parseFloat(cols[3]) || 0;
      const costOfLivingPlusRentIndex = parseFloat(cols[4]) || 0;
      const groceriesIndex = parseFloat(cols[5]) || 0;
      const restaurantIndex = parseFloat(cols[6]) || 0;
      const purchasingPowerIndex = parseFloat(cols[7]) || 0;

      items.push({
        rank,
        country,
        costOfLivingIndex,
        rentIndex,
        costOfLivingPlusRentIndex,
        groceriesIndex,
        restaurantIndex,
        purchasingPowerIndex,
      });
    }

    cachedCountries = items;
    return items;
  } catch (err) {
    console.error("Error loading Cost_of_Living_Index_by_Country_2024.csv:", err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryQuery = (searchParams.get("country") || "").toLowerCase().trim();

    const allCountries = loadCountries();

    if (countryQuery) {
      const found = allCountries.find(
        (c) => c.country.toLowerCase() === countryQuery || c.country.toLowerCase().includes(countryQuery)
      );
      return NextResponse.json({
        success: true,
        countryData: found || null,
        allCountries: allCountries.map((c) => c.country),
      });
    }

    return NextResponse.json({
      success: true,
      totalCount: allCountries.length,
      countries: allCountries,
    });
  } catch (err: any) {
    console.error("Cost of living API error:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch cost of living data" }, { status: 500 });
  }
}
