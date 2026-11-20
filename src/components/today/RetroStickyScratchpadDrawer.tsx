"use client";

import { X, FileText } from "lucide-react";
import { type Category } from "@/types";
import { type ThoughtPriority } from "@/lib/utils/scratchpad-nlp";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RetroStickyScratchpad } from "./RetroStickyScratchpad";

export interface RetroStickyScratchpadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: Category[];
  onConvertToTask?: (task: {
    title: string;
    priority?: ThoughtPriority;
    date?: string;
    category?: string;
    categoryId?: string;
  }) => void;
  onConvertToExpense?: (expense: {
    amount: number;
    note: string;
    categoryId?: string;
    date?: string;
  }) => void;
  onBatchConvert?: (
    tasks: Array<{
      title: string;
      priority: ThoughtPriority;
      date?: string;
      category?: string;
      categoryId?: string;
    }>,
    expenses: Array<{
      amount: number;
      note: string;
      categoryId?: string;
      date?: string;
    }>
  ) => void;
}

export function RetroStickyScratchpadDrawer({
  open,
  onOpenChange,
  categories = [],
  onConvertToTask,
  onConvertToExpense,
  onBatchConvert,
}: RetroStickyScratchpadDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="bg-[#FAF8F5] dark:bg-[#161514] border-l-2 border-[#161514] dark:border-[#2A2724] shadow-2xl w-full sm:max-w-md md:max-w-lg p-4 sm:p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] flex flex-col justify-start text-[#161514] dark:text-[#FAF8F5] space-y-4 overflow-y-auto"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Desk Scratchpad</SheetTitle>
        </SheetHeader>

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-[#CEF431] border border-[#161514] flex items-center justify-center text-[#161514] shadow-[1px_1px_0px_#161514]">
              <FileText className="size-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="font-heading font-black text-sm text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider">
                Desk Scratchpad
              </h2>
              <p className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                Natural Language Quick-Capture (⌘J)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-7 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#252220] flex items-center justify-center text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scratchpad Body */}
        <RetroStickyScratchpad
          categories={categories}
          onConvertToTask={onConvertToTask}
          onConvertToExpense={onConvertToExpense}
          onBatchConvert={onBatchConvert}
          className="shadow-none border-2 border-[#161514] dark:border-[#2A2724]"
        />
      </SheetContent>
    </Sheet>
  );
}
