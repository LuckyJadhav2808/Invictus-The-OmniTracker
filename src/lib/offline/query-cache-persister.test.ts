import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  hydrateQueryCacheFromIndexedDB,
  attachQueryCachePersister,
} from "./query-cache-persister";
import * as indexedDbStore from "./indexeddb-store";

describe("Query Cache Persister (0ms Cold-Start Engine)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.stubGlobal("window", {});
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
    vi.unstubAllGlobals();
  });

  it("hydrates query cache from IndexedDB items on app boot", async () => {
    const mockItems = [
      {
        key: JSON.stringify(["habits", "user_123"]),
        data: [{ id: "h1", name: "Gym" }],
      },
      {
        key: JSON.stringify(["tasks", "user_123"]),
        data: [{ id: "t1", title: "Study Calculus" }],
      },
    ];

    vi.spyOn(indexedDbStore, "getAllOfflineCacheItems").mockResolvedValue(mockItems);

    const count = await hydrateQueryCacheFromIndexedDB(queryClient);

    expect(count).toBe(2);
    expect(queryClient.getQueryData(["habits", "user_123"])).toEqual([
      { id: "h1", name: "Gym" },
    ]);
    expect(queryClient.getQueryData(["tasks", "user_123"])).toEqual([
      { id: "t1", title: "Study Calculus" },
    ]);
  });

  it("does not overwrite already fresh in-memory data during hydration", async () => {
    queryClient.setQueryData(["habits", "user_123"], [{ id: "h1", name: "Fresh in-memory habit" }]);

    vi.spyOn(indexedDbStore, "getAllOfflineCacheItems").mockResolvedValue([
      {
        key: JSON.stringify(["habits", "user_123"]),
        data: [{ id: "h1", name: "Stale disk habit" }],
      },
    ]);

    const count = await hydrateQueryCacheFromIndexedDB(queryClient);

    expect(count).toBe(0);
    expect(queryClient.getQueryData(["habits", "user_123"])).toEqual([
      { id: "h1", name: "Fresh in-memory habit" },
    ]);
  });

  it("persists successful query results for allowlisted domains", async () => {
    const setSpy = vi.spyOn(indexedDbStore, "setOfflineCacheItem").mockResolvedValue();

    const detach = attachQueryCachePersister(queryClient);

    // Simulate query execution
    queryClient.setQueryData(["transactions", "user_123"], [
      { id: "tx_1", amount: 250, type: "expense" },
    ]);

    // Small microtask wait
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(setSpy).toHaveBeenCalledWith(
      JSON.stringify(["transactions", "user_123"]),
      [{ id: "tx_1", amount: 250, type: "expense" }]
    );

    detach();
  });

  it("ignores non-allowlisted domains to avoid disk bloat", async () => {
    const setSpy = vi.spyOn(indexedDbStore, "setOfflineCacheItem").mockResolvedValue();

    const detach = attachQueryCachePersister(queryClient);

    // Some ephemeral domain not in allowlist
    queryClient.setQueryData(["ephemeralNotificationCount"], { count: 5 });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(setSpy).not.toHaveBeenCalled();

    detach();
  });
});
