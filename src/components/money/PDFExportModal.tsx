"use client";

import { useState, useMemo } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistPDFStatement } from "@/components/money/NeobrutalistPDFStatement";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { type Transaction, type Category } from "@/types";
import { FileText, Download, Printer, CheckCircle2, Calendar } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { exportElementToPDF } from "@/lib/utils/pdf-exporter";

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

  // Derive statement range label and filtered transactions
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

  const handleSaveAsPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGenerating(true);
    toast.info("Generating Studio PDF download... 📄");
    try {
      const safeLabel = periodLabel.replace(/[^a-zA-Z0-9_-]/g, "_");
      await exportElementToPDF("invictus-pdf-statement", `Invictus_Ledger_${safeLabel}.pdf`);
      toast.success("Studio PDF Statement downloaded! 📄✨");
      onOpenChange(false);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Direct PDF export encountered an error. Use 'Print Direct' -> 'Save as PDF'.");
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
        description="Download or print a Studio Neobrutalist financial statement with full emoji & category support"
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
            <span className="text-[10px] font-black uppercase tracking-wider text-[#161514] block mb-2">
              Statement Preview ({filteredTxs.length} Transactions)
            </span>

            <div className="max-h-[360px] overflow-y-auto rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)]">
              <NeobrutalistPDFStatement
                transactions={filteredTxs}
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
