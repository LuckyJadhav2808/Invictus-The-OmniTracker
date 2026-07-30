"use client";

import { Plus } from "lucide-react";

interface FABProps {
  onClick: () => void;
  className?: string;
}

export function FAB({ onClick, className = "" }: FABProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`fixed bottom-20 right-4 sm:bottom-22 sm:right-6 lg:bottom-8 lg:right-8 h-13 w-13 sm:h-14 sm:w-14 rounded-full bg-[#CEF431] hover:bg-[#03D26F] text-[#161514] border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center z-50 cursor-pointer ${className}`}
      aria-label="Quick Add"
    >
      <Plus className="h-6 w-6 stroke-[3]" />
    </button>
  );
}
