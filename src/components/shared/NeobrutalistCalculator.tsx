"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calculator,
  X,
  History,
  Copy,
  Check,
  Volume2,
  VolumeX,
  CornerDownLeft,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CalculatorState,
  INITIAL_CALCULATOR_STATE,
  CalcHistoryItem,
  inputDigit,
  inputOperator,
  calculateResult,
  handleClearAction,
  handleBackspaceAction,
  handleToggleSignAction,
  handlePercentageAction,
  applyFinTechQuickAction,
  getLiveSubtotal,
} from "@/lib/utils/calculator-engine";
import { soundFX } from "@/components/shared/SoundFX";
import { triggerHaptic } from "@/lib/native/haptics";

export interface NeobrutalistCalculatorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideFloatingTrigger?: boolean;
}

export function NeobrutalistCalculator({
  open: controlledOpen,
  onOpenChange,
  hideFloatingTrigger = false,
}: NeobrutalistCalculatorProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledOpen === "boolean";
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setIsOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const val = typeof next === "function" ? next(isOpen) : next;
    if (!isControlled) {
      setInternalOpen(val);
    }
    onOpenChange?.(val);
  };

  const [state, setState] = useState<CalculatorState>(INITIAL_CALCULATOR_STATE);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const expressionScrollRef = useRef<HTMLDivElement>(null);

  // Initialize sound mute state & load tape history from localStorage
  useEffect(() => {
    setSoundMuted(soundFX.isMuted());
    try {
      const stored = localStorage.getItem("invictus_calc_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        setState((prev) => ({ ...prev, history: parsed }));
      }
    } catch {}
  }, []);

  // Listen for global open calculator events (e.g. from command palette or header)
  useEffect(() => {
    const handleGlobalOpen = () => {
      setIsOpen(true);
      triggerHaptic("light");
      soundFX.play("click");
    };
    window.addEventListener("invictus:open-calc", handleGlobalOpen);
    return () => window.removeEventListener("invictus:open-calc", handleGlobalOpen);
  }, []);

  // Auto-scroll expression breadcrumb to the right as it grows
  useEffect(() => {
    if (expressionScrollRef.current) {
      expressionScrollRef.current.scrollLeft = expressionScrollRef.current.scrollWidth;
    }
  }, [state.expression]);

  const saveHistory = (newItem: CalcHistoryItem) => {
    try {
      const updated = [newItem, ...state.history.filter((h) => h.id !== newItem.id)].slice(0, 25);
      localStorage.setItem("invictus_calc_history", JSON.stringify(updated));
    } catch {}
  };

  const clearEntireHistory = () => {
    setState((prev) => ({ ...prev, history: [] }));
    try {
      localStorage.removeItem("invictus_calc_history");
    } catch {}
    triggerHaptic("medium");
    soundFX.play("pop");
    toast.success("Calculation tape cleared 🗑️");
  };

  const toggleSound = () => {
    const next = soundFX.toggleMute();
    setSoundMuted(next);
    triggerHaptic("light");
    toast.info(next ? "Calculator sound muted 🔇" : "Calculator sound enabled 🔊");
  };

  // ─── TACTILE ACTIONS WITH AUDIO & HAPTIC SYNTHESIS ───

  const handleNum = (digit: string) => {
    soundFX.play("click");
    triggerHaptic("light");
    setState((prev) => inputDigit(prev, digit));
  };

  const handleOp = (op: string) => {
    soundFX.play("click");
    triggerHaptic("light");
    setState((prev) => inputOperator(prev, op));
  };

  const handleEquals = () => {
    setState((prev) => {
      const next = calculateResult(prev, saveHistory);
      if (next.displayValue === "Cannot divide by 0" || next.displayValue === "Error") {
        soundFX.play("error");
        triggerHaptic("error");
      } else {
        soundFX.play("cash");
        triggerHaptic("medium");
      }
      return next;
    });
  };

  const handleClear = () => {
    soundFX.play("pop");
    triggerHaptic("light");
    setState((prev) => handleClearAction(prev));
  };

  const handleBackspace = () => {
    soundFX.play("pop");
    triggerHaptic("light");
    setState((prev) => handleBackspaceAction(prev));
  };

  const handleToggleSign = () => {
    soundFX.play("click");
    triggerHaptic("light");
    setState((prev) => handleToggleSignAction(prev));
  };

  const handlePercentage = () => {
    soundFX.play("click");
    triggerHaptic("light");
    setState((prev) => handlePercentageAction(prev));
  };

  const handleFinTechQuick = (action: "half" | "third" | "tip18" | "round") => {
    soundFX.play("cash");
    triggerHaptic("medium");
    setState((prev) => applyFinTechQuickAction(prev, action));
    const labels = {
      half: "Split 50/50 (÷2)",
      third: "Split 3-way (÷3)",
      tip18: "+18% Tip/Tax added",
      round: "Rounded to integer",
    };
    toast.success(labels[action]);
  };

  const handleCopyResult = () => {
    if (state.displayValue === "Error" || state.displayValue === "Cannot divide by 0") return;
    navigator.clipboard.writeText(state.displayValue);
    setCopied(true);
    soundFX.play("coin");
    triggerHaptic("success");
    toast.success(`Copied ${state.displayValue} to clipboard! 📋`);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRecallHistoryItem = (item: CalcHistoryItem) => {
    setState((prev) => ({
      ...prev,
      displayValue: item.result,
      expression: `${item.result}`,
      hasCalculated: false,
      waitingForOperand: false,
    }));
    setShowHistory(false);
    soundFX.play("pop");
    triggerHaptic("light");
    toast.info(`Recalled ${item.result} into active display`);
  };

  // ─── PHYSICAL KEYBOARD & NUMPAD NAVIGATION ───
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing if focus is inside an input/textarea elsewhere
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleNum(e.key);
      } else if (e.key === ".") {
        e.preventDefault();
        handleNum(".");
      } else if (e.key === "+" || e.key === "-" || e.key === "*" || e.key === "/") {
        e.preventDefault();
        const opMap: Record<string, string> = { "+": "+", "-": "−", "*": "×", "/": "÷" };
        handleOp(opMap[e.key] || e.key);
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "%") {
        e.preventDefault();
        handlePercentage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, state]);

  // Context-aware Clear button label (C when typing, AC when display is 0 or finished)
  const isAllClear = state.displayValue === "0" || state.hasCalculated;
  const clearLabel = isAllClear ? "AC" : "C";
  const liveSubtotal = getLiveSubtotal(state.expression, state.displayValue);

  return (
    <>
      {/* 1. Floating Neobrutalist Trigger Button (Thumb-zone placement on bottom-left) */}
      {!hideFloatingTrigger && (
        <div className="fixed bottom-20 left-3.5 sm:bottom-6 sm:left-6 z-30 select-none">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              soundFX.play("click");
              setIsOpen((prev) => !prev);
            }}
            className={cn(
              "h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-[#CEF431] text-[#161514] border-2.5 border-[#161514] dark:border-[#383531] shadow-[3.5px_3.5px_0px_0px_#161514] dark:shadow-[3.5px_3.5px_0px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer group",
              isOpen && "bg-[#161514] dark:bg-[#FAF8F5] text-[#CEF431] dark:text-[#161514]"
            )}
            title="Ledger Calculator (Numpad / 🧮)"
          >
            {isOpen ? (
              <X className="h-6 w-6 stroke-[3] transition-transform duration-200" />
            ) : (
              <Calculator className="h-6 w-6 stroke-[2.5] transition-transform duration-200 group-hover:scale-110" />
            )}
          </button>
        </div>
      )}

      {/* 2. Calculator Modal / Floating Card Popover */}
      {isOpen && (
        <>
          {/* Backdrop for outside click dismiss on mobile */}
          <div
            className="fixed inset-0 bg-[#161514]/40 dark:bg-black/60 backdrop-blur-[2px] z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={containerRef}
            className="fixed bottom-34 left-3.5 sm:bottom-22 sm:left-6 z-50 w-[310px] sm:w-[336px] rounded-3xl bg-[#FAF8F5] dark:bg-[#1C1A18] border-3 border-[#161514] dark:border-[#383531] shadow-[6px_6px_0px_0px_#161514] dark:shadow-[6px_6px_0px_0px_#000000] p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 select-none text-[#161514] dark:text-[#FAF8F5]"
          >
            {/* Header Strip */}
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-[#161514]/15 dark:border-[#383531]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#03D26F] animate-pulse" />
                <span className="font-heading font-black text-xs uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
                  Ledger Calc
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#CEF431] text-[#161514] font-bold">
                  2+2+2
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Audio Feedback Mute Toggle */}
                <button
                  type="button"
                  onClick={toggleSound}
                  className="p-1.5 rounded-xl border-1.5 border-[#161514] dark:border-[#383531] bg-white dark:bg-[#252321] text-[#161514]/70 dark:text-[#FAF8F5]/70 hover:bg-[#FAF8F5] dark:hover:bg-[#2F2C29] transition-all cursor-pointer"
                  title={soundMuted ? "Unmute Sound" : "Mute Sound"}
                >
                  {soundMuted ? (
                    <VolumeX className="h-3 w-3 stroke-[2.5] text-rose-500" />
                  ) : (
                    <Volume2 className="h-3 w-3 stroke-[2.5]" />
                  )}
                </button>

                {/* History Tape Drawer Button */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    soundFX.play("pop");
                    setShowHistory((prev) => !prev);
                  }}
                  className={cn(
                    "p-1.5 rounded-xl border-1.5 border-[#161514] dark:border-[#383531] text-[10px] font-black transition-all cursor-pointer flex items-center gap-1",
                    showHistory
                      ? "bg-[#CEF431] text-[#161514]"
                      : "bg-white dark:bg-[#252321] text-[#161514]/70 dark:text-[#FAF8F5]/70 hover:bg-[#FAF8F5] dark:hover:bg-[#2F2C29]"
                  )}
                  title="Calculation Tape"
                >
                  <History className="h-3 w-3 stroke-[2.5]" />
                  <span className="text-[10px] font-mono">
                    Tape{state.history.length > 0 && ` (${state.history.length})`}
                  </span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/40 text-[#161514]/70 dark:text-[#FAF8F5]/70 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* History Slide-over Drawer */}
            {showHistory ? (
              <div className="h-[320px] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-[#161514]/10 dark:border-[#383531]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/70">
                    Tape Log ({state.history.length})
                  </span>
                  {state.history.length > 0 && (
                    <button
                      type="button"
                      onClick={clearEntireHistory}
                      className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear Tape
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {state.history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-[#161514]/50 dark:text-[#FAF8F5]/50 space-y-2 py-8">
                      <div className="p-3 rounded-2xl bg-white dark:bg-[#252321] border border-[#161514] dark:border-[#383531]">
                        <History className="h-6 w-6 stroke-[1.5]" />
                      </div>
                      <p className="text-xs font-bold text-[#161514] dark:text-[#FAF8F5]">No calculations yet</p>
                      <p className="text-[10px] font-mono max-w-[200px]">
                        Continuous operations like 2+2+2 are saved here for instant 1-click recall.
                      </p>
                    </div>
                  ) : (
                    state.history.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => handleRecallHistoryItem(h)}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#252321] border-1.5 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] hover:bg-[#CEF431]/20 dark:hover:bg-[#CEF431]/10 cursor-pointer transition-colors space-y-1 group"
                      >
                        <div className="flex justify-between text-[10px] text-[#161514]/60 dark:text-[#FAF8F5]/60 font-mono">
                          <span className="truncate max-w-[180px]">{h.expression}</span>
                          <span>{h.timestamp}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-[#03D26F] opacity-0 group-hover:opacity-100 transition-opacity">
                            ↵ Click to Recall
                          </span>
                          <span className="text-right font-black text-sm font-mono text-[#161514] dark:text-[#FAF8F5]">
                            = {h.result}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="w-full py-2 rounded-xl bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] font-black text-xs uppercase cursor-pointer hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  Back to Keypad
                </button>
              </div>
            ) : (
              <>
                {/* Monospace Digital Display Console */}
                <div className="p-3 rounded-2xl bg-white dark:bg-[#121110] border-2.5 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] text-right relative space-y-1">
                  {/* Expression Tape Breadcrumb & Live Subtotal Pill */}
                  <div className="flex items-center justify-between gap-2 h-4.5">
                    {liveSubtotal ? (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#03D26F]/15 text-[#028A48] dark:text-[#03D26F] border border-[#03D26F]/30 animate-in fade-in">
                        = {liveSubtotal}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-[#161514]/40 dark:text-[#FAF8F5]/40 uppercase tracking-wider">
                        Ready
                      </span>
                    )}

                    <div
                      ref={expressionScrollRef}
                      className="text-[11px] font-mono font-bold text-[#161514]/50 dark:text-[#FAF8F5]/50 overflow-x-auto whitespace-nowrap no-scrollbar max-w-[200px]"
                    >
                      {state.expression || "0"}
                    </div>
                  </div>

                  {/* Primary Digital Readout & Quick Copy Button */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={handleCopyResult}
                      className="p-1 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#252321] text-[#161514]/40 dark:text-[#FAF8F5]/40 hover:text-[#161514] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer"
                      title="Copy result to clipboard"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                      ) : (
                        <Copy className="h-4 w-4 stroke-[2.5]" />
                      )}
                    </button>

                    <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[#161514] dark:text-[#FAF8F5] truncate">
                      {state.displayValue}
                    </div>
                  </div>
                </div>

                {/* ─── FINTECH SPLIT & QUICK ACCELERATORS ─── */}
                <div className="grid grid-cols-4 gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleFinTechQuick("half")}
                    className="h-6.5 rounded-lg bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#CEF431] dark:hover:bg-[#CEF431] hover:text-[#161514] text-[#161514] dark:text-[#FAF8F5] font-mono font-bold text-[10px] border border-[#161514] dark:border-[#383531] shadow-[1px_1px_0px_0px_#161514] dark:shadow-[1px_1px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                    title="Split 50/50 (Divide by 2)"
                  >
                    ½ Split
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinTechQuick("third")}
                    className="h-6.5 rounded-lg bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#CEF431] dark:hover:bg-[#CEF431] hover:text-[#161514] text-[#161514] dark:text-[#FAF8F5] font-mono font-bold text-[10px] border border-[#161514] dark:border-[#383531] shadow-[1px_1px_0px_0px_#161514] dark:shadow-[1px_1px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                    title="Split 3-way (Divide by 3)"
                  >
                    ⅓ Split
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinTechQuick("tip18")}
                    className="h-6.5 rounded-lg bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#CEF431] dark:hover:bg-[#CEF431] hover:text-[#161514] text-[#161514] dark:text-[#FAF8F5] font-mono font-bold text-[10px] border border-[#161514] dark:border-[#383531] shadow-[1px_1px_0px_0px_#161514] dark:shadow-[1px_1px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                    title="+18% Tip or GST"
                  >
                    +18%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinTechQuick("round")}
                    className="h-6.5 rounded-lg bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#CEF431] dark:hover:bg-[#CEF431] hover:text-[#161514] text-[#161514] dark:text-[#FAF8F5] font-mono font-bold text-[10px] border border-[#161514] dark:border-[#383531] shadow-[1px_1px_0px_0px_#161514] dark:shadow-[1px_1px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                    title="Round to nearest integer"
                  >
                    Round
                  </button>
                </div>

                {/* Neobrutalist Tactile Keypad */}
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {/* Row 1 */}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="h-10 rounded-xl bg-rose-100 dark:bg-rose-950/40 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-rose-950 dark:text-rose-200 font-black text-xs border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                    title={isAllClear ? "All Clear (Reset)" : "Clear Entry"}
                  >
                    {clearLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="h-10 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#F5F2EB] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] font-black text-xs border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center"
                    title="Backspace"
                  >
                    ⌫
                  </button>
                  <button
                    type="button"
                    onClick={handlePercentage}
                    className="h-10 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#F5F2EB] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] font-black text-xs border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOp("÷")}
                    className="h-10 rounded-xl bg-[#FDE047] dark:bg-[#EAB308]/90 hover:bg-[#FACC15] text-[#161514] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    ÷
                  </button>

                  {/* Row 2 */}
                  <button
                    type="button"
                    onClick={() => handleNum("7")}
                    className="h-10 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#F5F2EB] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    7
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNum("8")}
                    className="h-10 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#F5F2EB] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    8
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNum("9")}
                    className="h-10 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#F5F2EB] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    9
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOp("×")}
                    className="h-10 rounded-xl bg-[#FDE047] dark:bg-[#EAB308]/90 hover:bg-[#FACC15] text-[#161514] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    ×
                  </button>

                  {/* Row 3 */}
                  <button
                    type="button"
                    onClick={() => handleNum("4")}
                    className="h-10 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#F5F2EB] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    4
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNum("5")}
                    className="h-10 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#F5F2EB] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNum("6")}
                    className="h-10 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#F5F2EB] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    6
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOp("−")}
                    className="h-10 rounded-xl bg-[#FDE047] dark:bg-[#EAB308]/90 hover:bg-[#FACC15] text-[#161514] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    −
                  </button>

                  {/* Row 4 */}
                  <button
                    type="button"
                    onClick={() => handleNum("1")}
                    className="h-10 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#F5F2EB] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNum("2")}
                    className="h-10 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#F5F2EB] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNum("3")}
                    className="h-10 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#F5F2EB] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    3
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOp("+")}
                    className="h-10 rounded-xl bg-[#FDE047] dark:bg-[#EAB308]/90 hover:bg-[#FACC15] text-[#161514] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    +
                  </button>

                  {/* Row 5 */}
                  <button
                    type="button"
                    onClick={handleToggleSign}
                    className="h-10 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#F5F2EB] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] font-black text-xs border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    ±
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNum("0")}
                    className="h-10 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#F5F2EB] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNum(".")}
                    className="h-10 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#F5F2EB] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] font-black text-sm border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    .
                  </button>
                  <button
                    type="button"
                    onClick={handleEquals}
                    className="h-10 rounded-xl bg-[#03D26F] hover:bg-emerald-400 text-white font-black text-base border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    =
                  </button>
                </div>

                {/* ─── MICRO FOOTER: FIRST TIME USER ONBOARDING & KEYBOARD HINTS ─── */}
                <div className="pt-1 flex items-center justify-between text-[9px] font-mono text-[#161514]/50 dark:text-[#FAF8F5]/50 border-t border-[#161514]/10 dark:border-[#383531]">
                  <span>⌨️ Numpad supported</span>
                  <span className="font-bold">Enter =</span>
                  <span>Esc close</span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
