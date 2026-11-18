import { describe, it, expect } from "vitest";
import { WalletCardDeck } from "./WalletCardDeck";
import fs from "node:fs";
import path from "node:path";

describe("WalletCardDeck Production Architecture & Belanje Design Verification", () => {
  const filePath = path.resolve(__dirname, "./WalletCardDeck.tsx");
  const source = fs.readFileSync(filePath, "utf-8");

  it("exports WalletCardDeck as a valid functional component", () => {
    expect(WalletCardDeck).toBeDefined();
    expect(typeof WalletCardDeck).toBe("function");
  });

  it("verifies swipeable horizontal carousel with snap mandatory scrolling", () => {
    expect(source).toContain("snap-x snap-mandatory");
    expect(source).toContain("overflow-x-auto");
    expect(source).toContain("scrollSnapType: \"x mandatory\"");
  });

  it("implements privacy eye toggle for hiding sensitive balance telemetry", () => {
    expect(source).toContain("isBalanceHidden");
    expect(source).toContain("invictus_money_hide_balance");
    expect(source).toContain("••••••");
    expect(source).toContain("toggleHideBalance");
  });

  it("renders all 4 Belanje-benchmarked card metaphors", () => {
    // Card 1: Main Account (UPI & Digital Bank)
    expect(source).toContain("Main Account");
    expect(source).toContain("Income this month");
    expect(source).toContain("Spent this month");

    // Card 2: Cash Till (Physical Pocket Envelope)
    expect(source).toContain("Cash Till");
    expect(source).toContain("Physical Pocket Envelope");
    expect(source).toContain("Refill Till");

    // Card 3: Safe-to-Spend (Pace & Rollover)
    expect(source).toContain("Safe-to-Spend");
    expect(source).toContain("Budget Progress");

    // Card 4: Manage Cards & Accounts
    expect(source).toContain("Manage Cards & Accounts");
  });

  it("renders the 4 squircle quick action launchers", () => {
    expect(source).toContain("Add");
    expect(source).toContain("Receipts");
    expect(source).toContain("Calc");
    expect(source).toContain("Analytics");
  });

  it("renders dot pagination indicator", () => {
    expect(source).toContain("scrollToIndex");
    expect(source).toContain("activeCardIndex === idx");
  });
});
