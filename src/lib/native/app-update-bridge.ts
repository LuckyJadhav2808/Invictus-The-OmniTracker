"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";

export interface DownloadProgressEvent {
  progress: number; // 0 - 100
  bytesDownloaded: number;
  totalBytes: number;
}

interface AppUpdateBridgePluginType {
  canInstallPackages(): Promise<{ canInstall: boolean }>;
  openInstallPermissionSettings(): Promise<{ opened: boolean }>;
  downloadAndInstallApk(options: { url: string }): Promise<{ success: boolean; message?: string }>;
  addListener(
    eventName: "downloadProgress",
    listenerFunc: (event: DownloadProgressEvent) => void
  ): Promise<{ remove: () => Promise<void> }>;
  addListener(
    eventName: "downloadError",
    listenerFunc: (error: { error: string }) => void
  ): Promise<{ remove: () => Promise<void> }>;
}

const AppUpdateBridge = registerPlugin<AppUpdateBridgePluginType>("AppUpdateBridge");

export const NativeAppUpdater = {
  isSupported(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  },

  async canInstallPackages(): Promise<boolean> {
    if (!this.isSupported()) return true;
    try {
      const res = await AppUpdateBridge.canInstallPackages();
      return res.canInstall;
    } catch {
      return true;
    }
  },

  async openInstallPermissionSettings(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const res = await AppUpdateBridge.openInstallPermissionSettings();
      return res.opened;
    } catch {
      return false;
    }
  },

  async downloadAndInstall(
    apkUrl: string,
    onProgress?: (progress: DownloadProgressEvent) => void
  ): Promise<{ success: boolean; message?: string }> {
    if (!this.isSupported()) {
      // Web browser direct download fallback
      const link = document.createElement("a");
      link.href = apkUrl;
      link.setAttribute("download", "Invictus.apk");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true, message: "Browser download initiated" };
    }

    let progressListener: any = null;

    try {
      if (onProgress) {
        progressListener = await AppUpdateBridge.addListener("downloadProgress", (event) => {
          onProgress(event);
        });
      }

      const res = await AppUpdateBridge.downloadAndInstallApk({ url: apkUrl });
      return res;
    } finally {
      if (progressListener && typeof progressListener.remove === "function") {
        progressListener.remove().catch(() => {});
      }
    }
  },
};
