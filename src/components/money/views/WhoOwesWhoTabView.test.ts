import { describe, it, expect } from "vitest";

describe("WhoOwesWhoTabView (Belanje Page-in-Page Debt Deck)", () => {
  it("exports valid TabView component", async () => {
    const mod = await import("./WhoOwesWhoTabView");
    expect(mod.WhoOwesWhoTabView).toBeDefined();
    expect(typeof mod.WhoOwesWhoTabView).toBe("function");
  });
});
