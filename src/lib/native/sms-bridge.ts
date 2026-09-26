import { registerPlugin, Capacitor } from "@capacitor/core";

export interface NativeSmsMessage {
  id: string;
  address: string;
  body: string;
  date: number;
}

export interface SmsBridgePlugin {
  checkPermissions(): Promise<{ smsGranted: boolean; notificationsGranted: boolean; allGranted: boolean }>;
  requestPermissions(): Promise<{ smsGranted: boolean; notificationsGranted: boolean; allGranted: boolean }>;
  openAppSettings(): Promise<void>;
  fetchInboxSms(options: {
    startTime: number;
    endTime?: number;
    limit?: number;
  }): Promise<{ messages: NativeSmsMessage[]; count: number }>;
  setSyncConfig(options: { userId?: string; endpoint?: string }): Promise<{ success: boolean }>;
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

export async function fetchNativeInboxSms(
  startTime: number,
  endTime?: number,
  limit: number = 200
): Promise<NativeSmsMessage[]> {
  if (!Capacitor.isNativePlatform()) return [];
  try {
    const res = await SmsBridge.fetchInboxSms({
      startTime,
      endTime: endTime || Date.now(),
      limit,
    });
    return res.messages || [];
  } catch (e) {
    console.warn("fetchNativeInboxSms failed or unavailable:", e);
    return [];
  }
}

export async function setNativeSyncConfig(userId: string, endpoint?: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const res = await SmsBridge.setSyncConfig({ userId, endpoint });
    return res.success;
  } catch (e) {
    console.warn("setNativeSyncConfig error:", e);
    return false;
  }
}
