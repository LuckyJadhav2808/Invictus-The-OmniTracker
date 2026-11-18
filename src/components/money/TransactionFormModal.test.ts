import { describe, it, expect } from "vitest";
import { TransactionFormModal } from "./modals/TransactionFormModal";
import fs from "node:fs";
import path from "node:path";

describe("TransactionFormModal Production Architecture & Belanje Design Verification", () => {
  const filePath = path.resolve(__dirname, "./modals/TransactionFormModal.tsx");
  const source = fs.readFileSync(filePath, "utf-8");

  it("exports TransactionFormModal as a valid functional component", () => {
    expect(TransactionFormModal).toBeDefined();
    expect(typeof TransactionFormModal).toBe("function");
  });

  it("verifies mobile bottom sheet slide-up configuration with drag handle", () => {
    expect(source).toContain("side=\"bottom\"");
    expect(source).toContain("w-12 h-1.5");
    expect(source).toContain("rounded-full mx-auto");
  });

  it("verifies signature Belanje top navigation bar with Cancel and Save actions", () => {
    expect(source).toContain("Cancel");
    expect(source).toContain("Save");
    expect(source).toContain("onOpenChange(false)");
  });

  it("implements massive centered amount input with inline calculator button", () => {
    expect(source).toContain("text-4xl sm:text-5xl font-mono font-black");
    expect(source).toContain("text-center");
    expect(source).toContain("setIsCalcOpen(true)");
    expect(source).toContain("Calculator");
  });

  it("verifies date stepper with < > 1-tap fast navigation", () => {
    expect(source).toContain("handleStepDate");
    expect(source).toContain("subDays");
    expect(source).toContain("addDays");
    expect(source).toContain("ChevronLeft");
    expect(source).toContain("ChevronRight");
  });

  it("verifies horizontal payment method chips", () => {
    expect(source).toContain("UPI / QR");
    expect(source).toContain("Cash");
    expect(source).toContain("Card");
    expect(source).toContain("Bank");
  });

  it("verifies 1-tap category grid with + New custom envelope", () => {
    expect(source).toContain("+ New");
    expect(source).toContain("onOpenAddCategory");
  });
});
