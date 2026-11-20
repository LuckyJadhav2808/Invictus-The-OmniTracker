import Dexie, { type EntityTable } from "dexie";

export interface DexieTransaction {
  id: string;
  amount: number;
  type: "expense" | "income";
  date: string; // YYYY-MM-DD
  categoryId: string;
  paymentMethod?: string;
  note?: string;
  userId?: string;
  createdAt?: string;
}

export interface DexieTask {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "completed" | "archived";
  priority: "p1" | "p2" | "p3" | "p4";
  dueDate?: string; // ISO string or YYYY-MM-DD
  projectTag?: string;
  userId?: string;
  completedAt?: string;
}

export interface DexieHabit {
  id: string;
  title: string;
  zone?: "morning" | "forge" | "evening";
  frequency?: "daily" | "weekly";
  reminderTime?: string;
  archived?: boolean;
  userId?: string;
}

/**
 * Industrial-grade typed offline database schema for Invictus OS.
 * Features compound indexing for sub-millisecond local filtering.
 */
export class InvictusDatabase extends Dexie {
  transactions!: EntityTable<DexieTransaction, "id">;
  tasks!: EntityTable<DexieTask, "id">;
  habits!: EntityTable<DexieHabit, "id">;

  constructor(options?: { indexedDB?: any; IDBKeyRange?: any }) {
    super("InvictusOfflineDB", options);

    this.version(1).stores({
      transactions: "id, date, categoryId, type, [categoryId+date], [type+date]",
      tasks: "id, dueDate, status, priority, [status+dueDate]",
      habits: "id, zone, frequency, archived",
    });
  }
}

/**
 * Checks whether native IndexedDB is available in the current runtime environment.
 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

let dbInstance: InvictusDatabase | null = null;

/**
 * Returns the singleton InvictusDatabase instance.
 * SSR-safe: returns null if indexedDB is not available.
 */
export function getInvictusDB(options?: { indexedDB?: any; IDBKeyRange?: any }): InvictusDatabase | null {
  if (options) {
    return new InvictusDatabase(options);
  }
  if (!isIndexedDBAvailable()) {
    return null;
  }
  if (!dbInstance) {
    dbInstance = new InvictusDatabase();
  }
  return dbInstance;
}

// ─── HIGH-SPEED QUERY ENGINE WITH COMPOUND INDEXES ───

/**
 * Queries transactions within a date range using the indexed `date` field.
 */
export async function queryTransactionsByDateRange(
  startDate: string,
  endDate: string,
  customDb?: InvictusDatabase
): Promise<DexieTransaction[]> {
  const db = customDb || getInvictusDB();
  if (!db) return [];

  return db.transactions
    .where("date")
    .between(startDate, endDate, true, true)
    .reverse()
    .sortBy("date");
}

/**
 * Queries expenses for a specific category using compound index `[categoryId+date]`.
 */
export async function queryExpensesByCategory(
  categoryId: string,
  startDate?: string,
  endDate?: string,
  customDb?: InvictusDatabase
): Promise<DexieTransaction[]> {
  const db = customDb || getInvictusDB();
  if (!db) return [];

  if (startDate && endDate) {
    return db.transactions
      .where("[categoryId+date]")
      .between([categoryId, startDate], [categoryId, endDate], true, true)
      .toArray();
  }

  return db.transactions
    .where("categoryId")
    .equals(categoryId)
    .toArray();
}

/**
 * Queries active/pending tasks, optionally filtered by dueDate.
 */
export async function queryPendingTasks(
  dueBefore?: string,
  customDb?: InvictusDatabase
): Promise<DexieTask[]> {
  const db = customDb || getInvictusDB();
  if (!db) return [];

  if (dueBefore) {
    return db.tasks
      .where("[status+dueDate]")
      .between(["todo", Dexie.minKey], ["todo", dueBefore], true, true)
      .toArray();
  }

  return db.tasks
    .where("status")
    .equals("todo")
    .toArray();
}

/**
 * Bulk writes transactions into IndexedDB with atomic upsert.
 */
export async function bulkSyncTransactions(
  transactions: DexieTransaction[],
  customDb?: InvictusDatabase
): Promise<void> {
  const db = customDb || getInvictusDB();
  if (!db || transactions.length === 0) return;

  await db.transactions.bulkPut(transactions);
}

/**
 * Bulk writes tasks into IndexedDB with atomic upsert.
 */
export async function bulkSyncTasks(
  tasks: DexieTask[],
  customDb?: InvictusDatabase
): Promise<void> {
  const db = customDb || getInvictusDB();
  if (!db || tasks.length === 0) return;

  await db.tasks.bulkPut(tasks);
}

/**
 * Bulk writes habits into IndexedDB with atomic upsert.
 */
export async function bulkSyncHabits(
  habits: DexieHabit[],
  customDb?: InvictusDatabase
): Promise<void> {
  const db = customDb || getInvictusDB();
  if (!db || habits.length === 0) return;

  await db.habits.bulkPut(habits);
}
