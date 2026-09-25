/**
 * Invictus Zero-Knowledge Bank SMS Extraction Engine
 * Enforces strict TRAI sender whitelisting, zero-tolerance OTP dropping,
 * multi-bank regex extraction, and merchant auto-categorization.
 */

import { MERCHANT_RULES } from "./merchant-categorizer";

export interface ParsedBankSmsResult {
  isDrop: boolean;
  dropReason?: "NOT_APPROVED_BANK_SENDER" | "SECURITY_OTP_DETECTED" | "NOT_TRANSACTIONAL" | "INVALID_AMOUNT";
  transaction?: {
    amount: number;
    type: "expense" | "income";
    merchant: string;
    categorySuggestion: string;
    suggestedIcon: string;
    date: string; // YYYY-MM-DD
    accountLast4?: string;
    bankName: string;
    referenceId?: string;
    dedupSignature: string;
    rawSender: string;
  };
}

// 1. TRAI Approved Indian Bank & Payment Header Suffixes (Case-Insensitive)
export const APPROVED_BANK_HEADERS = [
  "HDFCBK", // HDFC Bank
  "SBINB",  // State Bank of India
  "SBIPSG", // SBI Payment Gateway
  "ICICIB", // ICICI Bank
  "AXISBK", // Axis Bank
  "KOTAKB", // Kotak Mahindra
  "INDUSB", // IndusInd Bank
  "YESBNK", // Yes Bank
  "PNBSMS", // Punjab National Bank
  "BOISMS", // Bank of India
  "CANBNK", // Canara Bank
  "UBISMS", // Union Bank of India
  "IDFCFB", // IDFC First Bank
  "FEDBNK", // Federal Bank
  "PAYTMB", // Paytm Payments Bank
  "CREDBK", // CRED Financial
  "AMEXIN", // American Express India
  "SCISMS", // Standard Chartered India
];

// Regex matching 2-letter operator prefix + hyphen + bank header + optional DLT route suffix (e.g. AD-HDFCBK, JK-PNBSMS-S, VM-SBINB-G)
export const TRAI_SENDER_REGEX = new RegExp(
  `^(?:[A-Za-z]{2}[-_])?(?:${APPROVED_BANK_HEADERS.join("|")})(?:[-_][A-Za-z0-9]+)?$`,
  "i"
);

/**
 * Validates if the SMS sender is an approved financial institution.
 * Strictly rejects personal contacts or standard 10-digit mobile numbers.
 */
export function isApprovedBankSender(sender: string): boolean {
  if (!sender || typeof sender !== "string") return false;
  const cleanSender = sender.trim();
  // Reject 10-digit mobile numbers or international phone numbers (+91...)
  if (/^\+?\d{10,13}$/.test(cleanSender)) return false;
  return TRAI_SENDER_REGEX.test(cleanSender);
}

// 2. Strict OTP & Credential Dropper Regex (Zero-Tolerance)
export const OTP_SECURITY_REGEX = /\b(otp|one time password|verification code|secret code|cvv|atm pin|upi pin|netbanking password|passcode|temporary code)\b/i;

/**
 * Checks if the SMS contains sensitive security verification tokens.
 * If true, the message MUST be dropped immediately with 0 bytes recorded.
 */
export function isOtpOrSecurityMessage(body: string): boolean {
  if (!body || typeof body !== "string") return false;
  return OTP_SECURITY_REGEX.test(body);
}

// Clean merchant string from noisy UPI references and telecom markers
export function cleanMerchantName(raw: string): string {
  if (!raw) return "General Merchant";
  let cleaned = raw.trim();

  // Strip trailing reference IDs, punctuation, or "thru / via UPI"
  cleaned = cleaned.replace(/\s+(?:thru|through|via)\b.*$/i, "");
  cleaned = cleaned.replace(/(?:\.|\s*Ref.*|\s*UPI.*|\s*Avail.*|\s*Bal.*)$/i, "");
  // Strip leading/trailing special characters
  cleaned = cleaned.replace(/^[*\-_/\s]+|[*\-_/\s]+$/g, "").trim();

  // If contains UPI VPA (e.g. "swiggy@icici" or "amazon.pay@axis"), extract the handle name
  if (cleaned.includes("@")) {
    const handle = cleaned.split("@")[0].trim();
    if (handle.length > 2) {
      cleaned = handle.replace(/[._-]/g, " ");
    }
  }

  // Capitalize neatly
  if (cleaned.length > 0) {
    cleaned = cleaned
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  return cleaned || "General Merchant";
}

// Extract explicit transaction date from SMS if present (e.g. 13-08-26, 25-SEP-26)
export function extractTransactionDate(text: string, fallbackDate: string): string {
  // Format DD-MM-YY or DD-MM-YYYY (e.g. 13-08-26 or 13-08-2026)
  const dmyMatch = text.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // Format DD-MMM-YY (e.g. 25-SEP-26 or 25Sep26)
  const MONTHS: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const dMonMatch = text.match(/\b(\d{1,2})[-/]?([A-Za-z]{3})[-/]?(\d{2,4})\b/);
  if (dMonMatch) {
    const day = dMonMatch[1].padStart(2, "0");
    const mStr = dMonMatch[2].toLowerCase();
    const month = MONTHS[mStr];
    if (month) {
      let year = dMonMatch[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }
  }

  return fallbackDate;
}

// Auto-map merchant name to Invictus category
export function autoCategorizeMerchant(merchant: string): { category: string; icon: string } {
  const lower = merchant.toLowerCase();
  for (const rule of MERCHANT_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      return { category: rule.categoryName, icon: rule.suggestedIcon };
    }
  }
  return { category: "Shopping & Wants", icon: "💳" };
}

// Simple deterministic hash function for deduplication
export function generateDedupSignature(
  amount: number,
  merchant: string,
  date: string,
  accountLast4 = ""
): string {
  const norm = `${amount.toFixed(2)}_${merchant.toLowerCase().replace(/[^a-z0-9]/g, "")}_${date}_${accountLast4}`;
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (hash << 5) - hash + norm.charCodeAt(i);
    hash |= 0;
  }
  return `sms_dedup_${Math.abs(hash)}_${date.replace(/-/g, "")}`;
}

