import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "@/lib/mongodb";
import { Category } from "@/models/Category";

export interface MonthlySpendingRecord {
  month: string;
  groceries: number;
  rent: number;
  transportation: number;
  gym: number;
  utilities: number;
  healthcare: number;
  investments: number;
  savings: number;
  emi: number;
  dining: number;
  shopping: number;
  totalExpenditure: number;
  income: number;
}

let cachedSpending: MonthlySpendingRecord[] | null = null;

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

function loadSpendingRecords(): MonthlySpendingRecord[] {
  if (cachedSpending) return cachedSpending;

  try {
    const filePath = path.join(process.cwd(), "dataset", "monthly_spending_dataset_2020_2025.csv");
    if (!fs.existsSync(filePath)) {
      console.warn("monthly_spending_dataset_2020_2025.csv not found at:", filePath);
      return [];
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split(/\r?\n/);
    if (lines.length <= 1) return [];

    const items: MonthlySpendingRecord[] = [];

    // Header: Month,Groceries (₹),Rent (₹),Transportation (₹),Gym (₹),Utilities (₹),Healthcare (₹),Investments (₹),Savings (₹),EMI/Loans (₹),Dining & Entertainment (₹),Shopping & Wants (₹),Total Expenditure (₹),Income (₹)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;

      const cols = parseCSVLine(line);
      const month = cols[0] || "";
      if (!month) continue;

      items.push({
        month,
        groceries: parseFloat(cols[1]) || 0,
        rent: parseFloat(cols[2]) || 0,
        transportation: parseFloat(cols[3]) || 0,
        gym: parseFloat(cols[4]) || 0,
        utilities: parseFloat(cols[5]) || 0,
        healthcare: parseFloat(cols[6]) || 0,
        investments: parseFloat(cols[7]) || 0,
        savings: parseFloat(cols[8]) || 0,
        emi: parseFloat(cols[9]) || 0,
        dining: parseFloat(cols[10]) || 0,
        shopping: parseFloat(cols[11]) || 0,
        totalExpenditure: parseFloat(cols[12]) || 0,
        income: parseFloat(cols[13]) || 0,
      });
    }

    cachedSpending = items;
    return items;
  } catch (err) {
    console.error("Error loading monthly_spending_dataset_2020_2025.csv:", err);
    return [];
  }
}

export async function GET() {
  try {
    const records = loadSpendingRecords();

    // Typical Monthly Template Derived from Dataset Averages
    const typicalTemplate = [
      { name: "Rent & Housing", icon: "🏠", type: "expense", color: "orange", monthlyBudget: 10000 },
      { name: "Groceries & Provisions", icon: "🛒", type: "expense", color: "mint", monthlyBudget: 5500 },
      { name: "Transportation & Fuel", icon: "🚗", type: "expense", color: "sky", monthlyBudget: 2500 },
      { name: "Utilities & Wifi", icon: "⚡", type: "expense", color: "yellow", monthlyBudget: 1800 },
      { name: "Gym & Health", icon: "🏋️", type: "expense", color: "rose", monthlyBudget: 900 },
      { name: "Dining & Outings", icon: "🍕", type: "expense", color: "coral", monthlyBudget: 2800 },
      { name: "Shopping & Wants", icon: "🛍️", type: "expense", color: "lavender", monthlyBudget: 1800 },
      { name: "Healthcare & Meds", icon: "🩺", type: "expense", color: "rose", monthlyBudget: 1500 },
      { name: "SIP Investments", icon: "📈", type: "expense", color: "mint", monthlyBudget: 4800 },
      { name: "Emergency Savings", icon: "💰", type: "expense", color: "emerald", monthlyBudget: 5000 },
    ];

    return NextResponse.json({
      success: true,
      totalMonths: records.length,
      records,
      typicalTemplate,
    });
  } catch (err: any) {
    console.error("Spending API error:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch spending records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId = "guest" } = await req.json();

    const typicalTemplate = [
      { name: "Rent & Housing", icon: "🏠", type: "expense", color: "orange", monthlyBudget: 10000 },
      { name: "Groceries & Provisions", icon: "🛒", type: "expense", color: "mint", monthlyBudget: 5500 },
      { name: "Transportation & Fuel", icon: "🚗", type: "expense", color: "sky", monthlyBudget: 2500 },
      { name: "Utilities & Wifi", icon: "⚡", type: "expense", color: "yellow", monthlyBudget: 1800 },
      { name: "Gym & Health", icon: "🏋️", type: "expense", color: "rose", monthlyBudget: 900 },
      { name: "Dining & Outings", icon: "🍕", type: "expense", color: "coral", monthlyBudget: 2800 },
      { name: "Shopping & Wants", icon: "🛍️", type: "expense", color: "lavender", monthlyBudget: 1800 },
      { name: "Healthcare & Meds", icon: "🩺", type: "expense", color: "rose", monthlyBudget: 1500 },
      { name: "SIP Investments", icon: "📈", type: "expense", color: "mint", monthlyBudget: 4800 },
      { name: "Emergency Savings", icon: "💰", type: "expense", color: "emerald", monthlyBudget: 5000 },
    ];

    if (userId !== "guest") {
      await connectToDatabase();
      for (const item of typicalTemplate) {
        await Category.findOneAndUpdate(
          { userId, name: item.name },
          { ...item, userId, isTemplate: true, templatePackId: "monthly-spending-template" },
          { upsert: true, returnDocument: "after" }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Applied 1-Click Monthly Budget Template successfully!",
      template: typicalTemplate,
    });
  } catch (err: any) {
    console.error("Apply template API error:", err);
    return NextResponse.json({ error: err?.message || "Failed to apply budget template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user-admin-default";

    if (userId !== "guest") {
      await connectToDatabase();
      // Safely remove only categories created by the 1-click monthly spending template
      await Category.deleteMany({
        userId,
        templatePackId: "monthly-spending-template",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Unapplied 1-Click Monthly Budget Template successfully!",
    });
  } catch (err: any) {
    console.error("Unapply template API error:", err);
    return NextResponse.json({ error: err?.message || "Failed to unapply budget template" }, { status: 500 });
  }
}
