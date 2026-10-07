import { useState, useEffect } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, RefreshCw, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck, Terminal, HardDriveDownload } from "lucide-react";
import { APP_VERSION_CONFIG } from "@/config/version";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { NativeAppUpdater } from "@/lib/native/app-update-bridge";

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
  const [installedVersion, setInstalledVersion] = useState<string>(APP_VERSION_CONFIG.version);

  // In-app download state
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [permissionNeeded, setPermissionNeeded] = useState(false);

  const fetchVersion = async (showToastOnLatest = false) => {
    setLoading(true);
    try {
      let currentClientVer = APP_VERSION_CONFIG.version;
      try {
        if (Capacitor.isNativePlatform()) {
          const info = await App.getInfo();
          if (info?.version) {
            currentClientVer = info.version;
            setInstalledVersion(info.version);
          }
        }
      } catch (err) {
        console.warn("Could not read native app version:", err);
      }

      const res = await fetch(`/api/version?installedVersion=${encodeURIComponent(currentClientVer)}`);
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

  const handleInAppDownload = async () => {
    if (NativeAppUpdater.isSupported()) {
      const canInstall = await NativeAppUpdater.canInstallPackages();
      if (!canInstall) {
        setPermissionNeeded(true);
        toast.info("Please allow Invictus to install updates, then tap Download again.");
        await NativeAppUpdater.openInstallPermissionSettings();
        return;
      }
    }

    setDownloading(true);
    setProgress(0);
    setDownloadedBytes(0);
    setTotalBytes(0);
    setPermissionNeeded(false);

    try {
      toast.info("Downloading APK update in-app... 🚀");
      const res = await NativeAppUpdater.downloadAndInstall(apkUrl, (evt) => {
        setProgress(evt.progress);
        setDownloadedBytes(evt.bytesDownloaded);
        setTotalBytes(evt.totalBytes);
      });

      if (res.success) {
        toast.success("Download complete! Launching package installer... 📦");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to download update in-app.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="App Version & Updates"
      description="Inspect version status, release notes, and install updates"
    >
      <div className="space-y-4 pt-2">
        {/* Version Status Hero Card */}
        <div className="bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl border-2 border-[#161514] flex items-center justify-center text-lg shadow-[1.5px_1.5px_0px_0px_#161514] ${
                hasUpdate ? "bg-amber-300" : "bg-[#CEF431]"
              }`}>
                {hasUpdate ? "⚡" : "✨"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-[#161514] font-heading">
                    Invictus v{currentVer}
                  </h3>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-[#161514] ${
                    hasUpdate ? "bg-amber-400 text-[#161514]" : "bg-[#CEF431] text-[#161514]"
                  }`}>
                    {hasUpdate ? `Update: v${latestVer}` : "Up to date"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#161514]/70 font-semibold pt-0.5">
                  <span>Native Shell: v{installedVersion}</span>
                  <span>•</span>
                  <span>Web Engine: v{APP_VERSION_CONFIG.version}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchVersion(true)}
              disabled={loading || downloading}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 border-2 border-[#161514] text-[#161514] text-[10px] font-black shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Checking…" : "Check"}</span>
            </button>
          </div>

          {/* Status Message Banner */}
          {hasUpdate ? (
            <div className="bg-amber-100 rounded-xl p-2.5 border-2 border-[#161514] flex items-center gap-2 text-xs font-bold text-amber-950">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Native APK <strong>v{latestVer}</strong> available! Install to update widgets & icons.</span>
            </div>
          ) : (
            <div className="bg-emerald-50 rounded-xl p-2.5 border-2 border-[#161514] flex items-center gap-2 text-xs font-bold text-emerald-950">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>You have the latest release installed with all native widgets active.</span>
            </div>
          )}
        </div>

        {/* Live Download Progress Card */}
        {downloading && (
          <div className="bg-[#161514] text-white rounded-2xl p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#CEF431] space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#CEF431]" />
                <span>{progress >= 100 ? "Launching Android Installer..." : "Downloading APK in-app..."}</span>
              </span>
              <span className="font-mono text-[#CEF431] text-sm">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden border border-white/20 p-0.5">
              <div
                className="h-full bg-[#CEF431] rounded-full transition-all duration-200"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-white/70 font-mono">
              <span>
                {downloadedBytes > 0
                  ? `${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB`
                  : "Connecting..."}
              </span>
              <span>
                {totalBytes > 0
                  ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
                  : "Calculating..."}
              </span>
            </div>
          </div>
        )}

        {/* Unknown Sources Permission Helper */}
        {permissionNeeded && (
          <div className="bg-amber-100 border-2 border-[#161514] rounded-xl p-3 text-xs space-y-2 text-[#161514]">
            <div className="font-black flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-700" />
              <span>Install Permission Needed</span>
            </div>
            <p className="text-[11px] font-medium leading-tight">
              Android requires permission to install updates directly inside Invictus. Tap below to enable &ldquo;Allow from this source&rdquo;, then retry.
            </p>
            <button
              type="button"
              onClick={() => NativeAppUpdater.openInstallPermissionSettings()}
              className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 font-black text-[11px] uppercase tracking-wider border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              Open Android Settings ⚙️
            </button>
          </div>
        )}

        {/* Release Notes / What's New */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#161514] flex items-center gap-1.5 font-heading">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Release Highlights (v{hasUpdate ? latestVer : currentVer})</span>
            </h4>
            {lastChecked && (
              <span className="text-[9px] font-bold text-[#161514]/60">
                Checked at {lastChecked}
              </span>
            )}
          </div>

          <div className="bg-white rounded-2xl p-3.5 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] space-y-2 max-h-48 overflow-y-auto">
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
            <button
              type="button"
              onClick={handleInAppDownload}
              disabled={downloading}
              className="w-full py-3 rounded-2xl bg-[#CEF431] hover:bg-[#bce022] text-[#161514] font-black text-xs uppercase tracking-wider border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <HardDriveDownload className="h-4 w-4" />
              <span>{downloading ? "Downloading in App..." : `Download & Install in App (v${latestVer})`}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleInAppDownload}
              disabled={downloading}
              className="w-full py-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-white text-[#161514] font-black text-xs border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{downloading ? "Downloading..." : "Re-download APK in App"}</span>
            </button>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <a
              href="https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker/releases/download/v1.7.1/Invictus.apk"
              download="Invictus.apk"
              className="text-center text-[10px] font-bold text-[#161514] underline underline-offset-2 hover:text-[#037A48]"
            >
              📥 Direct APK Download ↗
            </a>
            <a
              href={releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-[10px] font-bold text-[#161514]/70 hover:text-[#161514] underline underline-offset-2"
            >
              GitHub Release Notes ↗
            </a>
          </div>
        </div>
      </div>
    </ResponsiveFormContainer>
  );
}
