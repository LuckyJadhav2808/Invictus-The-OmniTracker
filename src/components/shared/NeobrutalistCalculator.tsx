"use client";

import { useState, useEffect, useRef } from "react";
import { Calculator, X, History, Copy, Check, CornerDownLeft, Delete } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface HistoryItem {
  expression: string;
  result: string;
  timestamp: string;
}

export function NeobrutalistCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [expression, setExpression] = useState("");
  const [displayValue, setDisplayValue] = useState("0");
  const [hasCalculated, setHasCalculated] = useState(false);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load calculation history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("invictus_calc_history");
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("invictus_calc_history", JSON.stringify(newHistory.slice(0, 15)));
    } catch {}
  };

  // Keyboard navigation & physical numpad support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleNumber(e.key);
      } else if (e.key === ".") {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === "+" || e.key === "-" || e.key === "*" || e.key === "/") {
        e.preventDefault();
        const opMap: Record<string, string> = { "+": "+", "-": "-", "*": "×", "/": "÷" };
        handleOperator(opMap[e.key] || e.key);
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, displayValue, expression, hasCalculated]);

  const handleNumber = (num: string) => {
    if (hasCalculated) {
      setDisplayValue(num);
      setExpression("");
      setHasCalculated(false);
    } else {
      if (displayValue === "0") {
        setDisplayValue(num);
      } else {
        setDisplayValue((prev) => (prev.length < 14 ? prev + num : prev));
      }
    }
  };

  const handleDecimal = () => {
    if (hasCalculated) {
      setDisplayValue("0.");
      setExpression("");
      setHasCalculated(false);
      return;
    }
    if (!displayValue.includes(".")) {
      setDisplayValue((prev) => prev + ".");
    }
  };

  const handleOperator = (op: string) => {
    if (hasCalculated) {
      setExpression(`${displayValue} ${op} `);
      setHasCalculated(false);
      setDisplayValue("0");
    } else {
      setExpression(`${displayValue} ${op} `);
      setDisplayValue("0");
    }
  };

  const handleClear = () => {
    setDisplayValue("0");
    setExpression("");
    setHasCalculated(false);
  };

  const handleBackspace = () => {
    if (hasCalculated) {
      handleClear();
      return;
    }
    if (displayValue.length > 1) {
      setDisplayValue((prev) => prev.slice(0, -1));
    } else {
      setDisplayValue("0");
    }
  };

  const handleToggleSign = () => {
    if (displayValue === "0") return;
    if (displayValue.startsWith("-")) {
      setDisplayValue((prev) => prev.slice(1));
    } else {
      setDisplayValue((prev) => "-" + prev);
    }
  };

  const handlePercentage = () => {
    const val = parseFloat(displayValue);
    if (!isNaN(val)) {
      const res = String(val / 100);
      setDisplayValue(res);
    }
  };

  const handleEquals = () => {
    if (!expression) return;

    try {
      const fullExpr = `${expression}${displayValue}`;
      // Replace arithmetic visual symbols with JS operators
      const evalExpr = fullExpr
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-");

      // Safe arithmetic evaluation
      const sanitized = evalExpr.replace(/[^0-9+\-*/.]/g, "");
      const calculated = Function(`"use strict"; return (${sanitized})`)();

      if (isNaN(calculated) || !isFinite(calculated)) {
        setDisplayValue("Error");
        return;
      }

      // Format clean result
      const rounded = Number(calculated.toFixed(6));
      const resultStr = String(rounded);

      const newHistoryItem: HistoryItem = {
        expression: fullExpr,
        result: resultStr,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      saveHistory([newHistoryItem, ...history]);
      setExpression(`${fullExpr} =`);
      setDisplayValue(resultStr);
      setHasCalculated(true);
    } catch {
      setDisplayValue("Error");
    }
  };

  const handleCopyResult = () => {
    if (displayValue === "Error") return;
    navigator.clipboard.writeText(displayValue);
    setCopied(true);
    toast.success(`Copied ${displayValue} to clipboard! 📋`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      {/* 1. Floating Neobrutalist Trigger Button (Placed safely above mobile bottom-nav) */}
      <div className="fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-30 select-none">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-[#CEF431] hover:bg-[#b8db29] text-[#161514] border-2.5 border-[#161514] shadow-[3.5px_3.5px_0px_0px_rgba(22,21,20,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer group",
            isOpen && "bg-[#161514] text-[#CEF431]"
          )}
          title="Quick Neobrutalist Calculator (⌘K / 🧮)"
        >
          {isOpen ? (
            <X className="h-6 w-6 stroke-[3] transition-transform duration-200" />
          ) : (
            <Calculator className="h-6 w-6 stroke-[2.5] transition-transform duration-200 group-hover:scale-110" />
          )}
        </button>
      </div>

      {/* 2. Calculator Modal / Floating Card Popover */}
      {isOpen && (
        <>
          {/* Backdrop for outside click dismiss on mobile */}
          <div
            className="fixed inset-0 bg-[#161514]/30 backdrop-blur-[2px] z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={containerRef}
            className="fixed bottom-34 right-3.5 sm:bottom-22 sm:right-6 z-50 w-[310px] sm:w-[330px] rounded-3xl bg-[#FAF8F5] border-3 border-[#161514] shadow-[6px_6px_0px_0px_rgba(22,21,20,1)] p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 select-none"
          >
            {/* Header Strip */}
            <div className="flex items-center justify-between pb-1 border-b-2 border-[#161514]/15">
              <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-[#161514]">
                <span className="h-2 w-2 rounded-full bg-[#03D26F]" />
                <span>🧮 Quick Calc</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowHistory((prev) => !prev)}
                  className={cn(
                    "p-1.5 rounded-xl border-1.5 border-[#161514] text-[10px] font-black transition-all cursor-pointer flex items-center gap-1",
                    showHistory ? "bg-[#CEF431] text-[#161514]" : "bg-white text-[#161514]/70 hover:bg-white"
                  )}
                  title="Calculation History"
                >
                  <History className="h-3 w-3 stroke-[2.5]" />
                  <span className="hidden sm:inline">Tape</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-xl hover:bg-rose-100 text-[#161514]/70 hover:text-rose-600 cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* History Slide-over Drawer */}
            {showHistory ? (
              <div className="h-[300px] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[#161514]/70">Calculation Tape</span>
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => saveHistory([])}
                      className="text-[9px] font-black text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear History
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-[#161514]/50 space-y-1 py-8">
                      <History className="h-6 w-6 stroke-[1.5]" />
                      <p className="text-[11px] font-bold">No calculations yet</p>
                    </div>
                  ) : (
                    history.map((h, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setDisplayValue(h.result);
                          setShowHistory(false);
                        }}
                        className="p-2 rounded-xl bg-white border border-[#161514] hover:bg-[#CEF431]/20 cursor-pointer transition-colors space-y-0.5"
                      >
                        <div className="flex justify-between text-[10px] text-[#161514]/60 font-mono">
                          <span>{h.expression}</span>
                          <span>{h.timestamp}</span>
                        </div>
                        <div className="text-right font-black text-xs font-mono text-[#161514]">
                          = {h.result}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="w-full py-2 rounded-xl bg-[#161514] text-white font-black text-xs uppercase cursor-pointer hover:bg-neutral-800"
                >
                  Back to Keypad
                </button>
              </div>
            ) : (
              <>
                {/* Monospace Digital Display Console */}
                <div className="p-3 rounded-2xl bg-white border-2.5 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] text-right relative group">
                  <div className="text-[11px] font-mono font-bold text-[#161514]/50 h-4 truncate">
                    {expression || " "}
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <button
                      type="button"
                      onClick={handleCopyResult}
                      className="p-1 rounded-lg hover:bg-[#FAF8F5] text-[#161514]/40 hover:text-[#161514] transition-colors cursor-pointer"
                      title="Copy result"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 stroke-[2.5]" />
                      )}
                    </button>

                    <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-[#161514] truncate">
                      {displayValue}
                    </div>
                  </div>
                </div>

                {/* Neobrutalist Tactile Keypad */}
                <div className="grid grid-cols-4 gap-1.5">
                  {/* Row 1 */}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="h-10 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-950 font-black text-xs border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="h-10 rounded-xl bg-white hover:bg-neutral-100 text-[#161514] font-black text-xs border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center"
                    title="Backspace"
                  >
                    ⌫
                  </button>
                  <button
                    type="button"
                    onClick={handlePercentage}
                    className="h-10 rounded-xl bg-white hover:bg-neutral-100 text-[#161514] font-black text-xs border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOperator("÷")}
                    className="h-10 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    ÷
                  </button>

                  {/* Row 2 */}
                  <button
                    type="button"
                    onClick={() => handleNumber("7")}
                    className="h-10 rounded-xl bg-white hover:bg-neutral-100 text-[#161514] font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    7
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumber("8")}
                    className="h-10 rounded-xl bg-white hover:bg-neutral-100 text-[#161514] font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    8
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumber("9")}
                    className="h-10 rounded-xl bg-white hover:bg-neutral-100 text-[#161514] font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    9
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOperator("×")}
                    className="h-10 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    ×
                  </button>

                  {/* Row 3 */}
                  <button
                    type="button"
                    onClick={() => handleNumber("4")}
                    className="h-10 rounded-xl bg-white hover:bg-neutral-100 text-[#161514] font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    4
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumber("5")}
                    className="h-10 rounded-xl bg-white hover:bg-neutral-100 text-[#161514] font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumber("6")}
                    className="h-10 rounded-xl bg-white hover:bg-neutral-100 text-[#161514] font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    6
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOperator("-")}
                    className="h-10 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    −
                  </button>

                  {/* Row 4 */}
                  <button
                    type="button"
                    onClick={() => handleNumber("1")}
                    className="h-10 rounded-xl bg-white hover:bg-neutral-100 text-[#161514] font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumber("2")}
                    className="h-10 rounded-xl bg-white hover:bg-neutral-100 text-[#161514] font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumber("3")}
                    className="h-10 rounded-xl bg-white hover:bg-neutral-100 text-[#161514] font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    3
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOperator("+")}
                    className="h-10 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    +
                  </button>

                  {/* Row 5 */}
                  <button
                    type="button"
                    onClick={handleToggleSign}
                    className="h-10 rounded-xl bg-white hover:bg-neutral-100 text-[#161514] font-black text-xs border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    ±
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumber("0")}
                    className="h-10 rounded-xl bg-white hover:bg-neutral-100 text-[#161514] font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleDecimal}
                    className="h-10 rounded-xl bg-white hover:bg-neutral-100 text-[#161514] font-black text-sm border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all font-mono"
                  >
                    .
                  </button>
                  <button
                    type="button"
                    onClick={handleEquals}
                    className="h-10 rounded-xl bg-[#03D26F] hover:bg-emerald-400 text-white font-black text-base border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    =
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
