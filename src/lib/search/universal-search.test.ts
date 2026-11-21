import { describe, it, expect } from "vitest";
import { createUniversalIndex } from "./universal-search";

interface TestTask {
  id: string;
  title: string;
  projectTag: string;
  notes?: string;
}

describe("Universal Client-Side Search Engine (MiniSearch)", () => {
  const sampleTasks: TestTask[] = [
    { id: "1", title: "Ship API Endpoint", projectTag: "Dev", notes: "Express and Next.js" },
    { id: "2", title: "Study Operating Systems Virtual Memory", projectTag: "Study", notes: "Page tables and TLB" },
    { id: "3", title: "Buy groceries and cold pressed juice", projectTag: "Life", notes: "Trader Joe's or Whole Foods" },
    { id: "4", title: "Chest and Tricep hypertrophy session", projectTag: "Health", notes: "Incline bench and dips" },
  ];

  it("indexes items and performs exact match", () => {
    const index = createUniversalIndex(sampleTasks, {
      fields: ["title", "projectTag", "notes"],
    });

    const results = index.search("Operating Systems");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("2");
  });

  it("handles prefix matching for dynamic search-as-you-type", () => {
    const index = createUniversalIndex(sampleTasks, {
      fields: ["title", "projectTag", "notes"],
    });

    const results = index.search("oper");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].title).toContain("Operating Systems");
  });

  it("handles fuzzy typo tolerance gracefully", () => {
    const index = createUniversalIndex(sampleTasks, {
      fields: ["title", "projectTag", "notes"],
      fuzzy: 0.2,
    });

    // Typo: "grocries" instead of "groceries"
    const results = index.search("grocries");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe("3");
  });

  it("returns all items when query is empty", () => {
    const index = createUniversalIndex(sampleTasks, {
      fields: ["title", "projectTag"],
    });

    const results = index.search("");
    expect(results).toHaveLength(4);
  });

  it("updates index dynamically when items change", () => {
    const index = createUniversalIndex(sampleTasks, {
      fields: ["title", "projectTag"],
    });

    index.setItems([
      { id: "99", title: "New Dynamic Task", projectTag: "Dev" },
    ]);

    expect(index.count()).toBe(1);
    const searchRes = index.search("Dynamic");
    expect(searchRes).toHaveLength(1);
    expect(searchRes[0].id).toBe("99");
  });
});
