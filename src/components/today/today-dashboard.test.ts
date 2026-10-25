import { describe, it, expect } from "vitest";
import {
  getEffectiveDaypartFromHour,
  DAYPART_CONFIGS,
  EffectiveDaypart,
} from "./useTodayCockpitViewModel";

describe("Today Cockpit Dayparting Engine", () => {
  it("resolves dawn patrol for morning hours (05:00 - 11:59)", () => {
    expect(getEffectiveDaypartFromHour(5)).toBe("dawn");
    expect(getEffectiveDaypartFromHour(8)).toBe("dawn");
    expect(getEffectiveDaypartFromHour(11)).toBe("dawn");
  });

  it("resolves the forge for afternoon deep work hours (12:00 - 17:59)", () => {
    expect(getEffectiveDaypartFromHour(12)).toBe("forge");
    expect(getEffectiveDaypartFromHour(14)).toBe("forge");
    expect(getEffectiveDaypartFromHour(17)).toBe("forge");
  });

  it("resolves night fortress for evening and early dawn hours (18:00 - 04:59)", () => {
    expect(getEffectiveDaypartFromHour(18)).toBe("night");
    expect(getEffectiveDaypartFromHour(22)).toBe("night");
    expect(getEffectiveDaypartFromHour(23)).toBe("night");
    expect(getEffectiveDaypartFromHour(0)).toBe("night");
    expect(getEffectiveDaypartFromHour(3)).toBe("night");
    expect(getEffectiveDaypartFromHour(4)).toBe("night");
  });

  it("contains complete theme configurations for each daypart", () => {
    const dayparts: EffectiveDaypart[] = ["dawn", "forge", "night"];

    for (const dp of dayparts) {
      const config = DAYPART_CONFIGS[dp];
      expect(config).toBeDefined();
      expect(config.id).toBe(dp);
      expect(config.title.length).toBeGreaterThan(0);
      expect(config.greeting.length).toBeGreaterThan(0);
      expect(config.subtitle.length).toBeGreaterThan(0);
      expect(config.badgeText.length).toBeGreaterThan(0);
      expect(config.icon).toBeDefined();
    }

    // Verify Neobrutalist design tokens
    expect(DAYPART_CONFIGS.dawn.badgeBg).toContain("#CEF431"); // Electric lime
    expect(DAYPART_CONFIGS.forge.badgeBg).toContain("#C084FC"); // Lavender forge
    expect(DAYPART_CONFIGS.night.badgeBg).toContain("#161514"); // Obsidian ink
  });
});

describe("Retro Sticky Scratchpad Parsing Heuristics", () => {
  const parseTaskFromText = (content: string) => {
    const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    return lines[0].replace(/^[-*•]\s*/, "");
  };

  const parseExpenseFromText = (content: string) => {
    const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    const firstLine = lines[0];
    const match = firstLine.match(/(\d+(?:\.\d{1,2})?)/);
    const amount = match ? parseFloat(match[1]) : 0;
    const note =
      firstLine
        .replace(/(\d+(?:\.\d{1,2})?)/, "")
        .replace(/₹|\$|€|£/g, "")
        .trim() || "Quick Expense";
    return { amount, note };
  };

  it("strips bullet points and extracts clean task title", () => {
    expect(parseTaskFromText("- Buy Protein Powder\n- Call mentor")).toBe("Buy Protein Powder");
    expect(parseTaskFromText("• Finalize Hackathon Pitch")).toBe("Finalize Hackathon Pitch");
    expect(parseTaskFromText("* Review React Docs")).toBe("Review React Docs");
    expect(parseTaskFromText("")).toBeNull();
  });

  it("extracts amounts and sanitized merchant notes for 1-tap expense logging", () => {
    const res1 = parseExpenseFromText("Coffee 150");
    expect(res1).toEqual({ amount: 150, note: "Coffee" });

    const res2 = parseExpenseFromText("₹420 College Textbooks");
    expect(res2).toEqual({ amount: 420, note: "College Textbooks" });

    const res3 = parseExpenseFromText("12.50 Bus Pass");
    expect(res3).toEqual({ amount: 12.5, note: "Bus Pass" });

    const res4 = parseExpenseFromText("500");
    expect(res4).toEqual({ amount: 500, note: "Quick Expense" });
  });
});
