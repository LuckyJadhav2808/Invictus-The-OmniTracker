import { describe, it, expect } from "vitest";
import { PendingSmsTransactionsBanner } from "./PendingSmsTransactionsBanner";

describe("PendingSmsTransactionsBanner", () => {
  it("exports a valid React functional component", () => {
    expect(PendingSmsTransactionsBanner).toBeDefined();
    expect(typeof PendingSmsTransactionsBanner).toBe("function");
  });
});
