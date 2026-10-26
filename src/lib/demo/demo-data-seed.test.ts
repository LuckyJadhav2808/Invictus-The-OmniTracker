import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateEvaluatorDemoDataset,
  loadEvaluatorDemoData,
  clearEvaluatorDemoData,
  isDemoDataActive,
  DEMO_DATA_FLAG_KEY,
} from "./demo-data-seed";

describe("Evaluator Demo Data Seed Engine", () => {
  // In-memory mock storage for localStorage in jsdom / node test runner
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};

    const mockLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = String(value);
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
      key: vi.fn((index: number) => Object.keys(mockStorage)[index] ?? null),
      get length() {
        return Object.keys(mockStorage).length;
      },
    };

    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.stubGlobal("window", { localStorage: mockLocalStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("generateEvaluatorDemoDataset()", () => {
    it("generates an exhaustive dataset with dynamic relative timestamps", () => {
      const data = generateEvaluatorDemoDataset();

      expect(data).toBeDefined();
      expect(data.todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(data.currentMonthKey).toMatch(/^\d{4}-\d{2}$/);

      // 1. Tasks
      expect(data.tasks.length).toBeGreaterThanOrEqual(6);
      const inProgressTask = data.tasks.find((t) => t.status === "in_progress");
      expect(inProgressTask).toBeDefined();
      expect(inProgressTask?.projectTag).toBe("Engineering");
      expect(inProgressTask?.subtasks.length).toBeGreaterThan(0);

      // 2. Habits
      expect(data.habits.length).toBeGreaterThanOrEqual(6);
      expect(Object.keys(data.habitLogs).length).toBeGreaterThan(0);
      expect(Object.keys(data.streaks).length).toBeGreaterThan(0);

      // 3. Iron Arena & Macro Forge
      expect(data.gymRoutines.length).toBeGreaterThanOrEqual(3); // Push, Pull, Legs
      const pushDay = data.gymRoutines.find((r) => r.title.toLowerCase().includes("push"));
      expect(pushDay).toBeDefined();
      expect(pushDay?.exercises.length).toBeGreaterThan(0);
      expect(pushDay?.exercises[0].sets.length).toBeGreaterThan(0);

      expect(data.nutritionTargets.calories).toBe(2400);
      expect(data.mealPlans.length).toBe(4);

      // 4. Study Space
      expect(data.subjects.length).toBe(3);
      expect(data.topics.length).toBe(5);
      expect(data.studySessions.length).toBeGreaterThanOrEqual(3);
      expect(data.tests.length).toBe(2);

      // 5. Money Space
      expect(data.categories.length).toBeGreaterThanOrEqual(8);
      expect(data.transactions.length).toBeGreaterThanOrEqual(14);
      const cashTx = data.transactions.find((tx) => tx.paymentMethod?.toLowerCase() === "cash");
      const upiTx = data.transactions.find((tx) => tx.paymentMethod?.toLowerCase() === "upi");
      expect(cashTx).toBeDefined();
      expect(upiTx).toBeDefined();
      expect(data.debts.length).toBeGreaterThanOrEqual(2);
      expect(data.savingsGoals.length).toBeGreaterThanOrEqual(2);
      expect(data.subscriptions.length).toBeGreaterThanOrEqual(3);

      // 6. Scratchpad
      expect(data.scratchpadContent).toContain("# ⚡ FOUNDER & STUDENT RADAR");
      expect(data.scratchpadContent).toContain("Deploy Next.js RSC");
      expect(data.scratchpadContent).toContain("₹180");
    });
  });

  describe("loadEvaluatorDemoData()", () => {
    it("populates all workspace keys and flags demo data as active", () => {
      const result = loadEvaluatorDemoData();

      expect(result).toBe(true);
      expect(isDemoDataActive()).toBe(true);
      expect(mockStorage[DEMO_DATA_FLAG_KEY]).toBe("true");

      // Verify core workspace keys are populated with valid JSON
      expect(mockStorage["invictus_tasks_db"]).toBeDefined();
      expect(JSON.parse(mockStorage["invictus_tasks_db"]).length).toBeGreaterThan(0);

      expect(mockStorage["invictus_habits"]).toBeDefined();
      expect(mockStorage["invictus_gym_routines"]).toBeDefined();
      expect(mockStorage["invictus_nutrition_targets"]).toBeDefined();
      expect(mockStorage["invictus_meal_plans"]).toBeDefined();
      expect(mockStorage["invictus_subjects"]).toBeDefined();
      expect(mockStorage["invictus_topics"]).toBeDefined();
      expect(mockStorage["invictus_study_sessions"]).toBeDefined();
      expect(mockStorage["invictus_tests"]).toBeDefined();
      expect(mockStorage["invictus_categories"]).toBeDefined();
      expect(mockStorage["invictus_transactions"]).toBeDefined();
      expect(mockStorage["invictus_debts"]).toBeDefined();
      expect(mockStorage["invictus_savings_goals"]).toBeDefined();
      expect(mockStorage["invictus_subscriptions"]).toBeDefined();
      expect(mockStorage["invictus_sticky_scratchpad"]).toBeDefined();

      // Verify guest session flags
      expect(mockStorage["invictus_guest_mode"]).toBe("true");
      expect(mockStorage["invictus_onboarded"]).toBe("true");
      expect(mockStorage["invictus_guest_name"]).toContain("Alex Vance");
    });
  });

  describe("clearEvaluatorDemoData()", () => {
    it("wipes all showcase records while preserving the guest session credentials", () => {
      // First load demo data
      loadEvaluatorDemoData();
      expect(isDemoDataActive()).toBe(true);
      expect(mockStorage["invictus_tasks_db"]).toBeDefined();

      // Clear demo data
      const result = clearEvaluatorDemoData();
      expect(result).toBe(true);

      // Demo data should no longer be active
      expect(isDemoDataActive()).toBe(false);
      expect(mockStorage[DEMO_DATA_FLAG_KEY]).toBeUndefined();

      // Workspace records must be wiped
      expect(mockStorage["invictus_tasks_db"]).toBeUndefined();
      expect(mockStorage["invictus_habits"]).toBeUndefined();
      expect(mockStorage["invictus_gym_routines"]).toBeUndefined();
      expect(mockStorage["invictus_nutrition_targets"]).toBeUndefined();
      expect(mockStorage["invictus_meal_plans"]).toBeUndefined();
      expect(mockStorage["invictus_subjects"]).toBeUndefined();
      expect(mockStorage["invictus_topics"]).toBeUndefined();
      expect(mockStorage["invictus_study_sessions"]).toBeUndefined();
      expect(mockStorage["invictus_tests"]).toBeUndefined();
      expect(mockStorage["invictus_categories"]).toBeUndefined();
      expect(mockStorage["invictus_transactions"]).toBeUndefined();
      expect(mockStorage["invictus_debts"]).toBeUndefined();
      expect(mockStorage["invictus_savings_goals"]).toBeUndefined();
      expect(mockStorage["invictus_subscriptions"]).toBeUndefined();
      expect(mockStorage["invictus_sticky_scratchpad"]).toBeUndefined();

      // Guest session credentials MUST be preserved
      expect(mockStorage["invictus_guest_mode"]).toBe("true");
      expect(mockStorage["invictus_onboarded"]).toBe("true");
      expect(mockStorage["invictus_guest_name"]).toBeDefined();
    });

    it("SAFETY AIR-GAP: Strictly prevents clearing data when a main account is active without demo flag", () => {
      // Simulate real authenticated user
      mockStorage["invictus_active_user"] = JSON.stringify({ uid: "usr_main_account_999", email: "user@example.com" });
      mockStorage["invictus_custom_session_token"] = "token_usr_main_account_999_xyz";
      mockStorage["invictus_tasks_db"] = JSON.stringify([{ id: "real_task_1", title: "Real Main Task" }]);

      // Attempt to clear demo data without demo flag
      const result = clearEvaluatorDemoData();
      expect(result).toBe(false);

      // Real user data must remain untouched!
      expect(mockStorage["invictus_tasks_db"]).toBeDefined();
      expect(JSON.parse(mockStorage["invictus_tasks_db"])[0].title).toBe("Real Main Task");
    });
  });

  describe("Safety Air-Gaps for Main User Accounts", () => {
    it("Strictly blocks loadEvaluatorDemoData() when an active main account is logged in", () => {
      // Simulate real authenticated user
      mockStorage["invictus_active_user"] = JSON.stringify({ uid: "usr_main_account_999", email: "user@example.com" });
      mockStorage["invictus_custom_session_token"] = "token_usr_main_account_999_xyz";
      mockStorage["invictus_tasks_db"] = JSON.stringify([{ id: "real_task_1", title: "Real Main Task" }]);

      // Attempt to seed demo data over main account
      const result = loadEvaluatorDemoData();
      expect(result).toBe(false);

      // Real task list must not be overwritten by demo tasks!
      const tasks = JSON.parse(mockStorage["invictus_tasks_db"]);
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe("Real Main Task");
      expect(isDemoDataActive()).toBe(false);
    });
  });
});
