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
      <div className="space-y-4 pt-2">
        {/* Warning Badge Card */}
        <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center gap-3">
          <div className="size-10 rounded-xl bg-rose-200 border-2 border-[#161514] flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_0px_#161514]">
            <AlertTriangle className="size-5 text-rose-800 stroke-[2.5]" />
          </div>
          <div>
            <h4
              className="text-xs font-heading font-black text-rose-950 uppercase tracking-wider"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Cautionary Action
            </h4>
            <p className="text-[11px] font-bold text-rose-900/80 mt-0.5 leading-snug">
              This goal will be archived and removed from your active routines.
            </p>
          </div>
        </div>

        {/* 44px WCAG AA Compliant Ergonomic Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              onOpenChange(false);
            }}
            className="flex-1 min-h-[46px] bg-white text-[#161514] border-2 border-[#161514] rounded-xl font-heading font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-slate-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer transition-all flex items-center justify-center"
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
            className="flex-1 min-h-[46px] bg-[#FF4343] hover:bg-[#e03838] text-white border-2 border-[#161514] rounded-xl font-heading font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer transition-all flex items-center justify-center"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </AdaptiveDrawerDialog>
  );
}
