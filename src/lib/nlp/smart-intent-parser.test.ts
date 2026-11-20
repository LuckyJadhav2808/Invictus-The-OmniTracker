import { describe, it, expect } from "vitest";
import { parseSmartIntent, parseTaskIntent } from "./smart-intent-parser";

describe("Smart Intent Parser (compromise + chrono-node)", () => {
  describe("Money Expense Intent", () => {
    it("correctly parses expense with amount and merchant", () => {
      const res = parseSmartIntent("Paid Rahul 450 for lunch yesterday");
      expect(res.domain).toBe("MONEY_EXPENSE");
      expect(res.expense).toBeDefined();
      expect(res.expense?.amount).toBe(450);
      expect(res.expense?.category).toBe("Food");
      expect(res.expense?.currency).toBe("INR");
    });

    it("parses currency symbols and amounts", () => {
      const res1 = parseSmartIntent("₹1,200 groceries at supermarket");
      expect(res1.domain).toBe("MONEY_EXPENSE");
      expect(res1.expense?.amount).toBe(1200);
      expect(res1.expense?.category).toBe("Food");

      const res2 = parseSmartIntent("$45 for Uber cab to airport");
      expect(res2.domain).toBe("MONEY_EXPENSE");
      expect(res2.expense?.amount).toBe(45);
      expect(res2.expense?.currency).toBe("USD");
      expect(res2.expense?.category).toBe("Travel");
    });

    it("detects education category from keywords", () => {
      const res = parseSmartIntent("₹350 stationery and books");
      expect(res.domain).toBe("MONEY_EXPENSE");
      expect(res.expense?.category).toBe("Education");
    });

    it("detects income domain from salary keywords", () => {
      const res = parseSmartIntent("Received ₹15000 stipend from company");
      expect(res.domain).toBe("MONEY_EXPENSE");
      expect(res.expense?.category).toBe("Income");
    });
  });

  describe("Habit Routine Intent", () => {
    it("correctly parses daily habits with routine time zones", () => {
      const res = parseSmartIntent("Read 20 pages Stoicism every morning at 7am");
      expect(res.domain).toBe("HABIT_ROUTINE");
      expect(res.habit).toBeDefined();
      expect(res.habit?.title).toContain("Read 20 pages");
      expect(res.habit?.zone).toBe("morning");
      expect(res.habit?.reminderTime).toBe("7:00 AM");
    });

    it("parses evening habits", () => {
      const res = parseSmartIntent("Digital sunset and sleep by 10:30pm every night");
      expect(res.domain).toBe("HABIT_ROUTINE");
      expect(res.habit?.zone).toBe("evening");
      expect(res.habit?.reminderTime).toBe("10:30 PM");
    });
  });

  describe("Task Intent", () => {
    it("correctly parses action items with deadlines", () => {
      const res = parseSmartIntent("Finish pitch deck by tomorrow 5pm");
      expect(res.domain).toBe("TASK");
      expect(res.task).toBeDefined();
      expect(res.task?.title).toContain("Finish pitch deck");
      expect(res.task?.dueDate).toBeDefined();
      expect(res.task?.dueTime).toBe("5:00 PM");
    });

    it("identifies urgent priority", () => {
      const res = parseSmartIntent("Submit assignment ASAP urgent");
      expect(res.domain).toBe("TASK");
      expect(res.task?.priority).toBe("high");
    });
  });
});

describe("parseTaskIntent (NLP-powered task auto-fill)", () => {
  it("extracts due date and time from natural language", () => {
    const res = parseTaskIntent("Deploy auth API by tomorrow 5pm");
    expect(res.cleanTitle).toContain("Deploy auth API");
    expect(res.dueDate).toBeDefined();
    expect(res.dueTime).toBe("17:00");
    expect(res.projectTag).toBe("Dev");
  });

  it("detects P1 urgency from keywords", () => {
    const res = parseTaskIntent("Fix production bug ASAP urgent blocker");
    expect(res.priority).toBe("p1");
    expect(res.projectTag).toBe("Dev");
  });

  it("detects P3 low-priority from keywords", () => {
    const res = parseTaskIntent("Clean desk sometime later low priority");
    expect(res.priority).toBe("p3");
  });

  it("detects Study project tag from academic keywords", () => {
    const res = parseTaskIntent("Revise OS notes for exam");
    expect(res.projectTag).toBe("Study");
  });

  it("detects Health project tag from fitness keywords", () => {
    const res = parseTaskIntent("Go to gym and do leg workout");
    expect(res.projectTag).toBe("Health");
  });

  it("detects Work project tag from professional keywords", () => {
    const res = parseTaskIntent("Prepare presentation for client meeting");
    expect(res.projectTag).toBe("Work");
  });
});
