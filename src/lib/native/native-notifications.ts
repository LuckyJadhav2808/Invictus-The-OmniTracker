"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications, Channel } from "@capacitor/local-notifications";
import { toast } from "sonner";

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as any;
  if (win.Capacitor?.isNativePlatform && win.Capacitor.isNativePlatform()) return true;
  if (win.Capacitor?.getPlatform && win.Capacitor.getPlatform() !== "web") return true;
  if (Capacitor.isNativePlatform()) return true;
  if (/capacitor/i.test(navigator.userAgent) || /android.*wv/i.test(navigator.userAgent)) return true;
  return false;
}

export const NOTIFICATION_CHANNELS: Channel[] = [
  {
    id: "invictus_habits",
    name: "Daily Habit Check-in",
    description: "Scheduled alerts to check off daily habits and protect streaks",
    importance: 5,
    visibility: 1,
    vibration: true,
  },
  {
    id: "invictus_finance",
    name: "Daily Expense Review",
    description: "Reminders to log daily expenses and calibrate safe spend pace",
    importance: 5,
    visibility: 1,
    vibration: true,
  },
  {
    id: "invictus_study",
    name: "Study & Revision Log",
    description: "Reminders to log study sessions and PYQs solved",
    importance: 5,
    visibility: 1,
    vibration: true,
  },
  {
    id: "invictus_exam",
    name: "Exam Targets & Milestones",
    description: "Milestone reviews and target exam syllabus countdowns",
    importance: 5,
    visibility: 1,
    vibration: true,
  },
  {
    id: "invictus_alerts",
    name: "System Alerts & Reminders",
    description: "System notifications, priority alerts, and test alarms",
    importance: 5,
    visibility: 1,
    vibration: true,
  },
];

let channelsConfigured = false;
let isListenerRegistered = false;

/**
 * Creates high-priority notification channels on Android 8.0+
 */
export async function setupNotificationChannels(): Promise<void> {
  if (!isNativeApp() || channelsConfigured) return;
  try {
    for (const channel of NOTIFICATION_CHANNELS) {
      await LocalNotifications.createChannel(channel);
    }
    channelsConfigured = true;
  } catch (err) {
    console.warn("[NativeNotifications] Failed to create notification channels:", err);
  }
}

const NATIVE_PERMISSION_TOAST_KEY = "invictus_native_permission_toast_shown";

/**
 * Initializes native notification bridge and sets up action/tap listeners
 */
export async function initNativeNotificationBridge(router?: any): Promise<void> {
  if (!isNativeApp()) return;

  try {
    await setupNotificationChannels();

    if (!isListenerRegistered) {
      isListenerRegistered = true;
      await LocalNotifications.addListener(
        "localNotificationActionPerformed",
        (notificationAction) => {
          const extra = notificationAction.notification.extra;
          const targetUrl = extra?.url;
          if (targetUrl) {
            if (router && typeof router.push === "function") {
              router.push(targetUrl);
            } else if (typeof window !== "undefined") {
              window.location.href = targetUrl;
            }
          }
        }
      );
    }

    // Auto-sync hardware alarms with saved user config on startup if permission is already granted
    const isGranted = await checkNativeNotificationPermissions();
    if (isGranted) {
      if (typeof window !== "undefined") {
        localStorage.setItem(NATIVE_PERMISSION_TOAST_KEY, "true");
      }
      try {
        const { getReminderConfig } = await import("@/lib/utils/reminder-scheduler");
        const config = getReminderConfig();
        if (config.habitsEnabled || config.moneyEnabled || config.studyEnabled || config.examEnabled) {
          await scheduleAllNativeAlarms(config, { silent: true });
        }
      } catch (e) {
        console.warn("[NativeNotifications] Boot auto-sync warning:", e);
      }
    }
  } catch (err) {
    console.warn("[NativeNotifications] initBridge warning:", err);
  }
}

/**
 * Check precise native notification permission status: granted, denied, or prompt
 */
export async function getNativeNotificationPermissionStatus(): Promise<"granted" | "denied" | "prompt"> {
  if (!isNativeApp()) return "prompt";
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") return "granted";
    if (status.display === "denied") return "denied";
    return "prompt";
  } catch {
    return "prompt";
  }
}

