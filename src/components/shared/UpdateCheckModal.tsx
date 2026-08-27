"use client";

import { useState, useEffect } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, RefreshCw, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck, Terminal } from "lucide-react";
import { APP_VERSION_CONFIG } from "@/config/version";
import { toast } from "sonner";

interface UpdateData {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  isMandatory: boolean;
  title: string;
  releaseNotes: string[];
  downloadUrl: string;
  apkDownloadUrl: string;
  publishedAt: string;
}

interface UpdateCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoCheck?: boolean;
}

export function UpdateCheckModal({ open, onOpenChange, autoCheck = false }: UpdateCheckModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UpdateData | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const fetchVersion = async (showToastOnLatest = false) => {
    setLoading(true);
    try {
      const res = await fetch("/api/version");
      if (!res.ok) throw new Error("Failed to fetch version");
      const result: UpdateData = await res.json();
      setData(result);
      setLastChecked(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

      if (showToastOnLatest) {
        if (result.hasUpdate) {
          toast.success(`New update available: v${result.latestVersion}! 🚀`);
        } else {
          toast.success(`You're running the latest version (v${result.currentVersion})! ✨`);
        }
      }
    } catch {
      toast.error("Failed to check for updates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open || autoCheck) {
      fetchVersion(false);
    }
  }, [open, autoCheck]);

  const currentVer = data?.currentVersion || APP_VERSION_CONFIG.version;
  const latestVer = data?.latestVersion || APP_VERSION_CONFIG.version;
  const hasUpdate = data?.hasUpdate || false;
  const releaseNotes = data?.releaseNotes || APP_VERSION_CONFIG.changelog;
  const apkUrl = data?.apkDownloadUrl || `${APP_VERSION_CONFIG.githubRepoUrl}/releases/latest`;
  const releaseUrl = data?.downloadUrl || `${APP_VERSION_CONFIG.githubRepoUrl}/releases/latest`;

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="App Version & Updates"
      description="Inspect version status, release notes, and install updates"
    >
      <div className="space-y-4 pt-2">
        {/* Version Status Hero Card */}
        <div className="bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl border-2 border-[#161514] flex items-center justify-center text-lg shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] ${
                hasUpdate ? "bg-amber-300" : "bg-[#CEF431]"
              }`}>
                {hasUpdate ? "⚡" : "✨"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-[#161514]">
                    Invictus v{currentVer}
                  </h3>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-[#161514] ${
                    hasUpdate ? "bg-amber-400 text-[#161514]" : "bg-[#CEF431] text-[#161514]"
                  }`}>
                    {hasUpdate ? `Update: v${latestVer}` : "Up to date"}
                  </span>
                </div>
                <p className="text-[10px] text-[#161514]/70 font-semibold pt-0.5">
                  Build #{APP_VERSION_CONFIG.buildNumber} • {APP_VERSION_CONFIG.channel.toUpperCase()} Channel
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchVersion(true)}
              disabled={loading}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 border-2 border-[#161514] text-[#161514] text-[10px] font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Checking…" : "Check"}</span>
            </button>
          </div>

          {/* Status Message Banner */}
          {hasUpdate ? (
            <div className="bg-amber-100 rounded-xl p-2.5 border border-[#161514] flex items-center gap-2 text-xs font-bold text-amber-950">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>A new version <strong>v{latestVer}</strong> is available for download!</span>
            </div>
          ) : (
            <div className="bg-emerald-50 rounded-xl p-2.5 border border-[#161514] flex items-center gap-2 text-xs font-bold text-emerald-950">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>You have the latest production release with all features active.</span>
            </div>
          )}
        </div>

        {/* Release Notes / What's New */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-navy-950 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Release Highlights (v{hasUpdate ? latestVer : currentVer})</span>
            </h4>
            {lastChecked && (
              <span className="text-[9px] font-bold text-navy-500">
                Checked at {lastChecked}
              </span>
            )}
          </div>

          <div className="bg-white rounded-2xl p-3.5 border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] space-y-2 max-h-48 overflow-y-auto">
            {releaseNotes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-[#161514] font-medium leading-tight">
                <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {hasUpdate ? (
            <a
              href={apkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-[#CEF431] hover:bg-[#bce022] text-[#161514] font-black text-xs uppercase tracking-wider border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download & Install APK (v{latestVer})</span>
            </a>
          ) : (
            <a
              href={apkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-white text-[#161514] font-black text-xs border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Re-download Installable APK</span>
            </a>
          )}

          <a
            href={releaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 text-center block text-[11px] font-bold text-navy-700 hover:text-navy-950 underline underline-offset-2"
          >
            View Changelog on GitHub Releases ↗
          </a>
        </div>
      </div>
    </ResponsiveFormContainer>
  );
}
