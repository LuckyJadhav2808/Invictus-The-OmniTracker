"use client";

import type { QueryClient } from "@tanstack/react-query";
import {
  setOfflineCacheItem,
  getAllOfflineCacheItems,
} from "./indexeddb-store";

// Allowed query prefixes to persist into local IndexedDB for instant 0ms cold-start
const PERSISTABLE_DOMAINS = new Set([
  "habits",
  "habitLogs",
  "streaks",
  "streakFreeze",
  "tasks",
  "studySessions",
  "subjects",
  "transactions",
  "categories",
  "budgetPreferences",
  "waterLog",
  "healthProfile",
]);

/**
 * Hydrates TanStack Query cache directly from native IndexedDB on cold-start (<10ms).
 * Eliminates loading spinners, skeleton flashes, and blank screens on app open.
 */
export async function hydrateQueryCacheFromIndexedDB(queryClient: QueryClient): Promise<number> {
  if (typeof window === "undefined") return 0;

  try {
    const cachedEntries = await getAllOfflineCacheItems();
    let hydratedCount = 0;

    for (const entry of cachedEntries) {
      if (!entry.key || entry.data === undefined) continue;

      try {
        const queryKey = JSON.parse(entry.key);
        // Only hydrate if React Query does not already have data in memory
        const existing = queryClient.getQueryData(queryKey);
        if (existing === undefined) {
          queryClient.setQueryData(queryKey, entry.data);
          hydratedCount++;
        }
      } catch {
        // Non-JSON key fallback
        const existing = queryClient.getQueryData([entry.key]);
        if (existing === undefined) {
          queryClient.setQueryData([entry.key], entry.data);
          hydratedCount++;
        }
      }
    }

    return hydratedCount;
  } catch (err) {
    console.warn("[QueryPersister] Failed to hydrate cache:", err);
    return 0;
  }
}

/**
 * Attaches a passive background listener that persists fresh query data into IndexedDB.
 */
export function attachQueryCachePersister(queryClient: QueryClient): () => void {
  if (typeof window === "undefined") return () => {};

  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (
      event?.type === "updated" &&
      event.query.state.status === "success" &&
      event.query.state.data !== undefined
    ) {
      const primaryKey = event.query.queryKey[0];
      if (typeof primaryKey === "string" && PERSISTABLE_DOMAINS.has(primaryKey)) {
        try {
          const serializedKey = JSON.stringify(event.query.queryKey);
          setOfflineCacheItem(serializedKey, event.query.state.data).catch(() => {});
        } catch {
          // Ignore non-serializable keys
        }
      }
    }
  });

  return unsubscribe;
}