/**
 * Check if native notification permissions are granted
 */
export async function checkNativeNotificationPermissions(): Promise<boolean> {
  const status = await getNativeNotificationPermissionStatus();
  return status === "granted";
}

/**
 * Request exact alarm & notification permissions on native Android/iOS
 */
export async function requestNativeNotificationPermissions(
  options: { silent?: boolean } = {}
): Promise<boolean> {
  if (!isNativeApp()) return false;

  try {
    const status = await LocalNotifications.requestPermissions();
    if (status.display === "granted") {
      const alreadyShown =
        typeof window !== "undefined" &&
        localStorage.getItem(NATIVE_PERMISSION_TOAST_KEY) === "true";

      if (!options.silent && !alreadyShown) {
        if (typeof window !== "undefined") {
          localStorage.setItem(NATIVE_PERMISSION_TOAST_KEY, "true");
        }
        toast.success("Native alarm permissions granted");
      }
      return true;
    } else {
      if (!options.silent) {
        toast.error("Notification permission denied. Please allow in Android App Settings.");
      }
      return false;
    }
  } catch (err: any) {
    console.error("[NativeNotifications] Failed to request permissions:", err);
    const msg = err?.message || "";
    if (msg.includes("not implemented")) {
      if (!options.silent) {
        toast.error("Hardware alarm bridge requires the latest app update.");
      }
    }
    return false;
  }
}

/**
 * Dispatches an instant native notification (used for test alerts, background notifications, etc.)
 */
export async function dispatchInstantNativeNotification(
  title: string,
  body: string,
  url: string = "/today",
  channelId: string = "invictus_alerts"
): Promise<boolean> {
  if (!isNativeApp()) return false;

  try {
    await setupNotificationChannels();
    const id = Math.floor(Date.now() % 100000) + Math.floor(Math.random() * 1000);
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: { at: new Date(Date.now() + 100) },
          channelId,
          smallIcon: "ic_stat_icon",
          iconColor: "#CEF431",
          extra: { url },
        },
      ],
    });
    return true;
  } catch (err) {
    console.error("[NativeNotifications] Instant dispatch failed:", err);
    return false;
  }
}

/**
 * Sends an instant test native alarm
 */
export async function sendTestNativeAlarm(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    await requestNativeNotificationPermissions({ silent: true });
    await setupNotificationChannels();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 999,
          title: "Invictus System Alert",
          body: "Hardware alarm active. Notifications will wake your lock screen at scheduled times.",
          schedule: { at: new Date(Date.now() + 1000) },
          channelId: "invictus_alerts",
          smallIcon: "ic_stat_icon",
          iconColor: "#CEF431",
          extra: { url: "/today" },
        },
      ],
    });
    toast.success("Test alarm dispatched to status bar");
    return true;
  } catch (e: any) {
    console.error("Test native alarm failed:", e);
    const msg = e?.message || "";
    if (msg.includes("not implemented")) {
      toast.error("Hardware alarm module requires the latest app build.");
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("Test Notification (Web Fallback)", {
            body: "Test alert triggered. Install the APK update to activate hardware-level lockscreen alarms.",
          });
        } catch {}
      }
    } else {
      toast.error("Failed to fire test alarm: " + msg);
    }
    return false;
  }
}

/**
 * Parses "HH:MM" into numeric hour and minute
 */
function parseTimeString(timeStr?: string): { hour: number; minute: number } | null {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":")) return null;
  const parts = timeStr.trim().split(":");
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);
  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return { hour, minute };
}

export interface NativeAlarmConfig {
  moneyEnabled?: boolean;
  moneyTime?: string;
  habitsEnabled?: boolean;
  habitsTime?: string;
  studyEnabled?: boolean;
  studyTime?: string;
  examEnabled?: boolean;
  examTime?: string;
}

/**
 * Schedules hardware-level exact alarms that ring and wake up the lock screen even in deep Doze mode
 */
