"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { evaluateExpression, formatCleanNumber } from "@/lib/utils/calculator-engine";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export interface InlineMathInputProps {
  value: string;
  onChange: (value: string, numericValue: number) => void;
  currencySymbol?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  required?: boolean;
  id?: string;
  variant?: "hero" | "standard" | "compact";
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * High-velocity Raycast / Soulver style inline math input.
 * Evaluates inline arithmetic (e.g. "1450/3", "120+45+30", "20+2*15") on the fly,
 * displaying a live subtotal badge and resolving on Enter or Blur.
 */
export function InlineMathInput({
  value,
  onChange,
  currencySymbol,
  placeholder = "0.00",
  className,
  autoFocus = false,
  required = false,
  id,
  variant = "standard",
  disabled = false,
  onKeyDown,
}: InlineMathInputProps) {
  const [internalText, setInternalText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal text when external value changes externally (e.g. quick increment chips)
  useEffect(() => {
    setInternalText(value);
  }, [value]);

  // Check if current input contains arithmetic operators
  const hasOperator = useMemo(() => {
    return /[+\-−×÷*\/]/.test(internalText);
  }, [internalText]);

  // Compute real-time live subtotal without blocking UI
  const liveResult = useMemo<number | null>(() => {
    if (!hasOperator || !internalText.trim()) return null;
    try {
      const computed = evaluateExpression(internalText);
      return isFinite(computed) && !isNaN(computed) ? computed : null;
    } catch {
      return null;
    }
  }, [internalText, hasOperator]);

  // Formatted live preview string
  const previewFormatted = useMemo(() => {
    if (liveResult === null) return null;
    const clean = formatCleanNumber(Math.round((liveResult + Number.EPSILON) * 100) / 100);
    return currencySymbol ? `${currencySymbol}${clean}` : clean;
  }, [liveResult, currencySymbol]);

  // Commit evaluated calculation into state
  const commitCalculation = () => {
    if (liveResult !== null && hasOperator) {
      const rounded = Math.round((liveResult + Number.EPSILON) * 100) / 100;
      const cleanStr = formatCleanNumber(rounded);
      setInternalText(cleanStr);
      onChange(cleanStr, rounded);
      soundFX.playPop();
      soundFX.vibrate(12);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits, decimals, operators, spaces, parentheses
    const sanitized = raw.replace(/[^0-9.\s+\-−×÷*\/()]/g, "");
    setInternalText(sanitized);

    const val = parseFloat(sanitized);
    onChange(sanitized, isNaN(val) ? 0 : val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "=") {
      if (liveResult !== null && hasOperator) {
        e.preventDefault();
        commitCalculation();
      }
    }
    onKeyDown?.(e);
  };

  const handleBlur = () => {
    commitCalculation();
  };

  if (variant === "hero") {
    return (
      <div className="relative w-full flex flex-col items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="text"
          value={internalText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          required={required}
          disabled={disabled}
          className={cn(
            "w-full text-center bg-transparent text-4xl sm:text-5xl font-mono font-black text-[#161514] dark:text-[#FAF8F5] placeholder-[#161514]/30 dark:placeholder-white/30 focus:outline-none tracking-tight",
            className
          )}
        />
        {/* Real-time Math Subtotal Pill */}
        {previewFormatted && (
          <button
            type="button"
            onClick={commitCalculation}
            className="mt-1 px-2.5 py-0.5 rounded-full bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] border border-[#161514] dark:border-[#CEF431] text-xs font-mono font-black shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer animate-in fade-in zoom-in-95 duration-100 flex items-center gap-1"
            title="Click or press Enter to resolve calculation"
          >
            <span>=</span>
            <span>{previewFormatted}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full flex items-center">
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="text"
        value={internalText}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required={required}
        disabled={disabled}
        className={cn(
          "w-full bg-transparent font-heading font-black text-2xl text-foreground focus:outline-hidden tabular-nums",
          className
        )}
      />
      {/* Real-time Math Subtotal Pill */}
      {previewFormatted && (
        <button
          type="button"
          onClick={commitCalculation}
          className="absolute right-2 px-2 py-0.5 rounded-md bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] border border-[#161514] dark:border-[#CEF431] text-[11px] font-mono font-black shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer animate-in fade-in duration-100 flex items-center gap-1 shrink-0"
          title="Click or press Enter to resolve calculation"
        >
          <span>=</span>
          <span>{previewFormatted}</span>
        </button>
      )}
    </div>
  );
}
