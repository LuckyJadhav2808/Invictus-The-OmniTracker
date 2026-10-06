"use client";

import React, { useState } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { useOfflineSync } from "@/lib/offline/sync-manager";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  Database,
  HardDrive,
  Layers,
  ArrowRight,
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
          className={`rounded-2xl p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] transition-all ${
            isOnline && serverStatus === "connected"
              ? "bg-[#FAF8F5]"
              : isOnline && serverStatus === "degraded"
              ? "bg-amber-50"
              : "bg-rose-50"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`h-11 w-11 rounded-xl border-2 border-[#161514] flex items-center justify-center text-xl shadow-[1.5px_1.5px_0px_0px_#161514] ${
                  isOnline && serverStatus === "connected"
                    ? "bg-[#CEF431]"
                    : isOnline
                    ? "bg-amber-300"
                    : "bg-rose-300"
                }`}
              >
                {isOnline ? <Cloud className="w-5 h-5 stroke-[2.5]" /> : <CloudOff className="w-5 h-5 stroke-[2.5]" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-[#161514] font-heading">
                    {isOnline && serverStatus === "connected"
                      ? "Cloud Connected"
                      : isOnline
                      ? "Server Degraded"
                      : "Offline Local Mode"}
                  </h3>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-[#161514] ${
                      isOnline && serverStatus === "connected"
                        ? "bg-[#CEF431] text-[#161514]"
                        : isOnline
                        ? "bg-amber-400 text-[#161514]"
                        : "bg-rose-400 text-white"
                    }`}
                  >
                    {isOnline && serverStatus === "connected" ? "Live Atlas" : isOnline ? "Degraded" : "Offline"}
                  </span>
                </div>
                <p className="text-[11px] text-[#161514]/70 font-semibold pt-0.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>
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
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 border-2 border-[#161514] text-[#161514] text-[10px] font-black shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Zap className={`h-3 w-3 ${pinging ? "animate-spin text-amber-500" : ""}`} />
              <span>{pinging ? "Pinging…" : "Ping"}</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-left">
          <div className="bg-white p-3 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#8C8479]">
              <Layers className="w-3.5 h-3.5" />
              <span>Pending Queue</span>
            </div>
            <div className="text-lg font-black text-[#161514] mt-1 font-heading">
              {pendingCount}{" "}
              <span className="text-[11px] font-bold text-[#8C8479]">
                {pendingCount === 1 ? "action" : "actions"}
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#8C8479]">
              <Clock className="w-3.5 h-3.5" />
              <span>Last Synchronized</span>
            </div>
            <div className="text-xs font-black text-[#161514] mt-1.5 truncate">
              {formattedLastSync}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#8C8479]">
              <Database className="w-3.5 h-3.5" />
              <span>Cloud Engine</span>
            </div>
            <div className="text-xs font-black text-[#161514] mt-1">
              MongoDB Atlas M0
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#8C8479]">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Client Vault</span>
            </div>
            <div className="text-xs font-black text-[#161514] mt-1">
              IndexedDB Secure
            </div>
          </div>
        </div>

        {/* Pending Actions Inspection List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#161514] flex items-center gap-1.5 font-heading">
              <span>Sync Queue Inspection</span>
            </h4>
            <span className="text-[10px] font-bold text-[#8C8479]">
              {pendingCount > 0 ? `${pendingCount} waiting` : "Clean ledger"}
            </span>
          </div>

          {queueJobs && queueJobs.length > 0 ? (
            <div className="bg-white rounded-xl p-3 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] space-y-2 max-h-40 overflow-y-auto">
              {queueJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FAF8F5] border border-[#161514]/20"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-[#161514] truncate">{job.label || job.endpoint}</p>
                    <p className="text-[10px] text-[#8C8479] font-mono uppercase">
                      {job.method} • {job.type || "record"}
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                    Queued
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-[#161514] flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="text-xs">
                <p className="font-black text-[#161514]">All records are 100% in sync</p>
                <p className="text-[11px] text-[#8C8479] font-medium">
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
            className="w-full py-3 rounded-2xl bg-[#CEF431] hover:bg-[#bce022] text-[#161514] font-black text-xs uppercase tracking-wider border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Flushing Offline Queue..." : "Sync Cloud Ledger Now"}</span>
          </button>
        </div>
      </div>
    </ResponsiveFormContainer>
  );
}
