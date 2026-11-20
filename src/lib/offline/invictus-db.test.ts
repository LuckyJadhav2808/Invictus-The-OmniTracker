import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { indexedDB, IDBKeyRange } from "fake-indexeddb";
import {
  InvictusDatabase,
  getInvictusDB,
  queryTransactionsByDateRange,
  queryExpensesByCategory,
  queryPendingTasks,
  bulkSyncTransactions,
  bulkSyncTasks,
  type DexieTransaction,
  type DexieTask,
} from "./invictus-db";

describe("Invictus Dexie Offline Database Engine", () => {
  let testDb: InvictusDatabase;

  beforeEach(() => {
    testDb = new InvictusDatabase({ indexedDB, IDBKeyRange });
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it("initializes with valid table schemas and compound indexes", () => {
    expect(testDb.tables.map((t) => t.name)).toEqual(
      expect.arrayContaining(["transactions", "tasks", "habits"])
    );
    expect(testDb.transactions.schema.indexes.some((i) => i.name === "[categoryId+date]")).toBe(true);
    expect(testDb.tasks.schema.indexes.some((i) => i.name === "[status+dueDate]")).toBe(true);
  });

  it("handles SSR / node environment gracefully without throwing", async () => {
    // Calling default getInvictusDB without options in node/vitest returns null
    const defaultDb = getInvictusDB();
    expect(defaultDb).toBeNull();

    const txs = await queryTransactionsByDateRange("2026-10-01", "2026-10-31");
    expect(txs).toEqual([]);

    const catTxs = await queryExpensesByCategory("cat_food", "2026-10-01", "2026-10-31");
    expect(catTxs).toEqual([]);

    const tasks = await queryPendingTasks();
    expect(tasks).toEqual([]);
  });

  it("executes fast compound index queries across date ranges and categories", async () => {
    const mockTxs: DexieTransaction[] = [
      { id: "tx_1", amount: 150, type: "expense", date: "2026-10-05", categoryId: "cat_food" },
      { id: "tx_2", amount: 250, type: "expense", date: "2026-10-12", categoryId: "cat_food" },
      { id: "tx_3", amount: 500, type: "expense", date: "2026-10-20", categoryId: "cat_travel" },
      { id: "tx_4", amount: 80, type: "expense", date: "2026-11-02", categoryId: "cat_food" },
    ];

    await bulkSyncTransactions(mockTxs, testDb);

    // Query October transactions
    const octTxs = await queryTransactionsByDateRange("2026-10-01", "2026-10-31", testDb);
    expect(octTxs.length).toBe(3);
    expect(octTxs[0].date).toBe("2026-10-20"); // Sorted descending

    // Query food expenses in October using [categoryId+date] compound index
    const foodOct = await queryExpensesByCategory("cat_food", "2026-10-01", "2026-10-31", testDb);
    expect(foodOct.length).toBe(2);
    expect(foodOct.map((t) => t.id)).toEqual(["tx_1", "tx_2"]);
  });

  it("queries pending tasks with status and dueDate compound filtering", async () => {
    const mockTasks: DexieTask[] = [
      { id: "task_1", title: "Review slides", status: "todo", priority: "p1", dueDate: "2026-10-25" },
      { id: "task_2", title: "Gym workout", status: "completed", priority: "p2", dueDate: "2026-10-25" },
      { id: "task_3", title: "Submit project", status: "todo", priority: "p1", dueDate: "2026-10-30" },
    ];

    await bulkSyncTasks(mockTasks, testDb);

    const pending = await queryPendingTasks(undefined, testDb);
    expect(pending.length).toBe(2);
    expect(pending.map((t) => t.id)).toEqual(["task_1", "task_3"]);
  });
});
