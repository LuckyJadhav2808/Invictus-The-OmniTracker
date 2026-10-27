import { describe, it, expect } from "vitest";
import { parseBankSms, generateDedupSignature } from "./sms-local-parser";
import { MerchantCategoryCache } from "./merchant-cache";

describe("Invictus Zero-Knowledge Local SMS Parser Engine", () => {
  describe("1. Real-World User PNB Bank SMS Case Study", () => {
    it("should parse Punjab National Bank UPI transaction with 100% precision", () => {
      const pnbSms =
        "A/c X3866 debited INR 60.00 Dt 01-10-26 12:03:31 to Ambika Chemist thru UPI:693771418779.Bal INR 157737.60 Not u?Fwd this SMS to 9264092640 to block UPI.-PNB";

      const parsed = parseBankSms(pnbSms, "PNBSMS");

      expect(parsed).not.toBeNull();
      if (!parsed) return;

      // Assert precise extraction
      expect(parsed.amount).toBe(60.0);
      expect(parsed.merchant).toBe("Ambika Chemist");
      expect(parsed.paymentMethod).toBe("UPI");
      expect(parsed.referenceId).toBe("693771418779");
      expect(parsed.date).toBe("2026-10-01");
      expect(parsed.time).toBe("12:03:31");
      expect(parsed.accountMasked).toBe("3866");
      expect(parsed.bankName).toBe("PNB");

      // Critical Safety: The available balance (157,737.60) must NOT be parsed as the spend amount!
      expect(parsed.amount).not.toBe(157737.6);
    });
  });

  describe("2. Strict Zero-Tolerance OTP & Security Token Dropper", () => {
    it("should drop OTP authentication messages with zero bytes recorded", () => {
      const otp1 = "Your OTP for transaction of Rs 500 at Amazon is 492019. Do not share with anyone.";
      const otp2 = "One Time Password (OTP) for UPI verification is 123456. Valid for 5 mins.-HDFC";
      const otp3 = "Never share your CVV or UPI PIN: 8492. Bank never asks for PIN.";

      expect(parseBankSms(otp1, "HDFCBK")).toBeNull();
      expect(parseBankSms(otp2, "HDFCBK")).toBeNull();
      expect(parseBankSms(otp3, "SBINB")).toBeNull();
    });
  });

  describe("3. Strict Credit & Inflow Dropper (Outflow Policy)", () => {
    it("should drop salary, refunds, and peer incoming transfers", () => {
      const salarySms = "Your A/C 1234 is credited with INR 75,000.00 on 01-Oct-26 towards Salary. Bal INR 1,50,000.-HDFC";
      const refundSms = "Refund of Rs 299.00 received for order #4928 on your A/c XX4321. Bal INR 14,200.-ICICI";
      const cashbackSms = "Cashback received Rs 20.00 from GooglePay on your Account.-AXISBK";

      expect(parseBankSms(salarySms, "HDFCBK")).toBeNull();
      expect(parseBankSms(refundSms, "ICICIB")).toBeNull();
      expect(parseBankSms(cashbackSms, "AXISBK")).toBeNull();
    });
  });

  describe("4. Failed & Declined Transaction Dropper", () => {
    it("should drop failed or declined transactions so no false expenses are logged", () => {
      const failed1 = "Transaction of INR 450.00 to Swiggy failed due to technical error. Your account was not debited.-SBI";
      const failed2 = "UPI payment declined by bank for Rs. 1,200 at Zomato.-HDFCBK";

      expect(parseBankSms(failed1, "SBINB")).toBeNull();
      expect(parseBankSms(failed2, "HDFCBK")).toBeNull();
    });
  });

  describe("5. Top Indian Bank Syntax Variations", () => {
    it("should parse HDFC Bank UPI messages", () => {
      const hdfcSms =
        "Alert! INR 1,200.00 debited from HDFC Bank A/c 5678 on 24-OCT-26 to VPA blinkit@hdfcbank. Avail Bal: INR 34,200.50";
      const parsed = parseBankSms(hdfcSms, "HDFCBK");

      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(1200.0);
      expect(parsed?.accountMasked).toBe("5678");
      expect(parsed?.bankName).toBe("HDFC");
      expect(parsed?.paymentMethod).toBe("UPI");
      expect(parsed?.date).toBe("2026-10-24");
    });

    it("should parse State Bank of India (SBI) messages", () => {
      const sbiSms =
        "Dear SBI User, A/C 9012 debited by 350.0 on 24-Oct-26 by transfer to SWIGGY. Ref No 429104. Bal: Rs. 12,000";
      const parsed = parseBankSms(sbiSms, "SBINB");

      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(350.0);
      expect(parsed?.accountMasked).toBe("9012");
      expect(parsed?.bankName).toBe("SBI");
      expect(parsed?.merchant).toBe("SWIGGY");
    });

    it("should parse ICICI Bank messages with Info clause", () => {
      const iciciSms =
        "ICICI Bank Acct XX4321 debited for Rs 850.00 on 24-Oct-26. Info: VPS*Zomato. Available Balance is INR 25,000.00";
      const parsed = parseBankSms(iciciSms, "ICICIB");

      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(850.0);
      expect(parsed?.accountMasked).toBe("4321");
      expect(parsed?.bankName).toBe("ICICI");
      expect(parsed?.merchant).toBe("Zomato");
    });

    it("should parse Credit Card transactions and classify as Card", () => {
      const cardSms =
        "Spent INR 2,499.00 on Axis Bank Credit Card ending 7890 at ZARA on 24-10-2026. Avail Limit: INR 80,000";
      const parsed = parseBankSms(cardSms, "AXISBK");

      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(2499.0);
      expect(parsed?.paymentMethod).toBe("Card");
      expect(parsed?.merchant).toBe("ZARA");
      expect(parsed?.accountMasked).toBe("7890");
    });

    it("should parse ATM cash withdrawals and classify as ATM", () => {
      const atmSms =
        "Your A/c XX1122 debited with INR 2,000.00 on 20-Oct-26. ATM cash withdrawal at PNB ATM. Avl Bal: INR 10,000.-PNB";
      const parsed = parseBankSms(atmSms, "PNBSMS");

      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(2000.0);
      expect(parsed?.paymentMethod).toBe("ATM");
      expect(parsed?.accountMasked).toBe("1122");
    });
  });

  describe("6. Deduplication Consistency (SHA-256 Idempotency)", () => {
    it("should generate identical deduplication signatures for identical transaction parameters", () => {
      const sig1 = generateDedupSignature(60.0, "Ambika Chemist", "2026-10-01", "3866");
      const sig2 = generateDedupSignature(60.0, "Ambika Chemist", "2026-10-01", "3866");
      const sigDiffAmt = generateDedupSignature(70.0, "Ambika Chemist", "2026-10-01", "3866");

      expect(sig1).toBe(sig2);
      expect(sig1).not.toBe(sigDiffAmt);
    });
  });

  describe("7. Categorize-Once Local Cache & Pre-Seeded Mappings", () => {
    it("should resolve pre-seeded merchants in O(1) without network calls", () => {
      const chemistMatch = MerchantCategoryCache.get("Ambika Chemist");
      expect(chemistMatch).not.toBeNull();
      expect(chemistMatch?.categoryId).toBe("cat-health");

      const swiggyMatch = MerchantCategoryCache.get("Swiggy");
      expect(swiggyMatch).not.toBeNull();
      expect(swiggyMatch?.categoryId).toBe("cat-food");

      const blinkitMatch = MerchantCategoryCache.get("Blinkit");
      expect(blinkitMatch).not.toBeNull();
      expect(blinkitMatch?.categoryId).toBe("cat-groceries");

      const uberMatch = MerchantCategoryCache.get("Uber");
      expect(uberMatch).not.toBeNull();
      expect(uberMatch?.categoryId).toBe("cat-transport");
    });

    it("should remember newly categorized merchants in local memory", () => {
      MerchantCategoryCache.set("Chai Tapri Corner", "cat-food", "Food & Dining");
      const match = MerchantCategoryCache.get("Chai Tapri Corner");

      expect(match).not.toBeNull();
      expect(match?.categoryId).toBe("cat-food");
    });
  });

  describe("8. Batch Stress Matrix using dataset/transactions.csv", () => {
    it("should accurately parse synthetic SMS derived from real dataset transactions", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const csvPath = path.resolve(process.cwd(), "dataset/transactions.csv");

      if (!fs.existsSync(csvPath)) return;

      const content = fs.readFileSync(csvPath, "utf-8");
      const lines = content.split("\n").filter((l) => l.trim().length > 0);
      const rows = lines.slice(1, 26); // Test first 25 real records

      for (const line of rows) {
        const parts = line.split(",");
        if (parts.length < 8) continue;

        const receiverName = parts[4].trim();
        const receiverUpi = parts[5].trim();
        const amount = parseFloat(parts[6].trim());
        const status = parts[7].trim();

        if (status === "SUCCESS") {
          const syntheticSms = `A/c X9876 debited INR ${amount.toFixed(2)} Dt 24-06-24 12:00:00 to ${receiverName} thru UPI:${receiverUpi}. Bal INR 85200.00 Not u? Block-PNB`;
          const parsed = parseBankSms(syntheticSms, "PNBSMS");

          expect(parsed).not.toBeNull();
          expect(parsed?.amount).toBe(amount);
          expect(parsed?.paymentMethod).toBe("UPI");
          expect(parsed?.bankName).toBe("PNB");
          expect(parsed?.merchant).toBe(receiverName);
        } else if (status === "FAILED") {
          const syntheticFailedSms = `Transaction of INR ${amount.toFixed(2)} to ${receiverName} failed due to bank error.-PNB`;
          const parsed = parseBankSms(syntheticFailedSms, "PNBSMS");
          expect(parsed).toBeNull(); // Failed transactions must be dropped
        }
      }
    });
  });
});
