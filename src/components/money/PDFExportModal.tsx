import { useState, useMemo, useEffect } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistPDFStatement } from "@/components/money/NeobrutalistPDFStatement";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { type Transaction, type Category } from "@/types";
import { Download, Printer, CheckSquare, Square, ChevronDown, ChevronUp } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { generateEnterpriseVectorPDF } from "@/lib/utils/vector-pdf-engine";
import { isCashTransaction } from "@/lib/utils/budget-rollover";
import { CategoryIcon } from "@/components/money/MoneyQuickActionsAndCards";

interface PDFExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  categories: Category[];
  currentMonthKey: string;
  currencySymbol?: string;
  userName?: string;
}

export function PDFExportModal({
  open,
  onOpenChange,
  transactions,
  categories,
  currentMonthKey,
  currencySymbol = "₹",
  userName = "Invictus User",
}: PDFExportModalProps) {
  const [rangeMode, setRangeMode] = useState<"current_month" | "last_30" | "all_time">("current_month");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Performance-optimized 60fps layout transitions (Zero CLS)
  const [optionsRef] = useAutoAnimate<HTMLDivElement>({ duration: 180, easing: "ease-out" });

  // Cash Selection States (Feature 6)
  const [includeCashExpenses, setIncludeCashExpenses] = useState(true);
  const [selectedCashTxIds, setSelectedCashTxIds] = useState<Set<string>>(new Set());
  const [isCashListExpanded, setIsCashListExpanded] = useState(false);

  // Derive statement range label and base filtered transactions
  const { filteredTxs, periodLabel } = useMemo(() => {
    const today = new Date();
    const activeKey = currentMonthKey && currentMonthKey !== "all" ? currentMonthKey : format(today, "yyyy-MM");

    if (rangeMode === "current_month") {
      let monthLabel = "CURRENT MONTH STATEMENT";
      try {
        const monthObj = parseISO(`${activeKey}-01`);
        monthLabel = format(monthObj, "MMMM yyyy").toUpperCase();
      } catch {}
      const txs = transactions.filter((t) => t.date && t.date.startsWith(activeKey));
      return { filteredTxs: txs, periodLabel: monthLabel };
    }

    if (rangeMode === "last_30") {
      const cutoffStr = format(subDays(today, 30), "yyyy-MM-dd");
      const txs = transactions.filter((t) => {
        const dKey = t.date ? t.date.split("T")[0] : format(today, "yyyy-MM-dd");
        return dKey >= cutoffStr;
      });
      return { filteredTxs: txs, periodLabel: "LAST 30 DAYS STATEMENT" };
    }

    return { filteredTxs: transactions, periodLabel: "FULL ALL-TIME STATEMENT" };
  }, [rangeMode, currentMonthKey, transactions]);

  // Separate Cash vs Online within filtered range
  const cashTxs = useMemo(() => {
    return filteredTxs.filter((t) => isCashTransaction(t.paymentMethod));
  }, [filteredTxs]);

  const onlineTxs = useMemo(() => {
    return filteredTxs.filter((t) => !isCashTransaction(t.paymentMethod));
  }, [filteredTxs]);

  // Sync selected cash IDs when cashTxs changes
  useEffect(() => {
    if (cashTxs.length > 0) {
      setSelectedCashTxIds(new Set(cashTxs.map((t) => t.id)));
    } else {
      setSelectedCashTxIds(new Set());
    }
  }, [cashTxs]);

  // Final Transactions to Export (Only includes selected Cash items)
  const finalExportTxs = useMemo(() => {
    if (!includeCashExpenses) {
      return onlineTxs;
    }
    const approvedCash = cashTxs.filter((t) => selectedCashTxIds.has(t.id));
    return [...onlineTxs, ...approvedCash].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [includeCashExpenses, onlineTxs, cashTxs, selectedCashTxIds]);

  const toggleSelectAllCash = () => {
    if (selectedCashTxIds.size === cashTxs.length) {
      setSelectedCashTxIds(new Set());
    } else {
      setSelectedCashTxIds(new Set(cashTxs.map((t) => t.id)));
    }
  };

  const toggleCashTxId = (id: string) => {
    setSelectedCashTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveAsPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGenerating(true);
    toast.info("Generating Enterprise Vector PDF statement... 📄");
    try {
      const safeLabel = periodLabel.replace(/[^a-zA-Z0-9_-]/g, "_");
      generateEnterpriseVectorPDF({
        transactions: finalExportTxs,
        categories,
        periodLabel,
        currencySymbol,
        userName,
        filename: `Invictus_Ledger_${safeLabel}.pdf`,
      });
      toast.success("Enterprise Vector PDF Statement downloaded! ⚡📄");
      onOpenChange(false);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("PDF export encountered an error.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintDirect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.dismiss();
    onOpenChange(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="Export Statement (PDF)"
    >
      <div className="space-y-4 pt-1">
        {/* 1-TAP QUICK DOWNLOAD DECK (Zero Friction) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground">
              Instant 1-Tap Statement
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {finalExportTxs.length} records ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 1-Tap Current Month Download */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleSaveAsPDF}
              className="min-h-[46px] w-full bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-heading font-black text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="size-4 stroke-[2.5]" />
              <span>{isGenerating ? "Generating..." : `Download ${periodLabel.split(" ")[0]} PDF`}</span>
            </button>

            {/* Direct Print */}
            <button
              type="button"
              onClick={handlePrintDirect}
              className="min-h-[46px] w-full bg-[#CEF431] hover:bg-[#bce028] text-[#161514] font-heading font-black text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <Printer className="size-4 stroke-[2.5]" />
              <span>Print Direct</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Options Toggle */}
        <div ref={optionsRef} className="space-y-3">
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setShowAdvancedOptions(!showAdvancedOptions);
            }}
            className="w-full py-2 px-3 rounded-xl bg-secondary/50 hover:bg-secondary text-xs font-mono font-bold text-muted-foreground hover:text-foreground flex items-center justify-between border border-border transition-colors cursor-pointer"
          >
            <span>Statement Range, Cash Filter &amp; Preview</span>
            <span className="font-heading font-black text-xs flex items-center gap-1">
              <span>{showAdvancedOptions ? "Hide" : "Customize"}</span>
              {showAdvancedOptions ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </span>
          </button>

          {showAdvancedOptions && (
            <div className="space-y-3 pt-1 animate-in fade-in zoom-in-95 duration-150">
              {/* Export Period Selector */}
              <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-1.5">
                <label className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground block">
                  Select Statement Range
                </label>
                <NeobrutalistSelect
                  value={rangeMode}
                  onChange={(val) => setRangeMode(val as any)}
                  options={[
                    { value: "current_month", label: `Current Month (${currentMonthKey === "all" ? format(new Date(), "yyyy-MM") : currentMonthKey})`, icon: "📅" },
                    { value: "last_30", label: "Last 30 Days Statement", icon: "⏱️" },
                    { value: "all_time", label: `Full All-Time History (${transactions.length} Logs)`, icon: "♾️" },
                  ]}
                />
              </div>

              {/* 💵 GRANULAR CASH EXPENSES FILTER & PICKER */}
              <div className="bg-amber-500/10 dark:bg-amber-950/20 rounded-xl border border-amber-500/20 dark:border-amber-800/40 p-3 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-lg bg-amber-500/20 dark:bg-amber-400/10 border border-amber-500/30 flex items-center justify-center text-sm shrink-0">
                      💵
                    </div>
                    <div>
                      <span className="text-xs font-heading font-black uppercase tracking-wider text-foreground block">
                        Include Cash Expenses?
                      </span>
                      <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold block">
                        {cashTxs.length} Cash transactions in period
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIncludeCashExpenses(!includeCashExpenses)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-heading font-black border shadow-xs transition-all cursor-pointer",
                      includeCashExpenses
                        ? "bg-[#CEF431] text-[#161514] border-[#161514]"
                        : "bg-white dark:bg-[#1C1A18] text-muted-foreground border-border"
                    )}
                  >
                    {includeCashExpenses ? "YES (Included)" : "NO (Hide Cash)"}
                  </button>
                </div>

                {/* Granular Individual Cash Item Selection */}
                {includeCashExpenses && cashTxs.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-amber-500/20 dark:border-amber-800/40">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIsCashListExpanded(!isCashListExpanded)}
                        className="text-[10px] font-heading font-black uppercase tracking-wider text-foreground flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>Choose Cash Items ({selectedCashTxIds.size}/{cashTxs.length})</span>
                        {isCashListExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={toggleSelectAllCash}
                        className="text-[9px] font-heading font-black uppercase px-2 py-0.5 rounded-lg bg-white dark:bg-[#1C1A18] border border-border text-foreground shadow-xs cursor-pointer"
                      >
                        {selectedCashTxIds.size === cashTxs.length ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    {isCashListExpanded && (
                      <div className="max-h-40 overflow-y-auto space-y-1.5 p-1 bg-white dark:bg-[#1C1A18] rounded-xl border border-border">
                        {cashTxs.map((tx) => {
                          const isChecked = selectedCashTxIds.has(tx.id);
                          const cat = categories.find((c) => c.id === tx.categoryId);
                          return (
                            <div
                              key={tx.id}
                              onClick={() => toggleCashTxId(tx.id)}
                              className={cn(
                                "p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-all text-xs font-bold",
                                isChecked
                                  ? "bg-[#CEF431]/20 dark:bg-[#CEF431]/10 border-[#161514]/30 dark:border-[#CEF431]/40 shadow-xs"
                                  : "bg-[#FAF8F5] dark:bg-[#252321] border-border opacity-70"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="p-0.5 text-foreground">
                                  {isChecked ? <CheckSquare className="size-4 text-[#03D26F] stroke-[2.5]" /> : <Square className="size-4 text-muted-foreground stroke-[2]" />}
                                </span>
                                <CategoryIcon name={cat?.icon} className="size-4 shrink-0 text-foreground" />
                                <div className="min-w-0">
                                  <span className="text-[11px] font-heading font-black text-foreground block truncate">
                                    {cat?.name || "Expense"} {tx.note ? `• ${tx.note}` : ""}
                                  </span>
                                  <span className="text-[9px] font-mono text-muted-foreground block">
                                    {tx.date ? format(parseISO(tx.date), "MMM d, yyyy") : ""}
                                  </span>
                                </div>
                              </div>

                              <span className="text-xs font-heading font-black text-foreground shrink-0">
                                {currencySymbol}{tx.amount.toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Statement Preview */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground">
                    Statement Preview ({finalExportTxs.length} Transactions)
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">
                    {includeCashExpenses
                      ? `${onlineTxs.length} Online + ${selectedCashTxIds.size} Cash`
                      : `${onlineTxs.length} Online`}
                  </span>
                </div>

                <div className="max-h-[260px] overflow-y-auto rounded-xl border border-border shadow-xs">
                  <NeobrutalistPDFStatement
                    transactions={finalExportTxs}
                    categories={categories}
                    periodLabel={periodLabel}
                    currencySymbol={currencySymbol}
                    userName={userName}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ResponsiveFormContainer>
  );
}