/**
 * Main parser entry point.
 * Given a sender and an SMS body, runs through the security sandbox and extracts transaction data.
 */
export function parseBankSms(sender: string, body: string, customDate?: string): ParsedBankSmsResult {
  // Step 1: Sender validation
  if (!isApprovedBankSender(sender)) {
    return { isDrop: true, dropReason: "NOT_APPROVED_BANK_SENDER" };
  }

  // Step 2: Zero-tolerance OTP dropping
  if (isOtpOrSecurityMessage(body)) {
    return { isDrop: true, dropReason: "SECURITY_OTP_DETECTED" };
  }

  const cleanBody = body.replace(/\n/g, " ").trim();
  const defaultDate = customDate || new Date().toISOString().split("T")[0];
  const dateStr = extractTransactionDate(cleanBody, defaultDate);

  // Step 3: Transaction intent check (reject loan offers / pre-approved spams)
  const isDebit = /(?:debited|spent|paid|sent|withdrawn|purchase)/i.test(cleanBody);
  const isCredit = /(?:credited|received|deposited|refunded)/i.test(cleanBody);

  if (!isDebit && !isCredit) {
    return { isDrop: true, dropReason: "NOT_TRANSACTIONAL" };
  }

  // Step 4: Extract Amount (Strip balance section first to guarantee account balance is NEVER read as transaction amount)
  const bodyForAmount = cleanBody.replace(/(?:AvlBal|Avail\s*Bal|Available\s*Balance|Bal:|Total\s*Bal).*$/i, "");

  const amountMatch =
    bodyForAmount.match(/(?:(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?))|(?:([\d,]+(?:\.\d{1,2})?)\s*(?:INR|Rs\.?|₹))/i) ||
    bodyForAmount.match(/(?:debited\s*(?:by|with|for)|credited\s*(?:by|with|for)|paid|sent)\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);

  if (!amountMatch) {
    return { isDrop: true, dropReason: "INVALID_AMOUNT" };
  }

  const rawAmountStr = (amountMatch[1] || amountMatch[2]).replace(/,/g, "");
  const amount = parseFloat(rawAmountStr);
  if (isNaN(amount) || amount <= 0) {
    return { isDrop: true, dropReason: "INVALID_AMOUNT" };
  }

  // Step 5: Extract Account/Card Last 4 digits (e.g. A/C XX1234, ending 1234, card 1234)
  const accMatch = cleanBody.match(/(?:A\/C|acct|acc|card|ending|vpa|xx|\*{2,})\s*([xX*]*(\d{4}))/i);
  const accountLast4 = accMatch ? accMatch[2] : undefined;

  // Step 6: Identify Bank Name from Sender
  let bankName = "Bank";
  const upperSender = sender.toUpperCase();
  for (const b of APPROVED_BANK_HEADERS) {
    if (upperSender.includes(b)) {
      bankName = b.replace(/BK|SMS|PSG/g, "");
      break;
    }
  }

  // Step 7: Extract Merchant / Beneficiary
  let rawMerchant = "UPI Payment";

  if (isDebit) {
    // Patterns like: "to SWIGGY", "at STARBUCKS", "info: BIL*NETFLIX", "transfer to MOHD"
    const merchantMatch =
      cleanBody.match(/(?:to|at|info:?|vpa)\s+([A-Za-z0-9._\-\* ]{2,35}?)(?:\s*(?:on|ref|upi|avail|bal|\.|\/|$))/i) ||
      cleanBody.match(/(?:paid to|spent on)\s+([A-Za-z0-9._\-\* ]{2,35}?)(?:\s*(?:on|ref|upi|avail|bal|\.|\/|$))/i);

    if (merchantMatch && merchantMatch[1]) {
      rawMerchant = merchantMatch[1].trim();
    }
  } else {
    // Patterns like: "from SWIGGY REFUND", "credited by XYZ"
    const creditMerchantMatch = cleanBody.match(/(?:from|by)\s+([A-Za-z0-9._\-\* ]{2,35}?)(?:\s*(?:on|ref|upi|avail|bal|\.|\/|$))/i);
    if (creditMerchantMatch && creditMerchantMatch[1]) {
      rawMerchant = creditMerchantMatch[1].trim();
    } else {
      rawMerchant = "Salary / Deposit";
    }
  }

  const cleanMerchant = cleanMerchantName(rawMerchant);
  const categoryInfo = autoCategorizeMerchant(cleanMerchant);
  const dedupSignature = generateDedupSignature(amount, cleanMerchant, dateStr, accountLast4);

  return {
    isDrop: false,
    transaction: {
      amount,
      type: isCredit && !isDebit ? "income" : "expense",
      merchant: cleanMerchant,
      categorySuggestion: categoryInfo.category,
      suggestedIcon: categoryInfo.icon,
      date: dateStr,
      accountLast4,
      bankName,
      dedupSignature,
      rawSender: sender,
    },
  };
}
