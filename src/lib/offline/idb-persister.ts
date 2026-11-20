"use client";

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";

export const INVICTUS_QUERY_CACHE_KEY = "INVICTUS_REACT_QUERY_OFFLINE_CACHE";
export const INVICTUS_QUERY_CACHE_BUSTER = "1.8.3";

/**
 * Industrial-grade IndexedDB storage persister for TanStack React Query.
 * Enables 0ms cold starts, instantaneous visual paint, and true offline-first durability.
 */
export function createIdbQueryPersister() {
  const isSupported =
    typeof window !== "undefined" && typeof window.indexedDB !== "undefined";

  return createAsyncStoragePersister({
    storage: {
      getItem: async (key: string) => {
        if (!isSupported) return null;
        try {
          const value = await get(key);
          return typeof value === "string" ? value : null;
        } catch (err) {
          console.warn("[idb-persister] Error reading cache key:", key, err);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        if (!isSupported) return;
        try {
          await set(key, value);
        } catch (err) {
          console.warn("[idb-persister] Error persisting cache key:", key, err);
        }
      },
      removeItem: async (key: string) => {
        if (!isSupported) return;
        try {
          await del(key);
        } catch (err) {
          console.warn("[idb-persister] Error removing cache key:", key, err);
        }
      },
    },
    key: INVICTUS_QUERY_CACHE_KEY,
    throttleTime: 1000,
  });
}

export const idbQueryPersister = createIdbQueryPersister();
