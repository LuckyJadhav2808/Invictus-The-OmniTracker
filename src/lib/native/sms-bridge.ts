import { registerPlugin, Capacitor } from "@capacitor/core";

export interface SmsBridgePlugin {
  checkPermissions(): Promise<{ smsGranted: boolean; notificationsGranted: boolean; allGranted: boolean }>;
  requestPermissions(): Promise<{ smsGranted: boolean; notificationsGranted: boolean; allGranted: boolean }>;
  openAppSettings(): Promise<void>;
}

export const SmsBridge = registerPlugin<SmsBridgePlugin>("SmsBridge");

export async function checkNativeSmsPermissions(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const res = await SmsBridge.checkPermissions();
    return res.smsGranted;
  } catch (e) {
    console.warn("SmsBridge.checkPermissions error", e);
    return false;
  }
}

export async function requestNativeSmsPermissions(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const res = await SmsBridge.requestPermissions();
    return res.smsGranted;
  } catch (e) {
    console.error("SmsBridge.requestPermissions error", e);
    return false;
  }
}

export async function openNativeAppSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await SmsBridge.openAppSettings();
  } catch (e) {
    console.error("Failed to open app settings", e);
  }
}
