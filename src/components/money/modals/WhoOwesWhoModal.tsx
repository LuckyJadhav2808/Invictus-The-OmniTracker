"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { X } from "lucide-react";
import { WhoOwesWhoTabView, type WhoOwesWhoTabViewProps } from "@/components/money/views/WhoOwesWhoTabView";

interface WhoOwesWhoModalProps extends WhoOwesWhoTabViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhoOwesWhoModal({
  open,
  onOpenChange,
  currencySymbol,
  prefill,
  onLogSettlementIncome,
}: WhoOwesWhoModalProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[88vh] sm:h-[84vh] max-w-2xl mx-auto rounded-t-3xl p-0 bg-[#FAF8F5] dark:bg-[#161514] border-t-2 border-[#161514] dark:border-[#383531] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#1C1A18] shrink-0">
          <SheetTitle className="text-base font-heading font-black text-[#161514] dark:text-[#FAF8F5] leading-tight">
            Who Owes Who 🤝
          </SheetTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-full bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#2E2B28] text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="size-4 stroke-[2]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-thin">
          <WhoOwesWhoTabView
            currencySymbol={currencySymbol}
            prefill={prefill}
            onLogSettlementIncome={onLogSettlementIncome}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
