import { describe, it, expect } from "vitest";

describe("RecentAccountFeed", () => {
  it("exports valid component definitions", async () => {
    const mod = await import("./RecentAccountFeed");
    expect(mod.RecentAccountFeed).toBeDefined();
  }, 15000);
});