export async function scheduleAllNativeAlarms(
  config: NativeAlarmConfig,
  options: { silent?: boolean } = {}
): Promise<boolean> {
  if (!isNativeApp()) return false;

  try {
    const isGranted = await checkNativeNotificationPermissions();
    if (!isGranted) {
      if (options.silent) {
        // In silent mode (e.g. app startup boot sync), do not prompt or show toasts
        return false;
      }
      const grantedNow = await requestNativeNotificationPermissions(options);
      if (!grantedNow) return false;
    }
    await setupNotificationChannels();

    // 1. Explicitly cancel all established Invictus alarm IDs plus any pending
    const knownIds = [101, 102, 103, 104];
    await LocalNotifications.cancel({
      notifications: knownIds.map((id) => ({ id })),
    }).catch(() => {});

    const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] }));
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      }).catch(() => {});
    }

    const notificationsToSchedule: any[] = [];

    // Habits Alarm (ID: 101)
    if (config.habitsEnabled && config.habitsTime) {
      const parsed = parseTimeString(config.habitsTime);
      if (parsed) {
        notificationsToSchedule.push({
          id: 101,
          channelId: "invictus_habits",
          title: "Daily Habit Check-in",
          body: "Review your scheduled habits and lock in today's streaks.",
          schedule: {
            on: {
              hour: parsed.hour,
              minute: parsed.minute,
            },
            allowWhileIdle: true,
          },
          smallIcon: "ic_stat_icon",
          iconColor: "#CEF431",
          extra: { url: "/goals", type: "habits" },
        });
      }
    }

    // Money Expense Alarm (ID: 102)
    if (config.moneyEnabled && config.moneyTime) {
      const parsed = parseTimeString(config.moneyTime);
      if (parsed) {
        notificationsToSchedule.push({
          id: 102,
          channelId: "invictus_finance",
          title: "Daily Expense Log",
          body: "Record today's spending to calibrate your remaining safe spend pace.",
          schedule: {
            on: {
              hour: parsed.hour,
              minute: parsed.minute,
            },
            allowWhileIdle: true,
          },
          smallIcon: "ic_stat_icon",
          iconColor: "#03D26F",
          extra: { url: "/money", type: "money" },
        });
      }
    }

    // Study Session Alarm (ID: 103)
    if (config.studyEnabled && config.studyTime) {
      const parsed = parseTimeString(config.studyTime);
      if (parsed) {
        notificationsToSchedule.push({
          id: 103,
          channelId: "invictus_study",
          title: "Study & PYQ Review",
          body: "Log completed focus hours and solved past-year questions.",
          schedule: {
            on: {
              hour: parsed.hour,
              minute: parsed.minute,
            },
            allowWhileIdle: true,
          },
          smallIcon: "ic_stat_icon",
          iconColor: "#FED7AA",
          extra: { url: "/study", type: "study" },
        });
      }
    }

    // Exam Review Alarm (ID: 104)
    if (config.examEnabled && config.examTime) {
      const parsed = parseTimeString(config.examTime);
      if (parsed) {
        notificationsToSchedule.push({
          id: 104,
          channelId: "invictus_exam",
          title: "Exam Syllabus Targets",
          body: "Review today's target topics and countdown milestones.",
          schedule: {
            on: {
              hour: parsed.hour,
              minute: parsed.minute,
            },
            allowWhileIdle: true,
          },
          smallIcon: "ic_stat_icon",
          iconColor: "#FFE4E6",
          extra: { url: "/study", type: "exam" },
        });
      }
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule,
      });
      if (!options.silent) {
        toast.success(`Scheduled ${notificationsToSchedule.length} daily hardware alarms`, {
          description: "Lockscreen alerts synchronized",
        });
      }
    }

    return true;
  } catch (err: any) {
    console.error("[NativeNotifications] Error scheduling alarms:", err);
    const msg = err?.message || "";
    if (msg.includes("not implemented")) {
      if (!options.silent) {
        toast.error("Hardware alarms will activate with the latest app update.");
      }
    } else {
      if (!options.silent) {
        toast.error("Failed to schedule native alarms: " + msg);
      }
    }
    return false;
  }
}
