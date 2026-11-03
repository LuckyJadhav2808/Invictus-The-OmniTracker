/**
 * Neobrutalist Calculator Arithmetic Engine
 * Production math parsing with safe algebraic evaluation, continuous chaining (2+2+2),
 * floating-point precision sanitization, operator replacement, and interactive tape history.
 */

export interface CalcHistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

export interface CalculatorState {
  displayValue: string;
  expression: string;
  waitingForOperand: boolean;
  hasCalculated: boolean;
  lastOperator: string | null;
  lastOperand: string | null;
  history: CalcHistoryItem[];
}

export const INITIAL_CALCULATOR_STATE: CalculatorState = {
  displayValue: "0",
  expression: "",
  waitingForOperand: false,
  hasCalculated: false,
  lastOperator: null,
  lastOperand: null,
  history: [],
};

/**
 * Clean floating point noise (e.g. 0.1 + 0.2 = 0.3 instead of 0.30000000000000004)
 */
export function formatCleanNumber(num: number): string {
  if (isNaN(num)) return "Error";
  if (!isFinite(num)) return num > 0 ? "Infinity" : "-Infinity";

  // Prevent scientific notation for reasonable numbers, cap precision at 10 decimals
  const rounded = Math.round((num + Number.EPSILON) * 1e10) / 1e10;
  // Parse back to float to remove trailing zero artifacts, then stringify
  return String(rounded);
}

/**
 * Safe algebraic expression parser and evaluator.
 * Handles +, -, × (*), ÷ (/), and decimal numbers without eval().
 */
export function evaluateExpression(exprStr: string): number {
  const sanitized = exprStr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/=/g, "")
    .trim();

  if (!sanitized) return 0;

  // Tokenize string into numbers and operators
  // Matches floats/integers or operators (+, -, *, /)
  const regex = /(\d+\.?\d*|\.\d+|[+\-*/])/g;
  const matches = sanitized.match(regex);

  if (!matches || matches.length === 0) return 0;

  // Handle leading minus (negative first number)
  const tokens: (number | string)[] = [];
  let i = 0;

  if (matches[0] === "-") {
    if (matches.length > 1 && !isNaN(Number(matches[1]))) {
      tokens.push(-Number(matches[1]));
      i = 2;
    } else {
      return 0;
    }
  }

  for (; i < matches.length; i++) {
    const token = matches[i];
    if (token === "+" || token === "-" || token === "*" || token === "/") {
      tokens.push(token);
    } else {
      const num = Number(token);
      if (isNaN(num)) return 0;
      tokens.push(num);
    }
  }

  // If expression ends with an operator (e.g. "2 + 2 +"), drop trailing operator for intermediate evaluation
  while (
    tokens.length > 0 &&
    typeof tokens[tokens.length - 1] === "string"
  ) {
    tokens.pop();
  }

  if (tokens.length === 0) return 0;
  if (tokens.length === 1) return typeof tokens[0] === "number" ? tokens[0] : 0;

  // Pass 1: Multiplication and Division (higher precedence)
  const pass1: (number | string)[] = [];
  let idx = 0;

  while (idx < tokens.length) {
    const current = tokens[idx];
    if (current === "*" || current === "/") {
      const prev = pass1.pop();
      const next = tokens[idx + 1];

      if (typeof prev !== "number" || typeof next !== "number") {
        throw new Error("Malformed expression");
      }

      if (current === "/") {
        if (next === 0) {
          throw new Error("Cannot divide by 0");
        }
        pass1.push(prev / next);
      } else {
        pass1.push(prev * next);
      }
      idx += 2; // skip operator and next number
    } else {
      pass1.push(current);
      idx++;
    }
  }

  // Pass 2: Addition and Subtraction (left-to-right)
  let result = pass1[0] as number;
  let pIdx = 1;

  while (pIdx < pass1.length) {
    const op = pass1[pIdx];
    const nextVal = pass1[pIdx + 1];

    if (typeof nextVal !== "number") {
      break;
    }

    if (op === "+") {
      result += nextVal;
    } else if (op === "-") {
      result -= nextVal;
    }
    pIdx += 2;
  }

  return result;
}

/**
 * Live intermediate subtotal preview helper.
 * Returns null if the expression is incomplete or invalid.
 */
export function getLiveSubtotal(expression: string, displayValue: string): string | null {
  if (!expression || expression.includes("=")) return null;

  try {
    // If expression ends with an operator, evaluate the expression up to the operator
    const trimmed = expression.trim();
    if (/[+\-−×÷*\/]$/.test(trimmed)) {
      const val = evaluateExpression(trimmed);
      return formatCleanNumber(val);
    }

    const val = evaluateExpression(expression);
    return formatCleanNumber(val);
  } catch {
    return null;
  }
}

