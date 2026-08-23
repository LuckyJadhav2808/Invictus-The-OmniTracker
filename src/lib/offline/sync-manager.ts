"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  getPendingOfflineMutations,
  removeOfflineMutation,
  type PendingMutationJob,
} from "./indexeddb-store";

type SyncListener = (state: { isOnline: boolean; isSyncing: boolean; pendingCount: number }) => void;

class OfflineSyncEngine {
  private static instance: OfflineSyncEngine;
  private isOnline: boolean = typeof window !== "undefined" ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private pendingCount: number = 0;
  private listeners: Set<SyncListener> = new Set();
  private queryClientInvalidator: (() => void) | null = null;

  private constructor() {
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;
      window.addEventListener("online", () => this.handleOnline());
      window.addEventListener("offline", () => this.handleOffline());
      this.updatePendingCount();
    }
  }

  public static getInstance(): OfflineSyncEngine {
    if (!OfflineSyncEngine.instance) {
      OfflineSyncEngine.instance = new OfflineSyncEngine();
    }
    return OfflineSyncEngine.instance;
  }

  public registerQueryInvalidator(fn: () => void) {
    this.queryClientInvalidator = fn;
  }

  public subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    listener({
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) =>
      l({
        isOnline: this.isOnline,
        isSyncing: this.isSyncing,
        pendingCount: this.pendingCount,
      })
    );
  }

  public async updatePendingCount(): Promise<number> {
    try {
      const jobs = await getPendingOfflineMutations();
      this.pendingCount = jobs.length;
      this.notify();
      return this.pendingCount;
    } catch {
      return 0;
    }
  }

  private handleOnline() {
    this.isOnline = true;
    this.notify();
    toast.success("Back Online! ⚡ Reconnecting to cloud...", { duration: 2500 });
    this.flushQueue();
  }

  private handleOffline() {
    this.isOnline = false;
    this.notify();
    toast.warning("You are offline 📴 Changes will be saved locally and auto-synced.", {
      duration: 3500,
    });
  }

  public async flushQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || !this.isOnline) {
      return { synced: 0, failed: 0 };
    }

    const jobs = await getPendingOfflineMutations();
    if (jobs.length === 0) {
      this.pendingCount = 0;
      this.notify();
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notify();

    let syncedCount = 0;
    let failedCount = 0;

    for (const job of jobs) {
      try {
        const res = await fetch(job.endpoint, {
          method: job.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: job.body ? JSON.stringify(job.body) : undefined,
        });

        if (res.ok || res.status === 409) {
          // Success or already exists (idempotent)
          await removeOfflineMutation(job.id);
          syncedCount++;
        } else if (res.status >= 400 && res.status < 500) {
          // Client error (invalid payload) -> Drop to avoid blocking queue
          await removeOfflineMutation(job.id);
          failedCount++;
        } else {
          // 5xx Server error -> Stop queue and retry on next cycle
          failedCount++;
          break;
        }
      } catch (networkError) {
        // Network connection lost while flushing
        this.isOnline = false;
        failedCount++;
        break;
      }
    }

    this.isSyncing = false;
    await this.updatePendingCount();

    if (syncedCount > 0) {
      if (this.queryClientInvalidator) {
        this.queryClientInvalidator();
      }

      toast.success(`Synced ${syncedCount} offline action${syncedCount > 1 ? "s" : ""} to cloud! ☁️`, {
        duration: 3500,
        style: {
          background: "#CEF431",
          color: "#161514",
          fontWeight: "800",
        },
      });
    }

    return { synced: syncedCount, failed: failedCount };
  }
}

export const syncEngine = OfflineSyncEngine.getInstance();

/**
 * React Hook to observe network status, pending offline mutations, and manual sync trigger.
 */
export function useOfflineSync() {
  const [state, setState] = useState({
    isOnline: typeof window !== "undefined" ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
  });

  useEffect(() => {
    const unsub = syncEngine.subscribe((newState) => {
      setState(newState);
    });
    syncEngine.updatePendingCount();
    return () => unsub();
  }, []);

  const syncNow = useCallback(async () => {
    return await syncEngine.flushQueue();
  }, []);

  return {
    ...state,
    syncNow,
  };
}
