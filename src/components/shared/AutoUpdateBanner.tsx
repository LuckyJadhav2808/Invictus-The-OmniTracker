"use client";

import { useState, useEffect } from "react";
import { Sparkles, Download, X } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { APP_VERSION_CONFIG } from "@/config/version";
import { UpdateCheckModal } from "@/components/shared/UpdateCheckModal";

interface VersionResponse {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  apkDownloadUrl?: string;
  title?: string;
}

export function AutoUpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState<VersionResponse | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Check if dismissed for current session
    const isDismissed = sessionStorage.getItem("invictus_update_dismissed") === "true";
    if (isDismissed) return;

    let isMounted = true;

    async function checkForUpdates() {
      try {
        let clientVer = APP_VERSION_CONFIG.version;
        if (Capacitor.isNativePlatform()) {
          try {
            const info = await App.getInfo();
            if (info?.version) {
              clientVer = info.version;
            }
          } catch {
            // Fallback cleanly
          }
        }

        const res = await fetch(`/api/version?installedVersion=${encodeURIComponent(clientVer)}`);
        if (!res.ok) return;

        const data: VersionResponse = await res.json();
        if (isMounted && data.hasUpdate) {
          setUpdateInfo(data);
        }
      } catch {
        // Silent failure in background
      }
    }

    // Small delay so it doesn't compete with initial page load animations
    const timer = setTimeout(checkForUpdates, 1800);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("invictus_update_dismissed", "true");
  };

  if (!updateInfo || !updateInfo.hasUpdate || dismissed) {
    return (
      <UpdateCheckModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        autoCheck={false}
      />
    );
  }

  return (
    <>
      <div className="w-full bg-[#CEF431] border-b-2 border-[#161514] px-4 py-2 text-[#161514] shadow-[0px_2px_0px_0px_#161514] z-40 sticky top-0 animate-in slide-in-from-top duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#161514] text-white text-xs font-black shadow-[1px_1px_0px_0px_#FAF8F5]">
              ⚡
            </span>
            <div className="truncate">
              <span className="font-black uppercase tracking-wide mr-1.5 font-heading">
                New v{updateInfo.latestVersion} Available:
              </span>
              <span className="hidden sm:inline font-bold opacity-80">
                Daily budget tracking, widgets & performance updates.
              </span>
              <span className="sm:hidden font-bold opacity-80">
                Tap to update
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setModalOpen(true)}
              className="px-3 py-1 rounded-lg bg-[#161514] hover:bg-[#252321] text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#FAF8F5] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
            >
              <Download className="h-3 w-3 text-[#CEF431]" />
              <span>Update Now</span>
            </button>

            <button
              onClick={handleDismiss}
              aria-label="Dismiss update alert"
              className="p-1 rounded-md text-[#161514]/70 hover:text-[#161514] hover:bg-black/10 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <UpdateCheckModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        autoCheck={false}
      />
    </>
  );
}
