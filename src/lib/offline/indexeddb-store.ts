/**
 * Invictus Offline Storage Engine
 * Ultra-fast native IndexedDB wrapper for offline mutations and local query caching.
 * Zero external runtime dependencies, 100% browser & PWA compatible.
 */

export interface PendingMutationJob {
  id: string;
  endpoint: string;
  method: "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  type: "goals" | "money" | "study" | "gym" | "general";
  label: string;
  createdAt: number;
  retryCount: number;
}

const DB_NAME = "invictus_offline_db";
const DB_VERSION = 1;
const STORE_MUTATIONS = "pending_mutations";
const STORE_CACHE = "offline_cache";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
        const mutationStore = db.createObjectStore(STORE_MUTATIONS, { keyPath: "id" });
        mutationStore.createIndex("createdAt", "createdAt", { unique: false });
        mutationStore.createIndex("type", "type", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Enqueue a new mutation to be synced when the device connects back to the internet.
 */
export async function enqueueOfflineMutation(
  job: Omit<PendingMutationJob, "id" | "createdAt" | "retryCount">
): Promise<PendingMutationJob> {
  const fullJob: PendingMutationJob = {
    ...job,
    id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    retryCount: 0,
  };

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, "readwrite");
      const store = tx.objectStore(STORE_MUTATIONS);
      const req = store.put(fullJob);

      req.onsuccess = () => resolve(fullJob);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("[OfflineDB] Failed to enqueue mutation:", err);
    return fullJob;
  }
}

/**
 * Retrieve all pending mutations in FIFO order (oldest first).
 */
export async function getPendingOfflineMutations(): Promise<PendingMutationJob[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, "readonly");
      const store = tx.objectStore(STORE_MUTATIONS);
      const req = store.getAll();

      req.onsuccess = () => {
        const jobs = (req.result as PendingMutationJob[]) || [];
        // Sort by createdAt ascending (FIFO)
        jobs.sort((a, b) => a.createdAt - b.createdAt);
        resolve(jobs);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("[OfflineDB] Failed to read pending mutations:", err);
    return [];
  }
}

/**
 * Remove a completed mutation from the queue.
 */
export async function removeOfflineMutation(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, "readwrite");
      const store = tx.objectStore(STORE_MUTATIONS);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("[OfflineDB] Failed to remove mutation:", err);
    return false;
  }
}

/**
 * Clear all pending mutations from the queue.
 */
export async function clearAllOfflineMutations(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, "readwrite");
      const store = tx.objectStore(STORE_MUTATIONS);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("[OfflineDB] Failed to clear mutations:", err);
  }
}

/**
 * Save a cached query result to IndexedDB for offline access.
 */
export async function setOfflineCacheItem<T>(key: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, "readwrite");
      const store = tx.objectStore(STORE_CACHE);
      const req = store.put({ key, data, updatedAt: Date.now() });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("[OfflineDB] Failed to cache item:", err);
  }
}

/**
 * Retrieve a cached query result from IndexedDB.
 */
export async function getOfflineCacheItem<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, "readonly");
      const store = tx.objectStore(STORE_CACHE);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data as T);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("[OfflineDB] Failed to read cached item:", err);
    return null;
  }
}
