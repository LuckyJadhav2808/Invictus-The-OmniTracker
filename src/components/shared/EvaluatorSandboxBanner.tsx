"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { loadEvaluatorDemoData, clearEvaluatorDemoData, isDemoDataActive } from "@/lib/demo/demo-data-seed";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";
import { Sparkles, Trash2, ShieldAlert, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function EvaluatorSandboxBanner() {
  const { isGuest, user } = useAuth();
  const queryClient = useQueryClient();
  const [demoActive, setDemoActive] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDemoActive(isDemoDataActive());
    }
  }, []);

  // Strict Safety Guard: Never render for authenticated main accounts!
  if (!isGuest || (user && user.uid !== "guest-user")) return null;

  const handleReloadDemo = () => {
    soundFX.playCompleteChime();
    soundFX.vibrate(25);
    const success = loadEvaluatorDemoData();
    if (success) {
      setDemoActive(true);
      // Invalidate all TanStack Query caches so all spaces update live
      queryClient.invalidateQueries();
      toast.success("Evaluator Showcase Loaded! 🚀✨", {
        description: "All features populated with fresh, relative demo data.",
      });
    } else {
      toast.error("Failed to load demo data.");
    }
  };

  const handleClearDemo = () => {
    soundFX.playPop();
    soundFX.vibrate(20);
    const success = clearEvaluatorDemoData();
    if (success) {
      setDemoActive(false);
      // Invalidate all TanStack Query caches
      queryClient.invalidateQueries();
      toast.info("Demo Data Cleared! 🧹", {
        description: "Workspace is now a clean blank canvas.",
      });
    } else {
      toast.error("Failed to clear demo data.");
    }
  };

  if (minimized) {
    return (
      <div className="fixed top-2 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            setMinimized(false);
          }}
          className="bg-[#CEF431] hover:bg-[#D8F74E] text-[#161514] font-heading font-black text-[10px] px-3 py-1.5 rounded-full border-2 border-[#161514] shadow-[2px_2px_0px_#161514] flex items-center gap-1.5 cursor-pointer active:translate-y-0.5"
          title="Open Evaluator Sandbox Controls"
        >
          <span>🧪 Evaluator Sandbox</span>
          <ChevronDown className="size-3 stroke-[3]" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAF8F5] border-b-2 border-[#161514] px-3 sm:px-6 py-2 shadow-[0_2px_0px_#161514] select-none z-40 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#161514] text-[#CEF431] px-2 py-0.5 rounded-md text-[10px] font-mono font-black border border-[#161514]">
            <span>🧪</span>
            <span>EVALUATOR SANDBOX</span>
          </div>
          <span className="text-xs font-heading font-black text-[#161514] hidden md:inline">
            Offline Guest Evaluation Mode
          </span>
          <span
            className={cn(
              "text-[9px] font-mono font-black px-1.5 py-0.2 rounded border",
              demoActive
                ? "bg-emerald-100 text-emerald-800 border-emerald-600"
                : "bg-zinc-100 text-zinc-600 border-zinc-400"
            )}
          >
            {demoActive ? "🟢 Showcase Loaded" : "⚪ Blank Canvas"}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClearDemo}
            className="text-[10px] font-heading font-black text-[#161514] bg-white hover:bg-rose-100 px-2.5 py-1 rounded-lg border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] flex items-center gap-1 cursor-pointer active:translate-y-0.5 transition-all"
            title="Delete demo data and test blank states"
          >
            <Trash2 className="size-3 stroke-[2.5]" />
            <span>Clear Demo Data</span>
          </button>

          <button
            type="button"
            onClick={handleReloadDemo}
            className="text-[10px] font-heading font-black text-[#161514] bg-[#CEF431] hover:bg-[#D8F74E] px-2.5 py-1 rounded-lg border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] flex items-center gap-1 cursor-pointer active:translate-y-0.5 transition-all"
            title="Reload full showcase with current timestamps"
          >
            <Sparkles className="size-3 stroke-[2.5]" />
            <span>Reload Showcase</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setMinimized(true);
            }}
            className="size-6 rounded-md border border-[#161514] bg-white hover:bg-[#FAF8F5] flex items-center justify-center text-[#161514] cursor-pointer"
            title="Minimize Banner"
          >
            <ChevronUp className="size-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
