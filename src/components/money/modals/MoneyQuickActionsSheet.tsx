"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { soundFX } from "@/components/shared/SoundFX";
import {
  PenTool,
  ScanLine,
  Banknote,
  Calculator,
} from "lucide-react";

interface MoneyQuickActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAction: (
    action: "add_transaction" | "scan_receipt" | "quick_cash" | "calculator"
  ) => void;
}

export function MoneyQuickActionsSheet({
  open,
  onOpenChange,
  onSelectAction,
}: MoneyQuickActionsSheetProps) {
  const handleAction = (
    action: "add_transaction" | "scan_receipt" | "quick_cash" | "calculator"
  ) => {
    soundFX.playPop();
    onOpenChange(false);
    onSelectAction(action);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="w-full sm:max-w-lg sm:mx-auto rounded-t-3xl border-t-2 border-x-2 sm:border-2 sm:rounded-3xl border-[#161514] dark:border-[#383531] bg-white dark:bg-[#161514] p-5 sm:p-6 shadow-2xl space-y-4 text-[#161514] dark:text-[#FAF8F5] focus:outline-none"
      >
        {/* Grab Handle Bar (Belanje Signature) */}
        <div className="w-12 h-1.5 bg-[#E8E5DF] dark:bg-[#383531] rounded-full mx-auto -mt-1 mb-1" />

        <SheetHeader className="p-0 text-left">
          <SheetTitle className="text-lg sm:text-xl font-heading font-black tracking-tight text-[#161514] dark:text-[#FAF8F5]">
            Quick Actions
          </SheetTitle>
          <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] font-medium">
            Fast capture actions optimized for one-hand operation
          </p>
        </SheetHeader>

        {/* 2x2 Chunky Tactile Cards (Belanje Benchmark) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Card 1: Add Transaction */}
          <button
            type="button"
            onClick={() => handleAction("add_transaction")}
            className="flex flex-col items-start p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1C1A] hover:bg-[#F1EFEA] dark:hover:bg-[#262422] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#383531] active:translate-y-0.5 transition-all text-left group cursor-pointer"
          >
            <div className="size-11 rounded-2xl bg-[var(--btn-primary-bg)] border border-[var(--btn-primary-border)] text-[var(--btn-primary-fg)] flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform">
              <PenTool className="size-5 stroke-[2]" />
            </div>
            <span className="text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5] block">
              Add Transaction
            </span>
            <span className="text-[11px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5 block leading-tight">
              Log income or expense
            </span>
          </button>

          {/* Card 2: Scan Receipt OCR */}
          <button
            type="button"
            onClick={() => handleAction("scan_receipt")}
            className="flex flex-col items-start p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1C1A] hover:bg-[#F1EFEA] dark:hover:bg-[#262422] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#383531] active:translate-y-0.5 transition-all text-left group cursor-pointer"
          >
            <div className="size-11 rounded-2xl bg-purple-100 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform">
              <ScanLine className="size-5 stroke-[2]" />
            </div>
            <span className="text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5] block">
              Scan Receipt
            </span>
            <span className="text-[11px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5 block leading-tight">
              Reads bills via local OCR
            </span>
          </button>

          {/* Card 3: Quick Cash */}
          <button
            type="button"
            onClick={() => handleAction("quick_cash")}
            className="flex flex-col items-start p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1C1A] hover:bg-[#F1EFEA] dark:hover:bg-[#262422] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#383531] active:translate-y-0.5 transition-all text-left group cursor-pointer"
          >
            <div className="size-11 rounded-2xl bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform">
              <Banknote className="size-5 stroke-[2]" />
            </div>
            <span className="text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5] block">
              Quick Cash
            </span>
            <span className="text-[11px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5 block leading-tight">
              1-tap pocket cash entry
            </span>
          </button>

          {/* Card 4: Calculator */}
          <button
            type="button"
            onClick={() => handleAction("calculator")}
            className="flex flex-col items-start p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1C1A] hover:bg-[#F1EFEA] dark:hover:bg-[#262422] border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#383531] active:translate-y-0.5 transition-all text-left group cursor-pointer"
          >
            <div className="size-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-[#047857] dark:text-[#03D26F] flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform">
              <Calculator className="size-5 stroke-[2]" />
            </div>
            <span className="text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5] block">
              Quick Calc
            </span>
            <span className="text-[11px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5 block leading-tight">
              Neobrutalist keypad
            </span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
