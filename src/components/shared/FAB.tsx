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
      className={`fixed bottom-24 right-6 lg:bottom-8 lg:right-8 h-14 w-14 rounded-full bg-amber-500 hover:bg-amber-600 text-navy-900 shadow-[0_8px_24px_rgba(245,185,66,0.35)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-40 ${className}`}
      aria-label="Quick Add"
    >
      <Plus className="h-6 w-6 stroke-[3]" />
    </button>
  );
}
