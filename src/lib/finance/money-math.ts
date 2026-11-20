import currency from "currency.js";

export interface CurrencyFormatOptions {
  symbol?: string;
  separator?: string;
  decimal?: string;
  precision?: number;
  useIndianFormat?: boolean;
}

/**
 * Creates a currency instance with safe defaults.
 */
export function money(value: number | string | currency, options?: currency.Options): currency {
  return currency(value, {
    precision: 2,
    ...options,
  });
}

/**
 * Exact decimal addition: a + b
 */
export function addMoney(a: number | string, b: number | string): number {
  return money(a).add(b).value;
}

/**
 * Exact decimal subtraction: a - b
 */
export function subtractMoney(a: number | string, b: number | string): number {
  return money(a).subtract(b).value;
}

/**
 * Exact decimal multiplication: a * b
 */
export function multiplyMoney(a: number | string, factor: number): number {
  return money(a).multiply(factor).value;
}

/**
 * Exact decimal division: a / b
 */
export function divideMoney(a: number | string, divisor: number): number {
  if (divisor === 0) return 0;
  return money(a).divide(divisor).value;
}

/**
 * Penny-perfect bill splitting with zero remainder loss.
 * Distributes pennies/paise across splitters so the sum exactly matches the original total.
 * Example: splitBill(100, 3) -> [33.34, 33.33, 33.33]
 */
export function splitBill(total: number | string, splitCount: number): number[] {
  if (splitCount <= 0) return [];
  if (splitCount === 1) return [money(total).value];

  const distributed = money(total).distribute(splitCount);
  return distributed.map((c) => c.value);
}

/**
 * Formats a currency value with support for Indian Lakh/Crore grouping (e.g. ₹1,50,000.00)
 * or standard Western thousands grouping (e.g. $150,000.00).
 */
export function formatMoney(
  value: number | string,
  options: CurrencyFormatOptions = {}
): string {
  const {
    symbol = "₹",
    separator = ",",
    decimal = ".",
    precision = 2,
    useIndianFormat = true,
  } = options;

  const numVal = money(value).value;
  const isNegative = numVal < 0;
  const absVal = Math.abs(numVal);

  if (useIndianFormat && symbol === "₹") {
    // Format according to Indian Numbering System: 1,00,000.00
    const parts = absVal.toFixed(precision).split(".");
    let intPart = parts[0];
    const decPart = parts.length > 1 ? parts[1] : "";

    if (intPart.length > 3) {
      const lastThree = intPart.substring(intPart.length - 3);
      const otherNumbers = intPart.substring(0, intPart.length - 3);
      intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, separator) + separator + lastThree;
    }

    const formatted = precision > 0 ? `${intPart}${decimal}${decPart}` : intPart;
    return `${isNegative ? "-" : ""}${symbol}${formatted}`;
  }

  // Standard Western formatting via currency.js
  return money(numVal, { symbol, separator, decimal, precision }).format();
}
