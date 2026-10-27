"use client";

import React, { useState, useEffect } from "react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import {
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  isSmsSyncAvailable,
  syncRecentBankSms,
  getLastSmsSyncTimestamp,
  resetLastSmsSyncTimestamp,
} from "@/lib/sms/sms-sync-service";
import { parseBankSms } from "@/lib/sms/sms-local-parser";
import { MerchantCategoryCache } from "@/lib/sms/merchant-cache";
import { ensureCategoryExists } from "@/lib/sms/category-provisioner";
import { useCategories, useTransactions, useBulkAddTransactions, useAddTransaction, useAddCategory } from "@/lib/queries/money";
import { detectCategoryFromNote } from "@/lib/utils/merchant-categorizer";
import { LearnedMerchantDictionaryModal } from "@/components/money/modals/LearnedMerchantDictionaryModal";

export function BankSmsSettingsSection() {
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();

  const [isNative, setIsNative] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [lastSyncText, setLastSyncText] = useState<string | null>(null);

  // Live Test Sandbox State
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
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

    refreshSyncTime();
  }, []);

  const refreshSyncTime = () => {
    const saved = getLastSmsSyncTimestamp();
    if (saved) {
      const d = new Date(saved);
      setLastSyncText(
        `${d.toLocaleDateString([], { month: "short", day: "numeric" })} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      );
    } else {
      setLastSyncText(null);
    }
  };

  // Live test parser using Learned Cache first, then keyword fallback
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

  const handleForceFullScan = async () => {
    if (!isNative) {
      toast.info("SMS scanning is only available in the native Android app.");
      return;
    }
    setIsSyncing(true);
    soundFX.play("click");
    try {
      const result = await syncRecentBankSms(categories, transactions, {
        forceFullScan: true,
        addCategoryFn: addCategoryMutation.mutateAsync,
      });
      if (result.transactions.length > 0) {
        soundFX.play("celebrate");
        await bulkAddMutation.mutateAsync(result.transactions);
        toast.success(`⚡ 30-Day Re-Scan Complete! Imported ${result.transactions.length} transactions.`, {
          description: `Scanned ${result.scannedCount} SMS messages with 0 duplicates.`,
        });
      } else {
        toast.info("Ledger up to date", {
          description: `Scanned past 30 days (${result.scannedCount} SMS). All transactions already imported.`,
        });
      }
      refreshSyncTime();
    } catch (err: any) {
      soundFX.play("error");
      toast.error(err.message || "Full SMS re-scan failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetTimestamp = () => {
    soundFX.play("pop");
    resetLastSmsSyncTimestamp();
    refreshSyncTime();
    toast.success("High-water mark reset. Next scan will inspect past 30 days.");
  };

  const handleImportTestParsed = async () => {
    if (!testResult) return;
    try {
      soundFX.play("coin");
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
    } catch {
      soundFX.play("error");
      toast.error("Failed to import test transaction");
    }
  };

  return (
    <div id="bank-sms" className="space-y-3 pt-2">
      <span className="text-[10px] font-black text-[#161514]/70 uppercase tracking-widest px-1">
        BANK SMS & PARSER TELEMETRY
      </span>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl p-5 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
        {/* Header telemetry badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#161514]/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
              <Smartphone className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm text-[#161514] uppercase font-heading">
                  Bank SMS Telemetry & Engine
                </h4>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-400">
                  <ShieldCheck className="size-3" />
                  <span>Air-Gapped</span>
                </span>
              </div>
              <p className="text-[11px] text-[#161514]/70 font-bold">
                {isNative
                  ? `Native Android engine active • Last sync: ${lastSyncText || "Never"}`
                  : "On-device zero-knowledge parser • Android bridge inactive on web"}
              </p>
            </div>
          </div>
        </div>

        {/* Feature 1: Learned Merchant Rules Modal Trigger */}
        <div className="flex items-center justify-between bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl p-3.5 shadow-[2px_2px_0px_0px_#161514]">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="size-9 rounded-xl bg-purple-100 border-2 border-[#161514] flex items-center justify-center text-purple-700 shadow-[1px_1px_0px_0px_#161514] shrink-0">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <h5 className="font-black text-xs text-[#161514] uppercase font-heading truncate">
                Learned Merchant Dictionary
              </h5>
              <p className="text-[10px] text-[#161514]/70 font-bold truncate">
                Configure merchant names, auto-categories, and fuzzy matching
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.play("pop");
              setIsDictionaryOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl border-2 border-[#161514] bg-[#FFFFFF] hover:bg-[#CEF431] text-[#161514] font-black text-xs uppercase shadow-[2px_2px_0px_0px_#161514] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            Manage Rules
          </button>
        </div>

        {/* Feature 2: 30-Day Recovery & Rescan */}
        <div className="flex items-center justify-between bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl p-3.5 shadow-[2px_2px_0px_0px_#161514]">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="size-9 rounded-xl bg-amber-100 border-2 border-[#161514] flex items-center justify-center text-amber-800 shadow-[1px_1px_0px_0px_#161514] shrink-0">
              <RotateCcw className="size-4" />
            </div>
            <div className="min-w-0">
              <h5 className="font-black text-xs text-[#161514] uppercase font-heading truncate">
                Full 30-Day SMS Re-Scan
              </h5>
              <p className="text-[10px] text-[#161514]/70 font-bold truncate">
                Recover missed payments from today, yesterday, or past month
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleForceFullScan}
              className={cn(
                "px-3 py-1.5 rounded-xl border-2 border-[#161514] font-black text-xs uppercase shadow-[2px_2px_0px_0px_#161514] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                isSyncing ? "bg-zinc-200 text-zinc-500 cursor-not-allowed" : "bg-[#CEF431] text-[#161514] hover:bg-[#bfe627]"
              )}
            >
              <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
              <span>{isSyncing ? "Scanning..." : "Re-Scan 30 Days"}</span>
            </button>
          </div>
        </div>

        {/* Feature 3: Collapsible Interactive Parser Sandbox */}
        <div className="border-2 border-[#161514] rounded-2xl overflow-hidden shadow-[2px_2px_0px_0px_#161514]">
          <button
            type="button"
            onClick={() => {
              soundFX.play("pop");
              setIsSandboxOpen(!isSandboxOpen);
            }}
            className="w-full bg-[#FAF8F5] hover:bg-white p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-emerald-100 border border-[#161514] flex items-center justify-center text-emerald-800">
                <Zap className="size-3.5" />
              </div>
              <div>
                <h5 className="font-black text-xs text-[#161514] uppercase font-heading">
                  Bank SMS Parser Sandbox & Diagnostics
                </h5>
                <p className="text-[10px] text-[#161514]/70 font-bold">
                  Paste bank messages to verify regex extraction and category suggestions
                </p>
              </div>
            </div>
            {isSandboxOpen ? <ChevronUp className="size-4 text-[#161514]" /> : <ChevronDown className="size-4 text-[#161514]" />}
          </button>

          {isSandboxOpen && (
            <div className="bg-white p-4 border-t-2 border-[#161514] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-[#161514]/70 uppercase">Test SMS Input</span>
                <span className="text-[10px] text-[#161514]/50">100% On-Device execution</span>
              </div>
              <textarea
                rows={3}
                value={testSmsText}
                onChange={(e) => setTestSmsText(e.target.value)}
                className="w-full bg-[#FAF8F5] border-2 border-[#161514] rounded-xl p-2.5 text-xs font-mono text-[#161514] focus:outline-none shadow-[2px_2px_0px_0px_#161514]"
                placeholder="Paste bank SMS text here..."
              />

              {testResult ? (
                <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs font-bold text-emerald-950 shadow-[1.5px_1.5px_0px_0px_#161514]">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>
                        Spent <strong>₹{testResult.amount}</strong> at <strong>{testResult.merchant}</strong> ({testResult.paymentMethod})
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-800 font-medium flex items-center gap-1.5 mt-1 ml-6">
                      <span>Bank: {testResult.bankName}</span>
                      <span>•</span>
                      <span>Date: {testResult.date}</span>
                      <span>•</span>
                      <span>Category: {testResult.categoryName}</span>
                      {testResult.source === "cache" && (
                        <span className="px-1.5 py-0.2 rounded bg-[#CEF431] text-[#161514] text-[9px] font-black uppercase border border-[#161514]">
                          Learned Dict
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleImportTestParsed}
                    className="px-3 py-1.5 rounded-xl bg-[#161514] hover:bg-[#2b2927] text-[#FAF8F5] text-xs font-black uppercase transition-all shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-y-0.5 cursor-pointer"
                  >
                    + Add to Ledger
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-3 text-xs font-medium text-amber-900 flex items-center gap-2 shadow-[1.5px_1.5px_0px_0px_#161514]">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                  <span>No debit amount detected or message dropped by safety air-gap.</span>
                </div>
              )}

              <div className="pt-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleResetTimestamp}
                  className="text-[10px] font-bold text-zinc-500 hover:text-zinc-800 underline cursor-pointer"
                >
                  Reset SMS Scan High-Water Mark Timestamp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rules Manager Modal */}
      <LearnedMerchantDictionaryModal
        open={isDictionaryOpen}
        onOpenChange={setIsDictionaryOpen}
        categories={categories}
      />
    </div>
  );
}
