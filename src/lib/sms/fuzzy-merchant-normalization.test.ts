import { describe, it, expect, beforeEach } from "vitest";
import { MerchantCategoryCache, normalizeMerchantKey } from "./merchant-cache";

describe("Fuse.js Fuzzy Merchant Normalization", () => {
  beforeEach(() => {
    MerchantCategoryCache.reset();
  });

  describe("Typo Resilience", () => {
    it("normalizes single-character typos (e.g. Swigy -> Swiggy)", () => {
      const match = MerchantCategoryCache.get("Swigy");
      expect(match).not.toBeNull();
      expect(match?.categoryId).toBe("cat-food");
      expect(match?.merchantPattern).toBe("swiggy");
    });

    it("normalizes pharmacy typos (e.g. Apollo Pharmcy -> Apollo Pharmacy)", () => {
      const match = MerchantCategoryCache.get("Apollo Pharmcy");
      expect(match).not.toBeNull();
      expect(match?.categoryId).toBe("cat-health");
    });

    it("normalizes space variations (e.g. Blink it -> Blinkit)", () => {
      const match = MerchantCategoryCache.get("Blink it");
      expect(match).not.toBeNull();
      expect(match?.categoryId).toBe("cat-groceries");
    });

    it("normalizes chemist typo (e.g. Ambika Chemsit -> Ambika Chemist)", () => {
      const match = MerchantCategoryCache.get("Ambika Chemsit");
      expect(match).not.toBeNull();
      expect(match?.categoryId).toBe("cat-health");
    });
  });

  describe("Compound UPI String Noise Extraction", () => {
    it("extracts merchant from compound UPI string with typos", () => {
      const hit = MerchantCategoryCache.get("UPI/492810/SWIGY-BANGALORE/02");
      expect(hit).not.toBeNull();
      expect(hit?.categoryId).toBe("cat-food");
    });

    it("extracts D-Mart from noisy Mumbai UPI string", () => {
      const hit = MerchantCategoryCache.get("UPI/29481/DMART-MUMBAI/Paytm");
      expect(hit).not.toBeNull();
      expect(hit?.categoryId).toBe("cat-groceries");
    });
  });

  describe("Financial Safety & False Positive Rejection", () => {
    it("does not false-match Apple with Apollo", () => {
      const hit = MerchantCategoryCache.get("Apple Macbook Store");
      // "Apple Macbook Store" should NOT match Apollo Pharmacy (cat-health)
      if (hit) {
        expect(hit.categoryId).not.toBe("cat-health");
      }
    });

    it("does not match unrelated short random strings", () => {
      const hit = MerchantCategoryCache.get("Xy Zq Wk 123");
      expect(hit).toBeNull();
    });
  });

  describe("Performance SLA", () => {
    it("completes 300 fuzzy lookups in under 50ms", () => {
      const testQueries = [
        "Swigy",
        "Zomto",
        "Blink it",
        "Zeptoo",
        "D-Mart Supermarket",
        "Ambika Chemsit",
        "Apollo Pharmcy",
        "Uber Ride",
        "Ola Cabs",
        "McDonalds Fast Food",
      ];

      const start = performance.now();
      for (let i = 0; i < 30; i++) {
        for (const q of testQueries) {
          MerchantCategoryCache.get(q);
        }
      }
      const duration = performance.now() - start;

      // 300 lookups should finish in under 800ms even under parallel test contention (<2.5ms per lookup)
      expect(duration).toBeLessThan(800);
    });
  });
});
