"use client";

import { useState, useEffect } from "react";
import { Download, RefreshCw, X, Sparkles } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { APP_VERSION_CONFIG } from "@/config/version";
import { UpdateCheckModal } from "@/components/shared/UpdateCheckModal";
import { soundFX } from "@/components/shared/SoundFX";

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

    // Delay so it doesn't compete with initial page load animations
    const timer = setTimeout(checkForUpdates, 1500);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    soundFX.playPop();
    setDismissed(true);
    sessionStorage.setItem("invictus_update_dismissed", "true");
  };

  const handleTriggerUpdate = () => {
    soundFX.playPop();
    if (Capacitor.isNativePlatform()) {
      setModalOpen(true);
    } else {
      window.location.reload();
    }
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
      {/* 
        Production Ergonomic Floating Dock:
        - Mobile (< lg): Pinned right above the bottom nav dock in the thumb zone (bottom-[calc(env(safe-area-inset-bottom,0px)+76px)]).
          Immune to Android status bar / clock / notch / camera overlaps and leaves header (Strobi/Dynamic Island) 100% untouched.
        - Desktop (>= lg): Pinned in the bottom-right corner (bottom-6 right-6), Linear/Raycast style.
          Does NOT push down page content or stretch 1920px wide across the top.
      */}
      <aside
        role="alert"
        aria-live="polite"
        className="fixed z-50 pointer-events-none transition-all duration-300
          bottom-[calc(env(safe-area-inset-bottom,0px)+76px)] inset-x-3 max-w-sm mx-auto
          lg:bottom-6 lg:right-6 lg:left-auto lg:inset-x-auto lg:max-w-md
          animate-in fade-in slide-in-from-bottom-4"
      >
        <div className="pointer-events-auto bg-[#CEF431] border-2 border-[#161514] rounded-2xl p-2.5 sm:p-3 shadow-[3px_3px_0px_#161514] lg:shadow-[4px_4px_0px_#161514] text-[#161514] select-none flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Left: Badge & Version info */}
          <div
            onClick={handleTriggerUpdate}
            className="flex items-center gap-2 sm:gap-2.5 min-w-0 cursor-pointer group flex-1"
            title="Click to install update"
          >
            <span className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-xl bg-[#161514] text-white text-xs font-black shadow-[1.5px_1.5px_0px_0px_#FAF8F5] group-hover:scale-105 transition-transform">
              ⚡
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-xs sm:text-[13px] tracking-tight leading-none text-[#161514]">
                  v{updateInfo.latestVersion} Available
                </span>
                <span className="hidden sm:inline-block size-1.5 rounded-full bg-[#161514] opacity-50" />
                <span className="hidden sm:inline font-mono font-bold text-[10px] text-[#161514]/70 uppercase tracking-wider">
                  Update
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-mono text-[#161514]/80 truncate mt-0.5 leading-tight">
                {Capacitor.isNativePlatform() ? "Tap to download & install APK" : "Tap to reload latest build"}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {Capacitor.isNativePlatform() ? (
              <button
                type="button"
                onClick={handleTriggerUpdate}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#161514] hover:bg-[#252321] text-white font-black text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 shadow-[1.5px_1.5px_0px_0px_#FAF8F5] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
              >
                <Download className="size-3 text-[#CEF431] stroke-[2.5]" />
                <span>Update</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTriggerUpdate}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#161514] hover:bg-[#252321] text-white font-black text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 shadow-[1.5px_1.5px_0px_0px_#FAF8F5] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
              >
                <RefreshCw className="size-3 text-[#CEF431] stroke-[2.5]" />
                <span className="sm:hidden">Reload</span>
                <span className="hidden sm:inline">Reload ⚡</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss update alert"
              className="size-7 rounded-lg text-[#161514]/70 hover:text-[#161514] hover:bg-black/10 transition-colors flex items-center justify-center cursor-pointer"
            >
              <X className="size-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </aside>

      <UpdateCheckModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        autoCheck={false}
      />
    </>
  );
}