/**
 * Reducer for inputting a digit (0-9 or .)
 */
export function inputDigit(state: CalculatorState, digit: string): CalculatorState {
  const { displayValue, expression, waitingForOperand, hasCalculated } = state;

  if (hasCalculated) {
    const newDisplay = digit === "." ? "0." : digit;
    return {
      ...state,
      displayValue: newDisplay,
      expression: newDisplay,
      waitingForOperand: false,
      hasCalculated: false,
      lastOperator: null,
      lastOperand: null,
    };
  }

  if (waitingForOperand) {
    const newDisplay = digit === "." ? "0." : digit;
    const newExpr = `${expression}${newDisplay}`;
    return {
      ...state,
      displayValue: newDisplay,
      expression: newExpr,
      waitingForOperand: false,
    };
  }

  if (digit === ".") {
    if (displayValue.includes(".")) {
      return state; // Prevent duplicate decimal points
    }
    const newDisplay = `${displayValue}.`;
    const newExpr = expression
      ? replaceLastToken(expression, newDisplay)
      : newDisplay;
    return {
      ...state,
      displayValue: newDisplay,
      expression: newExpr,
    };
  }

  if (displayValue === "0") {
    const newExpr = expression
      ? replaceLastToken(expression, digit)
      : digit;
    return {
      ...state,
      displayValue: digit,
      expression: newExpr,
    };
  }

  // Append digit up to 14 characters
  if (displayValue.length >= 14) return state;

  const newDisplay = displayValue + digit;
  const newExpr = expression
    ? replaceLastToken(expression, newDisplay)
    : newDisplay;

  return {
    ...state,
    displayValue: newDisplay,
    expression: newExpr,
  };
}

/**
 * Reducer for continuous operators (+, −, ×, ÷).
 * If user chains (e.g. 2 + 2 then +), it computes intermediate result 4,
 * expands expression to "2 + 2 + ", and displays 4 as subtotal.
 */
export function inputOperator(state: CalculatorState, op: string): CalculatorState {
  const { displayValue, expression, waitingForOperand, hasCalculated } = state;

  // Normalized visual operator symbols
  const visualOp = op === "*" ? "×" : op === "/" ? "÷" : op === "-" ? "−" : op;

  // If continuing after equals, start chaining from previous result
  if (hasCalculated) {
    return {
      ...state,
      expression: `${displayValue} ${visualOp} `,
      waitingForOperand: true,
      hasCalculated: false,
      lastOperator: null,
      lastOperand: null,
    };
  }

  // Operator replacement: user typed "2 + " and then immediately clicked "×"
  if (waitingForOperand && expression.trim().length > 0) {
    // Replace the trailing operator with the new operator
    const replaced = expression.replace(/([+\-−×÷*\/])\s*$/, `${visualOp} `);
    return {
      ...state,
      expression: replaced,
      waitingForOperand: true,
    };
  }

  // Continuous Chaining: user typed "2 + 2" and now hits "+"
  if (expression) {
    try {
      // Evaluate the expression up to this point
      const intermediate = evaluateExpression(expression);
      const cleanSubtotal = formatCleanNumber(intermediate);

      return {
        ...state,
        displayValue: cleanSubtotal,
        expression: `${expression} ${visualOp} `,
        waitingForOperand: true,
      };
    } catch {
      return {
        ...state,
        expression: `${expression} ${visualOp} `,
        waitingForOperand: true,
      };
    }
  }

  // First operator in sequence
  return {
    ...state,
    expression: `${displayValue} ${visualOp} `,
    waitingForOperand: true,
  };
}

/**
 * Reducer for equals (=) calculation.
 * Computes the full continuous chain, records history, and supports repeated equals.
 */
