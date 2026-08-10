"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderCategoryEmoji } from "@/components/money/MoneyQuickActionsAndCards";

export interface NeobrutalistOption {
  value: string;
  label: string;
  icon?: string;
}

interface NeobrutalistSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: NeobrutalistOption[];
  placeholder?: string;
  className?: string;
}

export function NeobrutalistSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className,
}: NeobrutalistSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-black text-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] transition-all cursor-pointer flex items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span>{renderCategoryEmoji(selectedOption.icon)}</span>}
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-[#161514]/50">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#161514] stroke-[3] shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Neobrutalist Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white rounded-2xl border-2 border-[#161514] p-1.5 shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] max-h-56 overflow-y-auto space-y-1 animate-in fade-in-50 zoom-in-95">
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs font-bold text-[#161514]/60">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-between gap-2 cursor-pointer border",
                    isSelected
                      ? "bg-[#CEF431] text-[#161514] border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]"
                      : "bg-white text-[#161514] border-transparent hover:bg-[#CEF431]/40 hover:border-[#161514]"
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    {opt.icon && <span>{renderCategoryEmoji(opt.icon)}</span>}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isSelected && <Check className="h-4 w-4 stroke-[3] text-[#161514] shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
