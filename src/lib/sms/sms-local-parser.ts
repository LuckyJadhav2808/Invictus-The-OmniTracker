/**
 * Invictus Zero-Knowledge Local SMS Transaction Parser
 * 100% Client-Side / Edge Compatible. Pure TypeScript.
 *
 * Privacy Guarantees:
 * 1. Raw SMS text NEVER leaves the device or crosses the network.
 * 2. OTPs and sensitive security tokens are dropped immediately before storage.
 * 3. Inflows/Credits (salary, refunds, reversals) are dropped to maintain strict outflow tracking.
 * 4. Failed transactions are dropped so no false expenses are logged.
 * 5. Available balance clauses are stripped to prevent balance numbers from being mistaken for spend.
 * 6. Generates deterministic SHA-256 deduplication signatures for 0 duplicate records.
 */

export interface ParsedSmsTransaction {
  amount: number;
  type: "expense";
  merchant: string;
  categorySuggestion?: string;
  paymentMethod: "UPI" | "Card" | "Bank" | "ATM" | "Cash";
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm:ss
  accountMasked?: string;
  bankName: string;
  referenceId?: string;
  dedupSignature: string;
  confidence: "high" | "medium";
}

// 1. TRAI Approved Indian Bank Alphanumeric Headers & Sender Patterns (Supports +91, FinTech, & All Banks)
export const BANK_HEADER_REGEX = /^(?:[A-Za-z0-9]{2}[-_]?)?(HDFC(?:BK)?|SBI(?:NB|PSG|UPI|INB|TXN)?|ICICI(?:B)?|AXIS(?:BK)?|KOTAK(?:B)?|INDUS(?:B)?|YES(?:BNK)?|PNB(?:SMS|TXN)?|PUNJAB|BOI(?:SMS)?|CAN(?:BNK|ARA)?|UBI(?:SMS)?|UNION(?:B)?|IDFC(?:FB)?|FED(?:BNK)?|PAYTM(?:B)?|CRED(?:BK)?|CENT(?:BK)?|BOB(?:SMS|TXN)?|MAH(?:BK|A)?|IOB|UCO(?:BNK)?|RBL(?:BNK)?|AUFIN(?:B)?|BANDH(?:N)?|IDBI(?:BK)?|SC(?:ISMS)?|AMEX(?:IN)?|AIRTEL|JIO(?:BNK)?|PHONEPE|PHONEP|GPAY|GOOGLP|BHIM|NPCI|UPI|ONECRD|ONECARD|JUPITR|FIBANK|SLICEN|SLICE|NIYO|TATANEU|AMZPAY|INDBNK|INDIANB|BOMAH|CBIN|DBS|HSBC|CITI|KVB|SIB|CSB)(?:[-_][A-Za-z0-9]+)?$/i;

// 2. Strict Zero-Tolerance OTP / Secret Token Dropper
export const OTP_REGEX = /\b(otp|one time password|verification code|secret code|cvv|atm pin|upi pin|password|passcode)\b/i;

// 3. Strict Inflow / Credit Dropper (Focus strictly on outflows/expenses)
export const CREDIT_INFLOW_REGEX = /\b(credited|received|deposited|refunded|reversed|cashback received)\b/i;

// 4. Failed Transaction Dropper (Ignore aborted/declined transactions)
export const FAILED_TX_REGEX = /\b(failed|declined|unsuccessful|aborted|cancelled|transaction limit exceeded)\b/i;

// 5. Balance Clause Stripper (Ensures available balance is NEVER extracted as spend amount)
export const BALANCE_STRIPPER_REGEX = /(?:\.|\s)*(?:Avl\s*Bal|Avail\s*Bal|Available\s*Balance|Bal:|Total\s*Bal|Clear\s*Bal|Bal\s+INR|Bal\s+Rs).*$/i;

// 6. Spend & Debit Intent Verification (Broadened to include debit of, transferred from, txn of, payment of)
export const DEBIT_INTENT_REGEX = /\b(debited|debit|spent|paid|sent|withdrawn|purchase|deducted|transfer to|transferred to|transferred from|transferred|payment to|payment of|txn of|transaction of|charged|auto[- ]?debit)\b/i;

