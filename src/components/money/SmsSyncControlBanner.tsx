"use client";

import React, { useState, useEffect } from "react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import {
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { isSmsSyncAvailable, syncRecentBankSms, LAST_SMS_SYNC_KEY } from "@/lib/sms/sms-sync-service";
import { parseBankSms } from "@/lib/sms/sms-local-parser";
import { MerchantCategoryCache } from "@/lib/sms/merchant-cache";
import { ensureCategoryExists } from "@/lib/sms/category-provisioner";
import { type Category, type Transaction } from "@/types";
import { useBulkAddTransactions, useAddTransaction, useAddCategory } from "@/lib/queries/money";
import { detectCategoryFromNote } from "@/lib/utils/merchant-categorizer";
import { LearnedMerchantDictionaryModal } from "./modals/LearnedMerchantDictionaryModal";

interface SmsSyncControlBannerProps {
  categories: Category[];
  transactions: Transaction[];
  onOpenCashModal: () => void;
}

export function SmsSyncControlBanner({
  categories,
  transactions,
  onOpenCashModal,
}: SmsSyncControlBannerProps) {
  const [isNative, setIsNative] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [lastSyncText, setLastSyncText] = useState<string | null>(null);
  const [isTestDrawerOpen, setIsTestDrawerOpen] = useState(false);
  const [testSmsText, setTestSmsText] = useState(
    "A/c X3866 debited INR 60.00 Dt 01-10-26 12:03:31 to Ambika Chemist thru UPI:693771418779.Bal INR 157737.60 Not u?Fwd this SMS to 9264092640 to block UPI.-PNB"
  );
  const [testResult, setTestResult] = useState<any>(null);

  const bulkAddMutation = useBulkAddTransactions();
  const addTxMutation = useAddTransaction();
  const addCategoryMutation = useAddCategory();

  useEffect(() => {
    isSmsSyncAvailable().then((avail) => {
      setIsNative(avail);
    });

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LAST_SMS_SYNC_KEY);
      if (saved) {
        const d = new Date(parseInt(saved, 10));
        setLastSyncText(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      }
    }
  }, []);

  // Live tester parser using Learned Merchant Cache first, then keyword fallback
  useEffect(() => {
    if (testSmsText.trim()) {
      const parsed = parseBankSms(testSmsText, "-PNB");
      if (parsed) {
        const hit = MerchantCategoryCache.get(parsed.merchant);
        if (hit) {
          setTestResult({
            ...parsed,
            categoryName: hit.categoryName,
            categoryId: hit.categoryId,
            source: "cache",
          });
        } else {
          const cat = detectCategoryFromNote(parsed.merchant, categories) || {
            categoryId: "cat-food",
            categoryName: "Food & Dining",
          };
          setTestResult({
            ...parsed,
            categoryName: cat.categoryName,
            categoryId: cat.categoryId,
            source: "keyword",
          });
        }
      } else {
        setTestResult(null);
      }
    } else {
      setTestResult(null);
    }
  }, [testSmsText, categories]);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    soundFX.play("click");
    try {
      const result = await syncRecentBankSms(categories, transactions, {
        addCategoryFn: addCategoryMutation.mutateAsync,
      });
      if (result.transactions.length > 0) {
        soundFX.play("celebrate");
        await bulkAddMutation.mutateAsync(result.transactions);
        toast.success(`⚡ Imported ${result.transactions.length} new bank transactions!`, {
          description: `Scanned ${result.scannedCount} SMS messages with 0 duplicates.`,
        });
      } else {
        toast.info("Ledger up to date", {
          description: `Scanned ${result.scannedCount} SMS. No new transactions found.`,
        });
      }
      setLastSyncText(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err: any) {
      soundFX.play("error");
      toast.error(err.message || "SMS sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportTestParsed = async () => {
    if (!testResult) return;
    try {
      soundFX.play("coin");

      // Ensure category exists or auto-provision it
      const resolved = await ensureCategoryExists(
        testResult.categoryName || testResult.categoryId,
        categories,
        addCategoryMutation.mutateAsync
      );

      if (resolved.wasCreated) {
        toast.info(`✨ Auto-created category "${resolved.category.name}"!`);
      }

      await addTxMutation.mutateAsync({
        amount: testResult.amount,
        type: "expense",
        categoryId: resolved.category.id,
        date: testResult.date,
        note: testResult.merchant,
        paymentMethod: testResult.paymentMethod,
        isRecurring: false,
        source: "bank_sms",
        dedupSignature: testResult.dedupSignature,
        sourceMetadata: {
          bankName: testResult.bankName,
          accountMasked: testResult.accountMasked,
          rawSender: testResult.bankName,
        },
      });

      MerchantCategoryCache.incrementMatch(testResult.merchant);
      toast.success(`Imported ₹${testResult.amount} spent at ${testResult.merchant}!`);
      setIsTestDrawerOpen(false);
    } catch {
      soundFX.play("error");
      toast.error("Failed to import test transaction");
    }
  };

  return (
    <>
      <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl p-3 shadow-[3px_3px_0px_0px_#161514] space-y-2 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center shadow-[1px_1px_0px_0px_#161514]">
              <Smartphone className="size-4 text-[#161514]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase text-[#161514]">
                  {isNative ? "Native Bank SMS Auto-Sync" : "Zero-Knowledge Local SMS Engine"}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-400">
                  <ShieldCheck className="size-3" />
                  <span>100% On-Device</span>
                </span>
              </div>
              <p className="text-[11px] text-[#161514]/70 font-medium">
                {isNative
                  ? `Android background listener active. Last scan: ${lastSyncText || "Never"}`
                  : "Reads UPI & bank SMS locally with regex. Learned dictionary auto-categorizes recurring merchants."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Learned Merchant Dictionary Rules Button */}
            <button
              type="button"
              onClick={() => {
                soundFX.play("pop");
                setIsDictionaryOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-xl border-2 border-[#161514] bg-[#FFFFFF] text-[#161514] font-black text-xs uppercase hover:bg-[#CEF431] shadow-[2px_2px_0px_0px_#161514] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
              title="Manage Learned Merchant Rules & Categories"
            >
              <Sparkles className="size-3.5 text-[#161514]" />
              <span>Rules</span>
            </button>

            {/* Quick Cash Button */}
            <button
              type="button"
              onClick={onOpenCashModal}
              className="px-2.5 py-1.5 rounded-xl border border-[#161514] bg-[#FFFFFF] text-[#161514] font-black text-xs uppercase hover:bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] active:translate-y-0.5 transition-all cursor-pointer"
            >
              + Log Cash
            </button>

            {/* Test SMS / Simulator Toggle */}
            <button
              type="button"
              onClick={() => {
                soundFX.play("pop");
                setIsTestDrawerOpen(!isTestDrawerOpen);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-[#161514] bg-[#FAF8F5] text-[#161514] font-black text-xs uppercase hover:bg-[#FFFFFF] shadow-[1px_1px_0px_0px_#161514] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Test SMS</span>
              {isTestDrawerOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>

            {/* Native Sync Button */}
            {isNative && (
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleSyncNow}
                className={cn(
                  "px-3 py-1.5 rounded-xl border-2 border-[#161514] font-black text-xs uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#161514] active:translate-y-0.5 transition-all cursor-pointer",
                  isSyncing ? "bg-zinc-200 text-zinc-500" : "bg-[#CEF431] text-[#161514] hover:bg-[#bfe627]"
                )}
              >
                <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
                <span>{isSyncing ? "Scanning..." : "Scan Inbox"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive SMS Simulator & Test Drawer */}
        {isTestDrawerOpen && (
          <div className="pt-2 border-t border-[#161514]/20 space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#161514] uppercase flex items-center gap-1">
                <Zap className="size-3 text-amber-500" />
                Live Local SMS Parser Sandbox
              </span>
              <span className="text-[10px] text-[#161514]/60">Paste real bank message below to test</span>
            </div>

            <textarea
              rows={2}
              value={testSmsText}
              onChange={(e) => setTestSmsText(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#161514] rounded-xl p-2 text-xs font-mono text-[#161514] focus:outline-none shadow-[1px_1px_0px_0px_#161514]"
              placeholder="Paste Bank SMS text..."
            />

            {testResult ? (
              <div className="bg-emerald-50 border border-emerald-400 rounded-xl p-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-emerald-950">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <div>
                    <span>
                      Spent <strong>₹{testResult.amount}</strong> at <strong>{testResult.merchant}</strong> ({testResult.paymentMethod})
                    </span>
                    <div className="text-[10px] text-emerald-800 font-medium flex items-center gap-1.5 mt-0.5">
                      <span>Bank: {testResult.bankName}</span>
                      <span>•</span>
                      <span>Category: {testResult.categoryName}</span>
                      {testResult.source === "cache" && (
                        <span className="px-1 py-0.2 rounded bg-[#CEF431] text-[#161514] text-[9px] font-black uppercase">
                          Learned Dict
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleImportTestParsed}
                  className="px-2.5 py-1 rounded-lg bg-[#161514] text-[#FAF8F5] text-[11px] font-black uppercase hover:bg-[#2b2927] transition-colors cursor-pointer"
                >
                  + Add to Ledger
                </button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-2 text-xs font-medium text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                <span>Message dropped or no debit amount detected (Security air-gap active).</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rules Manager Modal */}
      <LearnedMerchantDictionaryModal
        open={isDictionaryOpen}
        onOpenChange={setIsDictionaryOpen}
        categories={categories}
      />
    </>
  );
}
