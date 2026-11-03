"use client";

import React from "react";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { soundFX } from "@/components/shared/SoundFX";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Delete Confirmation",
  description = "Are you sure you want to delete this? This action cannot be undone.",
  confirmLabel = "Delete Permanent",
}: DeleteConfirmationModalProps) {
  return (
    <AdaptiveDrawerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="space-y-4 pt-1">
        {/* Warning Badge Card */}
        <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400 stroke-[1.75]" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-rose-950 dark:text-rose-200">
              Cautionary Action
            </h4>
            <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-0.5 leading-snug">
              This item will be archived and removed from your active views.
            </p>
          </div>
        </div>

        {/* Ergonomic Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              onOpenChange(false);
            }}
            className="flex-1 min-h-[42px] bg-white dark:bg-[#161514] hover:bg-[#F1EFEA] dark:hover:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724] rounded-lg font-medium text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              onConfirm();
              onOpenChange(false);
            }}
            className="flex-1 min-h-[42px] bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white rounded-lg font-medium text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </AdaptiveDrawerDialog>
  );
}