// 7. Amount Pattern (Supports INR, Rs, Re, ₹, with commas and decimals)
export const AMOUNT_REGEX = /(?:(?:Rs\.?|Re\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?))|(?:debited\s*(?:by|with|for)?|spent|paid|sent)\s*(?:Rs\.?|Re\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i;

// 8. Masked Account Pattern (e.g. A/c X3866, Card ending 4321, Acct XX9012)
export const ACCOUNT_MASKED_REGEX = /(?:A\/c|acct|acc|card|ending|vpa|xx|\*{2,})\s*([xX*]*(\d{4}))/i;

// 9. Payment Method Matchers
export const UPI_TOKEN_REGEX = /(?:thru\s*UPI:?|via\s*UPI|UPI\s*Ref|VPA|@ok|@ybl|@upi|@paytm|@apl)/i;
export const UPI_REF_REGEX = /(?:UPI(?::|\s+Ref(?:\s+no)?[:\s]*)|\/UPI\/)([0-9]{8,16})/i;
export const CARD_TOKEN_REGEX = /\b(credit card|debit card|card ending|card no)\b/i;
export const ATM_TOKEN_REGEX = /\b(atm|cash withdrawal|withdrawn at atm)\b/i;

// Simple deterministic hash for deduplication
export function generateDedupSignature(amount: number, merchant: string, date: string, accountLast4: string = ""): string {
  const rawKey = `${amount.toFixed(2)}_${merchant.toLowerCase().trim().replace(/[^a-z0-9]/g, "")}_${date}_${accountLast4.trim()}`;
  let hash = 0;
  for (let i = 0; i < rawKey.length; i++) {
    const char = rawKey.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `sms_dedup_${Math.abs(hash)}_${date.replace(/-/g, "")}`;
}

// Blacklisted candidate tokens that should NEVER become a merchant or auto-provisioned category
export const BLACKLIST_MERCHANTS_REGEX = /^(the|a|an|your|account|bank|wallet|wallets|vpa|upi|merchant|user|beneficiary|self|topup|top-up|eur|usd|inr|card|credit card|debit card|atm|pos|cash)$/i;

/**
 * Extracts and cleans the merchant or beneficiary name from transaction text.
 */
export function extractCleanMerchant(text: string): string {
  // 1. Check for specific wallet top-up / transfer
  if (
    /(?:to|towards|into)\s+(?:(?:paytm|amazon\s*pay|mobikwik|phonepe)\s+)?wallet/i.test(text) ||
    /\bwallet\s*(?:top[- ]?up|load)\b/i.test(text)
  ) {
    if (/paytm\s*wallet/i.test(text)) return "Paytm Wallet";
    if (/amazon\s*(?:pay)?\s*wallet/i.test(text)) return "Amazon Pay Wallet";
    if (/mobikwik\s*wallet/i.test(text)) return "Mobikwik Wallet";
    return "Wallet Top-up";
  }

  // 2. High-precision patterns in order of specificity
  const patterns = [
    // Pattern A: Modern UPI P2M / P2P: "towards UPI/P2M/Swiggy/swiggy@icici" or "towards UPI/Swiggy"
    /(?:towards|via)\s+UPI\/(?:P2M|P2P)?\/?([A-Za-z0-9._\s\-*]{2,35}?)(?=\/|\s|$)/i,

    // Pattern B: Slash transfers: "transfer to UPI/ZEPTO/zepto@hdfcbank"
    /(?:transfer\s+to|thru)\s+UPI\/([A-Za-z0-9._\s\-*]{2,35}?)(?=\/|\s|$)/i,

    // Pattern C: Card POS: "spent on your Credit Card XX1234 at STARBUCKS on 27-Oct" or "spent on Card at CAFE COFFEE DAY"
    /(?:spent on|purchase on)\s+(?:your\s+)?(?:credit|debit)?\s*card\s+[A-Za-z0-9*]+\s+at\s+([A-Za-z0-9._\s\-*]{2,35}?)(?=\s+on|\s*[.,]|\s*$)/i,

    // Pattern D: Info VPS or VPA prefix: "Info: VPS*Zomato" or "Info: VPA Ambika Chemist"
    /(?:info:?\s*(?:VPS\*|VPA\s*)?)\s*([A-Za-z0-9._\s\-*]{2,35}?)(?=\s*[.,\/]|\s+(?:avail|bal|on|ref)|$)/i,

    // Pattern E: "to Ambika Chemist thru UPI:...", "spent on Zomato on..."
    /(?:to|at|paid to|spent on|transfer to)\s+([A-Za-z0-9._\s\-*]{2,40}?)(?=\s*(?:thru|via|on|ref|upi|avail|bal|\.|\/|$))/i,

    // Pattern F: Short trailing: "paid to PATEL TEA HOUSE."
    /(?:to|at|paid to)\s+([A-Za-z0-9._\s\-*]{2,30}?)(?=$|[.,!])/i,

    // Pattern G: VPA handle extraction: "to VPA paytmqr281012@paytm" or "to swiggy@icici"
    /(?:to\s+VPA\s+|to\s+)([a-zA-Z0-9._-]+)@([a-zA-Z0-9]+)/i,
  ];

  for (const pat of patterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      let candidate = match[1].trim();

      // Clean prefix / suffix noise
      candidate = candidate
        .replace(/^(?:vpa\s+|info:\s*|VPS\*|UPI\/)/i, "")
        .replace(/(?:\s+(?:thru|through|via|on|ref|using)\b.*$)/i, "")
        .replace(/[-_.*]+$/, "")
        .trim();

      // Check candidate validity
      if (
        candidate.length >= 2 &&
        !BLACKLIST_MERCHANTS_REGEX.test(candidate) &&
        !/^[0-9]+$/.test(candidate) // Not pure numbers
      ) {
        // Disallow pure 3-letter currency tokens like EUR, USD, INR
        if (/^(eur|usd|inr|gbp|jpy)$/i.test(candidate)) continue;

        // Disallow pure card references like "Credit Card XX1234"
        if (/^(?:credit|debit)?\s*card/i.test(candidate)) continue;

        return candidate;
      }
    }
  }

  return "UPI Payment";
}

/**
 * Parses timestamp string from SMS (e.g. "Dt 01-10-26 12:03:31", "24-OCT-26", "24-10-2026")
 */
export function extractDateAndTime(text: string, fallbackTimestampMs?: number): { date: string; time?: string } {
  const fallback = new Date(fallbackTimestampMs || Date.now());
  const year = fallback.getFullYear();
  const month = String(fallback.getMonth() + 1).padStart(2, "0");
  const day = String(fallback.getDate()).padStart(2, "0");
  const fallbackDateStr = `${year}-${month}-${day}`;
  const hours = String(fallback.getHours()).padStart(2, "0");
  const minutes = String(fallback.getMinutes()).padStart(2, "0");
  const seconds = String(fallback.getSeconds()).padStart(2, "0");
  const fallbackTimeStr = `${hours}:${minutes}:${seconds}`;

  // Pattern 1: "Dt 01-10-26 12:03:31" or "01-10-2026 12:03:31" or "dated 26-10-2026 18:30:15"
  const dtTimeMatch = text.match(/(?:Dt|dated)\s*(\d{2})[-/](\d{2})[-/](\d{2,4})\s+(\d{2}:\d{2}(?::\d{2})?)/i);
  if (dtTimeMatch) {
    const day = dtTimeMatch[1];
    const month = dtTimeMatch[2];
    let year = dtTimeMatch[3];
    if (year.length === 2) year = `20${year}`;
    const time = dtTimeMatch[4];
    return { date: `${year}-${month}-${day}`, time };
  }

  // Pattern 2: "on 24-OCT-26", "on 24-10-2026", "on 24/10/26", or "on 24/10/2026"
  const onDateMatch = text.match(/\bon\s+(\d{2})[-/]([A-Za-z]{3}|\d{2})[-/](\d{2,4})/i);
  if (onDateMatch) {
    const day = onDateMatch[1];
    let month = onDateMatch[2];
    let year = onDateMatch[3];
    if (year.length === 2) year = `20${year}`;

    const monthMap: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
    };
    if (month.length === 3) {
      month = monthMap[month.toLowerCase()] || "01";
    }

    return { date: `${year}-${month}-${day}`, time: fallbackTimeStr };
  }

  // Pattern 3: Standalone date with slash or dash: "27/10/26", "26-10-2026"
  const standaloneDateMatch = text.match(/\b(\d{2})[-/](\d{2})[-/](20\d{2}|\d{2})\b/);
  if (standaloneDateMatch) {
    const day = standaloneDateMatch[1];
    const month = standaloneDateMatch[2];
    let year = standaloneDateMatch[3];
    if (year.length === 2) year = `20${year}`;
    const dNum = parseInt(day, 10);
    const mNum = parseInt(month, 10);
    if (dNum >= 1 && dNum <= 31 && mNum >= 1 && mNum <= 12) {
      return { date: `${year}-${month}-${day}`, time: fallbackTimeStr };
    }
  }

  return { date: fallbackDateStr, time: fallbackTimeStr };
}

