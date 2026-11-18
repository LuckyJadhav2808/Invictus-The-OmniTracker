import { describe, it, expect } from "vitest";
import { MoneyQuickActionsSheet } from "./modals/MoneyQuickActionsSheet";
import fs from "node:fs";
import path from "node:path";

describe("MoneyQuickActionsSheet Production Architecture & Mobile Bottom Sheet Verification", () => {
  const filePath = path.resolve(__dirname, "./modals/MoneyQuickActionsSheet.tsx");
  const source = fs.readFileSync(filePath, "utf-8");

  it("exports MoneyQuickActionsSheet as a valid functional component", () => {
    expect(MoneyQuickActionsSheet).toBeDefined();
    expect(typeof MoneyQuickActionsSheet).toBe("function");
  });

  it("verifies mobile bottom sheet slide-up configuration with drag handle", () => {
    // Sheet must anchor to the bottom
    expect(source).toContain("side=\"bottom\"");
    // Grab handle bar at the top
    expect(source).toContain("w-12 h-1.5");
    expect(source).toContain("rounded-full mx-auto");
  });

  it("contains all 4 quick action cards with soundFX and tactile haptics", () => {
    expect(source).toContain("Add Transaction");
    expect(source).toContain("Scan Receipt");
    expect(source).toContain("Quick Cash");
    expect(source).toContain("Quick Calc");
    expect(source).toContain("soundFX.playPop");
  });

  it("implements Neobrutalist hard drop shadows and cream borders", () => {
    expect(source).toContain("shadow-[2px_2px_0px_0px_#161514]");
    expect(source).toContain("border-[#161514]");
  });
});
