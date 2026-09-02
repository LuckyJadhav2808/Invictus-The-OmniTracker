import { useState, useMemo, useEffect } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistPDFStatement } from "@/components/money/NeobrutalistPDFStatement";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { type Transaction, type Category } from "@/types";
import { FileText, Download, Printer, CheckCircle2, Calendar, Banknote, CheckSquare, Square, ChevronDown, ChevronUp } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { exportElementToPDF } from "@/lib/utils/pdf-exporter";
import { generateEnterpriseVectorPDF } from "@/lib/utils/vector-pdf-engine";
import { isCashTransaction, isOnlineTransaction } from "@/lib/utils/budget-rollover";
import { renderCategoryEmoji } from "@/components/money/MoneyQuickActionsAndCards";

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
      title="EXPORT LEDGER PDF STATEMENT"
      description="Download or print a Studio Neobrutalist financial statement with granular Cash expense selection"
    >
      <div className="space-y-4 pt-1">
        {/* Export Period Selector */}
        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#161514] block">
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

        {/* 💵 FEATURE 6: GRANULAR CASH EXPENSES FILTER & PICKER */}
        <div className="bg-amber-50 rounded-2xl border-2 border-[#161514] p-3.5 shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-amber-400 border border-[#161514] flex items-center justify-center text-sm shrink-0">
                💵
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#161514] block">
                  Include Cash Expenses in PDF?
                </span>
                <span className="text-[10px] text-navy-700 font-bold block">
                  {cashTxs.length} Cash transactions found in selected period
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIncludeCashExpenses(!includeCashExpenses)}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-black border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] transition-all cursor-pointer",
                includeCashExpenses ? "bg-[#CEF431] text-[#161514]" : "bg-white text-navy-600"
              )}
            >
              {includeCashExpenses ? "YES (Included)" : "NO (Hide Cash)"}
            </button>
          </div>

          {/* Granular Individual Cash Item Selection (Only if Cash is Included) */}
          {includeCashExpenses && cashTxs.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-[#161514]/15">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsCashListExpanded(!isCashListExpanded)}
                  className="text-[10px] font-black uppercase tracking-wider text-[#161514] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Choose Individual Cash Expenses ({selectedCashTxIds.size}/{cashTxs.length} selected)</span>
                  {isCashListExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={toggleSelectAllCash}
                  className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-white border border-[#161514] hover:bg-amber-200 cursor-pointer"
                >
                  {selectedCashTxIds.size === cashTxs.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {isCashListExpanded && (
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 bg-white rounded-xl border border-[#161514]">
                  {cashTxs.map((tx) => {
                    const isChecked = selectedCashTxIds.has(tx.id);
                    const cat = categories.find((c) => c.id === tx.categoryId);
                    return (
                      <div
                        key={tx.id}
                        onClick={() => toggleCashTxId(tx.id)}
                        className={cn(
                          "p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs font-bold",
                          isChecked ? "bg-[#CEF431]/20 border-[#161514]" : "bg-gray-50 border-gray-200 opacity-60"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            className="p-0.5 text-[#161514]"
                          >
                            {isChecked ? <CheckSquare className="h-4 w-4 text-emerald-800 stroke-[2.5]" /> : <Square className="h-4 w-4 text-gray-400 stroke-[2]" />}
                          </button>
                          <span className="text-sm shrink-0">{renderCategoryEmoji(cat?.icon)}</span>
                          <div className="min-w-0">
                            <span className="text-[11px] font-black text-[#161514] block truncate">
                              {cat?.name || "Expense"} {tx.note ? `• ${tx.note}` : ""}
                            </span>
                            <span className="text-[9px] text-gray-500 block">
                              {tx.date ? format(parseISO(tx.date), "MMM d, yyyy") : ""}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-black text-[#161514] shrink-0">
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

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleSaveAsPDF}
            className="w-full bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-black text-xs uppercase tracking-wider py-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Download className="h-4 w-4 stroke-[2.5]" />
            <span>{isGenerating ? "Generating..." : "Save as PDF"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintDirect}
            className="w-full bg-[#CEF431] hover:bg-[#bce028] text-[#161514] font-black text-xs uppercase tracking-wider py-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Printer className="h-4 w-4 stroke-[2.5]" />
            <span>Print Direct</span>
          </button>
        </div>

        {/* Live Studio Statement Preview */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]">
              Statement Preview ({finalExportTxs.length} Transactions)
            </span>
            <span className="text-[9px] font-bold text-navy-600">
              {includeCashExpenses
                ? `${onlineTxs.length} Online + ${selectedCashTxIds.size} Cash`
                : `${onlineTxs.length} Online (Cash Excluded)`}
            </span>
          </div>

          <div className="max-h-[360px] overflow-y-auto rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)]">
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
    </ResponsiveFormContainer>
  );
}