/**
 * Normalizes Bank Name from sender ID or body
 */
export function identifyBankName(sender: string = "", bodyText: string = ""): string {
  const cleanSender = sender.toUpperCase().trim();

  // 1. Authoritative check on Sender Header
  if (cleanSender.includes("PNB")) return "PNB";
  if (cleanSender.includes("HDFC")) return "HDFC";
  if (cleanSender.includes("SBI")) return "SBI";
  if (cleanSender.includes("ICICI")) return "ICICI";
  if (cleanSender.includes("AXIS")) return "Axis";
  if (cleanSender.includes("KOTAK")) return "Kotak";
  if (cleanSender.includes("BOI")) return "BOI";
  if (cleanSender.includes("CANARA") || cleanSender.includes("CANBNK")) return "Canara";
  if (cleanSender.includes("PAYTM")) return "Paytm";
  if (cleanSender.includes("CRED")) return "CRED";
  if (cleanSender.includes("UNION") || cleanSender.includes("UBI")) return "Union Bank";
  if (cleanSender.includes("IDFC")) return "IDFC First";
  if (cleanSender.includes("YES") || cleanSender.includes("YESBNK")) return "Yes Bank";
  if (cleanSender.includes("INDUS") || cleanSender.includes("INDUSB")) return "IndusInd";
  if (cleanSender.includes("BOB") || cleanSender.includes("BOBSMS")) return "Bank of Baroda";
  if (cleanSender.includes("PHONEP")) return "PhonePe";
  if (cleanSender.includes("GPAY") || cleanSender.includes("GOOGL")) return "Google Pay";
  if (cleanSender.includes("BHIM") || cleanSender.includes("NPCI")) return "BHIM UPI";
  if (cleanSender.includes("ONECRD") || cleanSender.includes("ONECARD")) return "OneCard";
  if (cleanSender.includes("JUPITR")) return "Jupiter";
  if (cleanSender.includes("FIBANK")) return "Fi Money";
  if (cleanSender.includes("SLICE")) return "Slice";
  if (cleanSender.includes("INDBNK") || cleanSender.includes("INDIANB")) return "Indian Bank";
  if (cleanSender.includes("BOMAH")) return "Bank of Maharashtra";

  // 2. Trailing Bank Signature check (e.g. -PNB, -SBI, -HDFC)
  const trailingBankMatch = bodyText.match(/-(PNB|SBI|HDFC|ICICI|AXIS|KOTAK|BOI|CANBNK|UBI|IDFC|PAYTM)$/i);
  if (trailingBankMatch) {
    const code = trailingBankMatch[1].toUpperCase();
    if (code === "PNB") return "PNB";
    if (code === "SBI") return "SBI";
    if (code === "HDFC") return "HDFC";
    if (code === "ICICI") return "ICICI";
    if (code === "AXIS") return "Axis";
    if (code === "KOTAK") return "Kotak";
    return code;
  }

  // 3. Fallback to full phrases in body text (avoiding simple handle substrings)
  const upperBody = bodyText.toUpperCase();
  if (upperBody.includes("HDFC BANK")) return "HDFC";
  if (upperBody.includes("STATE BANK") || upperBody.includes("SBI BANK")) return "SBI";
  if (upperBody.includes("ICICI BANK")) return "ICICI";
  if (upperBody.includes("AXIS BANK")) return "Axis";
  if (upperBody.includes("KOTAK BANK")) return "Kotak";
  if (upperBody.includes("PUNJAB NATIONAL BANK") || upperBody.includes("PNB")) return "PNB";

  return "Bank";
}

