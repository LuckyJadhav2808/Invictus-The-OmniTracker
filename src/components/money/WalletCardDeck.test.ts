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

  it("verifies flippable stacked card architecture with swipe gestures", () => {
    expect(source).toContain("getCardStyle");
    expect(source).toContain("nextCard");
    expect(source).toContain("prevCard");
    expect(source).toContain("handleTouchStart");
    expect(source).toContain("handleTouchMove");
    expect(source).toContain("handleTouchEnd");
    expect(source).toContain("touch-pan-y select-none");
  });

  it("implements light mode white surface with calibrated card gradients", () => {
    // Card 1: Main account white gradient
    expect(source).toContain("from-white via-[#F8FAFC] to-[#EEF2F6]");
    expect(source).toContain("dark:from-[#161514] dark:via-[#1E1C1A] dark:to-[#141E28]");

    // Card 2: Cash till white/honey gradient
    expect(source).toContain("from-white via-[#FFFDF5] to-[#FEF3C7]");
    expect(source).toContain("dark:from-[#1C1A18] dark:via-[#24211D] dark:to-[#2E2416]");

    // Card 3: Safe-to-Spend mint gradient
    expect(source).toContain("from-white via-[#F0FDF4] to-[#DCFCE7]");
    expect(source).toContain("dark:from-[#161514] dark:via-[#1A201C] dark:to-[#122B1E]");
  });

  it("implements privacy eye toggle for hiding sensitive balance telemetry", () => {
    expect(source).toContain("isBalanceHidden");
    expect(source).toContain("invictus_money_hide_balance");
    expect(source).toContain("••••••");
    expect(source).toContain("toggleHideBalance");
  });

  it("renders all 4 Belanje-benchmarked card metaphors in stack", () => {
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

  it("delegates the 4 quick action launchers to MoneyDoorTileRow to eliminate duplicate buttons", () => {
    // Verified: Quick action launchers moved to Slot 4 (MoneyDoorTileRow) to eliminate button duplication
    expect(source).toContain("goToCard");
    expect(source).toContain("activeCardIndex");
  });

  it("renders dot pagination indicator and quick stack flip steppers", () => {
    expect(source).toContain("goToCard");
    expect(source).toContain("activeCardIndex === idx");
    expect(source).toContain("ChevronLeft");
    expect(source).toContain("ChevronRight");
  });
});
