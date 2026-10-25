import { describe, it, expect, beforeEach } from "vitest";
import {
  computeHorizonDays,
  getDaySealStatus,
  sealDayLedger,
} from "./useTodayCockpitViewModel";
import { format } from "date-fns";

describe("Today Dashboard Production Enhancements", () => {
  beforeEach(() => {
    // Clear mock localStorage
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  describe("Option 1: 7-Day Horizon Strip Derivations", () => {
    it("generates exactly 7 days centered around anchor date", () => {
      const anchor = new Date("2026-10-25T12:00:00Z");
      const selectedStr = "2026-10-25";
      const horizon = computeHorizonDays(anchor, selectedStr);

      expect(horizon).toHaveLength(7);
      // Center item (index 3) should be the anchor
      expect(horizon[3].dateStr).toBe("2026-10-25");
      expect(horizon[3].isSelected).toBe(true);

      // First item (index 0) is -3 days: 2026-10-22
      expect(horizon[0].dateStr).toBe("2026-10-22");
      expect(horizon[0].isSelected).toBe(false);

      // Last item (index 6) is +3 days: 2026-10-28
      expect(horizon[6].dateStr).toBe("2026-10-28");
      expect(horizon[6].isSelected).toBe(false);
    });

    it("marks completed dates accurately when provided with a completion set", () => {
      const anchor = new Date("2026-10-25T12:00:00Z");
      const completedSet = new Set(["2026-10-23", "2026-10-25"]);
      const horizon = computeHorizonDays(anchor, "2026-10-25", completedSet);

      const day23 = horizon.find((d) => d.dateStr === "2026-10-23");
      const day24 = horizon.find((d) => d.dateStr === "2026-10-24");
      const day25 = horizon.find((d) => d.dateStr === "2026-10-25");

      expect(day23?.isCompleted).toBe(true);
      expect(day24?.isCompleted).toBe(false);
      expect(day25?.isCompleted).toBe(true);
    });

    it("correctly identifies the actual today date", () => {
      const now = new Date();
      const todayStr = format(now, "yyyy-MM-dd");
      const horizon = computeHorizonDays(now, todayStr);

      const centerItem = horizon[3];
      expect(centerItem.isToday).toBe(true);
      expect(centerItem.isSelected).toBe(true);
    });
  });

  describe("Option 2: Day Sealing & Closeout Persistence", () => {
    it("returns unsealed status initially", () => {
      const status = getDaySealStatus("2026-10-25");
      expect(status.isSealed).toBe(false);
    });

    it("seals a day with score and timestamp in local storage", () => {
      const result = sealDayLedger("2026-10-25", 84);
      expect(result.isSealed).toBe(true);
      expect(result.score).toBe(84);
      expect(result.sealedAt).toBeDefined();

      const retrieved = getDaySealStatus("2026-10-25");
      expect(retrieved.isSealed).toBe(true);
      expect(retrieved.score).toBe(84);
      expect(retrieved.sealedAt).toBe(result.sealedAt);
    });
  });
});
