"use client";

import React, { useState, useEffect } from "react";
import { AppVersionInfo, APP_VERSION_CONFIG } from "@/config/version";
import { useFeatureFlags } from "@/lib/hooks/useFeatureFlags";
import { InAppDiagnosticsModal } from "@/components/shared/InAppDiagnosticsModal";
import {
  Zap,
  Rocket,
  ShieldCheck,
  RefreshCw,
  Plus,
  Terminal,
  Activity,
  CheckCircle2,
  AlertCircle,
  HardDriveDownload,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function InAppCicdPanel() {
  const [manifestData, setManifestData] = useState<any>(null);
  const [manifestLoading, setManifestLoading] = useState(true);
  const [flagsList, setFlagsList] = useState<Record<string, any>>({});
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // New Release Form
  const [isPublishing, setIsPublishing] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [newBuildNumber, setNewBuildNumber] = useState("");
  const [newChangelog, setNewChangelog] = useState("");
  const [newApkUrl, setNewApkUrl] = useState("/api/download/android");
  const [newSha256, setNewSha256] = useState("");
  const [isMandatory, setIsMandatory] = useState(false);

  const fetchManifest = async () => {
    setManifestLoading(true);
    try {
      const res = await fetch("/api/app/manifest", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setManifestData(data);
      }
    } catch {
      // Fallback
    } finally {
      setManifestLoading(false);
    }
  };

  const fetchFlags = async () => {
    setFlagsLoading(true);
    try {
      const res = await fetch("/api/config/flags", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.flags) {
          setFlagsList(data.flags);
        }
      }
    } catch {
      // Fallback
    } finally {
      setFlagsLoading(false);
    }
  };

  useEffect(() => {
    fetchManifest();
    fetchFlags();
  }, []);

  const handleToggleFlag = async (key: string, currentValue: boolean) => {
    try {
      const targetVal = !currentValue;
      setFlagsList((prev) => ({ ...prev, [key]: targetVal }));

      const res = await fetch("/api/config/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: targetVal }),
      });

      if (!res.ok) throw new Error("Failed to update feature flag");
      toast.success(`Flag '${key}' set to ${targetVal ? "ENABLED" : "DISABLED"}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update flag");
      fetchFlags();
    }
  };

  const handlePublishRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion || !newBuildNumber) {
      toast.error("Version and Build Number are required");
      return;
    }

    setIsPublishing(true);
    try {
      const notes = newChangelog
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const res = await fetch("/api/app/manifest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: newVersion,
          buildNumber: parseInt(newBuildNumber, 10),
          changelog: notes,
          apkDownloadUrl: newApkUrl,
          apkSha256: newSha256,
          isMandatory,
          releaseDate: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to publish release manifest");
      toast.success(`In-App Release v${newVersion} published successfully! 🚀`);
      setNewVersion("");
      setNewBuildNumber("");
      setNewChangelog("");
      setNewSha256("");
      fetchManifest();
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish release");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="bg-white rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[2px_2px_0px_0px_#161514]">
              <Rocket className="size-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-base text-[#161514] uppercase">
                  In-App CI/CD & Delivery Engine
                </h3>
                <span className="bg-emerald-300 text-[#161514] text-[9px] font-black px-2 py-0.5 rounded-full border border-[#161514]">
                  Zero-GitHub Dependency
                </span>
              </div>
              <p className="text-xs font-bold text-[#161514]/70 mt-0.5">
                Self-hosted release manifests, runtime feature flags, and bootloader safe-mode.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDiagnosticsOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#161514] text-white hover:bg-[#2a2725] px-4 py-2.5 rounded-2xl border-2 border-[#161514] font-black text-xs uppercase shadow-[2px_2px_0px_0px_#CEF431] cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <Activity className="size-4 text-[#CEF431]" />
            <span>Open Telemetry & Diagnostics</span>
          </button>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]">
            <span className="text-[9px] font-black uppercase text-[#161514]/60 block">Active Manifest</span>
            <span className="text-lg font-black text-[#161514] font-heading">
              v{manifestData?.latestVersion || APP_VERSION_CONFIG.version}
            </span>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]">
            <span className="text-[9px] font-black uppercase text-[#161514]/60 block">Build Code</span>
            <span className="text-lg font-black text-[#161514] font-heading">
              Build #{manifestData?.buildNumber || APP_VERSION_CONFIG.buildNumber}
            </span>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]">
            <span className="text-[9px] font-black uppercase text-[#161514]/60 block">Delivery Provider</span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-400 inline-block mt-1">
              {manifestData?.provider || "Self-Hosted"}
            </span>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]">
            <span className="text-[9px] font-black uppercase text-[#161514]/60 block">Active Flags</span>
            <span className="text-lg font-black text-[#161514] font-heading">
              {Object.keys(flagsList).length} Configured
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Publish Release Manifest */}
        <div className="bg-white rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
          <div className="flex items-center gap-2">
            <Rocket className="size-4 text-[#161514]" />
            <h4 className="font-heading font-black text-sm uppercase text-[#161514]">
              Publish In-App Release Manifest
            </h4>
          </div>

          <form onSubmit={handlePublishRelease} className="space-y-3 text-xs font-bold text-[#161514]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-black mb-1">Release Version *</label>
                <input
                  type="text"
                  placeholder="e.g. 1.7.3"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-[#161514] bg-[#FAF8F5] focus:outline-none focus:bg-white text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black mb-1">Build Number *</label>
                <input
                  type="number"
                  placeholder="e.g. 24"
                  value={newBuildNumber}
                  onChange={(e) => setNewBuildNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-[#161514] bg-[#FAF8F5] focus:outline-none focus:bg-white text-xs font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black mb-1">APK Download URL</label>
              <input
                type="text"
                placeholder="/api/download/android or direct CDN URL"
                value={newApkUrl}
                onChange={(e) => setNewApkUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-[#161514] bg-[#FAF8F5] focus:outline-none focus:bg-white text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black mb-1">SHA-256 Checksum (Integrity Hash)</label>
              <input
                type="text"
                placeholder="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                value={newSha256}
                onChange={(e) => setNewSha256(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-[#161514] bg-[#FAF8F5] focus:outline-none focus:bg-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black mb-1">Changelog Highlights (One per line)</label>
              <textarea
                rows={3}
                placeholder="In-App CI/CD architecture activated&#10;Instant offline synchronization&#10;Rest day engine"
                value={newChangelog}
                onChange={(e) => setNewChangelog(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-[#161514] bg-[#FAF8F5] focus:outline-none focus:bg-white text-xs font-bold"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isMandatoryCheck"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
                className="size-4 accent-[#161514]"
              />
              <label htmlFor="isMandatoryCheck" className="text-xs font-black uppercase">
                Mandatory Update (Locks older versions)
              </label>
            </div>

            <button
              type="submit"
              disabled={isPublishing}
              className="w-full py-3 bg-[#CEF431] hover:bg-[#bce023] text-[#161514] rounded-2xl border-2 border-[#161514] font-black text-xs uppercase shadow-[3px_3px_0px_0px_#161514] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
            >
              {isPublishing ? "Publishing Manifest..." : "Publish In-App Manifest"}
            </button>
          </form>
        </div>

        {/* Right Column: Live Edge Feature Flags */}
        <div className="bg-white rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="size-4 text-[#161514]" />
              <h4 className="font-heading font-black text-sm uppercase text-[#161514]">
                Runtime Feature Flags & Kill-Switches
              </h4>
            </div>
            <button
              type="button"
              onClick={fetchFlags}
              className="p-1 rounded-lg border border-[#161514] hover:bg-amber-100 cursor-pointer"
            >
              <RefreshCw className={cn("size-3", flagsLoading && "animate-spin")} />
            </button>
          </div>

          <p className="text-xs font-bold text-[#161514]/70">
            Toggling a flag updates edge instances immediately. Client apps revalidate flags every 60 seconds without redeployments.
          </p>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {Object.entries(flagsList).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-mono text-xs font-black text-[#161514] block truncate">
                    {key}
                  </span>
                  <span className="text-[10px] text-[#161514]/60 font-bold block">
                    {typeof val === "boolean"
                      ? val
                        ? "Active across all client apps"
                        : "Disabled by kill-switch"
                      : String(val)}
                  </span>
                </div>

                {typeof val === "boolean" && (
                  <button
                    type="button"
                    onClick={() => handleToggleFlag(key, val)}
                    className={cn(
                      "px-3 py-1 rounded-xl font-black text-[10px] uppercase border-2 border-[#161514] transition-all cursor-pointer shadow-[1px_1px_0px_0px_#161514]",
                      val
                        ? "bg-[#03D26F] text-[#161514]"
                        : "bg-rose-100 text-rose-800"
                    )}
                  >
                    {val ? "Enabled ✓" : "Disabled ✕"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <InAppDiagnosticsModal
        open={isDiagnosticsOpen}
        onOpenChange={setIsDiagnosticsOpen}
      />
    </div>
  );
}
