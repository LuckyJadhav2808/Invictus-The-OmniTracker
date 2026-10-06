"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  getPendingOfflineMutations,
  removeOfflineMutation,
  type PendingMutationJob,
} from "./indexeddb-store";

type SyncState = {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  dbLatencyMs: number | null;
  serverStatus: "connected" | "degraded" | "disconnected";
  queueJobs: PendingMutationJob[];
};

type SyncListener = (state: SyncState) => void;

class OfflineSyncEngine {
  private static instance: OfflineSyncEngine;
  private isOnline: boolean = typeof window !== "undefined" ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private pendingCount: number = 0;
  private queueJobs: PendingMutationJob[] = [];
  private lastSyncTime: string | null = null;
  private dbLatencyMs: number | null = null;
  private serverStatus: "connected" | "degraded" | "disconnected" = "connected";
  private listeners: Set<SyncListener> = new Set();
  private queryClientInvalidator: (() => void) | null = null;

  private constructor() {
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;
      const storedLastSync = localStorage.getItem("invictus_last_sync_time");
      if (storedLastSync) this.lastSyncTime = storedLastSync;

      window.addEventListener("online", () => this.handleOnline());
      window.addEventListener("offline", () => this.handleOffline());
      this.updatePendingCount();
      this.pingHealth().catch(() => {});
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
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): SyncState {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
      lastSyncTime: this.lastSyncTime,
      dbLatencyMs: this.dbLatencyMs,
      serverStatus: this.serverStatus,
      queueJobs: this.queueJobs,
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  public async pingHealth(): Promise<{ latencyMs: number; status: "connected" | "degraded" | "disconnected" }> {
    if (!this.isOnline) {
      this.serverStatus = "disconnected";
      this.dbLatencyMs = null;
      this.notify();
      return { latencyMs: 0, status: "disconnected" };
    }

    const start = Date.now();
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const latency = Date.now() - start;
      if (res.ok) {
        const data = await res.json();
        this.dbLatencyMs = data.database?.latencyMs ?? latency;
        this.serverStatus = data.status === "healthy" ? "connected" : "degraded";
      } else {
        this.serverStatus = "degraded";
        this.dbLatencyMs = latency;
      }
    } catch {
      this.serverStatus = "disconnected";
      this.dbLatencyMs = null;
    }

    this.notify();
    return { latencyMs: this.dbLatencyMs ?? 0, status: this.serverStatus };
  }

  public async updatePendingCount(): Promise<number> {
    try {
      const jobs = await getPendingOfflineMutations();
      this.queueJobs = jobs;
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
    this.pingHealth().catch(() => {});
    this.flushQueue();
  }

  private handleOffline() {
    this.isOnline = false;
    this.serverStatus = "disconnected";
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
      this.queueJobs = [];
      this.lastSyncTime = new Date().toISOString();
      if (typeof window !== "undefined") {
        localStorage.setItem("invictus_last_sync_time", this.lastSyncTime);
      }
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
    this.lastSyncTime = new Date().toISOString();
    if (typeof window !== "undefined") {
      localStorage.setItem("invictus_last_sync_time", this.lastSyncTime);
    }

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
 * React Hook to observe cloud sync telemetry, network status, pending offline mutations, and manual triggers.
 */
export function useOfflineSync() {
  const [state, setState] = useState<SyncState>(() => syncEngine.getState());

  useEffect(() => {
    const unsub = syncEngine.subscribe((newState) => {
      setState(newState);
    });
    syncEngine.updatePendingCount();
    return () => unsub();
  }, []);

  const syncNow = useCallback(async () => {
    await syncEngine.pingHealth();
    return await syncEngine.flushQueue();
  }, []);

  const pingHealth = useCallback(async () => {
    return await syncEngine.pingHealth();
  }, []);

  return {
    ...state,
    syncNow,
    pingHealth,
  };
}
