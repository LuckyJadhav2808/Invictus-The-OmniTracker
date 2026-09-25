"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseBankSms, ParsedBankSmsResult } from "@/lib/utils/sms-parser";
import { useBankSmsTracker } from "@/lib/hooks/useBankSmsTracker";
import { ShieldCheck, ShieldAlert, CheckCircle, ArrowRight, Zap, RefreshCw } from "lucide-react";

interface SmsSimulatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SAMPLE_PRESETS = [
  {
    label: "HDFC Swiggy (₹450)",
    sender: "AD-HDFCBK",
    body: "Rs 450.00 debited from A/C **1234 on 25-SEP-26 to SWIGGY UPI. Avail bal: Rs 14,210.00",
  },
  {
    label: "SBI Zomato (₹120)",
    sender: "VM-SBINB",
    body: "Dear UPI user A/C 9876 debited by 120.0 on 25Sep26 transfer to ZOMATO Ref 423984",
  },
  {
    label: "ICICI Netflix (₹1,450)",
    sender: "JX-ICICIB",
    body: "Acct XX5521 debited with INR 1,450.00 on 25-Sep-26. Info: BIL*NETFLIX. Bal: INR 32,100",
  },
  {
    label: "Salary Credit (₹85k)",
    sender: "AD-HDFCBK",
    body: "INR 85,000.00 credited to A/C XX4921 on 25-Sep-26 by INFOSYS TECH SALARY. Avail Bal: INR 1,20,000",
  },
  {
    label: "⚠️ Test OTP Dropper",
    sender: "AD-HDFCBK",
    body: "Your OTP for login on NetBanking is 492019. Do not share with anyone including bank officials.",
  },
];

export function SmsSimulatorModal({ open, onOpenChange }: SmsSimulatorModalProps) {
  const { processSms, isProcessing } = useBankSmsTracker();
  const [sender, setSender] = useState("AD-HDFCBK");
  const [body, setBody] = useState(SAMPLE_PRESETS[0].body);
  const [result, setResult] = useState<ParsedBankSmsResult | null>(null);
  const [loggedStatus, setLoggedStatus] = useState<string | null>(null);

  const handlePresetSelect = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setSender(preset.sender);
    setBody(preset.body);
    setResult(null);
    setLoggedStatus(null);
  };

  const handleTestParse = () => {
    const parsed = parseBankSms(sender, body);
    setResult(parsed);
    setLoggedStatus(null);
  };

  const handleProcessAndLog = async () => {
    const res = await processSms(sender, body);
    setResult(res);
    if (!res.isDrop && res.transaction) {
      setLoggedStatus("Successfully auto-logged to your MongoDB Money ledger! ⚡");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-[#161514] border-2 border-[#2A2826] text-white p-6 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#05DF72]/20 border border-[#05DF72]/40 rounded-xl text-[#05DF72]">
              <Zap className="w-5 h-5" />
            </span>
            <DialogTitle className="text-xl font-black tracking-tight text-white">
              Bank SMS Parser Sandbox
            </DialogTitle>
          </div>
          <DialogDescription className="text-stone-400 text-xs mt-1">
            Test and preview how Invictus extracts transactions and drops OTPs on-device with zero exposure.
          </DialogDescription>
        </DialogHeader>

        {/* Quick Presets */}
        <div className="mt-3">
          <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
            1-Click Sample Presets:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(p)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  body === p.body
                    ? "bg-[#05DF72] text-black border-[#05DF72] font-bold"
                    : "bg-[#23211F] text-stone-300 border-[#33302C] hover:border-stone-500"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3 mt-4">
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1">TRAI Sender Header</label>
            <input
              type="text"
              value={sender}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSender(e.target.value)}
              placeholder="e.g. AD-HDFCBK or VM-SBINB"
              className="w-full px-3 py-2 rounded-xl bg-[#201E1C] border border-[#33302C] text-stone-200 font-mono text-xs focus:outline-none focus:border-[#05DF72]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1">Bank SMS Text</label>
            <textarea
              value={body}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
              rows={3}
              placeholder="Paste raw SMS text..."
              className="w-full px-3 py-2 rounded-xl bg-[#201E1C] border border-[#33302C] text-stone-200 text-xs font-mono focus:outline-none focus:border-[#05DF72] resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestParse}
            className="flex-1 bg-[#23211F] border-[#33302C] text-stone-200 hover:bg-[#2A2826] text-xs font-bold"
          >
            Preview Analysis Only
          </Button>
          <Button
            type="button"
            onClick={handleProcessAndLog}
            disabled={isProcessing}
            className="flex-1 bg-[#05DF72] hover:bg-[#04C966] text-black text-xs font-black shadow-lg shadow-[#05DF72]/20"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Analyze & Auto-Log to Cloud <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Results Card */}
        {result && (
          <div className="mt-4 pt-4 border-t border-[#2A2826]">
            {result.isDrop ? (
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/40 text-red-200 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">
                    Security Drop Triggered
                  </h4>
                  <p className="text-xs mt-0.5 text-stone-300">
                    Reason: <span className="font-mono text-red-300 font-semibold">{result.dropReason}</span>
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    {result.dropReason === "SECURITY_OTP_DETECTED"
                      ? "🛡️ Zero-Tolerance Active: Sensitive token detected. Message discarded from memory immediately."
                      : "Sender or message format did not meet transactional criteria."}
                  </p>
                </div>
              </div>
            ) : result.transaction ? (
              <div className="p-4 rounded-xl bg-[#05DF72]/10 border border-[#05DF72]/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#05DF72]">
                    <ShieldCheck className="w-4 h-4" /> Parsed & Validated
                  </span>
                  <span className="px-2 py-0.5 rounded-full border border-[#05DF72]/40 text-[#05DF72] text-[10px] uppercase font-bold">
                    {result.transaction.bankName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-[#1C1A18] p-2 rounded-lg border border-[#2E2C2A]">
                    <span className="text-[10px] text-stone-400 block font-medium">Amount</span>
                    <span className="font-extrabold text-base text-white">
                      ₹{result.transaction.amount.toLocaleString("en-IN")}
                    </span>
                    <span className={`text-[10px] font-bold block ${result.transaction.type === "expense" ? "text-amber-400" : "text-emerald-400"}`}>
                      {result.transaction.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="bg-[#1C1A18] p-2 rounded-lg border border-[#2E2C2A]">
                    <span className="text-[10px] text-stone-400 block font-medium">Merchant / Recipient</span>
                    <span className="font-bold text-sm text-stone-200 block truncate">
                      {result.transaction.merchant}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Card/Acc: {result.transaction.accountLast4 ? `**${result.transaction.accountLast4}` : "UPI"}
                    </span>
                  </div>
                </div>

                <div className="bg-[#1C1A18] p-2 rounded-lg border border-[#2E2C2A] flex items-center justify-between text-xs">
                  <span className="text-stone-400">Suggested Category:</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>{result.transaction.suggestedIcon}</span>
                    <span>{result.transaction.categorySuggestion}</span>
                  </span>
                </div>

                {loggedStatus && (
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-[#05DF72]">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{loggedStatus}</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
