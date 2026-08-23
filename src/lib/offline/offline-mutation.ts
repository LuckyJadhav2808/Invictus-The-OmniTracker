"use client";

import { toast } from "sonner";
import { enqueueOfflineMutation } from "./indexeddb-store";
import { syncEngine } from "./sync-manager";

export interface OfflineMutationConfig<TVariables, TResult = any> {
  endpoint: string;
  method?: "POST" | "PUT" | "DELETE" | "PATCH";
  type: "goals" | "money" | "study" | "gym" | "general";
  label: string;
  body?: (variables: TVariables) => any;
  getOptimisticResult?: (variables: TVariables) => TResult;
  onSuccessToast?: string;
}

/**
 * Executes an HTTP mutation with 100% offline resilience:
 * - If online: Executes fetch. If fetch fails due to network drop, seamlessly falls back to IndexedDB.
 * - If offline: Enqueues directly to IndexedDB with 0ms lag and optimistic return.
 */
export async function executeOfflineMutation<TVariables, TResult = any>(
  variables: TVariables,
  config: OfflineMutationConfig<TVariables, TResult>
): Promise<TResult> {
  const {
    endpoint,
    method = "POST",
    type,
    label,
    body,
    getOptimisticResult,
    onSuccessToast,
  } = config;

  const payload = body ? body(variables) : variables;
  const isOnline = typeof window !== "undefined" ? navigator.onLine : true;

  // 1. Direct Offline Mode
  if (!isOnline) {
    await enqueueOfflineMutation({
      endpoint,
      method,
      type,
      label,
      body: payload,
    });

    await syncEngine.updatePendingCount();

    toast.info(`Saved locally (Offline) ⚡ [${label}]`, {
      duration: 3000,
      description: "Will automatically sync to cloud when you reconnect.",
      style: {
        background: "#FEF08A",
        color: "#161514",
        border: "2px solid #161514",
        fontWeight: "700",
      },
    });

    return (getOptimisticResult ? getOptimisticResult(variables) : { success: true, offline: true }) as TResult;
  }

  // 2. Online Mode with Automatic Network-Failure Fallback
  try {
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorJson: any;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = null;
      }
      throw new Error(errorJson?.error || errorJson?.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (onSuccessToast) {
      toast.success(onSuccessToast);
    }
    return data;
  } catch (err: any) {
    // Check if error is a network connectivity drop
    const isNetworkError =
      err?.message?.includes("fetch") ||
      err?.message?.includes("NetworkError") ||
      err?.message?.includes("Failed to fetch") ||
      !navigator.onLine;

    if (isNetworkError) {
      console.warn(`[OfflineMutation] Network failed for ${label}. Saving to IndexedDB queue.`);

      await enqueueOfflineMutation({
        endpoint,
        method,
        type,
        label,
        body: payload,
      });

      await syncEngine.updatePendingCount();

      toast.info(`Saved locally (Offline) ⚡ [${label}]`, {
        duration: 3000,
        description: "Will automatically sync to cloud when you reconnect.",
        style: {
          background: "#FEF08A",
          color: "#161514",
          border: "2px solid #161514",
          fontWeight: "700",
        },
      });

      return (getOptimisticResult ? getOptimisticResult(variables) : { success: true, offline: true }) as TResult;
    }

    // Re-throw server business validation errors (e.g. 400 Bad Request)
    throw err;
  }
}
