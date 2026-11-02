"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/money/MoneyQuickActionsAndCards";

export interface NeobrutalistOption {
  value: string;
  label: string;
  icon?: string | React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

interface NeobrutalistSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: NeobrutalistOption[];
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
}

function OptionIcon({
  icon,
  className = "size-3.5",
}: {
  icon?: string | React.ReactNode;
  className?: string;
}) {
  if (!icon) return null;
  if (React.isValidElement(icon)) {
    return <span className="shrink-0 inline-flex items-center justify-center">{icon}</span>;
  }
  if (typeof icon === "string") {
    const isEmoji = /\p{Extended_Pictographic}/u.test(icon) && icon.length <= 4;
    if (isEmoji) {
      return <span className="shrink-0 leading-none">{icon}</span>;
    }
    return <CategoryIcon name={icon} className={cn(className, "shrink-0 text-[#161514]")} />;
  }
  return null;
}

export function NeobrutalistSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className,
  size = "md",
  searchable,
  searchPlaceholder = "Filter options...",
  disabled = false,
}: NeobrutalistSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Auto-enable search if more than 6 options and not explicitly disabled
  const isSearchEnabled = searchable ?? options.length >= 7;

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
      if (isSearchEnabled && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    } else {
      setSearchQuery("");
    }
  }, [isOpen, isSearchEnabled]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const target = filteredOptions[highlightedIndex];
        if (!target.disabled) {
          onChange(target.value);
          setIsOpen(false);
        }
      }
    }
  };

  const isSmall = size === "sm";

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={cn("relative w-full text-left", className)}
    >
      {/* Trigger Button */}
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={cn(
          "w-full bg-white text-[#161514] font-black transition-all cursor-pointer flex items-center justify-between gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#CEF431]",
          isSmall
            ? "px-2.5 py-1 text-[10px] rounded-xl border border-[#161514] shadow-[1.5px_1.5px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            : "px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#161514]",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <span className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
          {selectedOption ? (
            <>
              <OptionIcon icon={selectedOption.icon} className={isSmall ? "size-3" : "size-4"} />
              <span className="truncate whitespace-nowrap font-black font-heading">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span className="ml-1 text-[9px] px-1.5 py-0.2 bg-[#CEF431] border border-[#161514] rounded font-mono">
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-[#161514]/50 font-normal">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "text-[#161514] stroke-[3] shrink-0 ml-0.5 transition-transform duration-200",
            isSmall ? "h-3 w-3" : "h-4 w-4",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Neobrutalist Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          ref={listboxRef}
          className={cn(
            "absolute left-0 top-[calc(100%+6px)] z-50 bg-[#FAF8F5] border-2 border-[#161514] p-1.5 shadow-[4px_4px_0px_0px_#161514] max-h-60 overflow-y-auto space-y-1 animate-in fade-in-50 zoom-in-95 duration-100 min-w-full sm:min-w-[200px] w-max max-w-[92vw] rounded-2xl",
            isSmall && "rounded-xl p-1"
          )}
        >
          {/* Quick Search Input */}
          {isSearchEnabled && (
            <div className="relative px-1 pb-1 mb-1 border-b border-[#161514]/20">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[#161514]/50 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-white pl-7 pr-6 py-1 text-[11px] font-bold text-[#161514] rounded-lg border border-[#161514] focus:outline-none focus:ring-1 focus:ring-[#CEF431]"
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#161514]/60 hover:text-[#161514]"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-center text-xs font-bold text-[#161514]/60">
              No matching options
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-between gap-2 cursor-pointer border",
                    isSelected
                      ? "bg-[#CEF431] text-[#161514] border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]"
                      : isHighlighted
                      ? "bg-[#CEF431]/40 text-[#161514] border-[#161514]"
                      : "bg-white text-[#161514] border-transparent hover:bg-[#CEF431]/40 hover:border-[#161514]",
                    opt.disabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    <OptionIcon icon={opt.icon} className="size-3.5" />
                    <span className="truncate font-heading">{opt.label}</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {opt.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-[#FAF8F5] border border-[#161514] rounded font-mono font-bold">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 stroke-[3] text-[#161514] shrink-0" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
