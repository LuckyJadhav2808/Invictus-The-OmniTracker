import { describe, it, expect } from "vitest";
import { createSearchWorkerClient, UniversalSearchWorkerEndpoint } from "./comlink-search-bridge";

describe("Comlink Search Bridge & Worker Endpoint", () => {
  it("indexes and searches items via in-process / Comlink service", async () => {
    const client = createSearchWorkerClient();

    const count = await client.indexItems([
      { id: "tx_1", title: "Whole Foods Market", category: "Groceries" },
      { id: "tx_2", title: "Swiggy Food Delivery", category: "Dining" },
      { id: "tx_3", title: "Gym Membership CultFit", category: "Fitness" },
    ]);

    expect(count).toBe(3);

    const results = await client.search("swigy"); // fuzzy match
    expect(results).toContain("tx_2");

    const empty = await client.search("");
    expect(empty).toEqual([]);
  });

  it("handles empty indexing gracefully", async () => {
    const endpoint = new UniversalSearchWorkerEndpoint();
    const count = await endpoint.indexItems([]);
    expect(count).toBe(0);
    const res = await endpoint.search("anything");
    expect(res).toEqual([]);
  });
});
