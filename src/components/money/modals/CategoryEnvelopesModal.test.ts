import { describe, it, expect } from "vitest";

describe("CategoryEnvelopesModal", () => {
  it("exports valid CategoryEnvelopesModal component definition", async () => {
    const mod = await import("./CategoryEnvelopesModal");
    expect(mod.CategoryEnvelopesModal).toBeDefined();
  }, 30000);
});