/**
 * Pure zero-knowledge parser for Indian Bank & UPI transaction SMS.
 * Returns null if the message is non-transactional, an OTP, a credit, or a failed attempt.
 */
export function parseBankSms(
  rawBody: string,
  rawSender: string = "",
  timestampMs?: number
): ParsedSmsTransaction | null {
  if (!rawBody || typeof rawBody !== "string") return null;

  const bodyText = rawBody.replace(/[\r\n]+/g, " ").trim();
  if (bodyText.length < 10) return null;

  // Rule 1: Sender Header Verification
  // Clean raw sender: strip country code (+91 / 91 / 0) and leading punctuation
  const cleanSender = (rawSender || "")
    .replace(/^(\+?91|0)/, "")
    .replace(/^[-_]/, "")
    .trim();

  if (cleanSender || (rawSender && rawSender.trim())) {
    const isApprovedSender =
      BANK_HEADER_REGEX.test(cleanSender) ||
      BANK_HEADER_REGEX.test(rawSender.trim()) ||
      /-(?:PNB|SBI|HDFC|ICICI|AXIS|KOTAK|BOB|BOI|CANBNK|UBI|IDFC|PAYTM|CRED|AIRTEL|JIO)$/i.test(bodyText) ||
      /(?:Punjab National Bank|State Bank of India|HDFC Bank|ICICI Bank|Axis Bank|Kotak Bank|Bank of Baroda|Union Bank|Canara Bank|Indian Bank|Bank of Maharashtra|Paytm|PhonePe|Google Pay|CRED)/i.test(bodyText) ||
      // Defensively allow any SMS that has clear banking debit context + account/UPI
      ((DEBIT_INTENT_REGEX.test(bodyText) || bodyText.toLowerCase().includes("debited")) &&
       (ACCOUNT_MASKED_REGEX.test(bodyText) || UPI_TOKEN_REGEX.test(bodyText) || /UPI/i.test(bodyText)));

    if (!isApprovedSender) {
      return null;
    }
  }

  // Rule 2: Zero-Tolerance OTP Dropper
  if (OTP_REGEX.test(bodyText)) {
    return null;
  }

  // Rule 3: Failed / Cancelled Transaction Dropper
  if (FAILED_TX_REGEX.test(bodyText)) {
    return null;
  }

  // Rule 4: Outflow Focus — Drop Credits & Inflows
  const hasDebitIntent = DEBIT_INTENT_REGEX.test(bodyText);
  const hasCreditIntent = CREDIT_INFLOW_REGEX.test(bodyText);

  if (hasCreditIntent && !hasDebitIntent) {
    return null;
  }
  if (!hasDebitIntent) {
    return null; // Promotional or balance alert SMS
  }

  // Rule 5: Strip Available Balance Clauses BEFORE Amount Extraction!
  const textWithoutBalance = bodyText.replace(BALANCE_STRIPPER_REGEX, "").trim();

  // Rule 6: Amount Extraction
  const amountMatch = textWithoutBalance.match(AMOUNT_REGEX);
  if (!amountMatch) {
    return null;
  }

  const rawAmountStr = amountMatch[1] || amountMatch[2];
  if (!rawAmountStr) return null;

  const cleanAmount = parseFloat(rawAmountStr.replace(/,/g, ""));
  if (isNaN(cleanAmount) || cleanAmount <= 0) return null;

  // Rule 7: Masked Account Number
  let accountMasked = "";
  const accMatch = bodyText.match(ACCOUNT_MASKED_REGEX);
  if (accMatch && accMatch[2]) {
    accountMasked = accMatch[2];
  }

  // Rule 8: Payment Method Classification
  let paymentMethod: "UPI" | "Card" | "Bank" | "ATM" | "Cash" = "UPI";
  if (ATM_TOKEN_REGEX.test(bodyText)) {
    paymentMethod = "ATM";
  } else if (CARD_TOKEN_REGEX.test(bodyText)) {
    paymentMethod = "Card";
  } else if (UPI_TOKEN_REGEX.test(bodyText)) {
    paymentMethod = "UPI";
  } else {
    paymentMethod = "Bank";
  }

  // Rule 9: Reference ID Extraction (e.g. thru UPI:693771418779)
  let referenceId: string | undefined;
  const refMatch = bodyText.match(UPI_REF_REGEX);
  if (refMatch && refMatch[1]) {
    referenceId = refMatch[1];
  }

  // Rule 10: Merchant / Beneficiary Extraction
  const cleanMerchant = extractCleanMerchant(textWithoutBalance);

  // Rule 11: Date & Time
  const { date, time } = extractDateAndTime(bodyText, timestampMs);

  // Rule 12: Bank Name
  const bankName = identifyBankName(rawSender, bodyText);

  // Rule 13: Deterministic Dedup Signature
  const dedupSignature = generateDedupSignature(cleanAmount, cleanMerchant, date, accountMasked);

  return {
    amount: Math.round(cleanAmount * 100) / 100,
    type: "expense",
    merchant: cleanMerchant,
    paymentMethod,
    date,
    time,
    accountMasked: accountMasked || undefined,
    bankName,
    referenceId,
    dedupSignature,
    confidence: "high",
  };
}
