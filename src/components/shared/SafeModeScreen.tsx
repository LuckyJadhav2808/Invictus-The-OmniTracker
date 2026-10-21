"use client";

import React, { useState } from "react";
import { safeModeWatchdog } from "@/lib/runtime/safe-mode-watchdog";
import { diagnosticLogger } from "@/lib/runtime/diagnostic-logger";
import { ShieldAlert, RefreshCw, Trash2, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface SafeModeScreenProps {
  onDismiss: () => void;
}

export function SafeModeScreen({ onDismiss }: SafeModeScreenProps) {
  const [purged, setPurged] = useState(false);
  const status = safeModeWatchdog.getStatus();

  const handlePurge = () => {
    safeModeWatchdog.purgeVolatileCaches();
    setPurged(true);
    toast.success("Volatile caches purged! Reloading...");
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleExportLogs = () => {
    try {
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(diagnosticLogger.exportDiagnosticPackage());
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `invictus_diagnostic_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Diagnostic package exported! 📋");
    } catch {
      toast.error("Failed to export diagnostic package");
    }
  };

  const handleOverride = () => {
    safeModeWatchdog.resetWatchdog();
    onDismiss();
    toast.info("Safe mode dismissed");
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#161514]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border-[3px] border-[#161514] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-[8px_8px_0px_0px_#161514] text-[#161514] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-rose-100 border-2 border-[#161514] flex items-center justify-center text-rose-600 shadow-[2px_2px_0px_0px_#161514] shrink-0">
            <ShieldAlert className="size-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className="text-lg font-black uppercase tracking-tight text-[#161514]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Safe Mode Triggered
              </h2>
              <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                Circuit Breaker
              </span>
            </div>
            <p className="text-xs font-bold text-[#161514]/70 mt-0.5">
              Invictus detected {status.crashCount} consecutive startup crashes.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] text-xs font-bold text-[#161514]/80 leading-relaxed space-y-2">
          <p>
            To prevent unrecoverable white-screen loops, the in-app bootloader watchdog caught the issue and halted automatic initialization.
          </p>
          <p className="text-[11px] text-[#161514]/60">
            Your account credentials and cloud data remain secure in MongoDB. Local caches may need to be refreshed.
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handlePurge}
            disabled={purged}
            className="w-full flex items-center justify-center gap-2 bg-[#CEF431] hover:bg-[#bce023] text-[#161514] font-black text-xs uppercase px-4 py-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            <Trash2 className="size-4" />
            <span>{purged ? "Purging..." : "Purge Local Caches & Reboot"}</span>
          </button>

          <button
            type="button"
            onClick={handleOverride}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#FAF8F5] text-[#161514] font-black text-xs uppercase px-4 py-2.5 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            <RefreshCw className="size-4" />
            <span>Continue to App (Override)</span>
          </button>

          <button
            type="button"
            onClick={handleExportLogs}
            className="w-full flex items-center justify-center gap-2 bg-transparent text-[#161514]/70 hover:text-[#161514] font-black text-[11px] uppercase py-1.5 transition-colors cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>Export Diagnostic Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
