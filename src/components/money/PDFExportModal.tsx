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
  const [manualDownloadUrl, setManualDownloadUrl] = useState<string | null>(null);

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

    // Allow UI thread 60ms to paint generating indicator
    await new Promise((resolve) => setTimeout(resolve, 60));

    try {
      const safeLabel = periodLabel.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `Invictus_Ledger_${safeLabel}.pdf`;
      const result = generateEnterpriseVectorPDF({
        transactions: finalExportTxs,
        categories,
        periodLabel,
        currencySymbol,
        userName,
        filename,
      });

      if (result && "blobUrl" in result && typeof result.blobUrl === "string") {
        setManualDownloadUrl(result.blobUrl);
      }

      soundFX.playPop();
      toast.success("Enterprise Vector PDF Statement downloaded! ⚡📄");

      // Give browser download manager time to initiate before closing modal
      setTimeout(() => {
        onOpenChange(false);
        setIsGenerating(false);
      }, 700);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("PDF export encountered an error.");
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
      maxWidth="sm:max-w-2xl"
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
              <span>{isGenerating ? "Generating PDF..." : `Download ${periodLabel.split(" ")[0]} PDF`}</span>
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

          {manualDownloadUrl && (
            <div className="pt-1 text-center">
              <a
                href={manualDownloadUrl}
                download={`Invictus_Ledger_${periodLabel.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`}
                className="text-[11px] font-mono font-bold text-[#03D26F] underline hover:text-[#02b35d]"
              >
                Download did not start automatically? Click here to save PDF
              </a>
            </div>
          )}
        </div>

        {/* Collapsible Advanced Options Toggle */}
        <div ref={optionsRef} className="space-y-3">
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setShowAdvancedOptions(!showAdvancedOptions);
            }}
            className="w-full py-2.5 px-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-[#F2EFE9] dark:hover:bg-[#252321] text-xs font-mono font-bold text-[#161514] dark:text-[#FAF8F5] flex items-center justify-between border-2 border-[#161514] dark:border-[#38332E] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            <span className="text-[11px] font-heading font-black tracking-wide uppercase">
              Statement Range, Cash Filter & Preview
            </span>
            <span className="font-heading font-black text-xs flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white dark:bg-[#2A2724] border border-[#161514]/30 dark:border-white/20">
              <span>{showAdvancedOptions ? "Hide" : "Customize"}</span>
              {showAdvancedOptions ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </span>
          </button>

          {showAdvancedOptions && (
            <div className="space-y-3 pt-1 animate-in fade-in zoom-in-95 duration-150">
              {/* Export Period Selector */}
              <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3 rounded-xl border-2 border-[#161514] dark:border-[#38332E] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] space-y-1.5">
                <label className="text-[11px] font-heading font-black uppercase tracking-wider text-[#161514]/80 dark:text-[#FAF8F5]/80 block">
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
              <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border-2 border-[#161514] dark:border-[#38332E] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-xl bg-[#FDE68A] border-2 border-[#161514] flex items-center justify-center text-sm shrink-0 shadow-[1px_1px_0px_0px_#161514]">
                      💵
                    </div>
                    <div>
                      <span className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
                        Include Cash Expenses?
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#161514]/70 dark:text-[#FAF8F5]/70 block">
                        {cashTxs.length} Cash transactions in period
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setIncludeCashExpenses(!includeCashExpenses);
                    }}
                    className={cn(
                      "px-3 py-1 rounded-xl text-xs font-heading font-black border-2 border-[#161514] transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px]",
                      includeCashExpenses
                        ? "bg-[#CEF431] text-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                        : "bg-white dark:bg-[#252321] text-[#161514]/60 dark:text-[#FAF8F5]/60 shadow-[1px_1px_0px_0px_#161514]"
                    )}
                  >
                    {includeCashExpenses ? "YES (Included)" : "NO (Hide Cash)"}
                  </button>
                </div>

                {/* Granular Individual Cash Item Selection */}
                {includeCashExpenses && cashTxs.length > 0 && (
                  <div className="space-y-2 pt-2 border-t-2 border-[#161514]/15 dark:border-[#38332E]">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIsCashListExpanded(!isCashListExpanded)}
                        className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>Choose Cash Items ({selectedCashTxIds.size}/{cashTxs.length})</span>
                        {isCashListExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playPop();
                          toggleSelectAllCash();
                        }}
                        className="text-[9px] font-heading font-black uppercase px-2 py-0.5 rounded-lg bg-white dark:bg-[#1C1A18] border-2 border-[#161514] text-[#161514] dark:text-[#FAF8F5] shadow-[1px_1px_0px_0px_#161514] cursor-pointer"
                      >
                        {selectedCashTxIds.size === cashTxs.length ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    {isCashListExpanded && (
                      <div className="max-h-44 overflow-y-auto space-y-1.5 p-1.5 bg-white dark:bg-[#161514] rounded-xl border-2 border-[#161514] dark:border-[#38332E]">
                        {cashTxs.map((tx) => {
                          const isChecked = selectedCashTxIds.has(tx.id);
                          const cat = categories.find((c) => c.id === tx.categoryId);
                          return (
                            <div
                              key={tx.id}
                              onClick={() => {
                                soundFX.playPop();
                                toggleCashTxId(tx.id);
                              }}
                              className={cn(
                                "p-2 rounded-xl border-2 flex items-center justify-between gap-2 cursor-pointer transition-all text-xs font-bold",
                                isChecked
                                  ? "bg-[#CEF431]/30 dark:bg-[#CEF431]/20 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]"
                                  : "bg-[#FAF8F5] dark:bg-[#252321] border-[#161514]/30 dark:border-[#38332E] opacity-70"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="p-0.5 text-[#161514] dark:text-[#FAF8F5]">
                                  {isChecked ? <CheckSquare className="size-4 text-[#03D26F] stroke-[2.5]" /> : <Square className="size-4 text-muted-foreground stroke-[2]" />}
                                </span>
                                <CategoryIcon name={cat?.icon} className="size-4 shrink-0 text-[#161514] dark:text-[#FAF8F5]" />
                                <div className="min-w-0">
                                  <span className="text-[11px] font-heading font-black text-[#161514] dark:text-[#FAF8F5] block truncate">
                                    {cat?.name || "Expense"} {tx.note ? `• ${tx.note}` : ""}
                                  </span>
                                  <span className="text-[9px] font-mono text-[#161514]/60 dark:text-[#FAF8F5]/60 block">
                                    {tx.date ? format(parseISO(tx.date), "MMM d, yyyy") : ""}
                                  </span>
                                </div>
                              </div>

                              <span className="text-xs font-mono font-black text-[#161514] dark:text-[#FAF8F5] shrink-0">
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
              <div className="pt-1 space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/70">
                    Statement Preview ({finalExportTxs.length} Transactions)
                  </span>
                  <span className="text-[9px] font-mono font-bold text-[#161514]/70 dark:text-[#FAF8F5]/70">
                    {includeCashExpenses
                      ? `${onlineTxs.length} Online + ${selectedCashTxIds.size} Cash`
                      : `${onlineTxs.length} Online`}
                  </span>
                </div>

                <div className="pt-1">
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
