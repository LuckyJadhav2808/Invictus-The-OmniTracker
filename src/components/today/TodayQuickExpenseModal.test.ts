import { describe, it, expect } from "vitest";
import { TodayQuickExpenseModal } from "./TodayQuickExpenseModal";
import { parseSmartIntent } from "@/lib/nlp/smart-intent-parser";

describe("TodayQuickExpenseModal & Smart NLP Quick Fill", () => {
  it("exports TodayQuickExpenseModal as a valid functional component", () => {
    expect(TodayQuickExpenseModal).toBeDefined();
    expect(typeof TodayQuickExpenseModal).toBe("function");
  });

  it("extracts expense amount and category correctly for quick log auto-fill", () => {
    const parsed = parseSmartIntent("Swiggy dinner 450");
    expect(parsed.domain).toBe("MONEY_EXPENSE");
    expect(parsed.expense?.amount).toBe(450);
    expect(parsed.expense?.category).toBe("Food");
  });

  it("extracts travel expenses accurately", () => {
    const parsed = parseSmartIntent("Uber to airport ₹620");
    expect(parsed.domain).toBe("MONEY_EXPENSE");
    expect(parsed.expense?.amount).toBe(620);
    expect(parsed.expense?.category).toBe("Travel");
  });
});
