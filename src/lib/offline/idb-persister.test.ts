import { describe, it, expect } from "vitest";
import {
  createIdbQueryPersister,
  INVICTUS_QUERY_CACHE_KEY,
  INVICTUS_QUERY_CACHE_BUSTER,
} from "./idb-persister";

describe("IDB Query Persister", () => {
  it("initializes persister with correct cache key and buster version", () => {
    const persister = createIdbQueryPersister();
    expect(persister).toBeDefined();
    expect(typeof persister.persistClient).toBe("function");
    expect(typeof persister.restoreClient).toBe("function");
    expect(typeof persister.removeClient).toBe("function");
    expect(INVICTUS_QUERY_CACHE_KEY).toBe("INVICTUS_REACT_QUERY_OFFLINE_CACHE");
    expect(INVICTUS_QUERY_CACHE_BUSTER).toBe("1.8.3");
  });

  it("handles environment without indexedDB gracefully during restoreClient", async () => {
    const persister = createIdbQueryPersister();
    const restored = await persister.restoreClient();
    expect(restored).toBeUndefined();
  });

  it("handles environment without indexedDB gracefully during persistClient and removeClient", async () => {
    const persister = createIdbQueryPersister();
    await expect(
      persister.persistClient({
        timestamp: Date.now(),
        buster: INVICTUS_QUERY_CACHE_BUSTER,
        clientState: { queries: [], mutations: [] },
      })
    ).resolves.not.toThrow();

    await expect(persister.removeClient()).resolves.not.toThrow();
  });
});
