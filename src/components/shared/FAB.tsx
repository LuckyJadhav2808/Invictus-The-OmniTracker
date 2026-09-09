"use client";

import { Plus } from "lucide-react";

interface FABProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

export function FAB({ onClick, className = "", label = "Quick Log" }: FABProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] right-4 sm:bottom-22 sm:right-6 lg:bottom-8 lg:right-8 h-14 w-14 sm:h-15 sm:w-15 rounded-2xl bg-[#CEF431] hover:bg-[#03D26F] text-[#161514] border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#161514] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center z-50 cursor-pointer group select-none ${className}`}
      aria-label={label}
      title={label}
    >
      <Plus className="h-6 w-6 stroke-[3] transition-transform duration-200 group-hover:rotate-90" />
    </button>
  );
}
