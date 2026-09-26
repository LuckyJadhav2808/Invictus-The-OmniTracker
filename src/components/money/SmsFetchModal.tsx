"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useBankSmsTracker, ParsedInboxItem } from "@/lib/hooks/useBankSmsTracker";
import { useCategories } from "@/lib/queries/money";
import { Capacitor } from "@capacitor/core";
import {
  Zap,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Check,
  Smartphone,
  ClipboardPaste,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, subDays, startOfDay, endOfDay, parseISO } from "date-fns";

interface SmsFetchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DateRangeOption = "today" | "yesterday" | "3days" | "7days" | "30days" | "custom";

export function SmsFetchModal({ open, onOpenChange }: SmsFetchModalProps) {
  const {
    fetchInboxTransactions,
    parsePastedSms,
    batchSyncTransactions,
    isProcessing,
    hasPermission,
    toggleSmsTracker,
  } = useBankSmsTracker();

  const { data: categories = [] } = useCategories();

  const isNative = Capacitor.isNativePlatform();

  const [dateRange, setDateRange] = useState<DateRangeOption>("today");
  const [customDate, setCustomDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [activeTab, setActiveTab] = useState<"native" | "paste">(
    isNative ? "native" : "paste"
  );

  const [pastedText, setPastedText] = useState("");
  const [fetchedItems, setFetchedItems] = useState<ParsedInboxItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [itemCategories, setItemCategories] = useState<Record<string, string>>({});
  const [hasScanned, setHasScanned] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Calculate start & end epoch time for selected range
  const { startTime, endTime, labelText } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);
    let label = "Today";

    if (dateRange === "today") {
      start = startOfDay(now);
      label = "Today (" + format(now, "d MMM") + ")";
    } else if (dateRange === "yesterday") {
      const y = subDays(now, 1);
      start = startOfDay(y);
      end = endOfDay(y);
      label = "Yesterday (" + format(y, "d MMM") + ")";
    } else if (dateRange === "3days") {
      start = startOfDay(subDays(now, 3));
      label = "Past 3 Days";
    } else if (dateRange === "7days") {
      start = startOfDay(subDays(now, 7));
      label = "Past 7 Days";
    } else if (dateRange === "30days") {
      start = startOfDay(subDays(now, 30));
      label = "Past 30 Days";
    } else {
      const cd = parseISO(customDate);
      start = startOfDay(cd);
      end = endOfDay(cd);
      label = format(cd, "d MMMM yyyy");
    }

    return {
      startTime: start.getTime(),
      endTime: end.getTime(),
      labelText: label,
    };
  }, [dateRange, customDate]);

  // Handle Scanning from native Android inbox
  const handleScanInbox = async () => {
    try {
      const res = await fetchInboxTransactions({ startTime, endTime, limit: 150 });
      setFetchedItems(res.items);
      setHasScanned(true);

      // Pre-select non-duplicate items
      const newSelected = new Set<string>();
      const initialCatMap: Record<string, string> = {};

      res.items.forEach((item) => {
        if (!item.isDuplicate) {
          newSelected.add(item.id);
        }
        // Match category suggestion if present
        if (item.parsed.transaction?.categorySuggestion) {
          const match = categories.find((c) =>
            c.name.toLowerCase().includes(item.parsed.transaction!.categorySuggestion!.toLowerCase())
          );
          if (match) initialCatMap[item.id] = match.id;
        }
      });

      setSelectedIds(newSelected);
      setItemCategories(initialCatMap);

      if (res.items.length === 0) {
        toast.info("No Bank SMS Found", {
          description: `No bank alerts found for ${labelText}. Try extending the date range.`,
        });
      } else {
        toast.success(`Found ${res.items.length} Bank Alerts`, {
          description: `${newSelected.size} new transactions ready for import.`,
        });
      }
    } catch (e: any) {
      toast.error("Failed to scan messages", {
        description: e?.message || "Please make sure SMS permission is granted in Android settings.",
      });
    }
  };

  // Handle parsing pasted SMS
  const handleParsePasted = () => {
    if (!pastedText.trim()) {
      toast.error("Please paste an SMS text first");
      return;
    }
    const dateToUse = dateRange === "custom" ? customDate : new Date().toISOString().split("T")[0];
    const items = parsePastedSms(pastedText, dateToUse);
    setFetchedItems(items);
    setHasScanned(true);

    const newSelected = new Set<string>();
    const initialCatMap: Record<string, string> = {};

    items.forEach((item) => {
      if (!item.isDuplicate) {
        newSelected.add(item.id);
      }
      if (item.parsed.transaction?.categorySuggestion) {
        const match = categories.find((c) =>
          c.name.toLowerCase().includes(item.parsed.transaction!.categorySuggestion!.toLowerCase())
        );
        if (match) initialCatMap[item.id] = match.id;
      }
    });

    setSelectedIds(newSelected);
    setItemCategories(initialCatMap);

    if (items.length === 0) {
      toast.error("Could not parse SMS", {
        description: "Make sure the pasted text contains transaction details (e.g. 'Rs 450 debited to Swiggy').",
      });
    } else {
      toast.success(`Parsed ${items.length} Bank Alerts`, {
        description: `${newSelected.size} new transactions ready for import.`,
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === fetchedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(fetchedItems.map((i) => i.id)));
    }
  };

  const handleSyncSelected = async () => {
    const itemsToSync = fetchedItems
      .filter((i) => selectedIds.has(i.id))
      .map((i) => ({
        parsed: i.parsed,
        categoryId: itemCategories[i.id],
      }));

    if (itemsToSync.length === 0) {
      toast.error("Please select at least 1 transaction to import.");
      return;
    }

    setIsSyncing(true);
    try {
      const res = await batchSyncTransactions(itemsToSync);
      toast.success(`⚡ Imported ${res.createdCount} Transactions!`, {
        description:
          res.duplicateCount > 0
            ? `${res.duplicateCount} duplicates were skipped safely.`
            : "Your ledger has been updated.",
      });
      onOpenChange(false);
      // Reset
      setFetchedItems([]);
      setHasScanned(false);
      setSelectedIds(new Set());
    } catch (e: any) {
      toast.error("Sync failed", {
        description: e?.message || "Could not sync transactions to your ledger.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-[2.5px] border-[#161514] text-[#161514] p-6 shadow-[6px_6px_0px_0px_#161514] rounded-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_#161514] shrink-0">
                ⚡
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight text-[#161514] font-heading">
                  Fetch Bank SMS Transactions
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-[#161514]/70 mt-0.5">
                  Fetch and convert bank alerts for any specific day or timeframe into ledger records.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Platform Tabs: Android Native vs Paste Fallback */}
          <div className="flex items-center gap-2 border-b-2 border-[#161514]/15 pb-2">
            {isNative && (
              <button
                type="button"
                onClick={() => setActiveTab("native")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all flex items-center gap-1.5",
                  activeTab === "native"
                    ? "bg-[#CEF431] text-[#161514] border-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                    : "bg-[#FAF8F5] text-[#161514]/60 border-transparent hover:border-[#161514]/30"
                )}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android Message Inbox</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("paste")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all flex items-center gap-1.5",
                activeTab === "paste"
                  ? "bg-[#CEF431] text-[#161514] border-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                  : "bg-[#FAF8F5] text-[#161514]/60 border-transparent hover:border-[#161514]/30"
              )}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Smart Paste SMS</span>
            </button>
          </div>

          {/* Timeframe Selector Pills */}
          <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl p-3.5 shadow-[2px_2px_0px_0px_#161514] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-[#161514]" />
                Select Target Timeframe:
              </span>
              <span className="text-[11px] font-bold text-[#161514]/70 bg-white px-2 py-0.5 rounded-lg border border-[#161514]">
                {labelText}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "3days", label: "Past 3 Days" },
                { id: "7days", label: "Past 7 Days" },
                { id: "30days", label: "Past 30 Days" },
                { id: "custom", label: "Pick Date" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setDateRange(pill.id as DateRangeOption)}
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all cursor-pointer",
                    dateRange === pill.id
                      ? "bg-[#161514] text-white border-[#161514] shadow-[1.5px_1.5px_0px_0px_#CEF431]"
                      : "bg-white text-[#161514] border-[#161514] hover:bg-[#FAF8F5]"
                  )}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {dateRange === "custom" && (
              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs font-bold text-[#161514]/80">Date:</span>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border-2 border-[#161514] text-xs font-bold bg-white text-[#161514] shadow-[2px_2px_0px_0px_#161514] outline-none"
                />
              </div>
            )}
          </div>

          {/* TAB 1: Android Native Inbox Scan */}
          {activeTab === "native" && isNative && (
            <div className="space-y-3">
              {!hasPermission && (
                <div className="bg-rose-100 border-2 border-rose-500 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs font-bold text-rose-900 shadow-[2px_2px_0px_0px_#E11D48]">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Android SMS permission required to read your bank alerts.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSmsTracker(true)}
                    className="px-3 py-1 rounded-xl bg-rose-600 text-white font-black text-[11px] uppercase border border-rose-900 shadow-[1px_1px_0px_0px_#881337] cursor-pointer"
                  >
                    Grant
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleScanInbox}
                disabled={isProcessing}
                className="w-full py-3 rounded-2xl bg-[#CEF431] hover:bg-[#BEE521] text-[#161514] font-black text-xs uppercase tracking-wider border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin stroke-[2.5]" />
                    <span>Scanning Messages Inbox...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 stroke-[2.5]" />
                    <span>Scan Android Inbox for {labelText}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: Paste SMS Box */}
          {activeTab === "paste" && (
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#161514] block">
                Paste SMS Message(s):
              </label>
              <textarea
                rows={3}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste one or multiple bank SMS here (e.g. 'Rs 450.00 debited from A/C **1234 to SWIGGY UPI...')"
                className="w-full p-3 rounded-2xl border-2 border-[#161514] text-xs font-mono bg-[#FAF8F5] text-[#161514] shadow-[2px_2px_0px_0px_#161514] outline-none placeholder:text-stone-400"
              />
              <button
                type="button"
                onClick={handleParsePasted}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#161514] font-black text-xs uppercase tracking-wider border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Parse SMS Text</span>
              </button>
            </div>
          )}

          {/* Parsed Results Section */}
          {hasScanned && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#161514]">
                    Detected Transactions ({fetchedItems.length})
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#CEF431] border border-[#161514]">
                    {selectedIds.size} Selected
                  </span>
                </div>

                {fetchedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-[11px] font-bold text-[#161514] underline hover:text-black cursor-pointer"
                  >
                    {selectedIds.size === fetchedItems.length ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>

              {fetchedItems.length === 0 ? (
                <div className="bg-[#FAF8F5] border-2 border-dashed border-[#161514]/40 rounded-2xl p-6 text-center text-xs font-bold text-[#161514]/60">
                  No bank transactions detected in this selection.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {fetchedItems.map((item) => {
                    const tx = item.parsed.transaction!;
                    const isSelected = selectedIds.has(item.id);
                    const isExpense = tx.type === "expense";

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelect(item.id)}
                        className={cn(
                          "p-3 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer",
                          isSelected
                            ? "bg-white border-[#161514] shadow-[3px_3px_0px_0px_#161514]"
                            : "bg-[#FAF8F5] border-[#161514]/30 opacity-75"
                        )}
                      >
                        {/* Left: Checkbox + Bank & Merchant */}
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-lg border-2 border-[#161514] flex items-center justify-center text-xs font-black shrink-0 transition-all",
                              isSelected ? "bg-[#CEF431]" : "bg-white"
                            )}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-md bg-[#161514] text-white">
                                {tx.bankName || "BANK"}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md border border-[#161514]",
                                  isExpense ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                                )}
                              >
                                {isExpense ? "Debit" : "Credit"}
                              </span>
                              {item.isDuplicate && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-stone-200 text-stone-700">
                                  Already Logged
                                </span>
                              )}
                              <span className="text-[10px] font-mono font-bold text-stone-500">
                                {tx.date}
                              </span>
                            </div>

                            <p className="text-xs font-black text-[#161514] mt-1 leading-snug">
                              {tx.merchant}
                              {tx.accountLast4 ? ` (A/c **${tx.accountLast4})` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Right: Amount & Category selector */}
                        <div
                          className="flex items-center gap-3 self-end sm:self-center shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Category Selector */}
                          <select
                            value={itemCategories[item.id] || ""}
                            onChange={(e) =>
                              setItemCategories((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            className="px-2 py-1 rounded-xl border border-[#161514] text-[11px] font-bold bg-white text-[#161514] outline-none max-w-[130px]"
                          >
                            <option value="">Auto-Match</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.icon || "💳"} {c.name}
                              </option>
                            ))}
                          </select>

                          {/* Amount */}
                          <div
                            className={cn(
                              "text-sm font-black font-mono px-2.5 py-1 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]",
                              isExpense ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                            )}
                          >
                            {isExpense ? "-" : "+"}₹
                            {tx.amount.toLocaleString("en-IN", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t-2 border-[#161514] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#161514]/70">
            <ShieldCheck className="w-4 h-4 text-[#03D26F]" />
            <span>OTPs are dropped locally. 0 private credentials stored.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-[#161514] text-xs font-black uppercase border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSyncSelected}
              disabled={isSyncing || selectedIds.size === 0}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-[#03D26F] hover:bg-[#02B861] text-[#161514] text-xs font-black uppercase tracking-wider border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Import {selectedIds.size} Selected</span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