export function calculateResult(
  state: CalculatorState,
  saveToHistory: (item: CalcHistoryItem) => void = () => {}
): CalculatorState {
  const { displayValue, expression, hasCalculated, lastOperator, lastOperand, history } = state;

  // Repeated equals: e.g. "2 + 3 = 5" -> pressing "=" again calculates "5 + 3 = 8"
  if (hasCalculated && lastOperator && lastOperand) {
    try {
      const repeatedExpr = `${displayValue} ${lastOperator} ${lastOperand}`;
      const resultNum = evaluateExpression(repeatedExpr);
      const cleanResult = formatCleanNumber(resultNum);

      const newItem: CalcHistoryItem = {
        id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        expression: repeatedExpr,
        result: cleanResult,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      saveToHistory(newItem);

      return {
        ...state,
        displayValue: cleanResult,
        expression: `${repeatedExpr} =`,
        hasCalculated: true,
        history: [newItem, ...history.slice(0, 24)],
      };
    } catch {
      return { ...state, displayValue: "Error" };
    }
  }

  if (!expression) return state;

  // Complete any trailing open expression (e.g. "2 + 2 + " -> "2 + 2 + 2")
  let fullExpr = expression.trim();
  if (/[+\-−×÷*\/]$/.test(fullExpr)) {
    fullExpr = `${fullExpr} ${displayValue}`;
  }

  try {
    const resultNum = evaluateExpression(fullExpr);
    const cleanResult = formatCleanNumber(resultNum);

    // Extract last operator and operand for repeated equals capability
    const match = fullExpr.match(/([+\-−×÷*\/])\s*([0-9.]+)\s*$/);
    const op = match ? match[1] : null;
    const operand = match ? match[2] : null;

    const newItem: CalcHistoryItem = {
      id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      expression: fullExpr,
      result: cleanResult,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    saveToHistory(newItem);

    return {
      ...state,
      displayValue: cleanResult,
      expression: `${fullExpr} =`,
      hasCalculated: true,
      lastOperator: op,
      lastOperand: operand,
      history: [newItem, ...history.slice(0, 24)],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error && err.message === "Cannot divide by 0"
      ? "Cannot divide by 0"
      : "Error";
    return {
      ...state,
      displayValue: msg,
      hasCalculated: true,
    };
  }
}

/**
 * Reducer for Clear / All Clear (C / AC)
 */
export function handleClearAction(state: CalculatorState): CalculatorState {
  const { displayValue, hasCalculated } = state;

  // If display is not 0 and calculation not finished, clear current entry (C)
  if (displayValue !== "0" && !hasCalculated) {
    return {
      ...state,
      displayValue: "0",
    };
  }

  // Otherwise perform All Clear (AC)
  return {
    ...INITIAL_CALCULATOR_STATE,
    history: state.history,
  };
}

/**
 * Reducer for Backspace (⌫)
 */
export function handleBackspaceAction(state: CalculatorState): CalculatorState {
  const { displayValue, expression, hasCalculated } = state;

  if (hasCalculated) {
    return {
      ...INITIAL_CALCULATOR_STATE,
      history: state.history,
    };
  }

  if (displayValue.length > 1) {
    const newDisplay = displayValue.slice(0, -1);
    const newExpr = expression ? replaceLastToken(expression, newDisplay) : newDisplay;
    return {
      ...state,
      displayValue: newDisplay,
      expression: newExpr,
    };
  }

  return {
    ...state,
    displayValue: "0",
    expression: expression ? replaceLastToken(expression, "0") : "0",
  };
}

/**
 * Reducer for Toggle Sign (±)
 */
export function handleToggleSignAction(state: CalculatorState): CalculatorState {
  const { displayValue, expression } = state;
  if (displayValue === "0" || displayValue === "Error") return state;

  const newDisplay = displayValue.startsWith("-")
    ? displayValue.slice(1)
    : `-${displayValue}`;

  const newExpr = expression
    ? replaceLastToken(expression, newDisplay)
    : newDisplay;

  return {
    ...state,
    displayValue: newDisplay,
    expression: newExpr,
  };
}

/**
 * Reducer for Percentage (%)
 */
export function handlePercentageAction(state: CalculatorState): CalculatorState {
  const { displayValue, expression } = state;
  const num = parseFloat(displayValue);
  if (isNaN(num)) return state;

  const percentVal = formatCleanNumber(num / 100);
  const newExpr = expression
    ? replaceLastToken(expression, percentVal)
    : percentVal;

  return {
    ...state,
    displayValue: percentVal,
    expression: newExpr,
  };
}

/**
 * Reducer for FinTech Split & Math Accelerators:
 * - half: divide active value by 2
 * - third: divide active value by 3
 * - tip18: multiply active value by 1.18 (18% tip/tax)
 * - round: round active value to nearest integer
 */
export function applyFinTechQuickAction(
  state: CalculatorState,
  action: "half" | "third" | "tip18" | "round"
): CalculatorState {
  const val = parseFloat(state.displayValue);
  if (isNaN(val)) return state;

  let computed: number;
  if (action === "half") {
    computed = val / 2;
  } else if (action === "third") {
    computed = val / 3;
  } else if (action === "tip18") {
    computed = val * 1.18;
  } else {
    computed = Math.round(val);
  }

  const clean = formatCleanNumber(computed);
  return {
    ...state,
    displayValue: clean,
    expression: `${clean}`,
    hasCalculated: false,
    waitingForOperand: false,
  };
}

/**
 * Helper to replace the last token/number in an expression string
 */
function replaceLastToken(expr: string, replacement: string): string {
  // If expression ends with a number or decimal
  const trimmed = expr.trimEnd();
  const match = trimmed.match(/(.*[\s+\-−×÷*\/])?([0-9.\-]+)$/);

  if (match) {
    const prefix = match[1] || "";
    return `${prefix}${replacement}`;
  }

  return replacement;
}
