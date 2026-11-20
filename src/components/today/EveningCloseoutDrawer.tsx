"use client";

import { X } from "lucide-react";
import {
  type DailyConquestMetrics,
} from "@/components/today/useTodayCockpitViewModel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { GladiatorCloseoutCard } from "./GladiatorCloseoutCard";

export interface EveningCloseoutDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: DailyConquestMetrics;
  selectedDate: string;
  isToday: boolean;
  onSealComplete?: () => void;
  tomorrowPendingTasksCount?: number;
  tomorrowSafeToSpend?: number;
  currencySymbol?: string;
  currentMood?: string;
  reflectionNote?: string;
  onChangeNote?: (note: string) => void;
  onSaveMood?: (newMood?: string) => Promise<void>;
  isSavingMood?: boolean;
}

export function EveningCloseoutDrawer({
  open,
  onOpenChange,
  metrics,
  selectedDate,
  isToday,
  onSealComplete,
  tomorrowPendingTasksCount = 0,
  tomorrowSafeToSpend,
  currencySymbol = "₹",
  currentMood = "good",
  reflectionNote = "",
  onChangeNote,
  onSaveMood,
  isSavingMood = false,
}: EveningCloseoutDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="bg-white dark:bg-[#161514] border-t-2 border-[#161514] dark:border-[#2A2724] rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto sm:max-w-2xl sm:mx-auto p-4 sm:p-6 text-[#161514] dark:text-[#FAF8F5] space-y-4"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Daily Evening Closeout</SheetTitle>
        </SheetHeader>

        {/* Drawer Drag Handle & Close Row */}
        <div className="flex items-center justify-between pb-1">
          <div className="w-10 h-1 bg-[#E8E5DF] dark:bg-[#2A2724] rounded-full mx-auto" />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-7 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#252220] flex items-center justify-center text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="size-4" />
          </button>
        </div>

        <GladiatorCloseoutCard
          metrics={metrics}
          selectedDate={selectedDate}
          isToday={isToday}
          onSealComplete={() => {
            onSealComplete?.();
            onOpenChange(false);
          }}
          tomorrowPendingTasksCount={tomorrowPendingTasksCount}
          tomorrowSafeToSpend={tomorrowSafeToSpend}
          currencySymbol={currencySymbol}
          currentMood={currentMood}
          reflectionNote={reflectionNote}
          onChangeNote={onChangeNote}
          onSaveMood={onSaveMood}
          isSavingMood={isSavingMood}
        />
      </SheetContent>
    </Sheet>
  );
}
