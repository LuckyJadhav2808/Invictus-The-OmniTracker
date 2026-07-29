"use client";

import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Delete Confirmation",
  description = "Are you sure you want to delete this? This cannot be undone.",
}: DeleteConfirmationModalProps) {
  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="flex-1 bg-white text-navy-950 border-2 border-navy-950 rounded-2xl py-2.5 font-black text-xs shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-amber-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] cursor-pointer transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
          className="flex-1 bg-[#FF3B30] text-white border-2 border-navy-950 rounded-2xl py-2.5 font-black text-xs shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-rose-600 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] cursor-pointer transition-all"
        >
          Delete
        </button>
      </div>
    </ResponsiveFormContainer>
  );
}
