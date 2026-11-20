import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isDuplicateToast,
  getDynamicStrobiQuip,
  strobiToast,
  showToast,
  STROBI_PAGE_QUIPS,
} from "./toasts";

describe("Toast Harmonisation & Strobi Intelligence Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Edge Case Deduplication (Rapid-fire spam protection)", () => {
    it("permits initial toast and blocks identical duplicate within cooldown", () => {
      const key = "test-dedupe-key-1";
      expect(isDuplicateToast(key, 1000)).toBe(false);
      // Immediate repeat should be suppressed
      expect(isDuplicateToast(key, 1000)).toBe(true);
    });

    it("allows different toast keys simultaneously without collision", () => {
      const keyA = "action-a";
      const keyB = "action-b";
      expect(isDuplicateToast(keyA, 1000)).toBe(false);
      expect(isDuplicateToast(keyB, 1000)).toBe(false);
    });
  });

  describe("Dynamic Contextual Classifier (getDynamicStrobiQuip)", () => {
    it("classifies gym and workout activities into fitness quip", async () => {
      const res = await getDynamicStrobiQuip("Heavy deadlift 140kg at gym", "habits");
      expect(res.gear).toBe("fitness");
      expect(res.expression).toBe("fire");
      expect(res.quip).toContain("Iron sharpens iron");
    });

    it("classifies study, dev, and code into intellectual focus quip", async () => {
      const res = await getDynamicStrobiQuip("Complete Next.js auth refactor code", "tasks");
      expect(res.gear).toBe("study");
      expect(res.expression).toBe("focus");
      expect(res.quip).toContain("Deep work focus");
    });

    it("classifies financial savings and budgeting into money celebration", async () => {
      const res = await getDynamicStrobiQuip("Saved 30% of monthly salary into mutual funds", "money");
      expect(res.gear).toBe("money");
      expect(res.expression).toBe("celebrate");
      expect(res.quip).toContain("Wealth discipline");
    });

    it("classifies hydration and wellbeing into vitality quip", async () => {
      const res = await getDynamicStrobiQuip("Drank 1000ml water bottle", "today");
      expect(res.gear).toBe("gladiator");
      expect(res.expression).toBe("happy");
      expect(res.quip).toContain("Vitality recharged");
    });

    it("falls back gracefully to page context quip for general messages", async () => {
      const res = await getDynamicStrobiQuip("Quick miscellaneous check", "today");
      expect(STROBI_PAGE_QUIPS.today).toContain(res.quip);
      expect(res.gear).toBe("gladiator");
    });
  });

  describe("Strobi Toast API Surface", () => {
    it("exposes all page-specific and utility methods", () => {
      expect(typeof strobiToast.today).toBe("function");
      expect(typeof strobiToast.habits).toBe("function");
      expect(typeof strobiToast.tasks).toBe("function");
      expect(typeof strobiToast.money).toBe("function");
      expect(typeof strobiToast.success).toBe("function");
      expect(typeof strobiToast.error).toBe("function");
      expect(typeof strobiToast.dynamic).toBe("function");
      expect(typeof strobiToast.promise).toBe("function");
      expect(typeof strobiToast.dismiss).toBe("function");
    });

    it("preserves backward compatibility with showToast", () => {
      expect(typeof showToast.success).toBe("function");
      expect(typeof showToast.error).toBe("function");
      expect(typeof showToast.info).toBe("function");
      expect(typeof showToast.warning).toBe("function");
    });
  });
});
