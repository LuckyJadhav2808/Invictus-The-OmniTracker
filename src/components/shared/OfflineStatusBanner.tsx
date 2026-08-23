"use client";

import { useOfflineSync } from "@/lib/offline/sync-manager";
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineStatusBanner() {
  const { isOnline, isSyncing, pendingCount, syncNow } = useOfflineSync();
  const [showSyncedBanner, setShowSyncedBanner] = useState(false);
  const [prevSyncing, setPrevSyncing] = useState(false);

  useEffect(() => {
    if (prevSyncing && !isSyncing && isOnline && pendingCount === 0) {
      setShowSyncedBanner(true);
      const timer = setTimeout(() => setShowSyncedBanner(false), 3500);
      return () => clearTimeout(timer);
    }
    setPrevSyncing(isSyncing);
  }, [isSyncing, isOnline, pendingCount, prevSyncing]);

  // Nothing to show if online, not syncing, and no pending changes
  if (isOnline && !isSyncing && pendingCount === 0 && !showSyncedBanner) {
    return null;
  }

  return (
    <aside aria-label="Network Status" className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* 1. Offline Mode Pill */}
      {!isOnline && (
        <div className="flex items-center gap-2.5 bg-[#FEF08A] text-[#161514] font-black text-xs md:text-sm px-4 py-2 rounded-full border-[2.5px] border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)]">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          <WifiOff className="w-4 h-4 text-[#161514] shrink-0" />
          <span>
            OFFLINE MODE {pendingCount > 0 && <span className="underline ml-1">({pendingCount} saved locally)</span>}
          </span>
        </div>
      )}

      {/* 2. Syncing In-Progress Pill */}
      {isOnline && isSyncing && (
        <div className="flex items-center gap-2 bg-[#67E8F9] text-[#161514] font-black text-xs md:text-sm px-4 py-2 rounded-full border-[2.5px] border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)]">
          <RefreshCw className="w-4 h-4 text-[#161514] animate-spin shrink-0" />
          <span>SYNCING {pendingCount > 0 ? `(${pendingCount} changes)...` : "TO CLOUD..."}</span>
        </div>
      )}

      {/* 3. Online with Pending Changes (Manual Trigger Available) */}
      {isOnline && !isSyncing && pendingCount > 0 && (
        <button
          onClick={() => syncNow()}
          className="flex items-center gap-2 bg-[#FED7AA] hover:bg-[#FDBA74] active:translate-x-0.5 active:translate-y-0.5 text-[#161514] font-black text-xs md:text-sm px-4 py-2 rounded-full border-[2.5px] border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] transition-all cursor-pointer"
        >
          <CloudUpload className="w-4 h-4 text-[#161514] shrink-0" />
          <span>{pendingCount} PENDING • TAP TO SYNC ⚡</span>
        </button>
      )}

      {/* 4. Synced Confirmation Pill */}
      {showSyncedBanner && isOnline && !isSyncing && pendingCount === 0 && (
        <div className="flex items-center gap-2 bg-[#CEF431] text-[#161514] font-black text-xs md:text-sm px-4 py-2 rounded-full border-[2.5px] border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] animate-in fade-in zoom-in-95 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#161514] shrink-0" />
          <span>ALL CHANGES SYNCED! ☁️</span>
        </div>
      )}
    </aside>
  );
}
