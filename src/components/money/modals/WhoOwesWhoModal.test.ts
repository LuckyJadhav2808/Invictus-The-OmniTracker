import { describe, it, expect } from "vitest";

describe("WhoOwesWhoModal", () => {
  it("exports valid modal component", async () => {
    const mod = await import("./WhoOwesWhoModal");
    expect(mod.WhoOwesWhoModal).toBeDefined();
  }, 15000);
});
