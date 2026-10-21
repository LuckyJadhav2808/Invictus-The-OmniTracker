"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { diagnosticLogger, DiagnosticLogEntry } from "@/lib/runtime/diagnostic-logger";
import { safeModeWatchdog } from "@/lib/runtime/safe-mode-watchdog";
import { migrationEngine, CURRENT_TARGET_SCHEMA_VERSION } from "@/lib/offline/migration-engine";
import { getPendingOfflineMutations, clearAllOfflineMutations } from "@/lib/offline/indexeddb-store";
import { useFeatureFlags } from "@/lib/hooks/useFeatureFlags";
import { APP_VERSION_CONFIG } from "@/config/version";
import {
  Activity,
  Database,
  Trash2,
  RefreshCw,
  Download,
  ShieldCheck,
  Zap,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InAppDiagnosticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InAppDiagnosticsModal({ open, onOpenChange }: InAppDiagnosticsModalProps) {
  const [entries, setEntries] = useState<DiagnosticLogEntry[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingLoading, setPingLoading] = useState(false);
  const { flags } = useFeatureFlags();
  const currentSchema = migrationEngine.getCurrentVersion();
  const safeStatus = safeModeWatchdog.getStatus();

  useEffect(() => {
    if (!open) return;

    const unsubscribe = diagnosticLogger.subscribe(setEntries);
    updatePending();
    measurePing();

    return () => {
      unsubscribe();
    };
  }, [open]);

  const updatePending = async () => {
    try {
      const items = await getPendingOfflineMutations();
      setPendingCount(items.length);
    } catch {
      setPendingCount(0);
    }
  };

  const measurePing = async () => {
    setPingLoading(true);
    const start = performance.now();
    try {
      const res = await fetch("/api/version?checkPing=1", { cache: "no-store" });
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        setPingLatency(elapsed);
        diagnosticLogger.log("info", "NETWORK", `API ping latency: ${elapsed}ms`);
      } else {
        setPingLatency(-1);
      }
    } catch {
      setPingLatency(-1);
    } finally {
      setPingLoading(false);
    }
  };

  const handleRunMigrations = async () => {
    try {
      const res = await migrationEngine.runMigrations();
      if (res.migrated) {
        toast.success(`Schema upgraded to v${res.toVersion}! 🎉`);
      } else {
        toast.info(res.logs[0] || "Schema already at latest version");
      }
    } catch {
      toast.error("Migration execution failed");
    }
  };

  const handleClearMutations = async () => {
    try {
      await clearAllOfflineMutations();
      setPendingCount(0);
      diagnosticLogger.log("warn", "OFFLINE_STORE", "Offline mutation queue cleared manually");
      toast.success("Offline mutation queue cleared");
    } catch {
      toast.error("Failed to clear offline mutations");
    }
  };

  const handleExportPackage = () => {
    try {
      const json = diagnosticLogger.exportDiagnosticPackage();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invictus_diagnostics_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Diagnostic package exported! 📋");
    } catch {
      toast.error("Failed to export diagnostic data");
    }
  };

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="In-App Telemetry & Diagnostics"
      description="Production self-healing, sync queue inspection, and live telemetry cockpit."
    >
      <div className="space-y-5 py-2">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#FAF8F5] p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#161514]/70">
              API Ping Latency
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Zap className="size-3.5 text-amber-500 fill-amber-500" />
              <span className="text-base font-black text-[#161514]">
                {pingLatency === null
                  ? "..."
                  : pingLatency === -1
                  ? "Offline"
                  : `${pingLatency}ms`}
              </span>
            </div>
          </div>

          <div className="bg-[#FAF8F5] p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#161514]/70">
              Offline Queue
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Database className="size-3.5 text-sky-600" />
              <span className="text-base font-black text-[#161514]">{pendingCount}</span>
            </div>
          </div>

          <div className="bg-[#FAF8F5] p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#161514]/70">
              Local Schema
            </span>
            <div className="flex items-center gap-1 mt-1">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span className="text-base font-black text-[#161514]">
                v{currentSchema}/{CURRENT_TARGET_SCHEMA_VERSION}
              </span>
            </div>
          </div>

          <div className="bg-[#FAF8F5] p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#161514]/70">
              Boot Watchdog
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Activity className="size-3.5 text-[#161514]" />
              <span className="text-xs font-black text-[#161514]">
                {safeStatus.isSafeMode ? "Safe Mode" : "Healthy (0)"}
              </span>
            </div>
          </div>
        </div>

        {/* Feature Flags Active Snapshot */}
        <div className="bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]">
              Runtime Feature Flags (Edge Evaluated)
            </span>
            <span className="text-[9px] font-black uppercase bg-[#CEF431] text-[#161514] px-2 py-0.5 rounded-full border border-[#161514]">
              {Object.keys(flags).length} Active
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-[#161514]/80">
            {Object.entries(flags).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#161514]/30"
              >
                <span className="truncate pr-1">{key}</span>
                <span
                  className={cn(
                    "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0",
                    val === true
                      ? "bg-emerald-100 text-emerald-900 border-emerald-600"
                      : val === false
                      ? "bg-zinc-200 text-zinc-700 border-zinc-400"
                      : "bg-amber-100 text-amber-900 border-amber-600"
                  )}
                >
                  {String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Self-Healing Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleRunMigrations}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-white text-[#161514] font-black text-[10px] uppercase border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <ShieldCheck className="size-3.5" />
            <span>Check Migrations</span>
          </button>

          <button
            type="button"
            onClick={handleClearMutations}
            disabled={pendingCount === 0}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-rose-50 text-rose-700 font-black text-[10px] uppercase border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] cursor-pointer disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <Trash2 className="size-3.5" />
            <span>Flush Queue ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={handleExportPackage}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#CEF431] hover:bg-[#bce023] text-[#161514] font-black text-[10px] uppercase border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <Download className="size-3.5" />
            <span>Export Diagnostics</span>
          </button>
        </div>

        {/* Circular Diagnostic Logs Stream */}
        <div className="bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#161514] flex items-center gap-1">
              <Terminal className="size-3" />
              <span>Diagnostic Event Stream (Last 40)</span>
            </span>
            <button
              type="button"
              onClick={() => diagnosticLogger.clear()}
              className="text-[9px] font-black uppercase text-[#161514]/60 hover:text-[#161514] underline"
            >
              Clear Logs
            </button>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px]">
            {entries.length === 0 ? (
              <p className="text-[#161514]/50 py-4 text-center">No diagnostic events logged yet.</p>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-2 rounded-lg bg-[#FAF8F5] border border-[#161514]/20 flex items-start justify-between gap-2 leading-tight"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded text-[8px] font-black uppercase border",
                          entry.level === "error"
                            ? "bg-rose-100 text-rose-800 border-rose-500"
                            : entry.level === "warn"
                            ? "bg-amber-100 text-amber-800 border-amber-500"
                            : entry.level === "system"
                            ? "bg-indigo-100 text-indigo-800 border-indigo-500"
                            : "bg-emerald-100 text-emerald-800 border-emerald-500"
                        )}
                      >
                        {entry.tag}
                      </span>
                      <span className="text-[9px] text-[#161514]/50">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[#161514] break-all">{entry.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ResponsiveFormContainer>
  );
}
