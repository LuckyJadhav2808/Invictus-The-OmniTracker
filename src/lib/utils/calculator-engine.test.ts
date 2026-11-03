import { describe, it, expect } from "vitest";
import {
  evaluateExpression,
  formatCleanNumber,
  getLiveSubtotal,
  inputDigit,
  inputOperator,
  calculateResult,
  handleClearAction,
  handleBackspaceAction,
  handleToggleSignAction,
  handlePercentageAction,
  applyFinTechQuickAction,
  INITIAL_CALCULATOR_STATE,
  CalculatorState,
} from "./calculator-engine";

describe("Neobrutalist Calculator Engine", () => {
  describe("Arithmetic Expression Evaluator", () => {
    it("evaluates simple addition correctly", () => {
      expect(evaluateExpression("2 + 2")).toBe(4);
      expect(evaluateExpression("10 + 25")).toBe(35);
    });

    it("evaluates continuous operations like 2+2+2 correctly", () => {
      expect(evaluateExpression("2 + 2 + 2")).toBe(6);
      expect(evaluateExpression("2 + 2 + 2 + 2")).toBe(8);
      expect(evaluateExpression("10 + 20 + 30 + 40")).toBe(100);
    });

    it("evaluates mixed continuous operations with standard algebraic precedence", () => {
      expect(evaluateExpression("2 + 3 × 4")).toBe(14);
      expect(evaluateExpression("10 - 2 × 3")).toBe(4);
      expect(evaluateExpression("20 ÷ 4 + 5")).toBe(10);
    });

    it("handles floating-point calculations with clean precision", () => {
      const raw = evaluateExpression("0.1 + 0.2");
      expect(formatCleanNumber(raw)).toBe("0.3");
    });

    it("safely handles division by zero", () => {
      expect(() => evaluateExpression("10 ÷ 0")).toThrow("Cannot divide by 0");
    });

    it("handles negative leading numbers correctly", () => {
      expect(evaluateExpression("-5 + 15")).toBe(10);
      expect(evaluateExpression("-10 - 5")).toBe(-15);
    });
  });

  describe("Continuous Operations State Machine (2 + 2 + 2 Flow)", () => {
    it("executes the full 2+2+2 continuous flow seamlessly", () => {
      let state: CalculatorState = { ...INITIAL_CALCULATOR_STATE };

      // Type "2"
      state = inputDigit(state, "2");
      expect(state.displayValue).toBe("2");
      expect(state.expression).toBe("2");

      // Press "+"
      state = inputOperator(state, "+");
      expect(state.waitingForOperand).toBe(true);
      expect(state.expression).toBe("2 + ");

      // Type "2"
      state = inputDigit(state, "2");
      expect(state.displayValue).toBe("2");
      expect(state.expression).toBe("2 + 2");

      // Press "+" again (CONTINUOUS CHAIN TRIGGER)
      state = inputOperator(state, "+");
      // Intermediate subtotal should be evaluated to 4!
      expect(state.displayValue).toBe("4");
      expect(state.expression).toBe("2 + 2 + ");
      expect(state.waitingForOperand).toBe(true);

      // Type "2"
      state = inputDigit(state, "2");
      expect(state.displayValue).toBe("2");
      expect(state.expression).toBe("2 + 2 + 2");

      // Press "="
      state = calculateResult(state);
      expect(state.displayValue).toBe("6");
      expect(state.expression).toBe("2 + 2 + 2 =");
      expect(state.hasCalculated).toBe(true);
      expect(state.history.length).toBe(1);
      expect(state.history[0].expression).toBe("2 + 2 + 2");
      expect(state.history[0].result).toBe("6");
    });

    it("supports continuing calculation with an operator after equals", () => {
      let state: CalculatorState = { ...INITIAL_CALCULATOR_STATE };

      // 2 + 2 = 4
      state = inputDigit(state, "2");
      state = inputOperator(state, "+");
      state = inputDigit(state, "2");
      state = calculateResult(state);
      expect(state.displayValue).toBe("4");

      // Now press "+" to continue from 4
      state = inputOperator(state, "+");
      expect(state.expression).toBe("4 + ");
      expect(state.waitingForOperand).toBe(true);

      // Type 10
      state = inputDigit(state, "1");
      state = inputDigit(state, "0");
      expect(state.displayValue).toBe("10");

      // Press "="
      state = calculateResult(state);
      expect(state.displayValue).toBe("14");
      expect(state.expression).toBe("4 + 10 =");
    });

    it("gracefully replaces operators when user changes their mind", () => {
      let state: CalculatorState = { ...INITIAL_CALCULATOR_STATE };

      state = inputDigit(state, "5");
      state = inputOperator(state, "+");
      expect(state.expression).toBe("5 + ");

      // User changes mind to multiply (×)
      state = inputOperator(state, "×");
      expect(state.expression).toBe("5 × ");
      expect(state.waitingForOperand).toBe(true);

      state = inputDigit(state, "3");
      state = calculateResult(state);
      expect(state.displayValue).toBe("15");
    });

    it("supports repeated equals operation (5 + 2 = 7 = 9 = 11)", () => {
      let state: CalculatorState = { ...INITIAL_CALCULATOR_STATE };

      state = inputDigit(state, "5");
      state = inputOperator(state, "+");
      state = inputDigit(state, "2");
      state = calculateResult(state);
      expect(state.displayValue).toBe("7");

      // Press "=" again
      state = calculateResult(state);
      expect(state.displayValue).toBe("9");

      // Press "=" again
      state = calculateResult(state);
      expect(state.displayValue).toBe("11");
    });
  });

  describe("Real-time Subtotal Preview", () => {
    it("computes live running subtotal accurately", () => {
      expect(getLiveSubtotal("2 + 2", "2")).toBe("4");
      expect(getLiveSubtotal("2 + 2 + ", "2")).toBe("4");
      expect(getLiveSubtotal("10 × 5", "5")).toBe("50");
      expect(getLiveSubtotal("", "0")).toBe(null);
    });
  });

  describe("FinTech Split Actions", () => {
    it("computes 50/50 split (half)", () => {
      const state: CalculatorState = { ...INITIAL_CALCULATOR_STATE, displayValue: "1200" };
      const next = applyFinTechQuickAction(state, "half");
      expect(next.displayValue).toBe("600");
    });

    it("computes 3-way split (third)", () => {
      const state: CalculatorState = { ...INITIAL_CALCULATOR_STATE, displayValue: "900" };
      const next = applyFinTechQuickAction(state, "third");
      expect(next.displayValue).toBe("300");
    });

    it("computes +18% tip/tax", () => {
      const state: CalculatorState = { ...INITIAL_CALCULATOR_STATE, displayValue: "100" };
      const next = applyFinTechQuickAction(state, "tip18");
      expect(next.displayValue).toBe("118");
    });

    it("rounds decimals to nearest whole integer", () => {
      const state: CalculatorState = { ...INITIAL_CALCULATOR_STATE, displayValue: "45.75" };
      const next = applyFinTechQuickAction(state, "round");
      expect(next.displayValue).toBe("46");
    });
  });

  describe("Clear, Sign, Backspace & Percent Handlers", () => {
    it("handles context-aware clear (C clears entry, AC resets all)", () => {
      let state: CalculatorState = { ...INITIAL_CALCULATOR_STATE, displayValue: "42" };
      // First clear: clears active entry to 0
      state = handleClearAction(state);
      expect(state.displayValue).toBe("0");

      // Second clear on 0: All Clear
      state.expression = "2 + ";
      state = handleClearAction(state);
      expect(state.expression).toBe("");
    });

    it("toggles sign (±)", () => {
      let state: CalculatorState = { ...INITIAL_CALCULATOR_STATE, displayValue: "50" };
      state = handleToggleSignAction(state);
      expect(state.displayValue).toBe("-50");
      state = handleToggleSignAction(state);
      expect(state.displayValue).toBe("50");
    });

    it("computes percentage (%)", () => {
      const state: CalculatorState = { ...INITIAL_CALCULATOR_STATE, displayValue: "75" };
      const next = handlePercentageAction(state);
      expect(next.displayValue).toBe("0.75");
    });

    it("handles backspace (⌫)", () => {
      let state: CalculatorState = { ...INITIAL_CALCULATOR_STATE, displayValue: "123" };
      state = handleBackspaceAction(state);
      expect(state.displayValue).toBe("12");
      state = handleBackspaceAction(state);
      expect(state.displayValue).toBe("1");
      state = handleBackspaceAction(state);
      expect(state.displayValue).toBe("0");
    });
  });
});
