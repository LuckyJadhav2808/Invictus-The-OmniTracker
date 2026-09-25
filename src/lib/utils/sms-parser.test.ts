import { describe, it, expect } from "vitest";
import {
  parseBankSms,
  isApprovedBankSender,
  isOtpOrSecurityMessage,
  cleanMerchantName,
  autoCategorizeMerchant,
  generateDedupSignature,
} from "./sms-parser";

describe("Invictus Bank SMS Parser Engine", () => {
  describe("Security Sandbox & Sender Verification", () => {
    it("should accept valid TRAI bank sender headers", () => {
      expect(isApprovedBankSender("AD-HDFCBK")).toBe(true);
      expect(isApprovedBankSender("VM-SBINB")).toBe(true);
      expect(isApprovedBankSender("JX-ICICIB")).toBe(true);
      expect(isApprovedBankSender("BZ-AXISBK")).toBe(true);
      expect(isApprovedBankSender("BP-KOTAKB")).toBe(true);
      expect(isApprovedBankSender("PAYTMB")).toBe(true);
    });

    it("should reject standard personal mobile numbers and non-bank senders", () => {
      expect(isApprovedBankSender("+919876543210")).toBe(false);
      expect(isApprovedBankSender("9876543210")).toBe(false);
      expect(isApprovedBankSender("VK-SPAMMY")).toBe(false);
      expect(isApprovedBankSender("MOM")).toBe(false);
    });

    it("should detect and drop OTP and security messages with zero tolerance", () => {
      const otpSms1 = "Your OTP for login on NetBanking is 492019. Do not share with anyone.";
      const otpSms2 = "124958 is your one time password for ICICI transaction. Valid for 10 mins.";
      const otpSms3 = "Never share your ATM PIN, CVV or password with bank officials.";

      expect(isOtpOrSecurityMessage(otpSms1)).toBe(true);
      expect(isOtpOrSecurityMessage(otpSms2)).toBe(true);
      expect(isOtpOrSecurityMessage(otpSms3)).toBe(true);

      const parsed = parseBankSms("AD-HDFCBK", otpSms1);
      expect(parsed.isDrop).toBe(true);
      expect(parsed.dropReason).toBe("SECURITY_OTP_DETECTED");
      expect(parsed.transaction).toBeUndefined();
    });

    it("should reject promotional spam messages without transactional debit/credit verbs", () => {
      const promoSms = "Congratulations! You are eligible for pre-approved personal loan of Rs 5,00,000. Apply now.";
      const parsed = parseBankSms("AD-HDFCBK", promoSms);
      expect(parsed.isDrop).toBe(true);
      expect(parsed.dropReason).toBe("NOT_TRANSACTIONAL");
    });
  });

  describe("Real-World Bank SMS Parsing", () => {
    it("should parse HDFC Bank debit SMS correctly", () => {
      const sms = "Rs 450.00 debited from A/C **1234 on 25-SEP-26 to SWIGGY UPI. Avail bal: Rs 14,210.00";
      const res = parseBankSms("AD-HDFCBK", sms, "2026-09-25");

      expect(res.isDrop).toBe(false);
      expect(res.transaction).toBeDefined();
      expect(res.transaction?.amount).toBe(450);
      expect(res.transaction?.type).toBe("expense");
      expect(res.transaction?.merchant.toLowerCase()).toContain("swiggy");
      expect(res.transaction?.categorySuggestion).toBe("Dining & Outings");
      expect(res.transaction?.accountLast4).toBe("1234");
      expect(res.transaction?.bankName).toBe("HDFC");
    });

    it("should parse SBI UPI debit SMS correctly", () => {
      const sms = "Dear UPI user A/C 9876 debited by 120.0 on 25Sep26 transfer to ZOMATO Ref 423984";
      const res = parseBankSms("VM-SBINB", sms, "2026-09-25");

      expect(res.isDrop).toBe(false);
      expect(res.transaction).toBeDefined();
      expect(res.transaction?.amount).toBe(120);
      expect(res.transaction?.type).toBe("expense");
      expect(res.transaction?.merchant.toLowerCase()).toContain("zomato");
      expect(res.transaction?.categorySuggestion).toBe("Dining & Outings");
      expect(res.transaction?.accountLast4).toBe("9876");
    });

    it("should parse ICICI Bank debit SMS correctly", () => {
      const sms = "Acct XX5521 debited with INR 1,450.00 on 25-Sep-26. Info: BIL*NETFLIX. Bal: INR 32,100";
      const res = parseBankSms("JX-ICICIB", sms, "2026-09-25");

      expect(res.isDrop).toBe(false);
      expect(res.transaction).toBeDefined();
      expect(res.transaction?.amount).toBe(1450);
      expect(res.transaction?.type).toBe("expense");
      expect(res.transaction?.accountLast4).toBe("5521");
    });

    it("should parse credit / salary SMS correctly as income", () => {
      const sms = "INR 85,000.00 credited to A/C XX4921 on 25-Sep-26 by INFOSYS TECH SALARY. Avail Bal: INR 1,20,000";
      const res = parseBankSms("AD-HDFCBK", sms, "2026-09-25");

      expect(res.isDrop).toBe(false);
      expect(res.transaction).toBeDefined();
      expect(res.transaction?.amount).toBe(85000);
      expect(res.transaction?.type).toBe("income");
      expect(res.transaction?.accountLast4).toBe("4921");
    });

    it("should parse micro-transactions and auto-categorize chai/tea", () => {
      const sms = "Paid Rs 15.00 to CHAI POINT on 25-09-26 via UPI. Ref: 482910";
      const res = parseBankSms("PAYTMB", sms, "2026-09-25");

      expect(res.isDrop).toBe(false);
      expect(res.transaction?.amount).toBe(15);
      expect(res.transaction?.type).toBe("expense");
      expect(res.transaction?.categorySuggestion).toBe("Dining & Outings");
    });

    it("should parse Indian comma-formatted numbers correctly", () => {
      const sms = "Rs. 1,25,000.50 debited from A/C **9012 to TATA MOTORS on 25-Sep-26.";
      const res = parseBankSms("BZ-AXISBK", sms, "2026-09-25");

      expect(res.isDrop).toBe(false);
      expect(res.transaction?.amount).toBe(125000.5);
      expect(res.transaction?.accountLast4).toBe("9012");
    });

    it("should parse PNB UPI credit SMS and NOT extract balance or private info", () => {
      const sms = "A/c X3866 credited for INR 3110.00 on 13-08-26 17:10:36 by Bhushan Bhanuda thru UPI.AvlBal INR 99607.20(UPI:659143578131).-PNB";
      const res = parseBankSms("JK-PNBSMS-S", sms);

      expect(res.isDrop).toBe(false);
      expect(res.transaction).toBeDefined();
      expect(res.transaction?.amount).toBe(3110.0);
      expect(res.transaction?.type).toBe("income");
      expect(res.transaction?.merchant).toBe("Bhushan Bhanuda");
      expect(res.transaction?.accountLast4).toBe("3866");
      expect(res.transaction?.date).toBe("2026-08-13");
      expect(res.transaction?.bankName).toBe("PNB");

      // STRICT PRIVACY CHECK:
      // Verify that the user's private balance (99607.20) is NEVER captured anywhere in the output!
      const serialized = JSON.stringify(res);
      expect(serialized).not.toContain("99607");
      expect(serialized).not.toContain("AvlBal");
      expect(serialized).not.toContain("659143578131");
    });
  });

  describe("Deduplication Signature Generation", () => {
    it("should produce identical dedup signature for duplicate SMS", () => {
      const sig1 = generateDedupSignature(450, "Swiggy", "2026-09-25", "1234");
      const sig2 = generateDedupSignature(450, "swiggy", "2026-09-25", "1234");
      expect(sig1).toBe(sig2);
    });

    it("should produce different signatures for different amounts or dates", () => {
      const sig1 = generateDedupSignature(450, "Swiggy", "2026-09-25", "1234");
      const sig2 = generateDedupSignature(500, "Swiggy", "2026-09-25", "1234");
      const sig3 = generateDedupSignature(450, "Swiggy", "2026-09-26", "1234");
      expect(sig1).not.toBe(sig2);
      expect(sig1).not.toBe(sig3);
    });
  });
});
