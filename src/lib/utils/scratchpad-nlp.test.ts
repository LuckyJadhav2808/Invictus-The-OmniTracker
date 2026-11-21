import { describe, it, expect } from "vitest";
import {
  parseThoughtLine,
  parseScratchpad,
  markLineAsConverted,
  clearConvertedLines,
} from "./scratchpad-nlp";
import { type Category } from "@/types";

describe("Scratchpad NLP AST Tokenizer Engine", () => {
  const mockCategories: Category[] = [
    {
      id: "cat_food",
      name: "Food & Dining",
      type: "expense",
      icon: "🍔",
      color: "#CEF431",
      monthlyBudget: 5000,
      archived: false,
    },
    {
      id: "cat_books",
      name: "Books & Education",
      type: "expense",
      icon: "📚",
      color: "#C084FC",
      monthlyBudget: 3000,
      archived: false,
    },
    {
      id: "cat_commute",
      name: "Transport & Commute",
      type: "expense",
      icon: "🚕",
      color: "#38BDF8",
      monthlyBudget: 2000,
      archived: false,
    },
  ];

  const baseDate = new Date("2026-10-26T10:00:00Z");

  it("extracts amount, priority, tomorrow date, category, and clean title from a natural student sentence", () => {
    const raw = "Coffee 150 with Alex tomorrow p1";
    const res = parseThoughtLine(raw, mockCategories, baseDate);

    expect(res.amount).toBe(150);
    expect(res.priority).toBe("p1");
    expect(res.dueDate).toBe("2026-10-27");
    expect(res.dueDateLabel).toBe("Tomorrow");
    expect(res.categoryName).toBe("Food & Dining");
    expect(res.categoryId).toBe("cat_food");
    expect(res.cleanTitle).toBe("Coffee with Alex");
    expect(res.type).toBe("expense");
    expect(res.isConverted).toBe(false);
  });

  it("handles relative dates correctly (today, in 3 days, day after tomorrow)", () => {
    const resToday = parseThoughtLine("Gym workout today urgent", mockCategories, baseDate);
    expect(resToday.dueDate).toBe("2026-10-26");
    expect(resToday.dueDateLabel).toBe("Today");
    expect(resToday.priority).toBe("p1");

    const resIn3Days = parseThoughtLine("Submit lab report in 3 days p2", mockCategories, baseDate);
    expect(resIn3Days.dueDate).toBe("2026-10-29");
    expect(resIn3Days.dueDateLabel).toBe("In 3d");
    expect(resIn3Days.priority).toBe("p2");

    const resDayAfter = parseThoughtLine("Physics mock test day after tomorrow", mockCategories, baseDate);
    expect(resDayAfter.dueDate).toBe("2026-10-28");
    expect(resDayAfter.dueDateLabel).toBe("In 2 days");
  });

  it("parses currency symbols and amounts cleanly", () => {
    const resRupee = parseThoughtLine("₹450 Textbooks for semester", mockCategories, baseDate);
    expect(resRupee.amount).toBe(450);
    expect(resRupee.categoryName).toBe("Books & Education");
    expect(resRupee.cleanTitle).toBe("Textbooks for semester");

    const resDollar = parseThoughtLine("Uber cab $14 to campus", mockCategories, baseDate);
    expect(resDollar.amount).toBe(14);
    expect(resDollar.categoryName).toBe("Transport & Commute");
    expect(resDollar.cleanTitle).toBe("Uber cab to campus");
  });

  it("strips bullet points (- , * , •) and cleans whitespace", () => {
    const resBullet = parseThoughtLine("- Buy whey protein 2400", mockCategories, baseDate);
    expect(resBullet.cleanTitle).toBe("Buy whey protein");
    expect(resBullet.amount).toBe(2400);

    const resStar = parseThoughtLine("• Review operating system slides", mockCategories, baseDate);
    expect(resStar.cleanTitle).toBe("Review operating system slides");
    expect(resStar.type).toBe("task");
  });

  it("parses full multi-line scratchpad and aggregates statistics", () => {
    const note = `
- Coffee 120 with Rahul tomorrow p1
• Uber 250 to station
- Finish DBMS Assignment due friday
~Old note~ (Converted ✓)
    `;

    const analysis = parseScratchpad(note, mockCategories, baseDate);

    expect(analysis.lines.length).toBe(4);
    expect(analysis.expenseCount).toBe(2);
    expect(analysis.taskCount).toBe(1);
    expect(analysis.convertedCount).toBe(1);
    expect(analysis.totalExpenseAmount).toBe(370); // 120 + 250
  });

  it("marks line as converted and cleans up converted notes", () => {
    const original = "Line 1: Buy milk\nLine 2: Coffee 150\nLine 3: Call Mom";
    const marked = markLineAsConverted(original, 1);

    expect(marked).toContain("~Line 2: Coffee 150~ (Converted ✓)");
    expect(marked).toContain("Line 1: Buy milk");

    const cleared = clearConvertedLines(marked);
    expect(cleared).not.toContain("Coffee 150");
    expect(cleared).toContain("Line 1: Buy milk");
    expect(cleared).toContain("Line 3: Call Mom");
  });

  it("identifies habit telemetry, water logging, reading pages, and workouts instead of treating them as expenses", () => {
    const resWater = parseThoughtLine("Drank 500ml water", mockCategories, baseDate);
    expect(resWater.type).toBe("habit");
    expect(resWater.habitName).toBe("Drink Water");
    expect(resWater.habitValue).toBe(500);
    expect(resWater.habitUnit).toBe("ml");
    expect(resWater.amount).toBeUndefined(); // Crucial: not ₹500!

    const resReading = parseThoughtLine("Read 25 pages today", mockCategories, baseDate);
    expect(resReading.type).toBe("habit");
    expect(resReading.habitName).toBe("Reading");
    expect(resReading.habitValue).toBe(25);
    expect(resReading.habitUnit).toBe("pages");

    const resPushups = parseThoughtLine("50 pushups done", mockCategories, baseDate);
    expect(resPushups.type).toBe("habit");
    expect(resPushups.habitValue).toBe(50);
    expect(resPushups.habitUnit).toBe("reps");

    const resColdShower = parseThoughtLine("Cold shower finished", mockCategories, baseDate);
    expect(resColdShower.type).toBe("habit");
    expect(resColdShower.habitName).toBe("Cold Shower");
  });

  it("evaluates inline math expressions in expense notes", () => {
    const resMath = parseThoughtLine("₹120+30 Coffee and cookie", mockCategories, baseDate);
    expect(resMath.type).toBe("expense");
    expect(resMath.amount).toBe(150);
  });

  it("aggregates tri-domain statistics across tasks, habits, and expenses", () => {
    const multiNote = `
- Swiggy dinner 450
- Drank 750ml water
- Finish physics report tomorrow p1
- Read 20 pages
- Metro 40
    `;
    const analysis = parseScratchpad(multiNote, mockCategories, baseDate);
    expect(analysis.expenseCount).toBe(2); // Swiggy 450, Metro 40
    expect(analysis.habitCount).toBe(2); // 750ml water, Read 20 pages
    expect(analysis.taskCount).toBe(1); // Finish physics report
    expect(analysis.totalExpenseAmount).toBe(490); // 450 + 40
  });
});
