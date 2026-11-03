"use client";

import React, { useState } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { useOfflineSync } from "@/lib/offline/sync-manager";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  Zap,
  Clock,
  Database,
  HardDrive,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CloudSyncDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloudSyncDrawer({ open, onOpenChange }: CloudSyncDrawerProps) {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    dbLatencyMs,
    serverStatus,
    queueJobs,
    syncNow,
    pingHealth,
  } = useOfflineSync();

  const [pinging, setPinging] = useState(false);

  const handleManualSync = async () => {
    await syncNow();
  };

  const handlePingHealth = async () => {
    setPinging(true);
    try {
      await pingHealth();
    } finally {
      setPinging(false);
    }
  };

  const formattedLastSync = lastSyncTime
    ? (() => {
        try {
          return formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true });
        } catch {
          return "Recently";
        }
      })()
    : "Not yet synced this session";

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="Cloud Sync Telemetry"
      description="Real-time MongoDB Atlas health, latency telemetry & offline queue"
    >
      <div className="space-y-4 pt-1">
        {/* Status Hero Card */}
        <div
          className={`rounded-2xl p-4 border shadow-xs transition-colors ${
            isOnline && serverStatus === "connected"
              ? "bg-[#FAF8F5] dark:bg-[#1C1A18] border-[#E8E5DF] dark:border-[#2A2724]"
              : isOnline && serverStatus === "degraded"
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
              : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-11 w-11 rounded-xl border flex items-center justify-center text-xl shadow-xs shrink-0 ${
                  isOnline && serverStatus === "connected"
                    ? "bg-[#CEF431] text-[#161514] border-[#CEF431]"
                    : isOnline
                    ? "bg-amber-300 text-[#161514] border-amber-300"
                    : "bg-rose-300 text-[#161514] border-rose-300"
                }`}
              >
                {isOnline ? <Cloud className="w-5 h-5 stroke-[2.5]" /> : <CloudOff className="w-5 h-5 stroke-[2.5]" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-sm text-[#161514] dark:text-[#FAF8F5] font-heading">
                    {isOnline && serverStatus === "connected"
                      ? "Cloud Connected"
                      : isOnline
                      ? "Server Degraded"
                      : "Offline Local Mode"}
                  </h3>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shadow-xs ${
                      isOnline && serverStatus === "connected"
                        ? "bg-[#CEF431] text-[#161514] border-[#CEF431]"
                        : isOnline
                        ? "bg-amber-400 text-[#161514] border-amber-400"
                        : "bg-rose-400 text-white border-rose-400"
                    }`}
                  >
                    {isOnline && serverStatus === "connected" ? "Live Atlas" : isOnline ? "Degraded" : "Offline"}
                  </span>
                </div>
                <p className="text-[11px] text-[#161514]/70 dark:text-[#FAF8F5]/70 font-semibold pt-0.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">
                    {isOnline && dbLatencyMs !== null
                      ? `${dbLatencyMs} ms latency to database`
                      : isOnline
                      ? "Measuring ping..."
                      : "Operating from local IndexedDB cache"}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePingHealth}
              disabled={pinging || !isOnline}
              title="Measure ping latency to MongoDB Atlas"
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#252321] hover:bg-amber-50 dark:hover:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] text-[#161514] dark:text-[#FAF8F5] text-[10px] font-black shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Zap className={`h-3 w-3 ${pinging ? "animate-spin text-amber-500" : ""}`} />
              <span>{pinging ? "Pinging…" : "Ping"}</span>
            </button>
          </div>
        </div>

        {/* First-Time User Clarity Note */}
        <div className="bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-800/30 rounded-xl p-3 flex items-start gap-2.5">
          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#161514]/80 dark:text-[#FAF8F5]/80 font-medium leading-relaxed">
            <strong className="font-black text-[#161514] dark:text-[#FAF8F5]">Offline-First Guarantee:</strong> Your habits, study logs, and ledger entries are always saved immediately to your local encrypted device cache. When connected, changes automatically sync to your private cloud vault.
          </p>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-left">
          <div className="bg-white dark:bg-[#1C1A18] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#8C8479] dark:text-[#A8A29E]">
              <Layers className="w-3.5 h-3.5" />
              <span>Pending Queue</span>
            </div>
            <div className="text-lg font-black text-[#161514] dark:text-[#FAF8F5] mt-1 font-heading">
              {pendingCount}{" "}
              <span className="text-[11px] font-bold text-[#8C8479] dark:text-[#A8A29E]">
                {pendingCount === 1 ? "action" : "actions"}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1A18] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#8C8479] dark:text-[#A8A29E]">
              <Clock className="w-3.5 h-3.5" />
              <span>Last Synchronized</span>
            </div>
            <div className="text-xs font-black text-[#161514] dark:text-[#FAF8F5] mt-1.5 truncate">
              {formattedLastSync}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1A18] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#8C8479] dark:text-[#A8A29E]">
              <Database className="w-3.5 h-3.5" />
              <span>Cloud Engine</span>
            </div>
            <div className="text-xs font-black text-[#161514] dark:text-[#FAF8F5] mt-1">
              MongoDB Atlas M0
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1A18] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#8C8479] dark:text-[#A8A29E]">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Client Vault</span>
            </div>
            <div className="text-xs font-black text-[#161514] dark:text-[#FAF8F5] mt-1">
              IndexedDB Secure
            </div>
          </div>
        </div>

        {/* Pending Actions Inspection List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5 font-heading">
              <span>Sync Queue Inspection</span>
            </h4>
            <span className="text-[10px] font-bold text-[#8C8479] dark:text-[#A8A29E]">
              {pendingCount > 0 ? `${pendingCount} waiting` : "Clean ledger"}
            </span>
          </div>

          {queueJobs && queueJobs.length > 0 ? (
            <div className="bg-white dark:bg-[#1C1A18] rounded-xl p-3 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-2 max-h-40 overflow-y-auto">
              {queueJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724]"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-[#161514] dark:text-[#FAF8F5] truncate">{job.label || job.endpoint}</p>
                    <p className="text-[10px] text-[#8C8479] dark:text-[#A8A29E] font-mono uppercase">
                      {job.method} • {job.type || "record"}
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                    Queued
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1C1A18] rounded-xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center gap-3 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="text-xs">
                <p className="font-black text-[#161514] dark:text-[#FAF8F5]">All records are 100% in sync</p>
                <p className="text-[11px] text-[#8C8479] dark:text-[#A8A29E] font-medium">
                  Zero pending mutations waiting in local queue.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline}
            className="w-full py-3 rounded-xl bg-[#CEF431] hover:bg-[#bce022] text-[#161514] font-black text-xs uppercase tracking-wider border border-[#CEF431] shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Flushing Offline Queue..." : "Sync Cloud Ledger Now"}</span>
          </button>
        </div>
      </div>
    </ResponsiveFormContainer>
  );
}
