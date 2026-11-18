import { describe, it, expect } from "vitest";
import { getCategorySquircleStyle } from "./BelanjeTransactionRow";

describe("BelanjeTransactionRow helper", () => {
  it("returns emerald theme for income transactions", () => {
    const style = getCategorySquircleStyle("Salary", true);
    expect(style.bg).toContain("emerald");
    expect(style.text).toContain("047857");
  });

  it("returns amber theme for food and dining", () => {
    const style = getCategorySquircleStyle("Swiggy Dining", false);
    expect(style.bg).toContain("amber");
  });

  it("returns sky theme for transport", () => {
    const style = getCategorySquircleStyle("Metro Pass", false);
    expect(style.bg).toContain("sky");
  });

  it("returns blue theme for bills and rent", () => {
    const style = getCategorySquircleStyle("Room Rent", false);
    expect(style.bg).toContain("blue");
  });

  it("returns purple theme for study and books", () => {
    const style = getCategorySquircleStyle("Books & Stationery", false);
    expect(style.bg).toContain("purple");
  });

  it("returns stone neutral fallback for unspecified categories", () => {
    const style = getCategorySquircleStyle("Misc Other", false);
    expect(style.bg).toContain("stone");
  });
});
