import { describe, it, expect, beforeEach } from "vitest";
import { MerchantCategoryCache, normalizeMerchantKey } from "./merchant-cache";

describe("MerchantCategoryCache & 3-Tier Fuzzy Matcher", () => {
  beforeEach(() => {
    MerchantCategoryCache.reset();
  });

  it("normalizes merchant strings cleanly", () => {
    expect(normalizeMerchantKey("  D-Mart Supermarket!!  ")).toBe("d mart supermarket");
    expect(normalizeMerchantKey("SWIGGY*BANGALORE")).toBe("swiggy bangalore");
  });

  it("returns pre-seeded merchants in Tier 1 exact match", () => {
    const swiggy = MerchantCategoryCache.get("swiggy");
    expect(swiggy).toBeDefined();
    expect(swiggy?.categoryId).toBe("cat-food");

    const dmart = MerchantCategoryCache.get("dmart");
    expect(dmart?.categoryId).toBe("cat-groceries");
  });

  it("matches messy UPI strings using Tier 2 token boundary matching", () => {
    // "UPI/2349102/DMART KANDIVALI/Paytm" contains token "dmart"
    const hit = MerchantCategoryCache.get("DMART KANDIVALI");
    expect(hit).toBeDefined();
    expect(hit?.categoryId).toBe("cat-groceries");

    const ambika = MerchantCategoryCache.get("Ambika Chemist thru UPI");
    expect(ambika).toBeDefined();
    expect(ambika?.categoryId).toBe("cat-health");
  });

  it("allows users to teach and override merchant mappings", () => {
    MerchantCategoryCache.set("Gupta General Store", "cat-groceries", "Groceries", true);
    const hit = MerchantCategoryCache.get("Gupta General Store");
    expect(hit).toBeDefined();
    expect(hit?.categoryId).toBe("cat-groceries");
    expect(hit?.isUserDefined).toBe(true);

    // Override an existing merchant
    MerchantCategoryCache.set("starbucks", "cat-leisure", "Leisure & Fun", true);
    const starbucks = MerchantCategoryCache.get("starbucks");
    expect(starbucks?.categoryId).toBe("cat-leisure");
  });

  it("partitions bulk merchants into cached vs uncached lists", () => {
    const list = ["swiggy", "Unknown Chai Stall 123", "blinkit", "Random Shop XYZ"];
    const { cached, uncached } = MerchantCategoryCache.partition(list);

    expect(cached["swiggy"]).toBeDefined();
    expect(cached["blinkit"]).toBeDefined();
    expect(uncached).toContain("Unknown Chai Stall 123");
    expect(uncached).toContain("Random Shop XYZ");
  });

  it("increments match counts and sorts user-defined rules to top", () => {
    MerchantCategoryCache.set("Tapri Chai", "cat-food", "Food & Dining", true);
    MerchantCategoryCache.incrementMatch("Tapri Chai");
    MerchantCategoryCache.incrementMatch("Tapri Chai");

    const rules = MerchantCategoryCache.getAllRules();
    const tapri = rules.find((r) => r.merchantPattern === "tapri chai");
    expect(tapri).toBeDefined();
    expect(tapri?.matchCount).toBeGreaterThanOrEqual(3);
    expect(rules[0].isUserDefined).toBe(true);
  });
});
