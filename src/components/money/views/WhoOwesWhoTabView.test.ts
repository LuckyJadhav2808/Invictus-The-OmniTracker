import { describe, it, expect } from "vitest";
import {
  calculateDueDateStatus,
  formatReminderMessage,
} from "./WhoOwesWhoTabView";

describe("WhoOwesWhoTabView (Belanje Debt Deck & Reminder Engine)", () => {
  it("exports valid TabView component", async () => {
    const mod = await import("./WhoOwesWhoTabView");
    expect(mod.WhoOwesWhoTabView).toBeDefined();
    expect(typeof mod.WhoOwesWhoTabView).toBe("function");
  }, 15000);

  describe("calculateDueDateStatus", () => {
    it("returns null when no date provided", () => {
      expect(calculateDueDateStatus(undefined)).toBeNull();
      expect(calculateDueDateStatus("")).toBeNull();
    });

    it("identifies Due Today correctly", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const status = calculateDueDateStatus(todayStr);
      expect(status).not.toBeNull();
      expect(status?.isDueToday).toBe(true);
      expect(status?.isOverdue).toBe(false);
      expect(status?.label).toBe("Due Today");
    });

    it("identifies Overdue dates with correct day count", () => {
      // 5 days in past
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const pastStr = pastDate.toISOString().split("T")[0];

      const status = calculateDueDateStatus(pastStr);
      expect(status).not.toBeNull();
      expect(status?.isOverdue).toBe(true);
      expect(status?.isDueToday).toBe(false);
      expect(status?.label).toMatch(/Overdue by \d+d/);
    });

    it("identifies future due dates", () => {
      // 10 days in future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureStr = futureDate.toISOString().split("T")[0];

      const status = calculateDueDateStatus(futureStr);
      expect(status).not.toBeNull();
      expect(status?.isOverdue).toBe(false);
      expect(status?.isDueToday).toBe(false);
      expect(status?.label).toBe(`Due ${futureStr}`);
    });
  });

  describe("formatReminderMessage", () => {
    it("generates a polite split reminder for lent debts with UPI handle nudge", () => {
      const msg = formatReminderMessage(
        {
          id: "iou-1",
          personName: "Aarav",
          amount: 450,
          type: "lent",
          status: "pending",
          description: "Dinner at Bistro",
          dueDate: "2026-11-20",
          createdAt: new Date().toISOString(),
        },
        "₹"
      );

      expect(msg).toContain("Aarav");
      expect(msg).toContain("₹450");
      expect(msg).toContain("Dinner at Bistro");
      expect(msg).toContain("*Expected by:* 2026-11-20");
      expect(msg).toContain("UPI or Cash");
    });

    it("generates payment notice when user is paying back borrowed money", () => {
      const msg = formatReminderMessage(
        {
          id: "iou-2",
          personName: "Priya",
          amount: 1200,
          type: "borrowed",
          status: "pending",
          description: "Concert tickets",
          createdAt: new Date().toISOString(),
        },
        "$"
      );

      expect(msg).toContain("Priya");
      expect(msg).toContain("$1,200");
      expect(msg).toContain("Concert tickets");
      expect(msg).toContain("Paying you back");
    });
  });
});
