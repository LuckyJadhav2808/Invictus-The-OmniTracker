import { describe, it, expect } from "vitest";
import { detectCategoryFromNoteAsync } from "./merchant-categorizer";

describe("detectCategoryFromNoteAsync multi-tier classification", () => {
  const sampleCategories = [
    { id: "cat-food", name: "Food & Dining", description: "Meals, restaurants, cafes, snacks, delivery" },
    { id: "cat-gym", name: "Gym & Fitness", description: "Workout, supplements, protein, gym fees, training" },
    { id: "cat-travel", name: "Travel & Commute", description: "Metro, cab, fuel, bus, flights" },
  ];

  it("resolves instant keyword match synchronously first", async () => {
    const result = await detectCategoryFromNoteAsync("Swiggy Biryani Dinner", sampleCategories);
    expect(result).not.toBeNull();
    expect(result?.categoryId).toBe("cat-food");
    expect(result?.matchType).toBe("keyword");
  });

  it("resolves direct category match cleanly", async () => {
    const result = await detectCategoryFromNoteAsync("Gym fee for November", sampleCategories);
    expect(result).not.toBeNull();
    expect(result?.categoryId).toBe("cat-gym");
    expect(result?.matchType).toBe("direct");
  });

  it("handles unknown text safely without throwing in node environment", async () => {
    const result = await detectCategoryFromNoteAsync("RandomGibberishXYZ123", sampleCategories);
    expect(result).toBeNull();
  });
});
